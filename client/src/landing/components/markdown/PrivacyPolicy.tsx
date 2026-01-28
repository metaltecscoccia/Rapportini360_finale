import ReactMarkdown from "react-markdown";

const privacyPolicyMarkdown = `# Informativa sulla Privacy

**Ultima modifica: 28 gennaio 2026**

## 1. Introduzione

Rapportini360 rispetta la privacy degli utenti e si impegna a proteggere i dati personali raccolti.

## 2. Titolare del Trattamento

**Nome Azienda:** Metaltec Scoccia S.r.l.  
**Indirizzo:** Via Tiburtina Valeria Km 127.550, CAP 67041, Aielli (AQ)  
**Email:** info@metaltecscoccia.it  
**Telefono:** 0863790251  
**Partita IVA:** 02064370667

## 3. Dati Raccolti

L'app raccoglie i seguenti dati:
- Nome completo, username
- Password (criptata con bcrypt)
- Rapportini giornalieri
- Registrazioni presenze
- Foto documenti
- Dati veicoli (opzionale)

## 4. Finalità del Trattamento

I dati sono utilizzati per:
- Gestione rapportini di lavoro
- Tracciamento ore e presenze
- Documentazione fotografica
- Gestione veicoli e rifornimenti

## 5. Sicurezza

Misure di sicurezza implementate:
- HTTPS/TLS per comunicazioni
- Password con bcrypt
- Cookie sicuri (HttpOnly, Secure, SameSite)
- Rate limiting contro attacchi brute force

## 6. Diritti GDPR

Hai diritto a:
- Accesso ai tuoi dati
- Rettifica dati inesatti
- Cancellazione (diritto all'oblio)
- Portabilità dei dati
- Opposizione al trattamento

## 7. Cookie

Utilizziamo solo un cookie di sessione tecnico:
- Nome: metaltec.sid
- Durata: 24 ore
- Finalità: Autenticazione utente

## 8. Contatti

Per domande sulla privacy:

**Email:** info@metaltecscoccia.it  
**Indirizzo:** Via Tiburtina Valeria Km 127.550, CAP 67041, Aielli (AQ)  
**Telefono:** 0863790251
`;

export default function PrivacyPolicy() {
  return <ReactMarkdown>{privacyPolicyMarkdown}</ReactMarkdown>;
}
