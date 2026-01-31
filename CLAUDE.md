# CLAUDE.md - Memoria Condivisa per Agenti AI

> Ultimo aggiornamento: 31 Gennaio 2026

---

## Stato Attuale

**Rapportini360** e' un'applicazione SaaS multi-tenant per la gestione digitale dei rapportini giornalieri di lavoro, sviluppata per aziende italiane nel settore costruzioni/manifatturiero.

### Funzionalita' Implementate

- **Autenticazione e Ruoli**: Login/logout, ruoli (employee, admin, superadmin, teamleader)
- **Gestione Rapportini**: Creazione, modifica, approvazione rapportini giornalieri con operazioni multiple
- **Sistema Squadre**: Caposquadra puo' compilare un rapportino per tutta la squadra
- **Foglio Presenze**: Gestione assenze (Ferie, Permesso, Malattia, Congedo, L104)
- **Gestione Commesse**: Clienti, commesse, tipi lavorazione, materiali
- **Gestione Veicoli**: Anagrafica veicoli, rifornimenti carburante, cisterna aziendale
- **Export Dati**: Word, Excel, PDF, TXT per rapportini, presenze, carburante
- **Dashboard Admin**: Statistiche, approvazioni, gestione dipendenti
- **Dashboard SuperAdmin**: Gestione organizzazioni SaaS, sottoscrizioni
- **Pagamenti Stripe**: Piani free/premium, trial 30gg, webhook
- **Email Resend**: Notifiche registrazione, approvazione account
- **App Mobile**: Build Android via Capacitor
- **Landing Page**: Homepage pubblica con pricing e registrazione self-service
- **Audit Trail**: Tracciamento modifiche rapportini (schema pronto)

---

## Architettura

### Stack Tecnologico

| Layer | Tecnologia |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + Radix UI (shadcn/ui) |
| State | TanStack Query (server state) |
| Routing | Wouter |
| Backend | Express.js + TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Passport.js (Local Strategy) + Express Session |
| Payments | Stripe |
| Email | Resend |
| Storage | Cloudinary (immagini) |
| Mobile | Capacitor (Android) |

### Struttura Cartelle

```
DailyReportify2/
├── client/src/
│   ├── components/     # Componenti React (AdminDashboard, TeamReportForm, etc.)
│   ├── landing/        # Landing page pubblica
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilities (apiRequest, queryClient)
│   └── pages/          # Pagine
├── server/
│   ├── index.ts        # Entry point Express
│   ├── routes.ts       # Tutti gli endpoint API (~6000 righe)
│   ├── storage.ts      # Logica database
│   ├── auth.ts         # Autenticazione
│   ├── emailService.ts # Invio email
│   └── *Service.ts     # Export (Excel, Word, PDF, TXT)
├── shared/
│   ├── schema.ts       # Schema Drizzle + validazione Zod
│   └── dateUtils.ts    # Utilities date
└── migrations/         # Migrazioni SQL
```

### Tabelle Database Principali

- `organizations` - Aziende SaaS (multi-tenant)
- `users` - Utenti con ruoli
- `dailyReports` - Rapportini giornalieri
- `operations` - Operazioni/lavorazioni per rapportino
- `teams` / `teamMembers` - Squadre e membri
- `teamSubmissions` - Invii rapportino di squadra
- `attendanceEntries` - Registrazioni assenze
- `workOrders` - Commesse
- `vehicles` / `fuelRefills` - Veicoli e rifornimenti
- `reportAuditLog` - Storico modifiche (audit trail)

---

## Task Completati

### Gennaio 2026

- [x] **Sistema Squadre completo**: Tabelle teams, teamMembers, teamSubmissions + API + UI
- [x] **TeamReportForm**: Form caposquadra con tab Lavorazione/Presenze
- [x] **Endpoint `/api/teams/by-leader/:id`**: Recupera squadra del caposquadra
- [x] **Endpoint `/api/teams/:id/members-with-status`**: Membri con stato assenza
- [x] **Endpoint `/api/team-submissions`**: Creazione rapportino squadra
- [x] **Fix Caposquadra visibilita'**: Teamleader ora visibile in Dipendenti, Presenze, dropdown
- [x] **Schema Audit Trail**: Tabella `reportAuditLog` creata
- [x] **Fix createdBy valori**: Corretto da "admin/employee" a "utente/ufficio/caposquadra"
- [x] **Fix dropdown caposquadra**: Cambiato endpoint da `/api/employees` a `/api/users/active`
- [x] **Landing Page**: Hero, Features, Pricing, FAQ, Footer
- [x] **Registrazione Self-Service**: Form signup con opzione carta/manuale
- [x] **Email Service Resend**: Notifiche a superadmin e clienti
- [x] **Documenti Legali**: Privacy Policy, Terms of Service, Cookie Policy (in markdown)

