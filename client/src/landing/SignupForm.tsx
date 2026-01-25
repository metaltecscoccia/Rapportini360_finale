import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ArrowLeft, Loader2, CheckCircle, Building, User, Mail, Lock } from "lucide-react";
import logoPath from "@assets/ChatGPT_Image_20_dic_2025,_17_13_27_(1)_1766249871224.png";

export default function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [formData, setFormData] = useState({
    organizationName: "",
    adminFullName: "",
    adminUsername: "",
    billingEmail: "",
    adminPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validazioni client-side
    if (!acceptedTerms) {
      setError("Devi accettare i termini e condizioni per continuare.");
      return;
    }

    if (formData.adminPassword !== formData.confirmPassword) {
      setError("Le password non coincidono.");
      return;
    }

    if (formData.adminPassword.length < 8) {
      setError("La password deve essere di almeno 8 caratteri.");
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
          adminFullName: formData.adminFullName,
          adminUsername: formData.adminUsername,
          adminPassword: formData.adminPassword,
          billingEmail: formData.billingEmail,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Registrazione riuscita - redirect alla dashboard
        // L'auto-login è già stato fatto dal backend
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
  };

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
                  <img src={logoPath} alt="Rapportini360" className="h-16 w-16 object-contain" />
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
                    <Label htmlFor="organizationName">Nome Azienda</Label>
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

                  {/* Nome Completo Admin */}
                  <div className="space-y-2">
                    <Label htmlFor="adminFullName">Nome e Cognome</Label>
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
                    <Label htmlFor="adminUsername">Username</Label>
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
                    <Label htmlFor="billingEmail">Email</Label>
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

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">Password</Label>
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

                  {/* Conferma Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Conferma Password</Label>
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
                        Creazione account...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Crea Account Gratuito
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
                  <span>Nessuna carta richiesta</span>
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
