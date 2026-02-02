import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";

export default function SignupSuccessPage() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");

    if (!sessionId) {
      setStatus("error");
      setError("Sessione non valida. Riprova la registrazione.");
      return;
    }

    // Verifica la sessione e attiva l'account
    const verifySession = async () => {
      try {
        const response = await fetch("/api/signup/verify-checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus("success");
          // Redirect alla dashboard dopo 2 secondi
          setTimeout(() => {
            setLocation("/");
          }, 2000);
        } else {
          setStatus("error");
          setError(data.error || "Errore durante la verifica. Contatta l'assistenza.");
        }
      } catch (err) {
        console.error("Verify session error:", err);
        setStatus("error");
        setError("Errore di connessione. Riprova.");
      }
    };

    verifySession();
  }, [setLocation]);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {status === "loading" && (
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  </div>
                )}
                {status === "success" && (
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                )}
                {status === "error" && (
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                )}
              </div>

              {status === "loading" && (
                <>
                  <CardTitle className="text-2xl">Attivazione in corso...</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Stiamo verificando il pagamento e attivando il tuo account.
                  </CardDescription>
                </>
              )}

              {status === "success" && (
                <>
                  <CardTitle className="text-2xl">Benvenuto!</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Il tuo account e' stato attivato con successo. Il trial di 30 giorni e' iniziato.
                  </CardDescription>
                </>
              )}

              {status === "error" && (
                <>
                  <CardTitle className="text-2xl">Errore</CardTitle>
                  <CardDescription className="text-base mt-2 text-red-600">
                    {error}
                  </CardDescription>
                </>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {status === "success" && (
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg text-sm">
                  <p className="text-green-700 dark:text-green-300">
                    Verrai reindirizzato alla dashboard tra pochi secondi...
                  </p>
                </div>
              )}

              {status === "error" && (
                <div className="space-y-3">
                  <Button
                    onClick={() => setLocation("/signup")}
                    variant="outline"
                    className="w-full"
                  >
                    Torna alla registrazione
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Se il problema persiste, contatta{" "}
                    <a href="mailto:info@metaltecscoccia.it" className="text-primary hover:underline">
                      info@metaltecscoccia.it
                    </a>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ThemeProvider>
  );
}
