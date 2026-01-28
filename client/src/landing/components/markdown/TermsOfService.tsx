import ReactMarkdown from "react-markdown";

const termsOfServiceMarkdown = `# Termini e Condizioni di Servizio

**Ultima modifica: 28 gennaio 2026**

## 1. Accettazione dei Termini

Utilizzando Rapportini360, accetti questi Termini e Condizioni di Servizio.

## 2. Definizioni

- **Organizzazione**: L'azienda che sottoscrive il servizio
- **Amministratore**: Utente con diritti di gestione
- **Dipendente**: Utente che inserisce rapportini
- **Utente**: Amministratore o Dipendente

## 3. Descrizione del Servizio

Rapportini360 è un'app per gestire:
- Rapportini giornalieri
- Presenze e assenze
- Foto documentazione
- Veicoli e rifornimenti
- Report e statistiche

## 4. Requisiti

Per utilizzare l'App devi:
- Avere almeno 16 anni
- Essere dipendente/amministratore di un'organizzazione registrata
- Accettare questi Termini e la Privacy Policy

## 5. Licenza d'Uso

Ti concediamo una licenza limitata, non esclusiva per utilizzare l'App per scopi lavorativi.

NON puoi:
- Modificare o decompilare l'App
- Accedere a dati di altri utenti
- Rivendere il servizio
- Usare l'App per scopi illegali

## 6. Obblighi dell'Utente

Devi:
- Inserire dati veritieri
- Mantenere riservata la password
- Usare l'App in modo conforme alla legge
- Non caricare contenuti illegali

## 7. Limitazione Responsabilità

L'APP È FORNITA "COSÌ COM'È" senza garanzie.

Non siamo responsabili per:
- Perdita di dati
- Interruzioni di servizio
- Uso improprio da parte di terzi

## 8. Legge Applicabile

Questi Termini sono regolati dalla legge italiana.
Foro competente: Tribunale di L'Aquila.

## 9. Contatti

**Metaltec Scoccia S.r.l.**  
**Email:** info@metaltecscoccia.it  
**Indirizzo:** Via Tiburtina Valeria Km 127.550, CAP 67041, Aielli (AQ)  
**Telefono:** 0863790251  
**P.IVA:** 02064370667
`;

export default function TermsOfService() {
  return <ReactMarkdown>{termsOfServiceMarkdown}</ReactMarkdown>;
}
