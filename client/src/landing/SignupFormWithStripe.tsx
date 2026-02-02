import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ArrowLeft, CheckCircle, Building, User, Mail, Briefcase, Phone } from "lucide-react";
import logoPath from "@assets/ChatGPT_Image_20_dic_2025,_17_13_27_(1)_1766249871224.png";
import { workFields } from "../../../shared/workFieldPresets";
import { SignupFormElementsInner } from "./SignupFormElementsInner";

// Load Stripe outside of component to avoid recreating on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

export default function SignupFormWithStripe() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    organizationName: "",
    workField: "",
    vatNumber: "",
    phone: "",
    adminFullName: "",
    adminUsername: "",
    billingEmail: "",
    adminPassword: "",
    confirmPassword: "",
    activationType: "card" as "card" | "manual",
    acceptedTerms: false,
  });

  // Handler per il submit manuale (senza carta)
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.acceptedTerms) {
      setError("Devi accettare i termini e condizioni per continuare.");
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

    if (formData.adminUsername.length < 3) {
      setError("L'username deve essere di almeno 3 caratteri.");
      return;
    }

    setIsLoading(true);

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
          billingEmail: formData.billingEmail,
          activationType: "manual",
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message || "Richiesta inviata! Riceverai le credenziali via email dopo l'approvazione.");
      } else {
        setError(data.error || "Errore durante la registrazione. Riprova.");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Errore di connessione al server. Riprova.");
    } finally {
      setIsLoading(false);
    }
  };

  // Schermata di successo per richiesta manuale
  if (success) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col">
          <header className="p-4">
            <div className="container mx-auto">
              <Link href="/home" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Torna alla home
              </Link>
            </div>
          </header>

          <main className="flex-1 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md"
            >
              <Card>
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">Richiesta Inviata!</CardTitle>
                  <CardDescription className="text-base mt-2">
                    {success}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-sm">
                    <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">Cosa succede ora?</p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-300">
                      <li>Verificheremo i tuoi dati aziendali</li>
                      <li>Riceverai un'email con le credenziali di accesso</li>
                      <li>Potrai iniziare subito il tuo trial di 30 giorni</li>
                    </ol>
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    Di solito rispondiamo entro 24 ore lavorative.
                  </p>
                  <Link href="/home">
                    <Button variant="outline" className="w-full">
                      Torna alla Home
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </main>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col">
        {/* Header */}
        <header className="p-4">
          <div className="container mx-auto">
            <Link href="/home" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Torna alla home
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <img src={logoPath} alt="Rapportini360" className="h-[147px] w-[147px] object-contain" />
                </div>
                <CardTitle className="text-2xl">Crea il tuo account</CardTitle>
                <CardDescription>
                  Inizia con 30 giorni di prova gratuita
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Campi comuni (fuori dal form Stripe) */}
                <div className="space-y-4">
                  {/* Nome Azienda */}
                  <div className="space-y-2">
                    <Label htmlFor="organizationName">Nome Azienda *</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="organizationName"
                        name="organizationName"
                        placeholder="La tua azienda Srl"
                        value={formData.organizationName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, organizationName: e.target.value }))}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Settore di Lavoro */}
                  <div className="space-y-2">
                    <Label htmlFor="workField">Settore di Lavoro</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                      <Select
                        value={formData.workField}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, workField: value }))}
                      >
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Seleziona il tuo settore" />
                        </SelectTrigger>
                        <SelectContent>
                          {workFields.map((field) => (
                            <SelectItem key={field.id} value={field.id}>
                              {field.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Pre-imposteremo Attivita e Componenti per il tuo settore
                    </p>
                  </div>

                  {/* Partita IVA */}
                  <div className="space-y-2">
                    <Label htmlFor="vatNumber">Partita IVA *</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="vatNumber"
                        name="vatNumber"
                        placeholder="IT01234567890"
                        value={formData.vatNumber}
                        onChange={(e) => setFormData((prev) => ({ ...prev, vatNumber: e.target.value }))}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Telefono */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefono *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+39 123 456 7890"
                        value={formData.phone}
                        onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Nome Completo Admin */}
                  <div className="space-y-2">
                    <Label htmlFor="adminFullName">Nome e Cognome *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="adminFullName"
                        name="adminFullName"
                        placeholder="Mario Rossi"
                        value={formData.adminFullName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, adminFullName: e.target.value }))}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Username */}
                  <div className="space-y-2">
                    <Label htmlFor="adminUsername">Username *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="adminUsername"
                        name="adminUsername"
                        placeholder="mario.rossi"
                        value={formData.adminUsername}
                        onChange={(e) => setFormData((prev) => ({ ...prev, adminUsername: e.target.value }))}
                        className="pl-10"
                        required
                        minLength={3}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Userai questo per accedere
                    </p>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="billingEmail">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="billingEmail"
                        name="billingEmail"
                        type="email"
                        placeholder="mario@azienda.it"
                        value={formData.billingEmail}
                        onChange={(e) => setFormData((prev) => ({ ...prev, billingEmail: e.target.value }))}
                        className="pl-10"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Per comunicazioni e fatturazione
                    </p>
                  </div>
                </div>

                {/* Stripe Elements Form */}
                <Elements stripe={stripePromise}>
                  <SignupFormElementsInner
                    formData={formData}
                    setFormData={setFormData}
                    setError={setError}
                    setIsLoading={setIsLoading}
                    handleSubmitExternal={handleManualSubmit}
                    acceptedTerms={formData.acceptedTerms}
                    isLoading={isLoading}
                    error={error}
                  />
                </Elements>
              </CardContent>
            </Card>

            {/* Benefits */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>30 giorni gratis</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Cancella quando vuoi</span>
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </ThemeProvider>
  );
}
