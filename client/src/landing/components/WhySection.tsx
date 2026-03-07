import { motion } from "framer-motion";
import { Smartphone, Clock, FileX, Briefcase, Users } from "lucide-react";
import { SITE_URL } from "@/landing/config";

const items = [
  {
    icon: Smartphone,
    title: "App per Rapportini Giornalieri",
    description: "Elimina i fogli di carta: i tuoi dipendenti compilano i rapportini direttamente dallo smartphone, ovunque si trovino.",
    href: `${SITE_URL}/app-rapportini-giornalieri/`,
  },
  {
    icon: Clock,
    title: "Controllo Ore Dipendenti Online",
    description: "Monitora le ore lavorate in tempo reale, senza rincorrere fogli presenze o email.",
    href: `${SITE_URL}/controllo-ore-dipendenti-online/`,
  },
  {
    icon: FileX,
    title: "Elimina Excel dalle Commesse",
    description: "Scopri perché i fogli Excel non bastano più e come gestire le commesse in modo strutturato.",
    href: `${SITE_URL}/eliminare-excel-gestione-commesse/`,
  },
  {
    icon: Briefcase,
    title: "Gestione Commesse per PMI",
    description: "Tieni sotto controllo costi, tempi e risorse di ogni commessa, tutto in un unico posto.",
    href: `${SITE_URL}/gestione-commesse-pmi/`,
  },
  {
    icon: Users,
    title: "Software Rapportini Dipendenti",
    description: "Una piattaforma semplice per raccogliere e gestire i rapportini di tutti i dipendenti.",
    href: `${SITE_URL}/software-rapportini-dipendenti/`,
  },
];

export default function WhySection() {
  return (
    <section id="perche" className="relative py-24 bg-[#050d1a] text-white overflow-hidden">
      {/* Background decorativo */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute top-[-5%] right-[-5%] w-[35%] h-[35%] bg-blue-600/40 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[35%] h-[35%] bg-primary/30 rounded-full blur-[100px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-sm font-bold tracking-[0.2em] text-primary uppercase mb-3"
          >
            Le nostre soluzioni
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80"
          >
            Perché Rapportini360?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-white/50 max-w-xl mx-auto text-lg"
          >
            Scopri come risolve i problemi reali della tua azienda
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <motion.a
              key={item.title}
              href={item.href}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              className="group flex flex-col gap-4 p-7 rounded-[1.5rem] bg-white/[0.04] border border-white/10 hover:border-primary/40 hover:bg-white/[0.07] transition-all duration-300 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white mb-2 leading-snug">{item.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed group-hover:text-white/70 transition-colors">{item.description}</p>
              </div>
              <span className="text-sm font-semibold text-primary group-hover:translate-x-1 transition-transform inline-block">
                Scopri di più &rarr;
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
