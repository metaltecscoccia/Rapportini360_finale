import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { registerStripeWebhook } from "./webhooks/stripe";

const app = express();

// Disable ETag globally to prevent 304 responses with empty body
app.set('etag', false);

// ============================================
// CORS CONFIGURATION FOR MOBILE APP
// ============================================
app.use(cors({
  origin: [
    'http://localhost:5173',
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
    'https://www.metaltecscoccia.it',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ============================================
// GLOBAL ERROR HANDLERS
// ============================================

process.on("unhandledRejection", (reason, promise) => {
  console.error("⚠️  Unhandled Rejection at:", promise, "reason:", reason);
  // Log but don't crash - let PM2 or similar handle restarts if needed
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  // Log but don't crash - in production you might want graceful shutdown
});

// ============================================
// ENVIRONMENT VALIDATION
// ============================================

if (process.env.NODE_ENV === "production") {
  // Validate critical environment variables
  const requiredEnvVars = [
    "DATABASE_URL",
    "SESSION_SECRET",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName],
  );

  if (missingVars.length > 0) {
    console.error("❌ FATAL: Missing required environment variables:");
    missingVars.forEach((varName) => console.error(`  - ${varName}`));
    process.exit(1);
  }
}
if (process.env.NODE_ENV === "production") {
  // Validate critical environment variables
  const requiredEnvVars = [
    "DATABASE_URL",
    "SESSION_SECRET",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName],
  );

  if (missingVars.length > 0) {
    console.error("❌ FATAL: Missing required environment variables:");
    missingVars.forEach((varName) => console.error(`  - ${varName}`));
    process.exit(1);
  }

  // ADD THIS DEBUG LOG
  console.log('🔍 DATABASE_URL check:', {
    host: process.env.DATABASE_URL?.match(/@([^/]+)/)?.[1] || 'unknown',
    database: process.env.DATABASE_URL?.match(/\/([^?]+)/)?.[1] || 'unknown'
  });
}
// ============================================
// PROXY CONFIGURATION
// ============================================

if (process.env.NODE_ENV === "production") {
  // Trust proxy for secure cookies behind HTTPS reverse proxy
  app.set("trust proxy", 1);
  log("✓ Trust proxy enabled for production");
}

// ============================================
// STRIPE WEBHOOKS (BEFORE BODY PARSERS)
// ============================================
// IMPORTANT: Stripe webhooks MUST be registered BEFORE express.json()
// to ensure raw body is available for signature verification
// The webhook needs raw body for signature verification
app.use("/webhook/stripe", express.raw({ type: "application/json" }));
registerStripeWebhook(app);

// ============================================
// BODY PARSERS
// ============================================

app.use(express.json({ limit: "10mb" })); // Increase limit for photo uploads
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// ============================================
// SESSION CONFIGURATION
// ============================================

// Ensure SESSION_SECRET is configured
if (!process.env.SESSION_SECRET) {
  if (process.env.NODE_ENV === "production") {
    console.error(
      "❌ FATAL: SESSION_SECRET environment variable is required in production",
    );
    process.exit(1);
  } else {
    console.warn("⚠️  WARNING: Using default SESSION_SECRET in development");
    process.env.SESSION_SECRET =
      "dev-secret-key-not-for-production-" + Math.random();
  }
}

// Session store configuration
const PgSession = connectPgSimple(session);
const sessionStore =
  process.env.NODE_ENV === "production" && process.env.DATABASE_URL
    ? new PgSession({
        conString: process.env.DATABASE_URL,
        tableName: "session",
        createTableIfMissing: true,
        pruneSessionInterval: 60 * 15, // Prune expired sessions every 15 minutes
      })
    : undefined; // Use memory store in development

if (sessionStore) {
  log("✓ Using PostgreSQL session store");
} else {
  log("⚠️  Using memory session store (development only)");
}

// Session middleware - optimized for iOS Safari compatibility
app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: "metaltec.sid", // Custom session name
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      httpOnly: true, // Prevent XSS attacks
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days (was 24 hours)
      sameSite: process.env.NODE_ENV === "production" ? "lax" : "lax", // CSRF protection
    },
    rolling: true, // Reset maxAge on every response (extends session on each request)
  }),
);

// ============================================
// REQUEST LOGGING MIDDLEWARE
// ============================================

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

      // Only log response body in development
      if (process.env.NODE_ENV === "development" && capturedJsonResponse) {
        const responseStr = JSON.stringify(capturedJsonResponse);
        if (responseStr.length < 100) {
          logLine += ` :: ${responseStr}`;
        }
      }

      // Truncate long log lines
      if (logLine.length > 200) {
        logLine = logLine.slice(0, 199) + "…";
      }

      // Color code by status
      if (res.statusCode >= 500) {
        console.error(`❌ ${logLine}`);
      } else if (res.statusCode >= 400) {
        console.warn(`⚠️  ${logLine}`);
      } else if (process.env.NODE_ENV === "development") {
        log(logLine);
      }
    }
  });

  next();
});

