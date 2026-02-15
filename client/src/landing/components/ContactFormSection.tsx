import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, Loader2, CheckCircle, Mail, Phone, MapPin } from "lucide-react";

export default function ContactFormSection() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError("Compila tutti i campi obbligatori.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setFormData({ name: "", email: "", phone: "", message: "" });
      } else {
        setError(data.error || "Errore nell'invio. Riprova.");
      }
    } catch {
      setError("Errore di connessione. Riprova.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="contatti" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            Contattaci
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Richiedi Informazioni
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hai domande o vuoi saperne di piu? Compila il form e ti risponderemo entro 24 ore.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardContent className="p-6">
                {success ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Messaggio Inviato!</h3>
                    <p className="text-muted-foreground mb-4">
                      Grazie per averci contattato. Ti risponderemo al piu presto.
                    </p>
                    <Button variant="outline" onClick={() => setSuccess(false)}>
                      Invia un altro messaggio
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contact-name">Nome e Cognome *</Label>
                        <Input
                          id="contact-name"
                          name="name"
                          placeholder="Mario Rossi"
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-email">Email *</Label>
                        <Input
                          id="contact-email"
                          name="email"
                          type="email"
                          placeholder="mario@azienda.it"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact-phone">Telefono (opzionale)</Label>
                      <Input
                        id="contact-phone"
                        name="phone"
                        type="tel"
                        placeholder="+39 123 456 7890"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact-message">Messaggio *</Label>
                      <Textarea
                        id="contact-message"
                        name="message"
                        placeholder="Scrivi qui la tua richiesta..."
                        value={formData.message}
                        onChange={handleChange}
                        rows={5}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Invio in corso...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Invia Richiesta
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Info contatti */}
          <motion.div
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Email</h4>
                <a href="mailto:info@metaltecscoccia.it" className="text-muted-foreground hover:text-primary transition-colors">
                  info@metaltecscoccia.it
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Telefono</h4>
                <a href="tel:+390863790251" className="text-muted-foreground hover:text-primary transition-colors">
                  0863 790251
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Sede</h4>
                <p className="text-muted-foreground">
                  Via Tiburtina Valeria Km 127.550<br />
                  67041 Aielli (AQ)
                </p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Rispondiamo entro 24h.</strong> Per urgenze chiamaci direttamente al numero indicato.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
