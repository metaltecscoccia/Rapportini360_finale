import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Trial Gratuito",
    price: "0",
    period: "per 30 giorni",
    description: "Prova tutte le funzionalita senza impegno",
    features: [
      "Fino a 5 dipendenti",
      "Rapportini illimitati",
      "Gestione commesse",
      "Tracking presenze",
      "Supporto email",
    ],
    cta: "Inizia Gratis",
    highlighted: false,
  },
  {
    name: "Premium Mensile",
    price: "49",
    period: "/mese",
    description: "Per aziende in crescita",
    features: [
      "Dipendenti illimitati",
      "Rapportini illimitati",
      "Gestione commesse",
      "Tracking presenze",
      "Gestione rifornimenti",
      "Dashboard avanzate",
      "Supporto prioritario",
      "Backup automatici",
    ],
    cta: "Scegli Mensile",
    highlighted: false,
  },
  {
    name: "Premium Annuale",
    price: "470",
    period: "/anno",
    description: "Risparmia il 20% pagando annualmente",
    features: [
      "Dipendenti illimitati",
      "Rapportini illimitati",
      "Gestione commesse",
      "Tracking presenze",
      "Gestione rifornimenti",
      "Dashboard avanzate",
      "Supporto prioritario",
      "Backup automatici",
    ],
    cta: "Scegli Annuale",
    highlighted: true,
    badge: "Piu popolare",
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Prezzi semplici e trasparenti
          </motion.h2>
          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Inizia gratis, poi scegli il piano che fa per te
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-2xl p-8 ${
                plan.highlighted
                  ? "bg-primary text-primary-foreground shadow-xl scale-105"
                  : "bg-card border"
              }`}
            >
              {plan.badge && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {plan.badge}
                </Badge>
              )}

              <div className="text-center mb-6">
                <h3 className={`text-xl font-semibold mb-2 ${
                  plan.highlighted ? "text-primary-foreground" : ""
                }`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={`text-sm ${
                    plan.highlighted ? "text-primary-foreground/80" : "text-muted-foreground"
                  }`}>
                    {plan.period}
                  </span>
                </div>
                <p className={`text-sm mt-2 ${
                  plan.highlighted ? "text-primary-foreground/80" : "text-muted-foreground"
                }`}>
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-2">
                    <Check className={`h-4 w-4 flex-shrink-0 ${
                      plan.highlighted ? "text-primary-foreground" : "text-green-500"
                    }`} />
                    <span className={`text-sm ${
                      plan.highlighted ? "text-primary-foreground/90" : ""
                    }`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link href="/signup">
                <Button
                  className="w-full"
                  variant={plan.highlighted ? "secondary" : "default"}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.p
          className="text-center text-sm text-muted-foreground mt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Tutti i prezzi sono IVA esclusa. Puoi cancellare in qualsiasi momento.
        </motion.p>
      </div>
    </section>
  );
}