// ============================================
// SECURITY HEADERS
// ============================================

app.use((req, res, next) => {
  // Security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Only set CSP in production
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.anthropic.com https://storage.googleapis.com;",
    );
  }

  next();
});

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

// ============================================
// PUBLIC LEGAL DOCUMENTS (for Google Play Store)
// ============================================

app.get("/privacy", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - Rapportini360</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
    h2 { color: #1e40af; margin-top: 30px; }
    h3 { color: #1e3a8a; margin-top: 20px; }
    code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; }
    a { color: #2563eb; }
    strong { color: #1f2937; }
    ul { padding-left: 20px; }
    .updated { color: #6b7280; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>Informativa sulla Privacy</h1>
  <p class="updated"><strong>Ultima modifica:</strong> 6 gennaio 2026</p>

  <h2>1. Introduzione</h2>
  <p>Rapportini360 (di seguito "l'App", "noi", "nostro") rispetta la privacy degli utenti e si impegna a proteggere i dati personali raccolti attraverso l'applicazione mobile.</p>
  <p>Questa informativa sulla privacy descrive quali dati raccogliamo, come li utilizziamo, con chi li condividiamo e quali diritti hai in relazione ai tuoi dati personali.</p>

  <h2>2. Titolare del Trattamento</h2>
  <p><strong>Nome Azienda:</strong> [DA COMPILARE]<br>
  <strong>Indirizzo:</strong> [DA COMPILARE]<br>
  <strong>Email:</strong> [DA COMPILARE]<br>
  <strong>Partita IVA:</strong> [DA COMPILARE]</p>

  <h2>3. Dati Raccolti</h2>

  <h3>3.1 Dati forniti direttamente dall'utente</h3>
  <ul>
    <li><strong>Informazioni di registrazione:</strong> Nome completo, username</li>
    <li><strong>Credenziali di accesso:</strong> Username e password (criptata con algoritmo bcrypt)</li>
    <li><strong>Dati lavorativi:</strong>
      <ul>
        <li>Rapportini giornalieri (data, cliente, commessa, tipo lavoro, materiali, ore lavorate, note)</li>
        <li>Registrazioni presenze (data, tipo assenza, note)</li>
        <li>Rettifiche ore lavorate</li>
      </ul>
    </li>
    <li><strong>Foto:</strong> Immagini scattate o selezionate dalla galleria per documentare le attività lavorative</li>
    <li><strong>Dati veicoli</strong> (se utilizzati): Targa, tipo carburante, chilometraggio, rifornimenti</li>
  </ul>

  <h3>3.2 Dati raccolti automaticamente</h3>
  <ul>
    <li><strong>Dati tecnici:</strong> Indirizzo IP, tipo di dispositivo, sistema operativo</li>
    <li><strong>Dati di sessione:</strong> Data e ora di accesso, durata della sessione</li>
  </ul>

  <h3>3.3 Dati non raccolti</h3>
  <p>L'App <strong>NON</strong> raccoglie:</p>
  <ul>
    <li>Posizione GPS o dati di geolocalizzazione</li>
    <li>Contatti dal dispositivo</li>
    <li>Dati di navigazione su altri siti/app</li>
    <li>Dati biometrici</li>
    <li>Informazioni di pagamento (carte di credito, conti bancari)</li>
  </ul>

  <h2>4. Finalità del Trattamento</h2>

  <h3>4.1 Finalità principali (base giuridica: esecuzione del contratto)</h3>
  <ul>
    <li>Gestione rapportini di lavoro giornalieri</li>
    <li>Tracciamento ore lavorate e presenze</li>
    <li>Documentazione fotografica delle attività lavorative</li>
    <li>Gestione flotta veicoli e rifornimenti</li>
    <li>Generazione report per l'organizzazione di appartenenza</li>
  </ul>

  <h3>4.2 Finalità secondarie (base giuridica: legittimo interesse)</h3>
  <ul>
    <li>Sicurezza dell'applicazione e prevenzione accessi non autorizzati</li>
    <li>Miglioramento delle funzionalità dell'App</li>
    <li>Supporto tecnico agli utenti</li>
  </ul>

  <h2>6. Condivisione dei Dati</h2>

  <h3>6.1 All'interno dell'organizzazione</h3>
  <p>I dati sono accessibili a:</p>
  <ul>
    <li><strong>Amministratori dell'organizzazione:</strong> Accesso completo ai dati dei dipendenti della propria organizzazione</li>
    <li><strong>Super amministratori:</strong> Gestiscono gli account delle organizzazioni ma <strong>NON</strong> hanno accesso ai dati interni delle organizzazioni (rapportini, presenze, foto)</li>
    <li><strong>Dipendenti:</strong> Accesso solo ai propri dati personali</li>
  </ul>

  <h3>6.2 Fornitori di servizi terzi</h3>

  <p><strong>Cloudinary (Cloudinary Ltd.)</strong></p>
  <ul>
    <li><strong>Finalità:</strong> Archiviazione e gestione foto</li>
    <li><strong>Dati condivisi:</strong> Foto caricate dagli utenti</li>
    <li><strong>Ubicazione server:</strong> Stati Uniti e Europa</li>
    <li><strong>Privacy policy:</strong> <a href="https://cloudinary.com/privacy">https://cloudinary.com/privacy</a></li>
  </ul>

  <p><strong>Railway (Railway Corp.)</strong></p>
  <ul>
    <li><strong>Finalità:</strong> Hosting dell'applicazione e database</li>
    <li><strong>Dati condivisi:</strong> Tutti i dati dell'applicazione</li>
    <li><strong>Ubicazione server:</strong> Stati Uniti</li>
    <li><strong>Privacy policy:</strong> <a href="https://railway.app/legal/privacy">https://railway.app/legal/privacy</a></li>
  </ul>

  <h2>8. Sicurezza dei Dati</h2>

  <h3>8.1 Misure tecniche</h3>
  <ul>
    <li><strong>Crittografia in transito:</strong> HTTPS/TLS per tutte le comunicazioni</li>
    <li><strong>Password criptate:</strong> Hashing con algoritmo bcrypt (12 salt rounds)</li>
    <li><strong>Cookie sicuri:</strong> Flag HttpOnly, Secure, SameSite per protezione XSS e CSRF</li>
    <li><strong>Sessioni temporanee:</strong> Scadenza automatica dopo 24 ore</li>
    <li><strong>Rate limiting:</strong> Protezione contro attacchi brute force (max 100 richieste/15 minuti)</li>
  </ul>

  <h2>9. Diritti degli Utenti (GDPR)</h2>
  <p>Hai i seguenti diritti in relazione ai tuoi dati personali:</p>
  <ul>
    <li><strong>Diritto di accesso:</strong> Puoi richiedere copia dei tuoi dati personali</li>
    <li><strong>Diritto di rettifica:</strong> Puoi richiedere la correzione di dati inesatti</li>
    <li><strong>Diritto di cancellazione:</strong> Puoi richiedere la cancellazione dei tuoi dati</li>
    <li><strong>Diritto di portabilità:</strong> Puoi richiedere i tuoi dati in formato CSV/JSON</li>
    <li><strong>Diritto di reclamo:</strong> Puoi presentare reclamo al Garante Privacy</li>
  </ul>

  <h2>10. Come Esercitare i Tuoi Diritti</h2>
  <p>Per esercitare i tuoi diritti, contatta l'amministratore della tua organizzazione o il titolare del trattamento all'indirizzo: <strong>[DA COMPILARE]</strong></p>

  <h2>11. Contatti</h2>
  <p><strong>Email:</strong> [DA COMPILARE]<br>
  <strong>Indirizzo:</strong> [DA COMPILARE]</p>

  <p style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 0.9em;">
    Questo documento fa parte dei requisiti legali per la pubblicazione su Google Play Store.
  </p>
</body>
</html>
  `);
});

app.get("/terms", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Termini e Condizioni - Rapportini360</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
    h2 { color: #1e40af; margin-top: 30px; }
    h3 { color: #1e3a8a; margin-top: 20px; }
    a { color: #2563eb; }
    strong { color: #1f2937; }
    ul { padding-left: 20px; }
    .updated { color: #6b7280; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>Termini e Condizioni di Servizio</h1>
  <p class="updated"><strong>Ultima modifica:</strong> 6 gennaio 2026</p>

  <h2>1. Accettazione dei Termini</h2>
  <p>Utilizzando Rapportini360 ("l'App", "il Servizio"), accetti di essere vincolato da questi Termini e Condizioni di Servizio. Se non accetti questi Termini, non utilizzare l'App.</p>

  <h2>2. Descrizione del Servizio</h2>
  <p>Rapportini360 è un'applicazione mobile e web per la gestione di:</p>
  <ul>
    <li>Rapportini giornalieri di lavoro</li>
    <li>Registrazione presenze e assenze</li>
    <li>Documentazione fotografica attività</li>
    <li>Gestione flotta veicoli e rifornimenti</li>
    <li>Report e statistiche</li>
  </ul>

  <h2>3. Requisiti per l'Utilizzo</h2>
  <p>Per utilizzare l'App devi:</p>
  <ul>
    <li>Avere almeno 16 anni</li>
    <li>Essere dipendente o amministratore di un'organizzazione registrata</li>
    <li>Accettare questi Termini e l'Informativa sulla Privacy</li>
  </ul>

  <h2>4. Account</h2>
  <ul>
    <li>L'account viene creato dall'amministratore dell'organizzazione</li>
    <li>Ogni utente riceve un username univoco</li>
    <li>Al primo accesso, l'utente deve impostare una password personale</li>
    <li>Sei responsabile della sicurezza delle tue credenziali</li>
    <li>Non puoi condividere il tuo account con altri</li>
  </ul>

  <h2>5. Obblighi dell'Utente</h2>
  <p>L'utente si impegna a:</p>
  <ul>
    <li>Inserire dati veritieri e accurati nei rapportini</li>
    <li>Utilizzare l'App in modo conforme alla legge</li>
    <li>Non caricare contenuti offensivi o illegali</li>
    <li>Mantenere riservata la propria password</li>
  </ul>

  <h2>6. Privacy</h2>
  <p>L'utilizzo dell'App è disciplinato dalla nostra <a href="/privacy">Informativa sulla Privacy</a>.</p>

  <h2>7. Limitazione di Responsabilità</h2>
  <p>L'APP È FORNITA "COSÌ COM'È" SENZA GARANZIE DI ALCUN TIPO. Non garantiamo che il servizio sarà ininterrotto o privo di errori.</p>

  <h2>8. Legge Applicabile</h2>
  <p>Questi Termini sono regolati dalla legge italiana.</p>

  <h2>9. Contatti</h2>
  <p><strong>Email:</strong> [DA COMPILARE]<br>
  <strong>Indirizzo:</strong> [DA COMPILARE]</p>

  <p style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 0.9em;">
    Utilizzando Rapportini360, dichiari di aver letto e accettato questi Termini e Condizioni.
  </p>
</body>
</html>
  `);
});

// ============================================
// SERVER INITIALIZATION
// ============================================

(async () => {
  try {
    log("🚀 Starting Metaltec Rapportini Server...");

    // Register API routes
    const server = await registerRoutes(app);
    log("✓ API routes registered");

    // ============================================
    // 301 REDIRECTS - Landing pages moved to main site
    // ============================================
    const MAIN_SITE = "https://www.metaltecscoccia.it";
    // Note: /privacy and /terms are NOT redirected because they have existing
    // HTML handlers (for Google Play Store) registered earlier in the middleware chain
    const landingRedirects: Record<string, string> = {
      "/home": `${MAIN_SITE}/rapportini360/`,
      "/chi-siamo": `${MAIN_SITE}/rapportini360/chi-siamo`,
      "/contatti": `${MAIN_SITE}/rapportini360/contatti`,
      "/termini": `${MAIN_SITE}/rapportini360/termini`,
      "/cookie": `${MAIN_SITE}/rapportini360/cookie`,
    };

    for (const [from, to] of Object.entries(landingRedirects)) {
      app.get(from, (_req, res) => {
        res.redirect(301, to);
      });
    }
    log("✓ Landing page 301 redirects configured");

    // Global error handler (must be after routes)
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      // Log the error for debugging
      console.error("❌ Express error handler:", {
        status,
        message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      });

      // Send error response to client (never expose stack trace in production)
      res.status(status).json({
        error: message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
      });
    });

    // Setup Vite dev server (development) or static file serving (production)
    if (app.get("env") === "development") {
      await setupVite(app, server);
      log("✓ Vite development server configured");
    } else {
      serveStatic(app);
      log("✓ Static file serving configured");
    }

    // Start HTTP server
    const port = parseInt(process.env.PORT || "5000", 10);

    server.listen(
      {
        port,
        host: "0.0.0.0",
        reusePort: true,
      },
      () => {
        log(`✅ Server running on port ${port}`);
        log(`   Environment: ${process.env.NODE_ENV || "development"}`);
        log(`   URL: http://localhost:${port}`);

        if (process.env.NODE_ENV === "production") {
          log("   🔒 Security features enabled");
          log("   🔄 Rate limiting active");
          log("   📊 PostgreSQL session store active");
        }
      },
    );

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      log(`\n⚠️  ${signal} received, starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(() => {
        log("✓ HTTP server closed");
      });

      // Give time for in-flight requests to complete
      setTimeout(() => {
        log("✅ Graceful shutdown complete");
        process.exit(0);
      }, 5000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("❌ FATAL: Failed to start server:", error);
    process.exit(1);
  }
})();
