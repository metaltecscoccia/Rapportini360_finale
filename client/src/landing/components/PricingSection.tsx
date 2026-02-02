import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Clock, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const plans = [
  {
    name: "Starter",
    priceMonthly: "9.90",
    priceYearly: "99",
    description: "Ideale per ditte individuali",
    features: ["5 dipendenti", "Rapportini illimitati", "Gestione commesse", "Tracking presenze", "Supporto email"],
    cta: "Inizia ora",
    highlighted: false,
  },
  {
    name: "Business",
    priceMonthly: "19.90",
    priceYearly: "199",
    description: "Il più scelto dalle PMI",
    features: ["15 dipendenti", "Gestione avanzata", "Tracking presenze", "Gestione rifornimenti", "Dashboard avanzate", "Supporto prioritario"],
    cta: "Inizia ora",
    highlighted: true,
    badge: "Più popolare",
  },
  {
    name: "Professional",
    priceMonthly: "49.90",
    priceYearly: "499",
    description: "Per aziende strutturate",
    features: ["30 dipendenti", "Gestione completa", "Backup automatici", "API personalizzate", "Supporto 24/7", "Export avanzati"],
    cta: "Inizia ora",
    highlighted: false,
  },
  {
    name: "Custom",
    priceMonthly: "Su misura",
    priceYearly: "Su misura",
    description: "Soluzioni enterprise",
    features: ["Oltre 30 dipendenti", "Personalizzazioni", "Account manager", "SLA garantito", "Formazione on-site"],
    cta: "Contattaci",
    highlighted: false,
  },
];

export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-24 bg-muted/30 relative overflow-hidden">
      
      {/* Promo Banner - Sticky-like style */}
      <div className="absolute top-0 inset-x-0 bg-primary/10 border-b border-primary/20 py-2.5">
        <div className="container mx-auto px-4 flex justify-center items-center gap-3 text-sm font-semibold text-primary">
          <Sparkles className="h-4 w-4" />
          <span>PROMO BENVENUTO: Prezzo bloccato per i primi 12 mesi per i nuovi utenti!</span>
          <Sparkles className="h-4 w-4" />
        </div>
      </div>

      <div className="container mx-auto px-4 mt-12">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mb-4 text-green-600 dark:text-green-400 font-bold text-sm tracking-wide uppercase"
          >
            <Lock className="h-4 w-4" />
            Tariffa garantita per 1 anno
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Piani semplici, senza sorprese
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tutti i prezzi sono **IVA esclusa**. Scegli il piano più adatto alla tua squadra.
          </p>

          {/* Billing Switch */}
          <div className="flex items-center justify-center gap-4 mt-10">
            <Label htmlFor="billing" className={!isYearly ? "font-bold" : "text-muted-foreground"}>Mensile</Label>
            <Switch id="billing" checked={isYearly} onCheckedChange={setIsYearly} />
            <div className="flex items-center gap-2">
              <Label htmlFor="billing" className={isYearly ? "font-bold" : "text-muted-foreground"}>Annuale</Label>
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 text-[10px] uppercase">
                2 Mesi Gratis
              </Badge>
            </div>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative flex flex-col rounded-3xl p-8 transition-all ${
                plan.highlighted
                  ? "bg-primary text-primary-foreground shadow-2xl scale-105 z-10 border-2 border-primary"
                  : "bg-card border border-border hover:border-primary/50 shadow-sm"
              }`}
            >
              {plan.badge && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-none font-bold shadow-lg">
                  {plan.badge}
                </Badge>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tighter">
                      {plan.priceMonthly === "Su misura" 
                        ? plan.priceMonthly 
                        : isYearly ? `€${plan.priceYearly}` : `€${plan.priceMonthly}`}
                    </span>
                    {plan.priceMonthly !== "Su misura" && (
                      <span className="text-sm opacity-80">
                        {isYearly ? "/anno" : "/mese"}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${plan.highlighted ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    + IVA
                  </span>
                </div>
                <p className={`text-sm mt-4 leading-relaxed ${plan.highlighted ? "text-primary-foreground/90" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start gap-3">
                    <Check className={`h-4 w-4 mt-0.5 ${plan.highlighted ? "text-primary-foreground" : "text-green-500"}`} />
                    <span className="text-sm font-medium opacity-90">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.cta === "Contattaci" ? "/contact" : "/signup"}>
                <Button
                  className={`w-full rounded-xl font-bold h-12 ${
                    plan.highlighted 
                      ? "bg-white text-primary hover:bg-white/90" 
                      : ""
                  }`}
                  variant={plan.highlighted ? "secondary" : "outline"}
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Note Legali e Info Promo */}
        <div className="mt-16 max-w-3xl mx-auto p-6 rounded-2xl bg-muted/50 border border-dashed border-muted-foreground/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <Clock className="h-5 w-5 text-primary shrink-0" />
              <p>
                <strong>Durata Promo:</strong> L'offerta è valida per i nuovi clienti. Il prezzo sottoscritto oggi rimarrà invariato per i primi 12 mesi di abbonamento.
              </p>
            </div>
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-primary shrink-0" />
              <p>
                <strong>Fatturazione:</strong> Tutti i prezzi sono indicati al netto dell'IVA. La disdetta è possibile in qualsiasi momento prima del rinnovo successivo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Info(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
  )
}