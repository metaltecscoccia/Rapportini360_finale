import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, XCircle, CreditCard } from "lucide-react";
import { Link } from "wouter";

interface BillingStatus {
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'paused';
  subscriptionPlan: 'free' | 'premium_monthly' | 'premium_yearly';
  isTrialActive: boolean;
  daysUntilTrialEnd: number;
  maxEmployees: number;
  billingEmail: string | null;
}

export default function SubscriptionBanner() {
  const { data: billingStatus, isLoading } = useQuery<BillingStatus>({
    queryKey: ["/api/billing/status"],
    queryFn: () => apiRequest("/api/billing/status"),
    refetchInterval: 60000, // Refetch every minute
  });

  // Don't show anything while loading or if no data
  if (isLoading || !billingStatus) {
    return null;
  }

  const { subscriptionStatus, isTrialActive, daysUntilTrialEnd } = billingStatus;

  // Trial warning (≤7 days remaining)
  if (isTrialActive && daysUntilTrialEnd <= 7 && daysUntilTrialEnd > 0) {
    return (
      <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 mb-4">
        <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
        <AlertTitle className="text-yellow-800 dark:text-yellow-200 font-semibold">
          Trial in scadenza
        </AlertTitle>
        <AlertDescription className="text-yellow-700 dark:text-yellow-300">
          Il tuo periodo di prova terminerà tra{" "}
          <Badge variant="outline" className="border-yellow-600 text-yellow-800 dark:text-yellow-200 mx-1">
            {daysUntilTrialEnd} {daysUntilTrialEnd === 1 ? "giorno" : "giorni"}
          </Badge>
          . Aggiorna al piano Premium per continuare ad utilizzare tutte le funzionalità.
          <Link href="/billing">
            <Button variant="outline" size="sm" className="ml-3 border-yellow-600 text-yellow-800 hover:bg-yellow-100 dark:text-yellow-200">
              <CreditCard className="h-4 w-4 mr-2" />
              Aggiorna ora
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  // Trial expired
  if (subscriptionStatus === 'trial' && !isTrialActive) {
    return (
      <Alert variant="destructive" className="mb-4">
        <XCircle className="h-4 w-4" />
        <AlertTitle className="font-semibold">Trial scaduto</AlertTitle>
        <AlertDescription>
          Il tuo periodo di prova è terminato. Aggiorna al piano Premium per continuare ad utilizzare l'app.
          <Link href="/billing">
            <Button variant="destructive" size="sm" className="ml-3">
              <CreditCard className="h-4 w-4 mr-2" />
              Aggiorna ora
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  // Payment failed / Past due
  if (subscriptionStatus === 'past_due') {
    return (
      <Alert variant="destructive" className="mb-4">
        <XCircle className="h-4 w-4" />
        <AlertTitle className="font-semibold">Pagamento non riuscito</AlertTitle>
        <AlertDescription>
          Il pagamento della tua sottoscrizione non è andato a buon fine. Aggiorna il tuo metodo di pagamento per evitare interruzioni del servizio.
          <Link href="/billing">
            <Button variant="destructive" size="sm" className="ml-3">
              <CreditCard className="h-4 w-4 mr-2" />
              Aggiorna pagamento
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  // Subscription canceled
  if (subscriptionStatus === 'canceled') {
    return (
      <Alert variant="destructive" className="mb-4">
        <XCircle className="h-4 w-4" />
        <AlertTitle className="font-semibold">Sottoscrizione annullata</AlertTitle>
        <AlertDescription>
          La tua sottoscrizione è stata annullata. Riattivala per continuare ad utilizzare l'app.
          <Link href="/billing">
            <Button variant="destructive" size="sm" className="ml-3">
              <CreditCard className="h-4 w-4 mr-2" />
              Riattiva sottoscrizione
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  // Subscription incomplete
  if (subscriptionStatus === 'incomplete') {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="font-semibold">Sottoscrizione incompleta</AlertTitle>
        <AlertDescription>
          La tua sottoscrizione non è stata completata. Completa il pagamento per attivare tutte le funzionalità.
          <Link href="/billing">
            <Button variant="destructive" size="sm" className="ml-3">
              <CreditCard className="h-4 w-4 mr-2" />
              Completa pagamento
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  // Active subscription or paused - no banner needed
  return null;
}
