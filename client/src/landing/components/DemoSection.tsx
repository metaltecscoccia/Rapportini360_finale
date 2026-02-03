import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Calendar,
  ClipboardList,
  Smartphone,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import screenshotRapportini from "@assets/app-rapportini.png";
import screenshotPresenze from "@assets/app-presenze.png";
import screenshotCommesse from "@assets/app-dashboard.png";
import screenshotMobile1 from "@assets/app-mobile-1.jpeg";
import screenshotMobile2 from "@assets/app-mobile-2.jpeg";

const demos = [
  {
    id: "rapportini",
    icon: FileText,
    title: "Dashboard Rapportini",
    description: "Visualizza tutti i rapportini in tempo reale. Approva, rifiuta o richiedi modifiche con un click. Filtra per dipendente, data o stato.",
    image: screenshotRapportini,
    color: "from-blue-500 to-cyan-500",
    features: ["Approvazione rapida", "Filtri avanzati", "Export dati"]
  },
  {
    id: "presenze",
    icon: Calendar,
    title: "Foglio Presenze",
    description: "Calendario mensile con vista completa delle presenze. Gestisci ferie, permessi e malattie. Legenda colorata per identificare subito le assenze.",
    image: screenshotPresenze,
    color: "from-purple-500 to-pink-500",
    features: ["Vista calendario", "Gestione assenze", "Report mensili"]
  },
  {
    id: "commesse",
    icon: ClipboardList,
    title: "Gestione Commesse",
    description: "Organizza le commesse per cliente. Monitora ore lavorate, stato di avanzamento e scadenze. Tutto raggruppato in modo chiaro.",
    image: screenshotCommesse,
    color: "from-orange-500 to-red-500",
    features: ["Per cliente", "Tracking ore", "Stati personalizzati"]
  },
  {
    id: "mobile",
    icon: Smartphone,
    title: "App Mobile",
    description: "I dipendenti compilano i rapportini direttamente dal cantiere. Interfaccia semplice e intuitiva.",
    image: screenshotMobile1,
    secondImage: screenshotMobile2,
    color: "from-green-500 to-emerald-500",
    features: ["Facile da usare", "Foto allegate", "Sincronizzazione"],
    isMobile: true
  }
];

export default function DemoSection() {
  const [activeDemo, setActiveDemo] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextDemo = () => {
    setActiveDemo((prev) => (prev + 1) % demos.length);
  };

  const prevDemo = () => {
    setActiveDemo((prev) => (prev - 1 + demos.length) % demos.length);
  };

  // Auto-scroll ogni 5 secondi, pausa su hover
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setActiveDemo((prev) => (prev + 1) % demos.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, activeDemo]);

  const currentDemo = demos[activeDemo];
  const Icon = currentDemo.icon;

  return (
    <section id="demo" className="py-24 bg-slate-50 dark:bg-slate-900/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-semibold text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">
            Esplora le funzionalita
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Scopri cosa puoi fare
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Una piattaforma completa per gestire ogni aspetto del lavoro quotidiano
          </p>
        </motion.div>

        {/* Demo Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {demos.map((demo, index) => {
            const TabIcon = demo.icon;
            return (
              <button
                key={demo.id}
                onClick={() => setActiveDemo(index)}
                className={`flex items-center gap-2 px-5 py-3 rounded-full font-medium transition-all ${
                  activeDemo === index
                    ? `bg-gradient-to-r ${demo.color} text-white shadow-lg`
                    : "bg-white dark:bg-slate-800 text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <TabIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{demo.title}</span>
              </button>
            );
          })}
        </div>

        {/* Demo Content */}
        <div
          className="grid lg:grid-cols-2 gap-12 items-center"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Left - Info */}
          <motion.div
            key={currentDemo.id + "-info"}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${currentDemo.color} text-white mb-6 shadow-lg`}>
              <Icon className="h-8 w-8" />
            </div>

            <h3 className="text-3xl font-bold mb-4">{currentDemo.title}</h3>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              {currentDemo.description}
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              {currentDemo.features.map((feature, i) => (
                <span
                  key={i}
                  className="px-4 py-2 bg-white dark:bg-slate-800 rounded-lg text-sm font-medium shadow-sm"
                >
                  {feature}
                </span>
              ))}
            </div>

            {/* Navigation Arrows */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={prevDemo}
                className="rounded-full"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {activeDemo + 1} / {demos.length}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={nextDemo}
                className="rounded-full"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>

          {/* Right - Screenshot */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentDemo.id + "-image"}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              {currentDemo.isMobile ? (
                // Mobile Screenshots Side by Side
                <div className="flex justify-center gap-4">
                  <div className="bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl w-52">
                    <div className="bg-slate-900 rounded-[2rem] overflow-hidden">
                      <div className="bg-slate-900 px-4 py-2 flex items-center justify-center">
                        <div className="w-16 h-1 bg-slate-700 rounded-full"></div>
                      </div>
                      <img
                        src={currentDemo.image}
                        alt={currentDemo.title}
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                  {currentDemo.secondImage && (
                    <div className="bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl w-52 mt-12">
                      <div className="bg-slate-900 rounded-[2rem] overflow-hidden">
                        <div className="bg-slate-900 px-4 py-2 flex items-center justify-center">
                          <div className="w-16 h-1 bg-slate-700 rounded-full"></div>
                        </div>
                        <img
                          src={currentDemo.secondImage}
                          alt={currentDemo.title + " 2"}
                          className="w-full h-auto"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Desktop Screenshot with Browser Frame
                <div className="relative">
                  <div className={`absolute -inset-4 bg-gradient-to-r ${currentDemo.color} rounded-2xl opacity-20 blur-xl`}></div>
                  <div className="relative bg-slate-800 rounded-xl overflow-hidden shadow-2xl">
                    <div className="p-3 flex items-center gap-2 border-b border-slate-700">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                      <div className="flex-1 flex justify-center">
                        <div className="bg-slate-700 rounded px-4 py-1 text-xs text-slate-400">
                          rapportini360.metaltecscoccia.it
                        </div>
                      </div>
                    </div>
                    <img
                      src={currentDemo.image}
                      alt={currentDemo.title}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
