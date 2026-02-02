import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    priceMonthly: "9.90",
    priceYearly: "99",
    description: "Per ditte individuali e piccoli team.",
    features: ["5 dipendenti", "Rapportini illimitati", "Gestione commesse", "Tracking presenze", "Supporto email"],
    highlighted: false,
  },
  {
    name: "Business",
    priceMonthly: "19.90",
    priceYearly: "199",
    description: "La soluzione completa per PMI in crescita.",
    features: ["15 dipendenti", "Gestione avanzata", "Tracking presenze", "Gestione rifornimenti", "Dashboard Pro", "Supporto prioritario"],
    highlighted: true,
    badge: "Più Popolare",
  },
  {
    name: "Professional",
    priceMonthly: "49.90",
    priceYearly: "499",
    description: "Per aziende che necessitano di controllo totale.",
    features: ["30 dipendenti", "Backup automatici", "API dedicate", "Supporto 24/7", "Export avanzati", "Multi-sede"],
    highlighted: false,
  },
  {
    name: "Custom",
    priceMonthly: "Su misura",
    priceYearly: "Su misura",
    description: "Configurazione enterprise personalizzata.",
    features: ["Oltre 30 dipendenti", "Personalizzazioni", "Account manager", "SLA garantito", "Formazione on-site"],
    highlighted: false,
    cta: "Contattaci",
  },
];

export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section className="relative py-24 bg-[#030712] text-white overflow-hidden">
      {/* Background Decorativo - Mesh Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/30 rounded-full blur-[120px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        {/* Top Promo Banner */}
        <div className="flex justify-center mb-8">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
          >
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium text-blue-200">Promo nuovi utenti: Prezzo bloccato per 12 mesi</span>
          </motion.div>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
            Piani per ogni dimensione
          </h2>
          
          {/* MAXI SWITCH - Impossibile da mancare */}
          <div className="flex justify-center mt-10">
            <div className="relative p-1.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-1 w-full max-w-[400px]">
              {/* Sfondo Animato dello Switch */}
              <motion.div
                className="absolute inset-y-1.5 bg-primary rounded-xl shadow-lg shadow-primary/20"
                initial={false}
                animate={{
                  x: isYearly ? "calc(100% - 4px)" : "4px",
                  width: "calc(50% - 4px)"
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              
              <button
                onClick={() => setIsYearly(false)}
                className={cn(
                  "relative flex-1 py-4 text-sm font-bold transition-colors z-20",
                  !isYearly ? "text-white" : "text-white/50 hover:text-white/80"
                )}
              >
                Fatturazione Mensile
              </button>
              
              <button
                onClick={() => setIsYearly(true)}
                className={cn(
                  "relative flex-1 py-4 text-sm font-bold transition-colors z-20 flex items-center justify-center gap-2",
                  isYearly ? "text-white" : "text-white/50 hover:text-white/80"
                )}
              >
                Fatturazione Annuale
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-green-500/20 text-green-400 text-[10px] border border-green-500/30">
                  -20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8 }}
              className={cn(
                "relative group flex flex-col p-8 rounded-[2rem] transition-all duration-500",
                plan.highlighted 
                  ? "bg-white/[0.08] border-2 border-primary/50 shadow-[0_0_40px_-15px_rgba(59,130,246,0.5)]" 
                  : "bg-white/[0.03] border border-white/10 hover:border-white/20 shadow-xl"
              )}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-primary text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/30">
                  {plan.badge}
                </div>
              )}

              <div className="mb-8">
                <span className="text-xs font-bold tracking-[0.2em] text-primary uppercase mb-2 block italic">
                  {plan.name}
                </span>
                
                <div className="flex items-start gap-1">
                  <span className="text-xl font-medium mt-1 text-white/50">€</span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={isYearly ? "y" : "m"}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-5xl font-black tracking-tighter"
                    >
                      {plan.priceMonthly === "Su misura" 
                        ? plan.priceMonthly 
                        : isYearly ? plan.priceYearly : plan.priceMonthly}
                    </motion.span>
                  </AnimatePresence>
                  {plan.priceMonthly !== "Su misura" && (
                    <div className="flex flex-col ml-2">
                      <span className="text-xs text-white/40 uppercase font-bold tracking-tighter">
                        {isYearly ? "/ anno" : "/ mese"}
                      </span>
                      <span className="text-[10px] text-primary font-black">+ IVA</span>
                    </div>
                  )}
                </div>
                <p className="mt-4 text-sm text-white/60 leading-relaxed min-h-[3rem]">
                  {plan.description}
                </p>
              </div>

              <div className="space-y-4 mb-10 flex-grow">
                {plan.features.map((feat) => (
                  <div key={feat} className="flex items-center gap-3 group/item">
                    <div className="h-5 w-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center transition-colors group-hover/item:bg-primary/30">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm text-white/80 group-hover/item:text-white transition-colors">{feat}</span>
                  </div>
                ))}
              </div>

              <Button
                variant={plan.highlighted ? "default" : "outline"}
                className={cn(
                  "w-full h-14 rounded-2xl font-black transition-all text-base uppercase tracking-wider",
                  plan.highlighted 
                    ? "bg-primary hover:bg-primary/80 shadow-lg shadow-primary/20" 
                    : "border-white/10 hover:bg-white/10"
                )}
              >
                {plan.cta || "Scegli il piano"}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-20 flex flex-col md:flex-row items-center justify-center gap-8 text-white/40 border-t border-white/5 pt-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            <span className="text-sm">Prezzo bloccato per 12 mesi</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span className="text-sm">Attivazione istantanea</span>
          </div>
          <p className="text-xs italic">* I prezzi non includono l\'IVA applicabile per legge.</p>
        </div>
      </div>
    </section>
  );
}