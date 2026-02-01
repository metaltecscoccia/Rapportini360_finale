import { Link } from "wouter";
import { ArrowLeft, MapPin, Mail, Phone, Building } from "lucide-react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/landing/components/Footer";
import logoPath from "@assets/ChatGPT_Image_20_dic_2025,_17_13_27_(1)_1766249871224.png";

export default function ContattiPage() {
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
            <h1 className="text-4xl font-bold mb-4">Contattaci</h1>
            <p className="text-muted-foreground text-lg">
              Siamo qui per aiutarti. Contattaci per qualsiasi informazione.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Informazioni Aziendali
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">Metaltec Scoccia S.r.l.</h3>
                  <p className="text-muted-foreground">
                    Sviluppo e distribuzione di Rapportini360
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Partita IVA</p>
                  <p className="font-medium">02064370667</p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Details */}
            <Card>
              <CardHeader>
                <CardTitle>Come Raggiungerci</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Indirizzo</p>
                    <p className="text-muted-foreground">
                      Via Tiburtina Valeria Km 127.550<br />
                      67041 Aielli (AQ)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Email</p>
                    <a
                      href="mailto:info@metaltecscoccia.it"
                      className="text-primary hover:underline"
                    >
                      info@metaltecscoccia.it
                    </a>
                    <p className="text-sm text-muted-foreground mt-1">
                      Supporto tecnico:{" "}
                      <a
                        href="mailto:support@metaltecscoccia.it"
                        className="text-primary hover:underline"
                      >
                        support@metaltecscoccia.it
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Telefono</p>
                    <a
                      href="tel:+390863790251"
                      className="text-primary hover:underline"
                    >
                      0863 790251
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Map placeholder */}
          <div className="mt-12">
            <Card>
              <CardContent className="p-0">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2952.8447983766384!2d13.590536!3d42.084722!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDLCsDA1JzA1LjAiTiAxM8KwMzUnMjUuOSJF!5e0!3m2!1sit!2sit!4v1706700000000!5m2!1sit!2sit"
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-lg"
                  title="Posizione Metaltec Scoccia"
                />
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </ThemeProvider>
  );
}
