import SwiftUI

@main
struct SmartEinkaufApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            RootTabView()
                .environmentObject(appState)
                .tint(.akzent)
        }
    }
}

// Die fünf Kern-Screens als Tabs (Konzept Abschnitt 5).
struct RootTabView: View {
    var body: some View {
        TabView {
            WochenplanView()
                .tabItem { Label("Plan", systemImage: "calendar") }
            ListeView()
                .tabItem { Label("Liste", systemImage: "list.bullet") }
            VorgabenView()
                .tabItem { Label("Vorgaben", systemImage: "slider.horizontal.3") }
            ErgebnisView()
                .tabItem { Label("Ergebnis", systemImage: "tag") }
            EinkaufenView()
                .tabItem { Label("Einkaufen", systemImage: "cart") }
        }
    }
}
