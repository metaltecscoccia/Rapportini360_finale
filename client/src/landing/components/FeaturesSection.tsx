import { motion } from "framer-motion";
import {
  FileText,
  ClipboardList,
  Calendar,
  Fuel,
  BarChart2,
  Users,
  Camera,
  UsersRound,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Rapportini Digitali",
    description: "Compila dal telefono, controlla dalla dashboard. Niente piu fogli di carta persi.",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    icon: ClipboardList,
    title: "Gestione Commesse",
    description: "Organizza per cliente, traccia ore e materiali. Tutto in un colpo d'occhio.",
    gradient: "from-purple-500 to-purple-600",
  },
  {
    icon: Calendar,
    title: "Presenze e Assenze",
    description: "Calendario completo. Ferie, permessi, malattie. Sempre tutto aggiornato.",
    gradient: "from-green-500 to-green-600",
  },
  {
    icon: Fuel,
    title: "Rifornimenti Mezzi",
    description: "Traccia ogni pieno. Monitora i consumi. Controlla i costi carburante.",
    gradient: "from-orange-500 to-orange-600",
  },
  {
    icon: Camera,
    title: "Foto dal Cantiere",
    description: "Allega fino a 5 foto per lavorazione. Documenta il lavoro svolto.",
    gradient: "from-pink-500 to-pink-600",
  },
  {
    icon: BarChart2,
    title: "Report e Statistiche",
    description: "Grafici chiari. Export Excel. Analizza produttivita e costi.",
    gradient: "from-cyan-500 to-cyan-600",
  },
  {
    icon: Users,
    title: "Multi-Dipendente",
    description: "Aggiungi tutto il team. Ogni utente ha il suo accesso personale.",
    gradient: "from-indigo-500 to-indigo-600",
  },
  {
    icon: UsersRound,
    title: "Gestione Squadre",
    description: "Organizza il team in squadre. Il caposquadra compila 1 rapportino per tutti i dipendenti.",
    gradient: "from-teal-500 to-teal-600",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-semibold text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
            Funzionalita
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Tutto quello che ti serve
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Una suite completa per digitalizzare la gestione quotidiana della tua azienda
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group relative"
              >
                <div className="h-full p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:border-slate-200 dark:hover:border-slate-600 transition-all">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6" />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Hover Gradient Effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity -z-10`}></div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-muted-foreground mb-4">
            E molto altro ancora...
          </p>
          <button
            onClick={() => {
              const el = document.getElementById("pricing");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            Scopri i piani disponibili →
          </button>
        </motion.div>
      </div>
    </section>
  );
}
