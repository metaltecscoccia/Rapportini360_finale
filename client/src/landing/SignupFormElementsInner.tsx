import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, CheckCircle, CreditCard, Lock, Clock } from "lucide-react";

interface SignupFormElementsInnerProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  handleSubmitExternal: (e: React.FormEvent) => Promise<void>;
  acceptedTerms: boolean;
  isLoading: boolean;
  error: string | null;
}

export function SignupFormElementsInner({
  formData,
  setFormData,
  setError,
  setIsLoading,
  handleSubmitExternal,
  acceptedTerms,
  isLoading,
  error: externalError,
}: SignupFormElementsInnerProps) {
  const stripe = useStripe();
  const elements = useElements();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!acceptedTerms) {
      setError("Devi accettare i termini e condizioni per continuare.");
      return;
    }

    if (formData.activationType === "card") {
      if (formData.adminPassword !== formData.confirmPassword) {
        setError("Le password non coincidono.");
        return;
      }

      if (formData.adminPassword.length < 8) {
        setError("La password deve essere di almeno 8 caratteri.");
        return;
      }

      if (!formData.vatNumber.trim()) {
        setError("La Partita IVA e' obbligatoria.");
        return;
      }
  
      if (!formData.phone.trim()) {
        setError("Il numero di telefono e' obbligatorio.");
        return;
      }

      if (!stripe || !elements) {
        // Stripe.js has not yet loaded. Make sure to disable form submission until Stripe.js has loaded.
        setError("Stripe non è stato caricato correttamente. Riprova tra qualche istante.");
        return;
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setError("Errore: Elemento carta non trovato.");
        return;
      }

      setIsLoading(true);
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

      if (stripeError) {
        setError(stripeError.message || "Errore Stripe");
        setIsLoading(false);
        return;
      }

      // Invia il paymentMethodId al backend insieme agli altri dati del form
      try {
        const response = await fetch("/api/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            organizationName: formData.organizationName,
            workField: formData.workField,
            vatNumber: formData.vatNumber,
            phone: formData.phone,
            adminFullName: formData.adminFullName,
            adminUsername: formData.adminUsername,
            adminPassword: formData.adminPassword,
            billingEmail: formData.billingEmail,
            activationType: formData.activationType,
            paymentMethodId: paymentMethod?.id,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Attivazione immediata - redirect alla dashboard
          window.location.href = "/";
        } else {
          setError(data.error || "Errore durante la registrazione. Riprova.");
        }
      } catch (err) {
        console.error("Signup error:", err);
        setError("Errore di connessione al server. Riprova.");
      } finally {
        setIsLoading(false);
      }

    } else { // Manual activation
      handleSubmitExternal(e);
    }
  };

  const currentError = externalError;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {currentError && (
        <Alert variant="destructive">
          <AlertDescription>{currentError}</AlertDescription>
        </Alert>
      )}

      {/* Tipo Attivazione */}
      <RadioGroup
        value={formData.activationType}
        onValueChange={(value: "card" | "manual") => setFormData((prev) => ({ ...prev, activationType: value }))}
        className="space-y-3"
      >
        <div className={`flex items-start space-x-3 p-3 rounded-lg border ${formData.activationType === "card" ? "border-primary bg-primary/5" : "border-muted"}`}>
          <RadioGroupItem value="card" id="card" className="mt-1" />
          <div className="flex-1">
            <Label htmlFor="card" className="flex items-center gap-2 font-medium cursor-pointer">
              <CreditCard className="h-4 w-4" />
              Attivazione Immediata
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Inserisci una carta di credito (non verra' addebitato nulla per 30 giorni)
            </p>
          </div>
        </div>

        <div className={`flex items-start space-x-3 p-3 rounded-lg border ${formData.activationType === "manual" ? "border-primary bg-primary/5" : "border-muted"}`}>
          <RadioGroupItem value="manual" id="manual" className="mt-1" />
          <div className="flex-1">
            <Label htmlFor="manual" className="flex items-center gap-2 font-medium cursor-pointer">
              <Clock className="h-4 w-4" />
              Richiedi Attivazione
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Riceverai le credenziali via email dopo la verifica (entro 24h)
            </p>
          </div>
        </div>
      </RadioGroup>

      {/* Password - solo per attivazione con carta */}
      {formData.activationType === "card" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="adminPassword">Password *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="adminPassword"
                name="adminPassword"
                type="password"
                placeholder="Minimo 8 caratteri"
                value={formData.adminPassword}
                onChange={handleChange}
                className="pl-10"
                required
                minLength={8}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Conferma Password *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Ripeti la password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Stripe Card Element qui */}
          <div className="space-y-2">
            <Label htmlFor="card-element">Dettagli Carta di Credito *</Label>
            <div className="p-3 border border-input rounded-md">
              <CardElement id="card-element" className="w-full" />
            </div>
          </div>
        </>
      )}

      {/* Termini e Condizioni */}
      <div className="flex items-start gap-2">
        <Checkbox
          id="terms"
          checked={acceptedTerms}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, acceptedTerms: checked as boolean }))}
        />
        <Label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
          Accetto i{" "}
          <a href="#" className="text-primary hover:underline">
            Termini di Servizio
          </a>{" "}
          e la{" "}
          <a href="#" className="text-primary hover:underline">
            Privacy Policy
          </a>
        </Label>
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {formData.activationType === "card" ? "Creazione account..." : "Invio richiesta..."}
          </>
        ) : (
          <>
            {formData.activationType === "card" ? (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Attiva con Carta
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Invia Richiesta
              </>
            )}
          </>
        )}
      </Button>

      {/* Login Link */}
      <p className="text-center text-sm text-muted-foreground">
        Hai gia un account?{" "}
        <Link href="/" className="text-primary hover:underline">
          Accedi
        </Link>
      </p>
    </form>
  );
}
