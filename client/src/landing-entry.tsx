import { createRoot } from "react-dom/client";
import { Router, Switch, Route } from "wouter";
import { ThemeProvider } from "@/components/ThemeProvider";
import LandingPage from "@/landing/LandingPage";
import ChiSiamoPage from "@/pages/ChiSiamoPage";
import ContattiPage from "@/pages/ContattiPage";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";
import CookiePage from "@/pages/CookiePage";
import "./index.css";

function LandingApp() {
  return (
    <ThemeProvider>
      <Router base="/rapportini360">
        <Switch>
          <Route path="/" component={LandingPage} />
          <Route path="/chi-siamo" component={ChiSiamoPage} />
          <Route path="/contatti" component={ContattiPage} />
          <Route path="/privacy" component={PrivacyPage} />
          <Route path="/termini" component={TermsPage} />
          <Route path="/cookie" component={CookiePage} />
          <Route>
            <LandingPage />
          </Route>
        </Switch>
      </Router>
    </ThemeProvider>
  );
}

createRoot(document.getElementById("root")!).render(<LandingApp />);
