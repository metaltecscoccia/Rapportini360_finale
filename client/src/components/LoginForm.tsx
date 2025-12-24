import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogIn, Loader2, AlertCircle, Shield, Check } from "lucide-react";
import { ShakeOnError } from "@/components/ui/animated";
import logoPath from "@assets/ChatGPT_Image_20_dic_2025,_17_13_27_(1)_1766249871224.png";

interface LoginFormProps {
  onLogin: (
    username: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Load saved credentials on mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem("metaltec_login_credentials");
    if (savedCredentials) {
      try {
        const { username: savedUsername } = JSON.parse(savedCredentials);
        setUsername(savedUsername || "");
        setRememberMe(true);
      } catch (error) {
        console.warn("Error loading saved credentials:", error);
        localStorage.removeItem("metaltec_login_credentials");
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await onLogin(username, password);

      if (result.success) {
        // Save only username if remember me is checked (NEVER save password)
        if (rememberMe) {
          localStorage.setItem(
            "metaltec_login_credentials",
            JSON.stringify({
              username,
            }),
          );
        } else {
          localStorage.removeItem("metaltec_login_credentials");
        }
      } else {
        setErrorMessage(result.error || "Login fallito");
      }
    } catch (error) {
      setErrorMessage("Errore di connessione al server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    // Clear error when user starts typing
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    // Clear error when user starts typing
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-4">
            <motion.div 
              className="flex justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4, type: "spring", stiffness: 200 }}
            >
              <img
                src={logoPath}
                alt="Rapportini360"
                className="max-h-72 w-auto object-contain"
              />
            </motion.div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="space-y-2"
              >
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="Inserisci username"
                  required
                  disabled={isLoading}
                  autoComplete="username"
                  data-testid="input-username"
                  className="transition-colors"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="space-y-2"
              >
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Inserisci password"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  data-testid="input-password"
                  className="transition-colors"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={isLoading}
                  data-testid="checkbox-remember-me"
                />
                <Label
                  htmlFor="remember-me"
                  className="text-sm font-normal cursor-pointer select-none"
                >
                  Ricorda username
                </Label>
              </motion.div>

              <AnimatePresence mode="wait">
                {errorMessage && (
                  <ShakeOnError hasError={!!errorMessage}>
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{errorMessage}</AlertDescription>
                      </Alert>
                    </motion.div>
                  </ShakeOnError>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {!errorMessage && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-2 p-3 bg-muted rounded-lg text-sm text-muted-foreground"
                  >
                    <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>
                      Accesso sicuro con protezione contro accessi non autorizzati.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-login"
                >
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center"
                      >
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Accesso in corso...
                      </motion.span>
                    ) : (
                      <motion.span
                        key="default"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center"
                      >
                        <LogIn className="h-4 w-4 mr-2" />
                        Accedi
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.3 }}
              className="mt-6 text-center text-xs text-muted-foreground"
            >
              <p>METALTEC Scoccia S.R.L. © {new Date().getFullYear()}</p>
              <p className="mt-1">Sistema di gestione rapportini v2.0</p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
