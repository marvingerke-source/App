# In Xcode testen – fertiges Projekt

**So testest du die vollständige App (Rezeptbuch, Fotos, Tracking, KI):**

1. Repo auf deinen Mac holen (klonen oder ZIP) und den Ordner
   `ios/SmartEinkaufWeb/` öffnen.
2. **`SmartEinkaufWeb.xcodeproj`** doppelklicken → Xcode öffnet das Projekt.
3. Oben ein Ziel wählen (z. B. **iPhone 16 Simulator**) und **▶ Run**.

Fertig – die komplette Web-App läuft in einer nativen iOS-Hülle. `localStorage`,
Foto-Upload (Kamera/Mediathek) und die KI-Erkennung funktionieren wie in Safari.

### Auf einem echten iPhone
- Xcode ▸ Projekt ▸ Target **SmartEinkaufWeb** ▸ **Signing & Capabilities** ▸
  dein **Team** wählen (kostenloser Apple-ID-Account genügt zum Testen).
- Bei Bedarf den **Bundle Identifier** ändern (z. B. `com.deinname.SmartEinkaufWeb`),
  falls `com.example.SmartEinkaufWeb` schon vergeben ist.
- iPhone per Kabel verbinden, als Ziel wählen, **▶ Run**.

### Offline / Web-Dateien einbetten (optional)
Standardmäßig lädt die App die Live-Seite
`https://marvingerke-source.github.io/App/`. Soll sie offline mit den lokalen
Dateien laufen:
1. Den Ordner `web/` (aus dem Repo-Root) per Drag & Drop ins Xcode-Projekt ziehen,
   dabei **„Create folder references"** wählen (blauer Ordner).
2. In `SmartEinkaufWeb/SmartEinkaufWebApp.swift` `makeUIView` so anpassen:
   ```swift
   if let local = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "web") {
       webView.loadFileURL(local, allowingReadAccessTo: local.deletingLastPathComponent())
   } else {
       webView.load(URLRequest(url: url))
   }
   ```

### Hinweis
`ios/SmartEinkauf/` ist das ältere **Stufe-1-SwiftUI-Gerüst** (ohne Rezeptbuch,
Fotos, Tracking, KI). Der vollständige Funktionsumfang lebt in der Web-App, die
dieses Projekt lädt.
