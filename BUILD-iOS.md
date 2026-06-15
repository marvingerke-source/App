# Store-fähige iOS-App bauen (Capacitor)

Diese App ist als **Capacitor-Hybrid-App** eingerichtet: der gesamte Web-Code
(`web/`) läuft als **eingebettete, native iOS-App** mit nativen Funktionen
(Splash-Screen, Statusleiste, haptisches Feedback). Das erfüllt Apples
Anforderung „mehr als eine eingepackte Website" und ist damit App-Store-tauglich.

## Voraussetzungen (einmalig, auf dem Mac)
- **Xcode** (aus dem Mac App Store)
- **Node.js** (nodejs.org)
- **CocoaPods**: im Terminal `sudo gem install cocoapods`

## Bauen & Starten
Im Repo-Wurzelverzeichnis:

```bash
npm install            # Capacitor-Abhängigkeiten holen
npx cap sync ios       # Web-Stand + Plugins ins iOS-Projekt kopieren
cd ios/App
pod install            # native Abhängigkeiten installieren
open App.xcworkspace   # WICHTIG: .xcworkspace öffnen, NICHT .xcodeproj
```

In Xcode:
1. Oben **iPhone-Simulator** (oder dein iPhone) als Ziel wählen
2. Für ein echtes Gerät: Target **App ▸ Signing & Capabilities ▸ Team** setzen
3. **▶ Run**

Die komplette App (Plan, Liste, Sparen, Einkauf, Rezeptbuch, Tracking, KI-Foto)
läuft jetzt als native iOS-App – offlinefähige Hülle, Inhalte/Fotos kommen bei
Bedarf aus dem Netz.

## Nach Änderungen am Web-Code
```bash
npx cap sync ios       # neue Web-Dateien ins iOS-Projekt übernehmen
```
(Dann in Xcode erneut Run.)

## Für die Veröffentlichung im App Store
- **Bundle Identifier** auf deine eigene Domain ändern (Standard:
  `com.smarteinkauf.app`) – in Xcode bei *Signing & Capabilities* und in
  `capacitor.config.json` (`appId`).
- **App-Icon & Launch-Screen** in `ios/App/App/Assets.xcassets` hinterlegen.
- Version/Build in Xcode setzen, **Product ▸ Archive**, dann über den
  **Organizer** an App Store Connect hochladen.
- **Apple Developer Program** (99 $/Jahr) wird zum Veröffentlichen benötigt.

## Hinweise
- `web/` ist die Single Source of Truth. `ios/App/App/public/` wird von
  `cap sync` automatisch daraus befüllt – dort nichts von Hand ändern.
- `node_modules/` ist bewusst nicht eingecheckt (kommt über `npm install`).
- Die alten reinen SwiftUI-Gerüste liegen unter `ios-legacy/` (nur als Referenz).
- KI-Foto-Erkennung & Pexels-Fotos: laufen client-seitig mit den in der App
  hinterlegten Keys. Für einen echten Launch sollten diese Aufrufe über ein
  kleines Backend laufen (Keys geheim halten, Limits/Abrechnung steuern).
