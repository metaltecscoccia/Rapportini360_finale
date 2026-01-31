# Informativa sulla Privacy

**Ultima modifica: 6 gennaio 2026**

## 1. Introduzione

Rapportini360 (di seguito "l'App", "noi", "nostro") rispetta la privacy degli utenti e si impegna a proteggere i dati personali raccolti attraverso l'applicazione mobile.

Questa informativa sulla privacy descrive quali dati raccogliamo, come li utilizziamo, con chi li condividiamo e quali diritti hai in relazione ai tuoi dati personali.

## 2. Titolare del Trattamento

**Nome Azienda:** Metaltec Scoccia S.r.l.
**Indirizzo:** Via Tiburtina Valeria Km 127.550, 67041 Aielli (AQ)
**Email:** info@metaltecscoccia.it
**Telefono:** 0863790251
**Partita IVA:** 02064370667

## 3. Dati Raccolti

### 3.1 Dati forniti direttamente dall'utente

- **Informazioni di registrazione**: Nome completo, username
- **Credenziali di accesso**: Username e password (criptata con algoritmo bcrypt)
- **Dati lavorativi**:
  - Rapportini giornalieri (data, cliente, commessa, tipo lavoro, materiali, ore lavorate, note)
  - Registrazioni presenze (data, tipo assenza, note)
  - Rettifiche ore lavorate
- **Foto**: Immagini scattate o selezionate dalla galleria per documentare le attività lavorative
- **Dati veicoli** (se utilizzati): Targa, tipo carburante, chilometraggio, rifornimenti

### 3.2 Dati raccolti automaticamente

- **Dati tecnici**: Indirizzo IP, tipo di dispositivo, sistema operativo
- **Dati di sessione**: Data e ora di accesso, durata della sessione

### 3.3 Dati non raccolti

L'App **NON** raccoglie:
- Posizione GPS o dati di geolocalizzazione
- Contatti dal dispositivo
- Dati di navigazione su altri siti/app
- Dati biometrici
- Informazioni di pagamento (carte di credito, conti bancari)

## 4. Finalità del Trattamento

I dati personali sono raccolti e trattati per le seguenti finalità:

### 4.1 Finalità principali (base giuridica: esecuzione del contratto)

- Gestione rapportini di lavoro giornalieri
- Tracciamento ore lavorate e presenze
- Documentazione fotografica delle attività lavorative
- Gestione flotta veicoli e rifornimenti
- Generazione report per l'organizzazione di appartenenza

### 4.2 Finalità secondarie (base giuridica: legittimo interesse)

- Sicurezza dell'applicazione e prevenzione accessi non autorizzati
- Miglioramento delle funzionalità dell'App
- Supporto tecnico agli utenti

### 4.3 Finalità legali (base giuridica: obbligo di legge)

- Conservazione dati per obblighi fiscali e contabili (10 anni)
- Risposta a richieste delle autorità competenti

## 5. Base Giuridica del Trattamento

Il trattamento dei dati personali è basato su:

- **Esecuzione del contratto**: Fornitura del servizio richiesto dall'organizzazione
- **Consenso**: Per l'uso di foto e dati biometrici (se implementati)
- **Obbligo di legge**: Conservazione dati contabili e fiscali
- **Legittimo interesse**: Sicurezza e miglioramento del servizio

## 6. Condivisione dei Dati

### 6.1 All'interno dell'organizzazione

I dati sono accessibili a:
- **Amministratori dell'organizzazione**: Accesso completo ai dati dei dipendenti della propria organizzazione
- **Super amministratori**: Gestiscono gli account delle organizzazioni ma **NON** hanno accesso ai dati interni delle organizzazioni (rapportini, presenze, foto)
- **Dipendenti**: Accesso solo ai propri dati personali

### 6.2 Fornitori di servizi terzi

I dati sono condivisi con i seguenti fornitori terzi:

**Cloudinary (Cloudinary Ltd.)**
- **Finalità**: Archiviazione e gestione foto
- **Dati condivisi**: Foto caricate dagli utenti
- **Ubicazione server**: Stati Uniti e Europa
- **Privacy policy**: https://cloudinary.com/privacy
- **Garanzie**: Accordo DPA (Data Processing Agreement), clausole contrattuali standard UE

**Railway (Railway Corp.)**
- **Finalità**: Hosting dell'applicazione e database
- **Dati condivisi**: Tutti i dati dell'applicazione
- **Ubicazione server**: Stati Uniti
- **Privacy policy**: https://railway.app/legal/privacy
- **Garanzie**: Clausole contrattuali standard UE, certificazioni di sicurezza

### 6.3 Terze parti NON utilizzate

L'App **NON** condivide dati con:
- Società di marketing o pubblicità
- Broker di dati
- Social network
- Servizi di analytics (Google Analytics, Facebook Pixel, ecc.)
- Altri terzi non menzionati

## 7. Conservazione dei Dati

