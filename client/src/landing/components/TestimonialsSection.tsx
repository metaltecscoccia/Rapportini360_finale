import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Marco Rossi",
    role: "Titolare",
    company: "Rossi Costruzioni",
    content:
      "Prima usavamo fogli Excel e carta per i rapportini. Ora con Rapportini360 abbiamo tutto sotto controllo in tempo reale. I miei operai compilano tutto dal telefono in cantiere.",
    rating: 5,
  },
  {
    name: "Laura Bianchi",
    role: "Responsabile Amministrativa",
    company: "Bianchi Impianti Srl",
    content:
      "La gestione delle commesse e il tracciamento delle ore lavorate ci ha fatto risparmiare ore di lavoro amministrativo ogni settimana. Consigliatissimo!",
    rating: 5,
  },
  {
    name: "Giuseppe Verdi",
    role: "Direttore Operativo",
    company: "Verdi Manutenzioni",
    content:
      "Finalmente riesco a vedere in tempo reale dove sono i miei tecnici e cosa stanno facendo. La funzione rifornimenti poi e utilissima per controllare i costi.",
    rating: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Cosa dicono i nostri clienti
          </motion.h2>
          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Aziende come la tua hanno gia scelto Rapportini360
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card rounded-xl p-6 border relative"
            >
              <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10" />

              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                "{testimonial.content}"
              </p>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
