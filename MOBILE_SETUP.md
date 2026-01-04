# 📱 DailyReportify - Setup Mobile (Android)

Questa guida spiega come sviluppare e pubblicare l'app Android di DailyReportify.

## 🚀 Prerequisiti

### Software Necessario

1. **Node.js** (già installato) ✅
2. **Android Studio** - [Download](https://developer.android.com/studio)
   - Scarica e installa Android Studio
   - Durante l'installazione, assicurati di includere:
     - Android SDK
     - Android SDK Platform
     - Android Virtual Device (per emulatore)

3. **Java JDK 17** - Richiesto da Android Studio
   - Viene installato automaticamente con Android Studio

### Configurazione Android Studio

1. Apri Android Studio
2. Vai su **Tools > SDK Manager**
3. Nella tab **SDK Platforms**, installa:
   - Android 14.0 (API Level 34) - Raccomandato
   - Android 13.0 (API Level 33)

4. Nella tab **SDK Tools**, installa:
   - Android SDK Build-Tools
   - Android Emulator
   - Android SDK Platform-Tools
   - Intel/AMD HAXM (per accelerazione emulatore)

5. Configura le variabili d'ambiente:
   - `ANDROID_HOME` = path alla SDK (es. `C:\Users\TuoNome\AppData\Local\Android\Sdk`)
   - Aggiungi al PATH: `%ANDROID_HOME%\platform-tools`

## 📋 Comandi Disponibili

### Build e Sviluppo

```bash
# Build del frontend e sincronizzazione con Android
npm run mobile:build

# Apri il progetto in Android Studio
npm run mobile:open

# Build + Run su emulatore/dispositivo
npm run mobile:run

# Solo sincronizzazione (dopo modifiche ai plugin)
npm run mobile:sync
```

### Workflow Tipico di Sviluppo

```bash
# 1. Modifica il codice React in client/src/...

# 2. Rebuilda e sincronizza
npm run mobile:build

# 3. Apri Android Studio
npm run mobile:open

# 4. In Android Studio:
# - Clicca sul pulsante "Run" (▶️)
# - Scegli emulatore o dispositivo USB
```

## 🧪 Testing

### Con Emulatore Android

1. In Android Studio, vai su **Tools > Device Manager**
2. Clicca **Create Device**
3. Scegli un device (es. Pixel 7)
4. Scegli system image (es. Android 14)
5. Clicca **Finish**
6. Avvia l'emulatore
7. Run l'app: `npm run mobile:run`

### Con Dispositivo Fisico (USB Debugging)

1. Sul telefono Android:
   - Vai in **Impostazioni > Info telefono**
   - Tocca 7 volte su "Numero build" per abilitare Developer Options
   - Vai in **Impostazioni > Opzioni sviluppatore**
   - Abilita **Debug USB**

2. Collega il telefono al PC via USB

3. Accetta la richiesta di debug USB sul telefono

4. Run l'app: `npm run mobile:run`

## 🔧 Configurazione App

### File Principali

- **capacitor.config.ts** - Configurazione principale Capacitor
- **android/app/src/main/AndroidManifest.xml** - Permessi e configurazioni Android
- **android/app/build.gradle** - Versione app, dependencies Android
- **android/app/src/main/res/** - Icone, splash screen, risorse

### Modificare App ID

Se vuoi cambiare l'ID dell'app (importante per Play Store):

1. Modifica [capacitor.config.ts](capacitor.config.ts):
```typescript
appId: 'com.tuaazienda.dailyreportify'  // ← Cambia questo
```

2. Rebuild:
```bash
npm run mobile:build
```

### Modificare Nome App

1. Modifica [capacitor.config.ts](capacitor.config.ts):
```typescript
appName: 'DailyReportify'  // ← Cambia questo
```

2. Rebuild:
```bash
npm run mobile:build
```

## 🎨 Icone e Splash Screen

### Generare Icone

1. Crea un'icona 1024x1024 PNG (senza trasparenza per Android)
2. Usa un tool online come [Icon Kitchen](https://icon.kitchen/)
3. Carica la tua icona
4. Download il pacchetto Android
5. Sostituisci le icone in `android/app/src/main/res/mipmap-*/`

### Splash Screen

1. Modifica [capacitor.config.ts](capacitor.config.ts):
```typescript
plugins: {
  SplashScreen: {
    launchShowDuration: 2000,
    backgroundColor: '#ffffff',  // ← Il tuo colore brand
    showSpinner: false,
  }
}
```

## 🔌 Plugin Capacitor Installati

- **@capacitor/app** - Lifecycle app, deep linking
- **@capacitor/camera** - Accesso fotocamera (per foto operazioni)
- **@capacitor/filesystem** - Accesso file system
- **@capacitor/network** - Status connessione
- **@capacitor/splash-screen** - Schermata di caricamento
- **@capacitor/status-bar** - Controllo barra di stato

## 📦 Build per Produzione (Google Play)

### 1. Preparazione

1. Incrementa la versione in [capacitor.config.ts](capacitor.config.ts)
2. Build del frontend:
```bash
npm run mobile:build
```

### 2. Generare Keystore (PRIMA VOLTA)

```bash
# In Android Studio > Terminal:
cd android
./gradlew signingReport  # Per vedere debug keys

# Genera release keystore:
keytool -genkey -v -keystore release.keystore -alias dailyreportify -keyalg RSA -keysize 2048 -validity 10000
```

**IMPORTANTE:** Salva il file `release.keystore` e la password in un posto sicuro!

### 3. Configurare Firma

Crea `android/key.properties`:
```properties
storeFile=../release.keystore
storePassword=TUA_PASSWORD
keyAlias=dailyreportify
keyPassword=TUA_PASSWORD
```

Aggiungi `key.properties` al [.gitignore](.gitignore) (già fatto) ✅

### 4. Build Release AAB

In Android Studio:
1. **Build > Generate Signed Bundle / APK**
2. Seleziona **Android App Bundle**
3. Scegli il keystore creato
4. Inserisci le password
5. Seleziona **release** build variant
6. Clicca **Finish**

Il file AAB sarà in: `android/app/release/app-release.aab`

### 5. Upload su Google Play Console

1. Vai su [Google Play Console](https://play.google.com/console)
2. Crea una nuova app (se prima volta)
3. Vai su **Release > Production**
4. Clicca **Create new release**
5. Upload `app-release.aab`
6. Compila store listing, screenshots, etc.
7. Invia per revisione

## 🐛 Troubleshooting

### Problema: "Android SDK not found"

**Soluzione:**
- Controlla che `ANDROID_HOME` sia configurato correttamente
- Riavvia il terminale/IDE dopo aver impostato le variabili d'ambiente

### Problema: "Unable to locate adb"

**Soluzione:**
```bash
# Aggiungi al PATH:
%ANDROID_HOME%\platform-tools
```

### Problema: "Gradle build failed"

**Soluzione:**
1. In Android Studio, clicca **File > Invalidate Caches**
2. Riavvia Android Studio
3. Run `./gradlew clean` in `android/`

### Problema: L'app non si connette al backend

**Soluzione:**

Per sviluppo locale, modifica [capacitor.config.ts](capacitor.config.ts):

```typescript
server: {
  url: 'http://10.0.2.2:5000',  // Per emulatore Android
  // url: 'http://192.168.1.X:5000',  // Per dispositivo fisico (tuo IP locale)
  cleartext: true
}
```

**IMPORTANTE:** Per produzione, usa sempre HTTPS!

## 📚 Risorse Utili

- [Documentazione Capacitor](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [Google Play Console](https://play.google.com/console)
- [Publishing Checklist](https://developer.android.com/distribute/best-practices/launch/launch-checklist)

## 🆘 Supporto

Per problemi con la configurazione mobile, contatta lo sviluppatore.