---

## Task Pendenti

### Priorita' Alta

1. **Footer con dati aziendali**
   - File: `client/src/landing/components/Footer.tsx`
   - Aggiungere: P.IVA, indirizzo, ragione sociale nel copyright

2. **Pagine legali dedicate** (accessibili via URL, non solo dialog)
   - Creare: `PrivacyPage.tsx`, `TermsPage.tsx`, `CookiePage.tsx`
   - Aggiungere routes in `App.tsx`: `/privacy`, `/termini`, `/cookie`

3. **Pagina Contatti**
   - Creare: `ContattiPage.tsx` con dati aziendali completi
   - Route: `/contatti`

4. **Pagina Chi Siamo**
   - Creare: `ChiSiamoPage.tsx` (placeholder, contenuto da utente)
   - Route: `/chi-siamo`

5. **Audit Trail UI**
   - Implementare sezione "Storico Modifiche" nel dettaglio rapportino
   - Endpoint `GET /api/daily-reports/:id/audit-log` da completare

### Priorita' Media

6. **Email Resend - Dominio Verificato**
   - Attuale: sender di test `onboarding@resend.dev` (limita destinatari)
   - Necessario: verificare dominio `metaltecscoccia.it` o `rapportini360.it` su Resend

7. **Tasto MENU mobile per admin**
   - Aggiungere barra full-width sotto header su mobile
   - File: `App.tsx` e `AdminDashboard.tsx`

---

## Note Tecniche

### Variabili d'Ambiente (.env)

```env
# Database (PostgreSQL - Neon consigliato)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Sessione
SESSION_SECRET=stringa-segreta-min-32-caratteri
NODE_ENV=development|production

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Resend)
RESEND_API_KEY=re_...
SUPERADMIN_EMAIL=info@metaltecscoccia.it
FROM_EMAIL=Rapportini360 <onboarding@resend.dev>

# App URL
APP_URL=http://localhost:5173

# Cloudinary (opzionale, per immagini)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Comandi Principali

```bash
# Sviluppo
npm install          # Installa dipendenze
npm run dev          # Avvia server dev (frontend + backend)

# Produzione
npm run build        # Build frontend + backend
npm run start        # Avvia server produzione

# Database
npm run db:push      # Applica schema al database

# Mobile (Android)
npm run mobile:build # Build per Android
npm run mobile:sync  # Sincronizza con Capacitor
npm run mobile:run   # Deploy su device/emulatore
```

### Convenzioni Codice

- **createdBy rapportini**: `"utente"` | `"ufficio"` | `"caposquadra"` (NON "employee"/"admin")
- **Ruoli utente**: `"employee"` | `"admin"` | `"superadmin"` | `"teamleader"`
- **Date**: Formato `YYYY-MM-DD` come stringa (non Date object)
- **ID**: UUID generati da PostgreSQL (`gen_random_uuid()`)
- **Multi-tenancy**: Tutte le query filtrate per `organizationId`

### File Critici (> 50KB)

- `server/routes.ts` (~96KB) - Tutti gli endpoint API
- `client/src/components/AdminDashboard.tsx` (~265KB) - Dashboard admin completa
- `shared/schema.ts` (~28KB) - Schema database + validazione

### Endpoint API Principali

| Metodo | Path | Descrizione |
|--------|------|-------------|
| POST | `/api/login` | Login utente |
| POST | `/api/signup` | Registrazione self-service |
| GET | `/api/daily-reports` | Lista rapportini |
| POST | `/api/daily-reports` | Crea rapportino |
| POST | `/api/team-submissions` | Crea rapportino squadra |
| GET | `/api/teams/by-leader/:id` | Squadra del caposquadra |
| GET | `/api/attendance/monthly` | Foglio presenze mensile |
| GET | `/api/users/active` | Dipendenti attivi |

### Dati Aziendali (per documenti legali)

```
Metaltec Scoccia S.r.l.
Via Tiburtina Valeria Km 127.550, CAP 67041, Aielli (AQ)
P.IVA: 02064370667
Email: info@metaltecscoccia.it
Telefono: 0863790251
```

---

## Piano File Riferimento

Il piano dettagliato si trova in:
`C:\Users\giann\.claude\plans\bubbly-puzzling-puffin.md`

Contiene specifiche complete per:
- Footer e pagine legali
- Fix caposquadra (completato)
- Audit trail rapportini
- Signup sicuro con Stripe
- Architettura sistema squadre
