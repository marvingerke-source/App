import Foundation

// Kern-Datenmodell gemäß Konzept (Abschnitt 4).
// Für den Stufe-1-Prototyp als einfache Structs; Stufe 2+ kann auf SwiftData umstellen.

struct Zutat: Identifiable, Hashable {
    let id = UUID()
    let name: String
    let menge: Double
    let einheit: String
    let kategorie: String
}

struct Rezept: Identifiable, Hashable {
    let id: String
    let name: String
    let portionen: Int
    let dauerMin: Int
    let symbol: String        // SF Symbol name
    let zutaten: [Zutat]
}

struct Markt: Identifiable, Hashable {
    let id: String
    let name: String
    let entfernungKm: Double
}

struct Angebot: Identifiable, Hashable {
    let id: String
    let marktId: String
    let produktname: String
    let kategorie: String
    let preis: Double
    let normalpreis: Double
    let einheit: String
    let istBio: Bool
    let gueltigBis: String

    var ersparnis: Double { max(0, normalpreis - preis) }
}

struct Vorgaben {
    var budget: Double = 40
    var bioGewuenscht: Bool = false
    var maxLaeden: Int = 2
}

// Ein zusammengeführter Bedarfsposten (Baustein A Ergebnis).
struct Bedarf: Identifiable, Hashable {
    var id: String { "\(name.lowercased())|\(einheit)" }
    let name: String
    var menge: Double
    let einheit: String
    let kategorie: String
    var ausRezepten: [String]
}

// Eintrag im Wochenplan.
struct PlanEintrag: Hashable {
    let rezeptId: String
    var portionen: Int
}

// Ergebnis-Strukturen.
struct PlanPosition: Identifiable, Hashable {
    var id: String { bedarf.id }
    let bedarf: Bedarf
    let angebot: Angebot?
    var bioErsatz: Bool = false
}

struct MarktGruppe: Identifiable {
    var id: String { markt.id }
    let markt: Markt
    let positionen: [PlanPosition]
    var summe: Double { positionen.compactMap { $0.angebot?.preis }.reduce(0, +) }
}

struct Einkaufsplan {
    let gruppen: [MarktGruppe]
    let ohneAngebot: [Bedarf]
    let summe: Double
    let ersparnis: Double
    let anzahlLaeden: Int
    let hinweis: String?
    let ueberBudget: Bool
}
