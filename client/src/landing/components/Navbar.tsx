import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import logoPath from "@assets/LOGO V2 Rapportini360 senza scritta.PNG";
import { APP_URL, LANDING_BASE } from "@/landing/config";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href={`${LANDING_BASE}/`} className="flex items-center gap-2">
            <img src={logoPath} alt="Rapportini360" className="h-12 w-12 object-contain" />
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight">
                <span className="text-slate-800 dark:text-slate-100">Rapportini</span>
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">360</span>
              </span>
              <span className="text-[0.6rem] text-muted-foreground uppercase tracking-[0.2em] font-medium -mt-0.5">
                Gestione digitale rapportini
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => scrollToSection("features")}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Funzionalit&agrave;
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Prezzi
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              FAQ
            </button>
            <button
              onClick={() => scrollToSection("contatti")}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Contatti
            </button>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a href={`${APP_URL}/`}>
              <Button variant="ghost">Accedi</Button>
            </a>
            <a href={`${APP_URL}/signup`}>
              <Button>Inizia Gratis</Button>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-4">
              <button
                onClick={() => scrollToSection("features")}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors text-left"
              >
                Funzionalit&agrave;
              </button>
              <button
                onClick={() => scrollToSection("pricing")}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors text-left"
              >
                Prezzi
              </button>
              <button
                onClick={() => scrollToSection("faq")}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors text-left"
              >
                FAQ
              </button>
              <button
                onClick={() => scrollToSection("contatti")}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors text-left"
              >
                Contatti
              </button>
              <div className="flex flex-col gap-2 pt-4 border-t">
                <a href={`${APP_URL}/`}>
                  <Button variant="ghost" className="w-full">Accedi</Button>
                </a>
                <a href={`${APP_URL}/signup`}>
                  <Button className="w-full">Inizia Gratis</Button>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
