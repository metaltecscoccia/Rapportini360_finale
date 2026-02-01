import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { queryClient } from "./lib/queryClient";
import {
  QueryClientProvider,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import NotFound from "@/pages/not-found";
import LoginForm from "@/components/LoginForm";
import LandingPage from "@/landing/LandingPage";
import SignupForm from "@/landing/SignupForm";
import SetPasswordForm from "@/components/SetPasswordForm";
import DailyReportForm from "@/components/DailyReportForm";
import TeamReportForm from "@/components/TeamReportForm";
import AdminDashboard from "@/components/AdminDashboard";
import SuperAdminDashboard from "@/components/SuperAdminDashboard";
import SubscriptionBanner from "@/components/SubscriptionBanner";
import ThemeToggle from "@/components/ThemeToggle";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";
import CookiePage from "@/pages/CookiePage";
import ContattiPage from "@/pages/ContattiPage";
import ChiSiamoPage from "@/pages/ChiSiamoPage";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDateToItalian } from "@/lib/dateUtils";
import logoPath from "@assets/ChatGPT_Image_20_dic_2025,_17_13_27_(1)_1766249871224.png";

type User = {
  id: string;
  username: string;
  role: "employee" | "admin" | "superadmin" | "teamleader";
  fullName: string;
};

function Router() {
  return (
    <Switch>
      <Route component={NotFound} />
    </Switch>
  );
}

// ============================================
// AUTHENTICATED APP COMPONENT
// ============================================

function AuthenticatedApp({
  currentUser,
  onLogout,
}: {
  currentUser: User;
  onLogout: () => void;
}) {
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      // Call logout API to destroy session
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      // Always clear frontend state regardless of API call result
      onLogout();
      toast({
        title: "Logout effettuato",
        description: "Sei stato disconnesso con successo.",
      });
    }
  };

  // Load today's report if exists (only for employees)
  const {
    data: todayReport,
    isLoading: loadingTodayReport,
    error: reportError,
    isError: hasReportError,
  } = useQuery<any>({
    queryKey: ["/api/daily-reports/today"],
    enabled: currentUser.role === "employee",
    retry: false,
    staleTime: 0,
  });

  // Determine if the error is a 404 (no report exists) or a real server error
  // The queryClient throws errors in format "404: error message"
  const isReportNotFound = hasReportError && (reportError as Error)?.message?.startsWith('404');
  const hasServerError = hasReportError && !isReportNotFound;

  // Mutation to create new daily report
  const createReportMutation = useMutation({
    mutationFn: async (operations: any[]) => {
      if (!currentUser) throw new Error("User not logged in");

      const response = await apiRequest("POST", "/api/daily-reports", {
        operations,
      });

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-reports/today"] });
      toast({
        title: "Rapportino creato",
        description:
          "Il rapportino è stato inviato con successo e è in attesa di approvazione.",
      });
    },
    onError: (error: any) => {
      console.error("Error creating report:", error);
      // Mostra il messaggio di errore reale dal server
      let errorMsg = "Impossibile creare il rapportino. Riprova più tardi.";
      try {
        const errorText = error.message || "";
        // Il formato è "400: {json}" - estraiamo il JSON
        const jsonStart = errorText.indexOf("{");
        if (jsonStart !== -1) {
          const parsed = JSON.parse(errorText.substring(jsonStart));
          errorMsg = parsed.error || errorMsg;
          if (parsed.details) {
            errorMsg += ` | Dettagli: ${parsed.details}`;
          }
        }
      } catch (e) {
        // usa messaggio generico
      }
      toast({
        title: "Errore",
        description: errorMsg,
        variant: "destructive",
      });
    },
  });

  // Mutation to update existing daily report
  const updateReportMutation = useMutation({
    mutationFn: async ({
      reportId,
      operations,
    }: {
      reportId: string;
      operations: any[];
    }) => {
      const response = await apiRequest(
        "PUT",
        `/api/daily-reports/${reportId}`,
        {
          operations,
        },
      );

      return response.json();
    },
    onSuccess: (data) => {
      // Invalida TUTTE le query che iniziano con /api/daily-reports
      queryClient.invalidateQueries({ queryKey: ["/api/daily-reports"] });
      toast({
        title: "Rapportino aggiornato",
        description: data.status === "In attesa"
          ? "Stato resettato per nuova approvazione."
          : "Le lavorazioni sono state aggiunte con successo.",
      });
    },
    onError: (error: any) => {
      console.error("Error updating report:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il rapportino. Riprova più tardi.",
        variant: "destructive",
      });
    },
  });

  const handleReportSubmit = (operations: any[]) => {
    if (todayReport) {
      // Update existing report
      updateReportMutation.mutate({ reportId: todayReport.id, operations });
    } else {
      // Create new report
      createReportMutation.mutate(operations);
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <motion.header
        className="border-b bg-gradient-header shadow-sm"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center gap-3"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <img
                src={logoPath}
                alt="Logo Aziendale"
                className="h-[100px] w-[100px] object-contain"
              />
              <div>
                <h1 className="text-xl font-semibold text-gradient-primary">
                  {currentUser.role === "superadmin"
                    ? "Super Admin"
                    : currentUser.role === "admin"
                    ? "Dashboard Amministratore"
                    : currentUser.role === "teamleader"
                    ? "Rapportino Squadra"
                    : "Rapportini Giornalieri"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Benvenuto, {currentUser.fullName}
                </p>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center gap-2"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <ThemeToggle />
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Esci
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Tasto MENU full-width per mobile admin */}
      {currentUser.role === "admin" && (
        <button
          className="md:hidden w-full bg-primary text-primary-foreground py-3
                     border-b shadow-sm hover:bg-primary/90 active:bg-primary/80
                     transition-colors font-medium"
          onClick={() => setMobileMenuOpen(true)}
        >
          MENU
        </button>
      )}

      {/* Subscription Banner */}
      <div className="container mx-auto px-4 pt-4">
        <SubscriptionBanner />
      </div>

      {/* Main Content */}
      <main className="container mx-auto">
        <Switch>
          {/* Default Route */}
          <Route path="/">
            {currentUser.role === "superadmin" ? (
              <SuperAdminDashboard />
            ) : currentUser.role === "admin" ? (
              <AdminDashboard
                mobileMenuOpen={mobileMenuOpen}
                onMobileMenuClose={() => setMobileMenuOpen(false)}
              />
            ) : currentUser.role === "teamleader" ? (
              <div className="py-6">
                <TeamReportForm
                  teamLeaderId={currentUser.id}
                  teamLeaderName={currentUser.fullName}
                />
              </div>
            ) : (
              <div className="py-6">
                {loadingTodayReport ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                      <p className="text-muted-foreground mt-2">Caricamento...</p>
                    </div>
                  </div>
                ) : hasServerError ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <p className="text-destructive mb-2">Errore di caricamento</p>
                      <p className="text-muted-foreground text-sm">
                        Si è verificato un errore durante il caricamento del rapportino. Riprova più tardi.
                      </p>
                    </div>
                  </div>
                ) : (
                  <DailyReportForm
                    employeeName={currentUser.fullName}
                    date={formatDateToItalian(
                      new Date().toISOString().split("T")[0],
                    )}
                    onSubmit={handleReportSubmit}
                    initialOperations={todayReport?.operations}
                    isEditing={!!todayReport}
                    isSubmitting={
                      createReportMutation.isPending ||
                      updateReportMutation.isPending
                    }
                    reportStatus={todayReport?.status ?? null}
                  />
                )}
              </div>
            )}
          </Route>
        </Switch>
      </main>
    </motion.div>
  );
}

