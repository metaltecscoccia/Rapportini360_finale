import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ArrowLeft, Loader2, CheckCircle, Building, User, Mail, Lock, Briefcase, Phone, CreditCard, Clock } from "lucide-react";
import logoPath from "@assets/ChatGPT_Image_20_dic_2025,_17_13_27_(1)_1766249871224.png";
import { workFields } from "../../../shared/workFieldPresets";

export default function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

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
    activationType: "manual" as "card" | "manual",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validazioni client-side
    if (!acceptedTerms) {
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

    if (formData.activationType === "card") {
      // Per attivazione con carta, la password e' obbligatoria
      if (formData.adminPassword !== formData.confirmPassword) {
        setError("Le password non coincidono.");
        return;
      }

      if (formData.adminPassword.length < 8) {
        setError("La password deve essere di almeno 8 caratteri.");
        return;
      }
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
          adminPassword: formData.activationType === "card" ? formData.adminPassword : undefined,
          billingEmail: formData.billingEmail,
          activationType: formData.activationType,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (formData.activationType === "card") {
          // Attivazione immediata - redirect alla dashboard
          window.location.href = "/";
        } else {
          // Richiesta manuale - mostra messaggio di successo
          setSuccess(data.message || "Richiesta inviata! Riceverai le credenziali via email dopo l'approvazione.");
        }
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

  // Se la registrazione manuale e' andata a buon fine, mostra solo il messaggio di successo
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
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

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
                        onChange={handleChange}
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
                        onChange={handleChange}
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
                        onChange={handleChange}
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
                        onChange={handleChange}
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
                        onChange={handleChange}
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
                        onChange={handleChange}
                        className="pl-10"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Per comunicazioni e fatturazione
                    </p>
                  </div>

                  {/* Tipo Attivazione */}
                  <div className="space-y-3">
                    <Label>Modalita di Attivazione *</Label>
                    <RadioGroup
                      value={formData.activationType}
                      onValueChange={(value: "card" | "manual") => setFormData((prev) => ({ ...prev, activationType: value }))}
                      className="space-y-3"
                    >
                      <div className={`flex items-start space-x-3 p-3 rounded-lg border ${formData.activationType === "card" ? "border-primary bg-primary/5" : "border-muted"}`}>
                        <RadioGroupItem value="card" id="card" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="card" className="flex items-center gap-2 font-medium cursor-pointer">
                            <CheckCircle className="h-4 w-4" />
                            Attivazione Immediata
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Inizia subito il trial di 30 giorni gratuito
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
                  </div>

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

                    </>
                  )}

                  {/* Termini e Condizioni */}
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="terms"
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
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
