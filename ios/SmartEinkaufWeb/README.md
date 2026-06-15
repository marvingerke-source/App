# In Xcode testen – Smarter Wochen-Einkauf

Es gibt zwei iOS-Varianten in diesem Repo:

| Ordner | Was | Stand |
|--------|-----|-------|
| `ios/SmartEinkaufWeb/` | **Native Hülle (WKWebView)**, lädt die vollständige Web-App | **alle Features** – zum Testen empfohlen |
| `ios/SmartEinkauf/` | Natives SwiftUI-Gerüst | nur Stufe 1 (Frühstand) |

## A) Schnellster Test – ganz ohne Xcode-Projekt
Im **iOS-Simulator** (kommt mit Xcode) oder am iPhone einfach **Safari** öffnen und
`https://marvingerke-source.github.io/App/` aufrufen. Das ist die echte App auf iOS.

## B) Als native App in Xcode (WKWebView-Hülle)
1. Xcode → **File ▸ New ▸ Project… ▸ iOS ▸ App**
   - Product Name: `SmartEinkaufWeb`
   - Interface: **SwiftUI**, Language: **Swift**
2. Die von Xcode erzeugte `…App.swift`/`ContentView.swift` löschen und stattdessen
   **`SmartEinkaufWebApp.swift`** aus diesem Ordner ins Target ziehen.
3. **Run** (▶) → Simulator oder verbundenes iPhone wählen.

Das war's – die vollständige Web-App läuft jetzt in einer nativen iOS-Hülle.
`localStorage`, Foto-Upload (Kamera/Mediathek) und die KI-Erkennung funktionieren
darin genauso wie in Safari.

### Offline / gebündelt (optional)
Soll die App ohne Internet laufen, den Ordner `web/` per **„Create folder references"**
ins Projekt ziehen und in `SmartEinkaufWebApp.swift` den auskommentierten
`loadFileURL(...)`-Block aktivieren.

### Foto/Kamera am Gerät
Damit die Kamera am echten iPhone genutzt werden darf, in den **Target-Einstellungen ▸
Info** den Schlüssel **`Privacy - Camera Usage Description`** (`NSCameraUsageDescription`)
mit einem kurzen Text ergänzen, z. B. „Für Fotos deiner Gerichte".

## Hinweis zum nativen SwiftUI-Gerüst (`ios/SmartEinkauf/`)
Das ist die ursprüngliche Stufe-1-Version (Wochenplan/Liste/Vorgaben/Ergebnis/Einkaufen
mit Beispieldaten) – ohne Rezeptbuch, Fotos, Tracking und KI. Es zeigt, wie eine native
Umsetzung aussähe; der vollständige, aktuelle Funktionsumfang lebt in der Web-App.
