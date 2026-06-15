import SwiftUI
import WebKit

// ============================================================================
// Native iOS-Hülle (WKWebView), die die vollständige Web-App lädt.
// Damit lässt sich der aktuelle Funktionsumfang (Rezeptbuch, Fotos, Tracking,
// KI-Erkennung) direkt im iOS-Simulator oder auf dem iPhone testen.
//
// Standard: lädt die Live-Seite (immer aktuell). Für Offline-Test siehe unten.
// ============================================================================

@main
struct SmartEinkaufWebApp: App {
    var body: some Scene {
        WindowGroup {
            WebAppView()
                .ignoresSafeArea()          // Web-App bringt eigene Safe-Area-Logik mit
                .preferredColorScheme(nil)  // folgt dem System (Dark Mode)
        }
    }
}

struct WebAppView: UIViewRepresentable {
    // Live-Version (immer der neueste Stand vom Branch):
    let url = URL(string: "https://marvingerke-source.github.io/App/")!

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        // Kamera/Foto-Auswahl ohne Extra-Tap erlauben:
        config.mediaTypesRequiringUserActionForPlayback = []

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.scrollView.bounces = true
        webView.allowsBackForwardNavigationGestures = false

        // --- Offline-Variante (optional) ----------------------------------
        // Statt der Live-URL die gebündelten Dateien laden. Dafür den Ordner
        // `web/` als "Create folder references" ins Projekt ziehen und oben
        // den load(...)-Aufruf gegen diesen Block tauschen:
        //
        // if let local = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "web") {
        //     webView.loadFileURL(local, allowingReadAccessTo: local.deletingLastPathComponent())
        //     return webView
        // }
        // -------------------------------------------------------------------

        webView.load(URLRequest(url: url))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}
}
