# 🔧 Modifiche Backend per Supporto Mobile

Quando sarai pronto a testare l'app mobile, dovrai fare alcune modifiche al backend per permettere le connessioni dall'app Capacitor.

## 1. Installare CORS

```bash
npm install cors
npm install --save-dev @types/cors
```

## 2. Configurare CORS in server/index.ts

Aggiungi all'inizio del file (dopo gli import esistenti):

```typescript
import cors from 'cors';
```

Poi, dopo `const app = express();` e prima delle altre configurazioni, aggiungi:

```typescript
// CORS Configuration per supporto mobile
app.use(cors({
  origin: [
    'http://localhost:5173',     // Vite dev server
    'capacitor://localhost',      // Capacitor Android
    'ionic://localhost',          // Capacitor iOS
    'http://localhost',           // Capacitor fallback
    process.env.FRONTEND_URL || 'https://tuodominio.com'  // Produzione
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## 3. Configurare Session per Mobile

Trova la sezione dove configuri `express-session` e aggiorna:

```typescript
app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',  // ← IMPORTANTE per mobile!
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 giorni
    },
  })
);
```

**Nota:** `sameSite: 'none'` è necessario per far funzionare le sessioni cross-origin (app mobile → server).

## 4. Variabili d'Ambiente (.env o Replit Secrets)

Aggiungi:

```bash
FRONTEND_URL=https://tuodominio.com  # URL produzione
SESSION_SECRET=una-stringa-segreta-molto-lunga-e-casuale
NODE_ENV=production  # Solo in produzione
```

## 5. Testare con Emulatore Android

### Opzione A: Server in Produzione (CONSIGLIATO)

Se il tuo backend è già online (es. su Replit), non serve configurare nulla!
L'app si connetterà automaticamente al server di produzione.

### Opzione B: Server Locale (Solo per Testing)

Se vuoi testare con il server locale:

1. **Trova il tuo IP locale:**
   ```bash
   ipconfig  # Windows
   ifconfig  # Mac/Linux
   # Cerca "IPv4 Address" tipo 192.168.1.XXX
   ```

2. **Avvia il server:**
   ```bash
   npm run dev
   ```

3. **Modifica capacitor.config.ts:**
   ```typescript
   server: {
     // Per emulatore Android:
     url: 'http://10.0.2.2:5000',
     cleartext: true,

     // Per dispositivo fisico:
     // url: 'http://192.168.1.XXX:5000',  // ← Il tuo IP locale
   }
   ```

4. **Rebuilda l'app:**
   ```bash
   npm run mobile:build
   ```

## 6. Gestione Upload File da Mobile

L'upload di file da Capacitor Camera funziona diversamente. Ecco come adattarlo:

### Nel Client (React):

```typescript
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

const handleTakePicture = async () => {
  try {
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera  // o CameraSource.Photos per galleria
    });

    // Converti in blob per l'upload
    const response = await fetch(photo.webPath!);
    const blob = await response.blob();

    const formData = new FormData();
    formData.append('file', blob, 'photo.jpg');

    // Upload al server
    await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include'  // ← IMPORTANTE per sessioni
    });
  } catch (error) {
    console.error('Errore foto:', error);
  }
};
```

## 7. Rilevare se l'App è su Mobile

Puoi rilevare se l'app sta girando su Capacitor:

```typescript
import { Capacitor } from '@capacitor/core';

const isMobile = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform(); // 'android', 'ios', o 'web'

if (isMobile) {
  // Comportamento specifico per mobile
}
```

## 8. Gestione Network Status

Per gestire modalità offline:

```typescript
import { Network } from '@capacitor/network';

// Check status corrente
const status = await Network.getStatus();
console.log('Connesso:', status.connected);
console.log('Tipo:', status.connectionType); // wifi, cellular, none

// Listener per cambio connessione
Network.addListener('networkStatusChange', status => {
  if (!status.connected) {
    // Mostra messaggio "Offline"
  } else {
    // Riconnesso, ricarica dati
  }
});
```

## 9. Gestione Back Button Android

Aggiungi nel tuo App.tsx principale:

```typescript
import { App as CapApp } from '@capacitor/app';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    CapApp.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        // Chiedi conferma prima di uscire
        const shouldExit = confirm('Vuoi uscire dall\'app?');
        if (shouldExit) {
          CapApp.exitApp();
        }
      } else {
        window.history.back();
      }
    });

    return () => {
      CapApp.removeAllListeners();
    };
  }, []);

  return (
    // Il tuo componente App...
  );
}
```

## 10. Deep Links (Opzionale)

Se vuoi che l'app si apra da link esterni:

In `android/app/src/main/AndroidManifest.xml`:

```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="dailyreportify" />
</intent-filter>
```

Poi nel codice:

```typescript
import { App as CapApp } from '@capacitor/app';

CapApp.addListener('appUrlOpen', data => {
  // data.url = "dailyreportify://report/123"
  const slug = data.url.split('dailyreportify://').pop();
  // Naviga alla route appropriata
});
```

## Checklist Pre-Deploy Mobile

Prima di pubblicare su Google Play:

- [ ] CORS configurato correttamente
- [ ] Session `sameSite: 'none'` in produzione
- [ ] Backend accessibile via HTTPS (non HTTP!)
- [ ] Upload file funziona da mobile
- [ ] Gestione offline implementata
- [ ] Back button Android gestito
- [ ] Testato su emulatore e dispositivo reale
- [ ] Nessun console.log sensibile (password, token, etc.)
- [ ] Error handling robusto

## Note Importanti

1. **HTTPS è obbligatorio in produzione!** Google Play richiede connessioni sicure.

2. **Test su dispositivo reale:** L'emulatore non rappresenta le performance reali.

3. **Permessi Android:** Controlla `android/app/src/main/AndroidManifest.xml` per i permessi richiesti.

4. **Privacy Policy:** Google Play richiede una privacy policy se raccogli dati utente.

## Quando Applicare Queste Modifiche?

**NON SUBITO!** Applica queste modifiche quando:

1. Hai installato Android Studio
2. Hai creato un emulatore o hai un dispositivo fisico
3. Sei pronto a testare l'app mobile

Per ora, continua a sviluppare la versione web normalmente. Quando sarai pronto per il mobile, ritorna qui! 🚀
