import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Building2,
  Users,
  Calendar,
  Settings,
  ClipboardList,
  HelpCircle,
  CheckCircle,
  Clock,
  Download,
  UserPlus,
  Wrench,
  AlertCircle,
} from "lucide-react";

interface GuidaSection {
  value: string;
  icon: React.ReactNode;
  title: string;
  badge?: string;
  content: React.ReactNode;
}

const sections: GuidaSection[] = [
  {
    value: "rapportini",
    icon: <FileText className="h-5 w-5 text-blue-600" />,
    title: "Rapportini Giornalieri",
    content: (
      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">I rapportini vengono inviati dai dipendenti ogni giorno e devono essere approvati dall'amministratore.</p>
        <div className="space-y-2">
          <h4 className="font-semibold">Come visualizzare i rapportini</h4>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground pl-2">
            <li>Vai alla sezione <strong>Rapportini</strong> dalla barra laterale</li>
            <li>Usa i filtri per nome dipendente, data o stato (In attesa / Approvato)</li>
            <li>Clicca sulla riga per espandere i dettagli con le operazioni e le foto</li>
          </ol>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold">Come approvare un rapportino</h4>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground pl-2">
            <li>Individua il rapportino con stato <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-800">In attesa</Badge></li>
            <li>Clicca il tasto di approvazione (spunta verde) sulla riga</li>
            <li>Il rapportino passa allo stato <Badge variant="outline" className="text-xs bg-green-50 text-green-800">Approvato</Badge> e le ore vengono conteggiate sulla commessa</li>
          </ol>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold">Esportazione rapportini</h4>
          <p className="text-muted-foreground">Usa il bottone <strong>Esporta</strong> per scaricare i rapportini in formato Word o TXT. Puoi filtrare per periodo prima di esportare.</p>
        </div>
      </div>
    ),
  },
  {
    value: "commesse",
    icon: <Building2 className="h-5 w-5 text-orange-600" />,
    title: "Clienti e Commesse",
    content: (
      <div className="space-y-4 text-sm">
        <div className="space-y-2">
          <h4 className="font-semibold">Come aggiungere un cliente</h4>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground pl-2">
            <li>Vai alla sezione <strong>Clienti</strong> dalla barra laterale</li>
            <li>Clicca <strong>Aggiungi Cliente</strong> e inserisci il nome</li>
            <li>Il cliente sarà disponibile per le nuove commesse</li>
          </ol>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold">Come creare una commessa</h4>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground pl-2">
            <li>Vai alla sezione <strong>Commesse</strong> dalla barra laterale</li>
            <li>Clicca <strong>Nuova Commessa</strong></li>
            <li>Seleziona il cliente, inserisci nome, descrizione e ore previste</li>
            <li>Scegli le <strong>Attività</strong> e i <strong>Componenti</strong> disponibili per questa commessa</li>
            <li>Salva — la commessa sarà selezionabile dai dipendenti nel rapportino</li>
          </ol>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold">Monitoraggio ore commessa</h4>
          <p className="text-muted-foreground">Clicca su una commessa per aprire il <strong>Report Commessa</strong>, che mostra la tabella di tutte le operazioni registrate, le ore totali e il confronto con le ore previste.</p>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold">Chiudere una commessa</h4>
          <p className="text-muted-foreground">Puoi impostare una commessa come "Completata" usando il selettore stato nella lista commesse. Le commesse chiuse non sono più selezionabili nel rapportino.</p>
        </div>
      </div>
    ),
  },
  {
    value: "ordini",
    icon: <ClipboardList className="h-5 w-5 text-purple-600" />,
    title: "Ordini di Servizio",
    content: (
      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">Gli ordini di servizio sono micro-commesse assegnate a singoli dipendenti con tracciamento automatico del tempo.</p>
        <div className="space-y-2">
          <h4 className="font-semibold">Come creare un ordine di servizio</h4>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground pl-2">
            <li>Vai a <strong>Commesse → Ordini di Servizio</strong></li>
            <li>Clicca <strong>Nuovo Ordine</strong></li>
            <li>Inserisci nome, descrizione, cliente, commessa e dipendente assegnato</li>
            <li>Salva — il dipendente riceverà una notifica al prossimo accesso</li>
          </ol>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold">Ciclo di vita dell'ordine</h4>
          <div className="flex flex-wrap gap-2 items-center text-muted-foreground">
            <Badge variant="outline" className="bg-blue-50 text-blue-800">Assegnato</Badge>
            <span>→</span>
            <Badge variant="outline" className="bg-amber-50 text-amber-800">In corso</Badge>
            <span>→</span>
            <Badge variant="outline" className="bg-purple-50 text-purple-800">In pausa</Badge>
            <span>→</span>
            <Badge variant="outline" className="bg-green-50 text-green-800">Completato</Badge>
          </div>
          <p className="text-muted-foreground mt-2">Quando il dipendente completa l'ordine, le ore vengono calcolate automaticamente e aggiunte al rapportino giornaliero e alla commessa.</p>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold">Modifica ore (override admin)</h4>
          <p className="text-muted-foreground">Clicca sull'icona occhio (dettaglio) di un ordine completato per vedere e modificare le ore calcolate automaticamente dal sistema.</p>
        </div>
      </div>
    ),
  },
  {
    value: "dipendenti",
    icon: <Users className="h-5 w-5 text-green-600" />,
    title: "Dipendenti",
    content: (
      <div className="space-y-4 text-sm">
        <div className="space-y-2">
          <h4 className="font-semibold">Come aggiungere un dipendente</h4>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground pl-2">
            <li>Vai alla sezione <strong>Dipendenti</strong> dalla barra laterale</li>
            <li>Clicca <strong>Aggiungi Dipendente</strong></li>
            <li>Inserisci nome completo e username (es. <em>mario.rossi</em>)</li>
            <li>Il sistema genera una password temporanea — comunicala al dipendente</li>
            <li>Al primo accesso il dipendente dovrà impostare una nuova password</li>
          </ol>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold">Reset password</h4>
          <p className="text-muted-foreground">Se un dipendente dimentica la password, clicca sull'icona <strong>Reset Password</strong> nella sua riga per generare una nuova password temporanea da comunicargli.</p>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold">Disattivare un dipendente</h4>
          <p className="text-muted-foreground">Usa il bottone <strong>Disattiva</strong> (icona utente con X) per impedire l'accesso senza eliminare i dati storici. Il dipendente non apparirà più nei dropdown del rapportino.</p>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold">Squadre (Caposquadra)</h4>
          <p className="text-muted-foreground">Dalla sezione <strong>Squadre</strong> puoi creare squadre e assegnare un caposquadra. Il caposquadra potrà inviare un unico rapportino per tutti i membri della squadra.</p>
        </div>
      </div>
    ),
  },
  {
    value: "presenze",
    icon: <Calendar className="h-5 w-5 text-red-600" />,
    title: "Presenze e Assenze",
    content: (
      <div className="space-y-4 text-sm">
        <div className="space-y-2">
          <h4 className="font-semibold">Come registrare un'assenza</h4>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground pl-2">
            <li>Vai alla sezione <strong>Presenze</strong> dalla barra laterale</li>
            <li>Clicca <strong>Registra Assenza</strong> o usa il tasto rapido nella dashboard</li>
            <li>Seleziona dipendente, data e tipo di assenza</li>
            <li>Salva — il dipendente non potrà inviare rapportino per quel giorno</li>
          </ol>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold">Tipi di assenza disponibili</h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { code: "F", label: "Ferie" },
              { code: "P", label: "Permesso" },
              { code: "M", label: "Malattia" },
              { code: "A", label: "Assenza" },
              { code: "CP", label: "Congedo Parentale" },
              { code: "L104", label: "Legge 104" },
            ].map(({ code, label }) => (
              <div key={code} className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs w-12 justify-center">{code}</Badge>
                <span className="text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold">Foglio presenze mensile</h4>
          <p className="text-muted-foreground">La sezione Presenze mostra il riepilogo mensile per tutti i dipendenti con statistiche sulle assenze strategiche (lunedì/venerdì/ponti).</p>
        </div>
      </div>
    ),
  },
  {
    value: "configurazione",
    icon: <Settings className="h-5 w-5 text-gray-600" />,
    title: "Configurazione",
    content: (
      <div className="space-y-4 text-sm">
        <div className="space-y-2">
          <h4 className="font-semibold">Attività e Componenti</h4>
          <p className="text-muted-foreground">Dalla scheda <strong>Attività e Componenti</strong> puoi gestire i tipi di lavorazione (es. Saldatura, Montaggio) e i materiali/componenti utilizzabili nei rapportini. Puoi attivare o disattivare singole voci senza eliminarle.</p>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold">DPI/Attrezzature</h4>
          <p className="text-muted-foreground">Dalla scheda <strong>DPI/Attrezzature</strong> gestisci il catalogo delle dotazioni aziendali e le assegnazioni ai dipendenti. I dipendenti ricevono una notifica per confermare la ricezione.</p>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold">Backup dati</h4>
          <p className="text-muted-foreground">Dalla scheda <strong>Backup</strong> puoi esportare tutti i dati dell'organizzazione in un file compresso per conservarli esternamente.</p>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold">Abbonamento</h4>
          <p className="text-muted-foreground">Dalla scheda <strong>Abbonamento</strong> puoi visualizzare lo stato del piano attivo, le date di scadenza e gestire il metodo di pagamento tramite il portale Stripe.</p>
        </div>
      </div>
    ),
  },
  {
    value: "faq",
    icon: <HelpCircle className="h-5 w-5 text-indigo-600" />,
    title: "Domande Frequenti (FAQ)",
    content: (
      <div className="space-y-4 text-sm">
        {[
          {
            q: "Cosa succede se il dipendente invia un rapportino con ore diverse da 8?",
            a: "Il sistema mostra un avviso, ma il dipendente può confermare l'invio lo stesso. L'amministratore vede le ore effettive nel dettaglio del rapportino e può decidere se approvarlo.",
          },
          {
            q: "Il dipendente può modificare un rapportino già inviato?",
            a: "Sì, finché il rapportino è in stato 'In attesa' il dipendente può aggiornarlo. Una volta approvato dall'admin non è più modificabile dal dipendente.",
          },
          {
            q: "Le ore degli ordini di servizio vengono aggiunte automaticamente alla commessa?",
            a: "Sì. Quando il dipendente completa un ordine di servizio, le ore calcolate automaticamente vengono aggiunte al rapportino giornaliero e compaiono nel report della commessa.",
          },
          {
            q: "Come faccio a vedere quante ore sono state lavorate su una commessa?",
            a: "Vai alla sezione Commesse, clicca sulla commessa desiderata per aprire il Report Commessa. Vedrai le ore totali lavorate, il confronto con le ore previste e il dettaglio per dipendente e data.",
          },
          {
            q: "Un dipendente disattivato perde i dati storici?",
            a: "No. La disattivazione impedisce solo il login e rimuove il dipendente dai dropdown. Tutti i rapportini e le ore storiche rimangono visibili e conteggiati.",
          },
          {
            q: "Come funziona il caposquadra?",
            a: "Il caposquadra vede la schermata 'Rapportino Squadra'. Può inserire i dati della lavorazione del giorno e selezionare i membri presenti. All'invio, il sistema crea automaticamente un rapportino per ogni dipendente selezionato.",
          },
          {
            q: "Cosa sono le assenze 'strategiche'?",
            a: "Le statistiche presenze evidenziano le assenze registrate di lunedì, venerdì o nei giorni adiacenti a festività (cosiddette 'assenze strategiche'), per aiutare l'admin a identificare eventuali anomalie.",
          },
        ].map(({ q, a }, i) => (
          <div key={i} className="rounded-lg border p-3 space-y-1">
            <p className="font-medium flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
              {q}
            </p>
            <p className="text-muted-foreground pl-6">{a}</p>
          </div>
        ))}
      </div>
    ),
  },
];

export default function GuidaPage() {
  return (
    <div className="space-y-6 p-2">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Guida e Manuale Utente</h2>
        <p className="text-muted-foreground mt-1">
          Istruzioni operative per l'utilizzo di Rapportini360. Clicca su una sezione per espanderla.
        </p>
      </div>

      {/* Flusso di lavoro rapido */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Flusso di lavoro giornaliero
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-center text-sm">
            {[
              { icon: <Clock className="h-4 w-4" />, label: "1. Dipendente compila rapportino" },
              { icon: <FileText className="h-4 w-4" />, label: "2. Invia all'ufficio" },
              { icon: <CheckCircle className="h-4 w-4" />, label: "3. Admin approva" },
              { icon: <Wrench className="h-4 w-4" />, label: "4. Ore aggiunte alla commessa" },
              { icon: <Download className="h-4 w-4" />, label: "5. Export mensile" },
            ].map(({ icon, label }, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-background rounded-full px-3 py-1.5 border text-xs font-medium">
                {icon}
                {label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sezioni accordion */}
      <Accordion type="multiple" className="space-y-2">
        {sections.map((section) => (
          <AccordionItem
            key={section.value}
            value={section.value}
            className="border rounded-lg px-4"
          >
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                {section.icon}
                <span className="font-semibold text-base">{section.title}</span>
                {section.badge && (
                  <Badge variant="secondary" className="text-xs">{section.badge}</Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              {section.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <p className="text-xs text-muted-foreground text-center pt-2">
        Per assistenza tecnica contatta: <strong>info@metaltecscoccia.it</strong> · Tel. 0863 790251
      </p>
    </div>
  );
}
