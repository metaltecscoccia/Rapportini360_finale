import ReactMarkdown from "react-markdown";

const cookiePolicyMarkdown = `# Cookie Policy

**Ultima modifica: 28 gennaio 2026**

## Utilizzo dei Cookie

Rapportini360 utilizza cookie strettamente necessari per il funzionamento dell'applicazione.

## Cookie di Sessione

- **Nome:** metaltec.sid
- **Finalità:** Autenticazione e mantenimento sessione utente
- **Durata:** 24 ore
- **Tipo:** Cookie tecnico strettamente necessario (non richiede consenso esplicito GDPR)
- **Caratteristiche sicurezza:**
  - HttpOnly: protegge da XSS
  - Secure: solo connessioni HTTPS
  - SameSite: protegge da CSRF

## Cookie NON Utilizzati

L'applicazione **NON** utilizza:
- Cookie di profilazione
- Cookie di marketing
- Cookie di terze parti
- Cookie di tracciamento

## Base Giuridica

I cookie tecnici necessari sono esenti dal consenso secondo:
- Regolamento UE 2016/679 (GDPR)
- Direttiva ePrivacy 2002/58/CE
- Provvedimento Garante Privacy n. 229/2014

## Gestione Cookie

### Come bloccare i cookie

Puoi bloccare i cookie dalle impostazioni del browser.

⚠️ **Nota**: Bloccando il cookie di sessione, non potrai utilizzare l'applicazione.

### Come eliminare i cookie

- Effettua il logout (elimina automaticamente)
- Elimina manualmente dalle impostazioni browser

## Sicurezza

Il cookie è protetto da:
- Crittografia HTTPS
- Flag HttpOnly, Secure, SameSite
- Rotazione ID ad ogni login

## Contatti

**Metaltec Scoccia S.r.l.**  
**Email:** info@metaltecscoccia.it  
**Indirizzo:** Via Tiburtina Valeria Km 127.550, CAP 67041, Aielli (AQ)  
**Telefono:** 0863790251  
**P.IVA:** 02064370667
`;

export default function CookiePolicy() {
  return <ReactMarkdown>{cookiePolicyMarkdown}</ReactMarkdown>;
}
