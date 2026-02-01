import { Link } from "wouter";
import { ArrowLeft, Users, Target, Heart } from "lucide-react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/landing/components/Footer";
import logoPath from "@assets/ChatGPT_Image_20_dic_2025,_17_13_27_(1)_1766249871224.png";

export default function ChiSiamoPage() {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/home" className="flex items-center gap-2">
              <img src={logoPath} alt="Rapportini360" className="h-10 w-10 object-contain" />
              <span className="font-bold text-lg">Rapportini360</span>
            </Link>
            <Link href="/home" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
              <ArrowLeft className="h-4 w-4" />
              Torna alla home
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Chi Siamo</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Metaltec Scoccia S.r.l. - Innovazione al servizio delle imprese
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Il Team</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Un team dedicato allo sviluppo di soluzioni digitali per semplificare il lavoro quotidiano.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>La Missione</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Digitalizzare i processi aziendali per aumentare efficienza e produttivita.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>I Valori</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Affidabilita, innovazione e attenzione alle esigenze dei nostri clienti.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main content - placeholder */}
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <h2>La Nostra Storia</h2>
            <p>
              Metaltec Scoccia S.r.l. nasce ad Aielli, nel cuore dell'Abruzzo, con la visione di
              portare l'innovazione digitale nelle piccole e medie imprese italiane.
            </p>
            <p>
              Rapportini360 e il frutto della nostra esperienza diretta nel settore produttivo:
              abbiamo sviluppato una soluzione che risponde alle reali esigenze delle aziende
              che gestiscono squadre di lavoro sul campo.
            </p>

            <h2>Perche Rapportini360</h2>
            <p>
              La nostra applicazione nasce dall'esigenza di eliminare la carta, ridurre gli
              errori e avere sempre sotto controllo l'attivita dei dipendenti. Con Rapportini360,
              le aziende possono:
            </p>
            <ul>
              <li>Raccogliere rapportini giornalieri in tempo reale</li>
              <li>Gestire presenze e assenze con facilita</li>
              <li>Documentare attivita con foto georeferenziate</li>
              <li>Generare report per la contabilita e le buste paga</li>
            </ul>

            <h2>Contattaci</h2>
            <p>
              Vuoi saperne di piu? <Link href="/contatti" className="text-primary">Contattaci</Link> per
              una dimostrazione gratuita o per qualsiasi informazione.
            </p>
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </ThemeProvider>
  );
}
