import { ArrowLeft, Users, Target, Heart } from "lucide-react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/landing/components/Footer";
import logoPath from "@assets/ChatGPT_Image_20_dic_2025,_17_13_27_(1)_1766249871224.png";
import { LANDING_BASE } from "@/landing/config";

export default function ChiSiamoPage() {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <a href={`${LANDING_BASE}/`} className="flex items-center gap-2">
              <img src={logoPath} alt="Rapportini360" className="h-10 w-10 object-contain" />
              <span className="font-bold text-lg">Rapportini360</span>
            </a>
            <a href={`${LANDING_BASE}/`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
              <ArrowLeft className="h-4 w-4" />
              Torna alla home
            </a>
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
              Metaltec Scoccia S.r.l. nasce ad Aielli, nel cuore dell'Abruzzo, come azienda operativa
              nel settore delle costruzioni metalliche e dell'impiantistica industriale.
            </p>
            <p>
              Rapportini360 e nato come software interno, sviluppato per rispondere alle nostre
              stesse necessita: tracciare le ore lavorate dai dipendenti sulle diverse commesse,
              gestire le presenze e avere un quadro chiaro dei costi e delle attivita quotidiane.
            </p>
            <p>
              Con il tempo ci siamo resi conto che questa esigenza non era solo nostra: qualsiasi
              azienda che gestisce commesse, dipendenti e squadre di lavoro ha bisogno di uno
              strumento semplice e affidabile per tenere traccia delle ore lavorate sulle relative
              commesse. Cosi abbiamo deciso di rendere Rapportini360 disponibile a tutti.
            </p>

            <h2>Perche Rapportini360</h2>
            <p>
              La nostra applicazione nasce dall'esperienza reale sul campo. Sappiamo cosa serve
              perche lo usiamo ogni giorno. Con Rapportini360, le aziende possono:
            </p>
            <ul>
              <li>Raccogliere rapportini giornalieri in tempo reale</li>
              <li>Gestire presenze e assenze con facilita</li>
              <li>Documentare attivita con foto georeferenziate</li>
              <li>Generare report per la contabilita e le buste paga</li>
            </ul>

            <h2>Contattaci</h2>
            <p>
              Vuoi saperne di piu? <a href={`${LANDING_BASE}/contatti`} className="text-primary">Contattaci</a> per
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
