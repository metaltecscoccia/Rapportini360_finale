# Google Play Store - Data Safety Disclosure

**Data di compilazione: 6 gennaio 2026**

Questa guida ti aiuta a compilare la sezione "Data Safety" (Sicurezza dei Dati) nella Google Play Console.

## 📋 COME COMPILARE IL QUESTIONARIO

### STEP 1: Raccolta e Condivisione Dati

**Domanda: "Does your app collect or share any of the required user data types?"**

**Risposta: YES** ✅

---

## STEP 2: Tipi di Dati Raccolti

### 1️⃣ LOCATION (Posizione)

**Domanda: "Does your app collect any location data?"**

**Risposta: NO** ❌

Non raccogliamo dati GPS o di geolocalizzazione.

---

### 2️⃣ PERSONAL INFO (Informazioni Personali)

**Domanda: "Does your app collect personal info?"**

**Risposta: YES** ✅

#### Seleziona i tipi di dati raccolti:

☑️ **Name** (Nome)
- Raccogliamo il nome completo del dipendente

☑️ **Email address** (NO - se non raccogliete email)
- Non raccogliamo email

☐ **User IDs** (NO - username interno, non ID pubblici)

☐ **Address** (NO)

☐ **Phone number** (NO)

☐ **Race and ethnicity** (NO)

☐ **Political or religious beliefs** (NO)

☐ **Sexual orientation** (NO)

☐ **Other info** (NO)

#### Per ogni tipo selezionato, rispondi:

**Is this data collected, shared, or both?**
- ✅ Collected (Raccolto)
- ✅ Shared (Condiviso - con Cloudinary e Railway)

**Is this data processed ephemerally?**
- ❌ NO (i dati sono conservati, non elaborati temporaneamente)

**Is this data required or optional?**
- ✅ Required (Obbligatorio per fornire il servizio)

