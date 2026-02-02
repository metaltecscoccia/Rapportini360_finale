import type { Express } from "express";
import Stripe from "stripe";
import { storage } from "../storage";

// Questo è il file che gestirà gli eventi webhook di Stripe.
// È fondamentale per mantenere lo stato degli abbonamenti sincronizzato con il tuo database.

export async function registerStripeWebhook(app: Express) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2025-12-15.clover',
  });

  app.post("/webhook/stripe", async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET as string);
    } catch (err: any) {
      console.error(`⚠️  Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[Webhook] Subscription ${event.type}:`, subscription.id);
        // Recupera l'organizzazione basandosi sul customerId o metadata
        // (Dovrai assicurarti che il customerId sia salvato con l'organizzazione)
        const organizationId = subscription.metadata.organizationId;

        if (!organizationId) {
          console.error(`[Webhook Error] Organization ID missing in metadata for subscription ${subscription.id}`);
          return res.status(400).send(`Webhook Error: Organization ID missing`);
        }

        let status: "trial" | "active" | "canceled" | "past_due" | "unpaid" | "pending_approval" | "free" = "free";
        let trialEndDate: Date | null = null;
        let currentPeriodEnd: Date | null = null;

        if (subscription.status === "trialing") {
          status = "trial";
          trialEndDate = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
        } else if (subscription.status === "active") {
          status = "active";
          currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null;
        } else if (subscription.status === "canceled") {
          status = "canceled";
        } else if (subscription.status === "past_due") {
          status = "past_due";
        } else if (subscription.status === "unpaid") {
          status = "unpaid";
        }

        // Determina il planType dal Price ID
        let subscriptionPlan: "free" | "starter_monthly" | "starter_yearly" | "business_monthly" | "business_yearly" | "professional_monthly" | "professional_yearly" = "free";
        if (subscription.items.data.length > 0) {
          const priceId = subscription.items.data[0].price.id;
          // Mappa Price ID a planType (dovrai configurare questi nel tuo .env o in una mappa qui)
          const planMap: Record<string, typeof subscriptionPlan> = {
            [process.env.STRIPE_PRICE_STARTER_MONTHLY as string]: "starter_monthly",
            [process.env.STRIPE_PRICE_STARTER_YEARLY as string]: "starter_yearly",
            [process.env.STRIPE_PRICE_BUSINESS_MONTHLY as string]: "business_monthly",
            [process.env.STRIPE_PRICE_BUSINESS_YEARLY as string]: "business_yearly",
            [process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY as string]: "professional_monthly",
            [process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY as string]: "professional_yearly",
            // Aggiungi altri Price ID se necessario
          };
          subscriptionPlan = planMap[priceId] || "free";
        }

        await storage.updateOrganization(organizationId, {
          stripeCustomerId: subscription.customer as string,
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: status,
          subscriptionPlan: subscriptionPlan,
          trialEndDate: trialEndDate,
          currentPeriodEnd: currentPeriodEnd,
          // Puoi anche aggiornare isActive, maxEmployees in base al piano
          isActive: status === "active" || status === "trial", // Attiva se in trial o attivo
        });
        break;
      
      case "invoice.payment_succeeded":
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Webhook] Invoice payment succeeded:`, invoice.id);
        // Potresti voler inviare una notifica all'utente, aggiornare crediti, ecc.
        // Lo stato della sottoscrizione dovrebbe essere già gestito da customer.subscription.updated
        break;
      
      case "invoice.payment_failed":
        const failedInvoice = event.data.object as Stripe.Invoice;
        console.log(`[Webhook] Invoice payment failed:`, failedInvoice.id);
        // Notifica l'utente, disabilita alcune funzionalità o cambia lo stato dell'abbonamento a 'past_due' / 'unpaid'
        // Lo stato della sottoscrizione dovrebbe essere già gestito da customer.subscription.updated
        break;

      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`[Webhook] Checkout session completed:`, session.id);
        // Se usi Checkout Session per creare sottoscrizioni, potresti voler finalizzare qui
        // Ma se la sottoscrizione è già creata, l'evento customer.subscription.created dovrebbe gestirla.
        // Puoi usare i metadata qui per collegare la sessione all'organizzazione
        const completedOrgId = session.metadata?.organizationId;
        const customerStripeId = session.metadata?.customerStripeId || session.customer;
        const planTypeFromMetadata = session.metadata?.planType; // Get planType from metadata

        if (completedOrgId && customerStripeId && planTypeFromMetadata) {
          // In un flusso normale, la sottoscrizione viene creata dall'evento customer.subscription.created
          // Questo blocco è più per sicurezza o se il flusso di creazione è diverso.
          // Assicurati che l'organizzazione sia attiva e il suo stato di abbonamento sia aggiornato.
          // Potresti voler recuperare la subscription qui se non hai l'ID diretto
          // await storage.updateOrganization(completedOrgId, { /* updates */ });
          console.log(`[Webhook] Checkout session for Org ${completedOrgId} completed for customer ${customerStripeId} with plan ${planTypeFromMetadata}`);
        } else {
          console.warn(`[Webhook] Checkout session completed event missing organizationId, customerStripeId or planType metadata.`);
        }

        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
  });
}
