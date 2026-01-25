import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Come funziona il periodo di prova gratuito?",
    answer:
      "Puoi provare Rapportini360 gratuitamente per 30 giorni con tutte le funzionalita. Durante il trial puoi aggiungere fino a 5 dipendenti. Non e richiesta nessuna carta di credito per iniziare.",
  },
  {
    question: "Posso cancellare l'abbonamento quando voglio?",
    answer:
      "Si, puoi cancellare il tuo abbonamento in qualsiasi momento dalla sezione Abbonamento del tuo account. Non ci sono vincoli o penali. I tuoi dati rimarranno accessibili fino alla fine del periodo pagato.",
  },
  {
    question: "I miei dati sono al sicuro?",
    answer:
      "Assolutamente si. Utilizziamo crittografia SSL per tutte le comunicazioni e i tuoi dati sono salvati su server sicuri con backup automatici giornalieri. Solo tu e i tuoi dipendenti autorizzati possono accedere ai dati della tua azienda.",
  },
  {
    question: "Come aggiungo i dipendenti?",
    answer:
      "Dalla dashboard amministratore puoi aggiungere nuovi dipendenti in pochi click. Ad ogni dipendente verra assegnato un username e una password temporanea che dovra cambiare al primo accesso.",
  },
  {
    question: "Posso usare Rapportini360 dal telefono?",
    answer:
      "Si, Rapportini360 e completamente responsive e funziona perfettamente su smartphone e tablet. I tuoi dipendenti possono compilare i rapportini direttamente dal cantiere o in mobilita.",
  },
  {
    question: "Cosa succede se supero i 5 dipendenti durante il trial?",
    answer:
      "Durante il periodo di prova gratuito puoi avere massimo 5 dipendenti. Per aggiungerne altri, dovrai passare a un piano Premium che include dipendenti illimitati.",
  },
  {
    question: "Offrite assistenza tecnica?",
    answer:
      "Si, offriamo supporto via email per tutti i clienti. I clienti Premium hanno accesso al supporto prioritario con tempi di risposta garantiti entro 24 ore lavorative.",
  },
  {
    question: "Posso esportare i miei dati?",
    answer:
      "Si, puoi esportare tutti i tuoi dati (rapportini, commesse, presenze) in qualsiasi momento. I dati sono tuoi e hai sempre il pieno controllo su di essi.",
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Domande frequenti
          </motion.h2>
          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Hai dubbi? Ecco le risposte alle domande piu comuni
          </motion.p>
        </div>

        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
