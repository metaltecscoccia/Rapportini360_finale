import express from 'express';
import Stripe from 'stripe';
import { storage } from '../storage';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

export const stripeWebhookRouter = express.Router();

/**
 * Stripe Webhook Endpoint
 * IMPORTANT: This must be registered BEFORE express.json() middleware
 * to ensure the raw body is available for signature verification
 */
stripeWebhookRouter.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    console.error('[Stripe Webhook] Missing stripe-signature header');
    return res.status(400).send('Missing stripe-signature header');
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error processing event:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

/**
 * Handle checkout.session.completed
 * Called when a customer completes the checkout process
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('[Stripe Webhook] Processing checkout.session.completed', session.id);

  const organizationId = session.metadata?.organizationId;
  const planType = session.metadata?.planType;

  if (!organizationId) {
    console.error('[Stripe Webhook] Missing organizationId in metadata');
    return;
  }

  // Determine max employees based on plan type
  const maxEmployees = planType?.startsWith('premium') ? 999 : 5;

  await storage.updateOrganization(organizationId, {
    stripeCustomerId: session.customer as string,
    subscriptionStatus: 'active',
    subscriptionPlan: planType || 'free',
    subscriptionId: session.subscription as string,
    maxEmployees,
  });

  console.log(`[Stripe Webhook] Updated organization ${organizationId} to active status`);
}

/**
 * Handle customer.subscription.created
 * Called when a new subscription is created
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('[Stripe Webhook] Processing customer.subscription.created', subscription.id);

  const customerId = subscription.customer as string;
  const org = await storage.getOrganizationByStripeCustomerId(customerId);

  if (!org) {
    console.error('[Stripe Webhook] Organization not found for customer', customerId);
    return;
  }

  const periodEnd = (subscription as any).current_period_end;
  await storage.updateOrganization(org.id, {
    subscriptionId: subscription.id,
    subscriptionStatus: mapStripeStatus(subscription.status),
    subscriptionCurrentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
  });

  console.log(`[Stripe Webhook] Created subscription for organization ${org.id}`);
}

/**
 * Handle customer.subscription.updated
 * Called when a subscription is updated (e.g., status change, renewal)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('[Stripe Webhook] Processing customer.subscription.updated', subscription.id);

  const customerId = subscription.customer as string;
  const org = await storage.getOrganizationByStripeCustomerId(customerId);

  if (!org) {
    console.error('[Stripe Webhook] Organization not found for customer', customerId);
    return;
  }

  const periodEnd = (subscription as any).current_period_end;
  await storage.updateOrganization(org.id, {
    subscriptionStatus: mapStripeStatus(subscription.status),
    subscriptionCurrentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
  });

  console.log(`[Stripe Webhook] Updated subscription status for organization ${org.id}: ${subscription.status}`);
}

/**
 * Handle customer.subscription.deleted
 * Called when a subscription is canceled
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('[Stripe Webhook] Processing customer.subscription.deleted', subscription.id);

  const customerId = subscription.customer as string;
  const org = await storage.getOrganizationByStripeCustomerId(customerId);

  if (!org) {
    console.error('[Stripe Webhook] Organization not found for customer', customerId);
    return;
  }

  await storage.updateOrganization(org.id, {
    subscriptionStatus: 'canceled',
  });

  console.log(`[Stripe Webhook] Subscription canceled for organization ${org.id}`);
}

/**
 * Handle invoice.payment_succeeded
 * Called when a payment is successful
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('[Stripe Webhook] Processing invoice.payment_succeeded', invoice.id);

  const customerId = invoice.customer as string;
  const org = await storage.getOrganizationByStripeCustomerId(customerId);

  if (!org) {
    console.error('[Stripe Webhook] Organization not found for customer', customerId);
    return;
  }

  // If subscription was past_due, set back to active
  if (org.subscriptionStatus === 'past_due') {
    await storage.updateOrganization(org.id, {
      subscriptionStatus: 'active',
    });
    console.log(`[Stripe Webhook] Payment recovered for organization ${org.id}`);
  }
}

/**
 * Handle invoice.payment_failed
 * Called when a payment fails
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('[Stripe Webhook] Processing invoice.payment_failed', invoice.id);

  const customerId = invoice.customer as string;
  const org = await storage.getOrganizationByStripeCustomerId(customerId);

  if (!org) {
    console.error('[Stripe Webhook] Organization not found for customer', customerId);
    return;
  }

  await storage.updateOrganization(org.id, {
    subscriptionStatus: 'past_due',
  });

  console.log(`[Stripe Webhook] Payment failed for organization ${org.id}`);

  // TODO: Send email notification to billing contact
}

/**
 * Map Stripe subscription status to our internal status
 */
function mapStripeStatus(stripeStatus: string): string {
  const statusMap: { [key: string]: string } = {
    'active': 'active',
    'past_due': 'past_due',
    'unpaid': 'past_due',
    'canceled': 'canceled',
    'incomplete': 'incomplete',
    'incomplete_expired': 'canceled',
    'trialing': 'trial',
    'paused': 'paused',
  };

  return statusMap[stripeStatus] || stripeStatus;
}
