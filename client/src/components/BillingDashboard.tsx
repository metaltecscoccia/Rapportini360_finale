import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  Check,
  Zap,
  Users,
  FileText,
  Shield,
  Clock,
  ExternalLink,
  Crown,
} from "lucide-react";
import { motion } from "framer-motion";

type SubscriptionPlan = 'free' | 'starter_monthly' | 'starter_yearly' | 'business_monthly' | 'business_yearly' | 'professional_monthly' | 'professional_yearly';

interface BillingStatus {
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'paused';
  subscriptionPlan: SubscriptionPlan;
  isTrialActive: boolean;
  daysUntilTrialEnd: number;
  maxEmployees: number;
  billingEmail: string | null;
}

interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

interface CustomerPortalResponse {
  url: string;
}

const PLAN_FEATURES = [
  { icon: Users, text: "Dipendenti illimitati" },
  { icon: FileText, text: "Rapportini illimitati" },
  { icon: Shield, text: "Backup automatico" },
  { icon: Zap, text: "Supporto prioritario" },
];

export default function BillingDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: billingStatus, isLoading } = useQuery<BillingStatus>({
    queryKey: ["/api/billing/status"],
    queryFn: () => apiRequest("/api/billing/status"),
  });

  const createCheckoutMutation = useMutation({
    mutationFn: async ({ planType }: { planType: Exclude<SubscriptionPlan, 'free'> }) => {
      // Price IDs are handled server-side from environment variables
      return apiRequest<CheckoutSessionResponse>("/api/billing/create-checkout-session", {
        method: "POST",
        body: JSON.stringify({ planType }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile avviare il checkout",
        variant: "destructive",
      });
    },
  });

  const openCustomerPortalMutation = useMutation({
    mutationFn: () =>
      apiRequest<CustomerPortalResponse>("/api/billing/customer-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: (data) => {
      // Open Customer Portal in new tab
      window.open(data.url, '_blank');
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aprire il portale clienti",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!billingStatus) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Impossibile caricare lo stato della sottoscrizione.</p>
      </div>
    );
  }

  const {
    subscriptionStatus,
    subscriptionPlan,
    isTrialActive,
    daysUntilTrialEnd,
    maxEmployees,
    billingEmail,
  } = billingStatus;

  const isPremium = subscriptionPlan !== 'free';
  const isActive = subscriptionStatus === 'active';

  // Get status badge
  const getStatusBadge = () => {
    switch (subscriptionStatus) {
      case 'active':
        return <Badge className="bg-green-500 text-white">Attiva</Badge>;
      case 'trial':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">Trial</Badge>;
      case 'past_due':
        return <Badge variant="destructive">Pagamento scaduto</Badge>;
      case 'canceled':
        return <Badge variant="destructive">Annullata</Badge>;
      case 'incomplete':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Incompleta</Badge>;
      case 'paused':
        return <Badge variant="outline">In pausa</Badge>;
      default:
        return <Badge variant="outline">{subscriptionStatus}</Badge>;
    }
  };

  // Get plan badge
  const getPlanBadge = () => {
    const planLabels: Record<SubscriptionPlan, string> = {
      'free': 'Free',
      'starter_monthly': 'Starter Mensile',
      'starter_yearly': 'Starter Annuale',
      'business_monthly': 'Business Mensile',
      'business_yearly': 'Business Annuale',
      'professional_monthly': 'Professional Mensile',
      'professional_yearly': 'Professional Annuale',
    };

    if (subscriptionPlan === 'free') {
      return <Badge variant="secondary">Free</Badge>;
    }

    const isYearly = subscriptionPlan.includes('yearly');
    return (
      <Badge className={`bg-gradient-to-r ${isYearly ? 'from-purple-500 to-pink-500' : 'from-blue-500 to-cyan-500'} text-white`}>
        <Crown className="h-3 w-3 mr-1" />
        {planLabels[subscriptionPlan]}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Piano e Fatturazione</h1>
        <p className="text-muted-foreground mt-2">
          Gestisci la tua sottoscrizione e i metodi di pagamento
        </p>
      </div>

      {/* Current Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Stato Attuale</CardTitle>
            <CardDescription>
              Dettagli della tua sottoscrizione
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Piano</p>
                {getPlanBadge()}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Stato</p>
                {getStatusBadge()}
              </div>
            </div>

            {isTrialActive && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-100">
                      Trial attivo
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {daysUntilTrialEnd} {daysUntilTrialEnd === 1 ? "giorno" : "giorni"} rimanenti
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground mb-1">Limite dipendenti</p>
              <p className="text-lg font-semibold">
                {maxEmployees === 999 ? "Illimitati" : maxEmployees}
              </p>
            </div>

            {billingEmail && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email di fatturazione</p>
                <p className="text-sm">{billingEmail}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Upgrade Options (only if not premium or not active) */}
      {(!isPremium || !isActive) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Aggiorna al Premium</CardTitle>
              <CardDescription>
                Sblocca tutte le funzionalità per la tua azienda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Monthly Plan */}
                <div className="border rounded-lg p-6 space-y-4 hover:border-primary transition-colors">
                  <div>
                    <h3 className="text-xl font-bold">Professional Mensile</h3>
                    <div className="mt-2">
                      <span className="text-4xl font-bold">49,90€</span>
                      <span className="text-muted-foreground">/mese</span>
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {PLAN_FEATURES.map((feature, idx) => {
                      const Icon = feature.icon;
                      return (
                        <li key={idx} className="flex items-center gap-2">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm">{feature.text}</span>
                        </li>
                      );
                    })}
                  </ul>

                  <Button
                    className="w-full"
                    onClick={() => createCheckoutMutation.mutate({ planType: 'professional_monthly' })}
                    disabled={createCheckoutMutation.isPending}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Scegli Mensile
                  </Button>
                </div>

                {/* Yearly Plan */}
                <div className="border-2 border-primary rounded-lg p-6 space-y-4 relative bg-gradient-to-br from-primary/5 to-primary/10">
                  <Badge className="absolute top-4 right-4 bg-green-500">
                    Risparmia 20%
                  </Badge>

                  <div>
                    <h3 className="text-xl font-bold">Professional Annuale</h3>
                    <div className="mt-2">
                      <span className="text-4xl font-bold">499€</span>
                      <span className="text-muted-foreground">/anno</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      2 mesi gratis!
                    </p>
                  </div>

                  <ul className="space-y-3">
                    {PLAN_FEATURES.map((feature, idx) => {
                      const Icon = feature.icon;
                      return (
                        <li key={idx} className="flex items-center gap-2">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm">{feature.text}</span>
                        </li>
                      );
                    })}
                  </ul>

                  <Button
                    className="w-full"
                    onClick={() => createCheckoutMutation.mutate({ planType: 'professional_yearly' })}
                    disabled={createCheckoutMutation.isPending}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Scegli Annuale
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Customer Portal (only if has stripe customer) */}
      {isPremium && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Gestione Sottoscrizione</CardTitle>
              <CardDescription>
                Gestisci il tuo metodo di pagamento, visualizza fatture e aggiorna la sottoscrizione
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => openCustomerPortalMutation.mutate()}
                disabled={openCustomerPortalMutation.isPending}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Gestisci Pagamento e Fatture
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
