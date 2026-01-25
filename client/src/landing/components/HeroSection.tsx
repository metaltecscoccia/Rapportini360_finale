import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Smartphone, Monitor } from "lucide-react";
import { motion } from "framer-motion";
import screenshotDesktop from "@assets/app-rapportini.png";
import screenshotMobile1 from "@assets/app-mobile-1.jpeg";

export default function HeroSection() {
  return (
    <section className="pt-28 pb-20 md:pt-36 md:pb-28 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-semibold text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Prova gratuita 30 giorni
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
              Digitalizza i{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                rapportini
              </span>{" "}
              della tua azienda
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              I tuoi dipendenti compilano dal telefono, tu controlli tutto dalla dashboard.
              Gestisci commesse, presenze e rifornimenti in un'unica piattaforma.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link href="/signup">
                <Button size="lg" className="text-lg px-8 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25">
                  Inizia Gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 h-14"
                onClick={() => {
                  const element = document.getElementById("demo");
                  if (element) element.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Guarda la Demo
              </Button>
            </div>

            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                </div>
                <span className="text-muted-foreground">Nessuna carta richiesta</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                </div>
                <span className="text-muted-foreground">Setup in 2 minuti</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                </div>
                <span className="text-muted-foreground">Cancella quando vuoi</span>
              </div>
            </div>
          </motion.div>

          {/* Right - Screenshots */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Desktop Screenshot */}
            <div className="relative z-10">
              <div className="bg-slate-800 rounded-t-xl p-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-slate-700 rounded px-3 py-1 text-xs text-slate-400 flex items-center gap-2">
                    <Monitor className="h-3 w-3" />
                    rapportini360.it
                  </div>
                </div>
              </div>
              <div className="rounded-b-xl overflow-hidden shadow-2xl border border-slate-700">
                <img
                  src={screenshotDesktop}
                  alt="Dashboard Rapportini360"
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Mobile Screenshot - Floating */}
            <motion.div
              className="absolute -bottom-8 -left-8 z-20 w-48 md:w-56"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="bg-slate-900 rounded-[2rem] p-2 shadow-2xl">
                <div className="bg-slate-900 rounded-[1.5rem] overflow-hidden">
                  <div className="bg-slate-900 px-4 py-2 flex items-center justify-center">
                    <div className="w-20 h-1 bg-slate-700 rounded-full"></div>
                  </div>
                  <img
                    src={screenshotMobile1}
                    alt="App Mobile Rapportini360"
                    className="w-full h-auto"
                  />
                </div>
              </div>
              <div className="absolute -top-3 -right-3 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Smartphone className="h-3 w-3" />
                Mobile App
              </div>
            </motion.div>

            {/* Decorative Elements */}
            <div className="absolute -z-10 top-10 -right-10 w-72 h-72 bg-purple-300 dark:bg-purple-900/30 rounded-full blur-3xl opacity-30"></div>
            <div className="absolute -z-10 -bottom-10 left-10 w-72 h-72 bg-blue-300 dark:bg-blue-900/30 rounded-full blur-3xl opacity-30"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
