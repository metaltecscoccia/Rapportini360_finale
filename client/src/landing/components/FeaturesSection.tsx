import { motion } from "framer-motion";
import {
  FileText,
  ClipboardList,
  Calendar,
  Fuel,
  BarChart2,
  Users,
  Building,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Rapportini Digitali",
    description:
      "I dipendenti compilano i rapportini giornalieri direttamente dal loro dispositivo. Niente piu carta, tutto organizzato.",
  },
  {
    icon: ClipboardList,
    title: "Gestione Commesse",
    description:
      "Crea e gestisci commesse per ogni cliente. Traccia ore lavorate, materiali usati e stato di avanzamento.",
  },
  {
    icon: Calendar,
    title: "Tracking Presenze",
    description:
      "Registra ferie, permessi e malattie. Visualizza il calendario presenze di tutto il team in un colpo d'occhio.",
  },
  {
    icon: Fuel,
    title: "Gestione Rifornimenti",
    description:
      "Traccia i rifornimenti dei mezzi aziendali. Monitora consumi e costi carburante per ogni veicolo.",
  },
  {
    icon: BarChart2,
    title: "Dashboard e Statistiche",
    description:
      "Report dettagliati su ore lavorate, costi e produttivita. Esporta i dati quando ne hai bisogno.",
  },
  {
    icon: Users,
    title: "Multi-utente",
    description:
      "Aggiungi tutti i dipendenti che vuoi. Ogni utente ha il suo accesso personale con permessi appropriati.",
  },
  {
    icon: Building,
    title: "Gestione Clienti",
    description:
      "Anagrafica clienti completa. Associa commesse e rapportini a ogni cliente per una visione completa.",
  },
  {
    icon: Shield,
    title: "Sicuro e Affidabile",
    description:
      "I tuoi dati sono al sicuro. Backup automatici e crittografia per proteggere le informazioni aziendali.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Tutto cio che ti serve per gestire il lavoro
          </motion.h2>
          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Una piattaforma completa per digitalizzare la gestione quotidiana
            della tua azienda
          </motion.p>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