### 7.1 Periodo di conservazione

- **Account attivi**: I dati vengono conservati finché l'account è attivo
- **Account disattivati**: I dati vengono conservati per 10 anni per obblighi fiscali e contabili
- **Dati di sessione**: 24 ore dalla disconnessione
- **Foto**: Conservate fino a eliminazione manuale da parte dell'amministratore

### 7.2 Cancellazione dati

Dopo il periodo di conservazione, i dati vengono eliminati in modo permanente e non recuperabile.

## 8. Sicurezza dei Dati

Adottiamo misure tecniche e organizzative per proteggere i dati personali:

### 8.1 Misure tecniche

- **Crittografia in transito**: HTTPS/TLS per tutte le comunicazioni
- **Password criptate**: Hashing con algoritmo bcrypt (12 salt rounds)
- **Cookie sicuri**: Flag HttpOnly, Secure, SameSite per protezione XSS e CSRF
- **Sessioni temporanee**: Scadenza automatica dopo 24 ore
- **Rate limiting**: Protezione contro attacchi brute force (max 100 richieste/15 minuti)

### 8.2 Misure organizzative

- Accesso ai dati limitato al personale autorizzato
- Isolamento dati tra organizzazioni diverse (multi-tenant)
- Backup regolari del database
- Monitoraggio accessi e attività sospette

### 8.3 Limitazioni

- **Foto non criptate a riposo**: Le foto sono archiviate su Cloudinary senza crittografia end-to-end
- **Metadata foto**: Le foto potrebbero contenere metadati EXIF (posizione, modello dispositivo)

## 9. Diritti degli Utenti (GDPR)

Hai i seguenti diritti in relazione ai tuoi dati personali:

### 9.1 Diritto di accesso

Puoi richiedere copia dei tuoi dati personali contattando l'amministratore della tua organizzazione.

### 9.2 Diritto di rettifica

Puoi richiedere la correzione di dati inesatti o incompleti.

### 9.3 Diritto di cancellazione ("diritto all'oblio")

Puoi richiedere la cancellazione dei tuoi dati, salvo obblighi di legge che ne richiedano la conservazione.

### 9.4 Diritto di limitazione

Puoi richiedere la limitazione del trattamento in caso di contestazione dell'esattezza dei dati.

### 9.5 Diritto di portabilità

Puoi richiedere di ricevere i tuoi dati in formato strutturato e leggibile (CSV, JSON).

### 9.6 Diritto di opposizione

Puoi opporti al trattamento basato su legittimo interesse.

### 9.7 Diritto di revocare il consenso

Dove il trattamento è basato sul consenso, puoi revocarlo in qualsiasi momento.

### 9.8 Diritto di reclamo

Puoi presentare reclamo all'Autorità Garante per la Protezione dei Dati Personali:
- **Sito**: https://www.garanteprivacy.it
- **Email**: garante@gpdp.it
- **Indirizzo**: Piazza Venezia 11, 00187 Roma

## 10. Come Esercitare i Tuoi Diritti

Per esercitare i tuoi diritti, contatta:

1. **Amministratore della tua organizzazione** (prima opzione)
2. **Titolare del trattamento** all'indirizzo email: info@metaltecscoccia.it

Risponderemo entro 30 giorni dalla richiesta.

## 11. Trasferimento Dati Extra-UE

I dati possono essere trasferiti e archiviati negli Stati Uniti tramite i fornitori:
- Cloudinary (foto)
- Railway (database)

Tali trasferimenti sono protetti da:
- Clausole contrattuali standard approvate dalla Commissione Europea
- Accordi DPA (Data Processing Agreement)
- Certificazioni di sicurezza (ISO 27001, SOC 2)

## 12. Utilizzo di Cookie

L'App utilizza un cookie di sessione essenziale:

- **Nome**: `metaltec.sid`
- **Finalità**: Autenticazione e mantenimento sessione utente
- **Durata**: 24 ore
- **Tipo**: Strettamente necessario (non richiede consenso esplicito)

Non utilizziamo cookie di profilazione, marketing o analytics.

## 13. Minori

L'App non è destinata a minori di 16 anni. Non raccogliamo consapevolmente dati di minori.

## 14. Modifiche all'Informativa

Questa informativa può essere aggiornata periodicamente. Le modifiche sostanziali saranno comunicate tramite:
- Notifica in-app
- Email agli amministratori delle organizzazioni

La data di "Ultima modifica" in cima al documento indica l'ultima revisione.

## 15. Contatti

Per domande su questa informativa o sul trattamento dei dati:

**Email**: info@metaltecscoccia.it
**Indirizzo**: Via Tiburtina Valeria Km 127.550, 67041 Aielli (AQ)
**Telefono**: 0863790251

---

**Link utili:**
- [Termini di Servizio](#) (da creare)
- [Guida Utente](#) (opzionale)
- [Supporto Tecnico](#) (opzionale)
