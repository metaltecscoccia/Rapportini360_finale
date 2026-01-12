@echo off
echo Creazione keystore per DailyReportify...
echo.
echo IMPORTANTE: Conserva la password in un posto sicuro!
echo Password keystore: MetalTec2025!
echo Password chiave: MetalTec2025!
echo.

cd android\app

keytool -genkeypair -v -storetype PKCS12 -keystore dailyreportify-release-key.jks -alias dailyreportify -keyalg RSA -keysize 2048 -validity 10000

echo.
echo Keystore creato in: android\app\dailyreportify-release-key.jks
echo.
pause
