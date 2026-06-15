import SwiftUI
import WebKit

// ============================================================================
// Native iOS-App (WKWebView), die die vollständige Web-App lädt.
// Einfach SmartEinkaufWeb.xcodeproj öffnen und ▶ Run drücken.
// ============================================================================

@main
struct SmartEinkaufWebApp: App {
    var body: some Scene {
        WindowGroup {
            WebAppView()
                .ignoresSafeArea()
        }
    }
}

struct WebAppView: UIViewRepresentable {
    // Live-Version (immer der neueste Stand). Für Offline siehe README.
    let url = URL(string: "https://marvingerke-source.github.io/App/")!

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.scrollView.bounces = true
        webView.load(URLRequest(url: url))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}
}