**Why is this data collected/shared?**
- ☑️ App functionality (Funzionalità dell'app)
- ☑️ Account management (Gestione account)

---

### 3️⃣ FINANCIAL INFO (Informazioni Finanziarie)

**Domanda: "Does your app collect financial info?"**

**Risposta: YES** ✅ (solo se raccogliete costi carburante)

#### Seleziona i tipi:

☑️ **Purchase history** (NO - a meno che non implementiate pagamenti in-app)

☑️ **Other financial info**
- Raccogliamo costi rifornimenti carburante

**Is this data collected, shared, or both?**
- ✅ Collected
- ✅ Shared (con Railway)

**Is this data processed ephemerally?**
- ❌ NO

**Is this data required or optional?**
- ☐ Optional (Opzionale - solo se l'organizzazione usa modulo veicoli)

**Why is this data collected?**
- ☑️ App functionality

---

### 4️⃣ HEALTH AND FITNESS (Salute e Fitness)

**Domanda: "Does your app collect health and fitness data?"**

**Risposta: NO** ❌

---

### 5️⃣ MESSAGES (Messaggi)

**Domanda: "Does your app collect messages?"**

**Risposta: NO** ❌

(Le "note" nei rapportini non sono messaggi personali)

---

### 6️⃣ PHOTOS AND VIDEOS (Foto e Video)

**Domanda: "Does your app collect photos or videos?"**

**Risposta: YES** ✅

#### Seleziona:

☑️ **Photos**
- Raccogliamo foto per documentare attività lavorative

☐ **Videos** (NO)

**Is this data collected, shared, or both?**
- ✅ Collected
- ✅ Shared (con Cloudinary per storage)

**Is this data processed ephemerally?**
- ❌ NO

**Is this data required or optional?**
- ☐ Optional (Le foto sono opzionali, max 5 per operazione)

**Why is this data collected?**
- ☑️ App functionality (Documentazione attività lavorative)

---

### 7️⃣ AUDIO FILES (File Audio)

**Domanda: "Does your app collect audio files?"**

**Risposta: NO** ❌

---

### 8️⃣ FILES AND DOCS (File e Documenti)

**Domanda: "Does your app collect files and docs?"**

**Risposta: NO** ❌

---

### 9️⃣ CALENDAR (Calendario)

**Domanda: "Does your app collect calendar data?"**

**Risposta: NO** ❌

---

### 🔟 CONTACTS (Contatti)

**Domanda: "Does your app collect contacts?"**

**Risposta: NO** ❌

---

### 1️⃣1️⃣ APP ACTIVITY (Attività App)

**Domanda: "Does your app collect app activity data?"**

**Risposta: YES** ✅

#### Seleziona:

☑️ **App interactions**
- Tracciamo sessioni utente (login/logout)

☐ **In-app search history** (NO)

☐ **Installed apps** (NO)

☐ **Other user-generated content** (Già coperto da Photos)

☐ **Other actions** (NO)

**Is this data collected, shared, or both?**
- ✅ Collected
- ✅ Shared (con Railway)

**Is this data processed ephemerally?**
- ✅ YES (Le sessioni scadono dopo 24 ore)

**Is this data required or optional?**
- ✅ Required (Necessario per autenticazione)

**Why is this data collected?**
- ☑️ App functionality (Gestione sessioni)
- ☑️ Security (Protezione accessi non autorizzati)

---

### 1️⃣2️⃣ WEB BROWSING (Navigazione Web)

**Domanda: "Does your app collect web browsing data?"**

**Risposta: NO** ❌

---

### 1️⃣3️⃣ APP INFO AND PERFORMANCE (Info e Performance App)

**Domanda: "Does your app collect app info and performance data?"**

**Risposta: NO** ❌

(Non usiamo crash reporting o analytics)

---

### 1️⃣4️⃣ DEVICE OR OTHER IDs (ID Dispositivo)

**Domanda: "Does your app collect device or other IDs?"**

**Risposta: NO** ❌

(Non tracciamo ID dispositivo o advertising ID)

---

## STEP 3: Sicurezza dei Dati

**Domanda: "Is all of the user data collected by your app encrypted in transit?"**

**Risposta: YES** ✅

Tutti i dati sono trasmessi tramite HTTPS/TLS.

---

**Domanda: "Do you provide a way for users to request that their data is deleted?"**

**Risposta: YES** ✅

Gli utenti possono richiedere la cancellazione dei dati contattando l'amministratore dell'organizzazione o il titolare del trattamento (email: [DA COMPILARE]).

---

## STEP 4: Privacy Policy

**Domanda: "Link to your privacy policy"**

**Risposta:**
```
[URL PUBBLICO DOVE OSPITERAI PRIVACY_POLICY.md]
```

Esempi:
- `https://rapportini360.com/privacy-policy`
- `https://tuosito.it/privacy`
- URL Railway: `https://rapportini360finale-production.up.railway.app/privacy`

**⚠️ IMPORTANTE**: Il link deve essere:
- Pubblicamente accessibile (senza login)
- In italiano (o multilingua)
- Sempre raggiungibile

---

## STEP 5: Certificazioni e Compliance

**Domanda: "Does your app comply with Google Play's Families Policy requirements?"**

**Risposta: NO** ❌

L'app è destinata a uso aziendale, non a bambini/famiglie.

---

**Domanda: "Does your app use the Advertising ID?"**

**Risposta: NO** ❌

---

**Domanda: "Is your app designed for children?"**

**Risposta: NO** ❌

Target: Adulti lavoratori (18+)

---

## 📝 RIEPILOGO DATI RACCOLTI

| Categoria | Tipo Dato | Raccolto | Condiviso | Obbligatorio | Scopo |
|-----------|-----------|----------|-----------|--------------|-------|
| **Personal Info** | Nome | ✅ | ✅ | ✅ | Gestione account |
| **Financial Info** | Costi carburante | ✅ | ✅ | ❌ | Tracciamento spese |
| **Photos** | Foto lavoro | ✅ | ✅ | ❌ | Documentazione |
| **App Activity** | Sessioni | ✅ | ✅ | ✅ | Autenticazione |

---

## 🔐 MISURE DI SICUREZZA DA DICHIARARE

Nel form "Additional details" menziona:

```
L'app implementa le seguenti misure di sicurezza:

✅ Crittografia in transito (HTTPS/TLS)
✅ Password criptate con bcrypt (12 salt rounds)
✅ Cookie HttpOnly per protezione XSS
✅ Protezione CSRF (SameSite cookies)
✅ Rate limiting anti brute-force
✅ Sessioni temporanee (24h scadenza)
✅ Isolamento dati multi-tenant
✅ Accesso limitato basato su ruoli (RBAC)
✅ Backup regolari database
✅ Monitoraggio accessi

❌ Le foto non sono criptate at-rest (archiviate su Cloudinary)
```

---

## 🌍 THIRD-PARTY DATA SHARING (Condivisione con Terze Parti)

**Domanda: "Does your app share data with third parties?"**

**Risposta: YES** ✅

### Terze parti con cui condividi dati:

#### 1. Cloudinary
- **Scopo**: Archiviazione foto
- **Dati condivisi**: Foto lavoro
- **Link privacy policy**: https://cloudinary.com/privacy

#### 2. Railway
- **Scopo**: Hosting database
- **Dati condivisi**: Tutti i dati app
- **Link privacy policy**: https://railway.app/legal/privacy

**Conferma:**
☑️ These third parties are compliant with Google Play's Developer Distribution Agreement

---

## ⚠️ CHECKLIST FINALE

Prima di pubblicare, verifica:

- [ ] Privacy Policy ospitata su URL pubblico
- [ ] Privacy Policy linkata nell'app (pagina login o impostazioni)
- [ ] Tutti i campi "DA COMPILARE" sostituiti con dati reali
- [ ] Rimosso campo `plainPassword` dal database
- [ ] Rimossa password da localStorage
- [ ] Testato reset password
- [ ] Screenshots app preparati (minimo 2)
- [ ] Icona 512x512 pronta
- [ ] Feature graphic 1024x500 pronta
- [ ] Descrizione store scritta
- [ ] Content rating completato

---

## 📧 EMAIL TEMPLATE PER DATA DELETION REQUEST

Quando un utente richiede cancellazione dati, usa questo template:

```
Oggetto: Richiesta Cancellazione Dati Personali - Rapportini360

Gentile [Nome Amministratore],

Ho ricevuto una richiesta di cancellazione dati personali da parte di:
- Nome: [Nome Utente]
- Username: [Username]
- Organizzazione: [Nome Organizzazione]

Per conformità GDPR, richiedo la cancellazione di tutti i dati personali
dell'utente entro 30 giorni, salvo obblighi di conservazione fiscale (10 anni).

Dati da cancellare:
- Account utente
- Rapportini personali (se non soggetti a obbligo fiscale)
- Foto caricate
- Dati presenze

Grazie,
[Il tuo nome]
```

---

## 🎯 PROSSIMI PASSI

1. ✅ Completa compilazione sezioni con `[DA COMPILARE]`
2. ✅ Ospita Privacy Policy su URL pubblico
3. ✅ Aggiungi link Privacy nell'app
4. ✅ Compila Data Safety su Google Play Console
5. ✅ Carica AAB e asset grafici
6. ✅ Sottoponi per review

**Tempo stimato review Google Play: 1-7 giorni**