// ============================================
// MAIN APP COMPONENT
// ============================================

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mustResetPassword, setMustResetPassword] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (
    username: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include session cookies
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Clear all cached queries to prevent showing data from previous user
        queryClient.clear();

        // Check if user must reset password (temporary password)
        if (data.mustResetPassword) {
          setCurrentUser(data.user); // Set user for authenticated session
          setMustResetPassword(true); // Show SetPasswordForm
          toast({
            title: "Password temporanea",
            description: "Imposta una nuova password per continuare.",
          });
          return { success: true };
        }

        setCurrentUser(data.user);
        toast({
          title: "Login effettuato",
          description: `Benvenuto, ${data.user.fullName}!`,
        });
        return { success: true };
      } else {
        return { success: false, error: data.error || "Login fallito" };
      }
    } catch (error) {
      console.error("Error during login:", error);
      return { success: false, error: "Errore di connessione al server" };
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Show SetPasswordForm if user must reset password
  if (mustResetPassword && currentUser) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider>
            <SetPasswordForm />
            <Toaster />
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Show public pages if not authenticated
  if (!currentUser) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Switch>
            {/* Landing Page */}
            <Route path="/home">
              <LandingPage />
              <Toaster />
            </Route>
            {/* Signup */}
            <Route path="/signup">
              <SignupForm />
              <Toaster />
            </Route>
            {/* Legal Pages */}
            <Route path="/privacy">
              <ThemeProvider>
                <PrivacyPage />
                <Toaster />
              </ThemeProvider>
            </Route>
            <Route path="/termini">
              <ThemeProvider>
                <TermsPage />
                <Toaster />
              </ThemeProvider>
            </Route>
            <Route path="/cookie">
              <ThemeProvider>
                <CookiePage />
                <Toaster />
              </ThemeProvider>
            </Route>
            <Route path="/contatti">
              <ThemeProvider>
                <ContattiPage />
                <Toaster />
              </ThemeProvider>
            </Route>
            <Route path="/chi-siamo">
              <ThemeProvider>
                <ChiSiamoPage />
                <Toaster />
              </ThemeProvider>
            </Route>
            {/* Login (default) */}
            <Route path="/">
              <ThemeProvider>
                <LoginForm onLogin={handleLogin} />
                <Toaster />
              </ThemeProvider>
            </Route>
            {/* Fallback to login */}
            <Route>
              <ThemeProvider>
                <LoginForm onLogin={handleLogin} />
                <Toaster />
              </ThemeProvider>
            </Route>
          </Switch>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Show authenticated app
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthenticatedApp currentUser={currentUser} onLogout={handleLogout} />
          <Toaster />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
