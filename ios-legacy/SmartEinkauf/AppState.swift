import SwiftUI
import Combine

// Zentraler, beobachtbarer App-Zustand für den Prototyp.
// Stufe 2+: Persistenz über SwiftData statt In-Memory.
final class AppState: ObservableObject {
    @Published var plan: [String: PlanEintrag] = [
        "Mo": PlanEintrag(rezeptId: "bolognese", portionen: 2),
        "Di": PlanEintrag(rezeptId: "salat", portionen: 2),
        "Do": PlanEintrag(rezeptId: "haehnchen", portionen: 2),
        "Sa": PlanEintrag(rezeptId: "curry", portionen: 4),
    ]
    @Published var vorratAbgehakt: Set<String> = []     // Bedarf-IDs
    @Published var einkaufAbgehakt: Set<String> = []     // Angebot-IDs
    @Published var vorgaben = Vorgaben()

    let rezepte = Beispieldaten.rezepte
    let angebote = Beispieldaten.angebote
    let maerkte = Beispieldaten.maerkte

    var gesamterBedarf: [Bedarf] {
        Einkaufsplaner.bedarf(ausPlan: plan, rezepte: rezepte)
    }

    var offenerBedarf: [Bedarf] {
        gesamterBedarf.filter { !vorratAbgehakt.contains($0.id) }
    }

    var einkaufsplan: Einkaufsplan {
        Einkaufsplaner.plan(bedarf: offenerBedarf, vorgaben: vorgaben,
                            angebote: angebote, maerkte: maerkte)
    }

    func rezept(_ id: String) -> Rezept? { rezepte.first { $0.id == id } }

    func setze(tag: String, rezeptId: String?) {
        if let rezeptId, let r = rezept(rezeptId) {
            plan[tag] = PlanEintrag(rezeptId: rezeptId, portionen: r.portionen)
        } else {
            plan[tag] = nil
        }
    }

    func toggleVorrat(_ id: String) {
        if vorratAbgehakt.contains(id) { vorratAbgehakt.remove(id) } else { vorratAbgehakt.insert(id) }
    }

    func toggleEinkauf(_ id: String) {
        if einkaufAbgehakt.contains(id) { einkaufAbgehakt.remove(id) } else { einkaufAbgehakt.insert(id) }
    }
}

// Eine ruhige Akzentfarbe gemäß Konzept (Design-Abschnitt).
extension Color {
    static let akzent = Color(red: 0.20, green: 0.66, blue: 0.33)
}
