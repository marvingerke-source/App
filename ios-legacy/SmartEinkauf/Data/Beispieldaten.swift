import Foundation

// Beispieldaten für den Prototyp. In Stufe 2 ersetzt durch KI-Prospekt-Import.
enum Beispieldaten {

    static let maerkte: [Markt] = [
        Markt(id: "aldi",  name: "Aldi Süd", entfernungKm: 0.8),
        Markt(id: "rewe",  name: "Rewe",     entfernungKm: 1.4),
        Markt(id: "lidl",  name: "Lidl",     entfernungKm: 2.1),
        Markt(id: "edeka", name: "Edeka",    entfernungKm: 3.0),
    ]

    static let rezepte: [Rezept] = [
        Rezept(id: "bolognese", name: "Spaghetti Bolognese", portionen: 2, dauerMin: 30, symbol: "fork.knife", zutaten: [
            Zutat(name: "Hackfleisch", menge: 400, einheit: "g", kategorie: "fleisch"),
            Zutat(name: "Spaghetti", menge: 500, einheit: "g", kategorie: "nudeln"),
            Zutat(name: "Zwiebeln", menge: 2, einheit: "Stk", kategorie: "gemuese"),
            Zutat(name: "Tomaten (Dose)", menge: 400, einheit: "g", kategorie: "konserven"),
            Zutat(name: "Knoblauch", menge: 2, einheit: "Zehen", kategorie: "gemuese"),
            Zutat(name: "Parmesan", menge: 100, einheit: "g", kategorie: "kaese"),
        ]),
        Rezept(id: "curry", name: "Gemüse-Kokos-Curry", portionen: 2, dauerMin: 25, symbol: "leaf", zutaten: [
            Zutat(name: "Kokosmilch", menge: 400, einheit: "ml", kategorie: "konserven"),
            Zutat(name: "Paprika", menge: 2, einheit: "Stk", kategorie: "gemuese"),
            Zutat(name: "Zwiebeln", menge: 1, einheit: "Stk", kategorie: "gemuese"),
            Zutat(name: "Reis", menge: 250, einheit: "g", kategorie: "reis"),
            Zutat(name: "Currypaste", menge: 50, einheit: "g", kategorie: "gewuerze"),
        ]),
        Rezept(id: "haehnchen", name: "Hähnchen mit Brokkoli & Reis", portionen: 2, dauerMin: 35, symbol: "flame", zutaten: [
            Zutat(name: "Hähnchenbrust", menge: 600, einheit: "g", kategorie: "fleisch"),
            Zutat(name: "Brokkoli", menge: 1, einheit: "Stk", kategorie: "gemuese"),
            Zutat(name: "Reis", menge: 250, einheit: "g", kategorie: "reis"),
        ]),
        Rezept(id: "omelette", name: "Käse-Omelette", portionen: 2, dauerMin: 15, symbol: "sun.max", zutaten: [
            Zutat(name: "Eier", menge: 6, einheit: "Stk", kategorie: "eier"),
            Zutat(name: "Milch", menge: 100, einheit: "ml", kategorie: "milch"),
            Zutat(name: "Käse", menge: 150, einheit: "g", kategorie: "kaese"),
        ]),
        Rezept(id: "salat", name: "Großer Hirtensalat", portionen: 2, dauerMin: 15, symbol: "carrot", zutaten: [
            Zutat(name: "Tomaten", menge: 4, einheit: "Stk", kategorie: "gemuese"),
            Zutat(name: "Gurke", menge: 1, einheit: "Stk", kategorie: "gemuese"),
            Zutat(name: "Feta", menge: 200, einheit: "g", kategorie: "kaese"),
            Zutat(name: "Olivenöl", menge: 50, einheit: "ml", kategorie: "oel"),
        ]),
        Rezept(id: "pasta_pesto", name: "Pasta mit Pesto", portionen: 2, dauerMin: 15, symbol: "leaf.fill", zutaten: [
            Zutat(name: "Spaghetti", menge: 500, einheit: "g", kategorie: "nudeln"),
            Zutat(name: "Pesto", menge: 190, einheit: "g", kategorie: "konserven"),
            Zutat(name: "Parmesan", menge: 80, einheit: "g", kategorie: "kaese"),
        ]),
    ]

    static let angebote: [Angebot] = [
        Angebot(id: "a1", marktId: "aldi", produktname: "Frisches Hackfleisch gemischt 500g", kategorie: "fleisch", preis: 3.49, normalpreis: 4.49, einheit: "500g", istBio: false, gueltigBis: "2026-06-21"),
        Angebot(id: "a2", marktId: "rewe", produktname: "Bio-Hackfleisch Rind 400g", kategorie: "fleisch", preis: 4.99, normalpreis: 5.99, einheit: "400g", istBio: true, gueltigBis: "2026-06-21"),
        Angebot(id: "a3", marktId: "lidl", produktname: "Hähnchenbrustfilet 1kg", kategorie: "fleisch", preis: 6.99, normalpreis: 8.49, einheit: "1kg", istBio: false, gueltigBis: "2026-06-21"),
        Angebot(id: "a4", marktId: "edeka", produktname: "Bio-Hähnchenbrust 600g", kategorie: "fleisch", preis: 7.49, normalpreis: 8.99, einheit: "600g", istBio: true, gueltigBis: "2026-06-21"),
        Angebot(id: "a5", marktId: "aldi", produktname: "Spaghetti 500g", kategorie: "nudeln", preis: 0.79, normalpreis: 1.09, einheit: "500g", istBio: false, gueltigBis: "2026-06-21"),
        Angebot(id: "a6", marktId: "rewe", produktname: "Bio-Spaghetti 500g", kategorie: "nudeln", preis: 1.29, normalpreis: 1.69, einheit: "500g", istBio: true, gueltigBis: "2026-06-21"),
        Angebot(id: "a7", marktId: "lidl", produktname: "Basmatireis 1kg", kategorie: "reis", preis: 1.99, normalpreis: 2.79, einheit: "1kg", istBio: false, gueltigBis: "2026-06-21"),
        Angebot(id: "a8", marktId: "edeka", produktname: "Bio-Basmatireis 500g", kategorie: "reis", preis: 2.49, normalpreis: 2.99, einheit: "500g", istBio: true, gueltigBis: "2026-06-21"),
        Angebot(id: "a9", marktId: "aldi", produktname: "Zwiebeln 2kg Netz", kategorie: "gemuese", preis: 1.49, normalpreis: 1.99, einheit: "2kg", istBio: false, gueltigBis: "2026-06-21"),
        Angebot(id: "a10", marktId: "lidl", produktname: "Paprika rot 500g", kategorie: "gemuese", preis: 1.79, normalpreis: 2.49, einheit: "500g", istBio: false, gueltigBis: "2026-06-21"),
        Angebot(id: "a11", marktId: "rewe", produktname: "Bio-Paprika Mix 500g", kategorie: "gemuese", preis: 2.49, normalpreis: 2.99, einheit: "500g", istBio: true, gueltigBis: "2026-06-21"),
        Angebot(id: "a12", marktId: "edeka", produktname: "Brokkoli Stück", kategorie: "gemuese", preis: 0.99, normalpreis: 1.49, einheit: "Stk", istBio: false, gueltigBis: "2026-06-21"),
        Angebot(id: "a13", marktId: "aldi", produktname: "Rispentomaten 500g", kategorie: "gemuese", preis: 1.29, normalpreis: 1.99, einheit: "500g", istBio: false, gueltigBis: "2026-06-21"),
        Angebot(id: "a14", marktId: "lidl", produktname: "Salatgurke", kategorie: "gemuese", preis: 0.59, normalpreis: 0.89, einheit: "Stk", istBio: false, gueltigBis: "2026-06-21"),
        Angebot(id: "a15", marktId: "rewe", produktname: "Knoblauch 200g", kategorie: "gemuese", preis: 0.89, normalpreis: 1.19, einheit: "200g", istBio: false, gueltigBis: "2026-06-21"),
        Angebot(id: "a16", marktId: "aldi", produktname: "Gehackte Tomaten 400g Dose", kategorie: "konserven", preis: 0.49, normalpreis: 0.79, einheit: "400g", istBio: false, gueltigBis: "2026-06-21"),
        Angebot(id: "a17", marktId: "edeka", produktname: "Bio-Kokosmilch 400ml", kategorie: "konserven", preis: 1.19, normalpreis: 1.59, einheit: "400ml", istBio: true, gueltigBis: "2026-06-21"),
        Angebot(id: "a18", marktId: "lidl", produktname: "Kokosmilch 400ml", kategorie: "konserven", preis: 0.89, normalpreis: 1.29, einheit: "400ml", istBio: false, gueltigBis: "2026-06-21"),
        Angebot(id: "a19", marktId: "rewe", produktname: "Pesto Genovese 190g", kategorie: "konserven", preis: 1.79, normalpreis: 2.29, einheit: "190g", istBio: false, gueltigBis: "2026-06-21"),
        Angebot(id: "a20", marktId: "aldi", produktname: "Frische Vollmilch 3,8% 1L", kategorie: "milch", preis: 0.99, normalpreis: 1.19, einheit: "1L", istBio: false, gueltigBis: "2026-06-21"),
        Angebot(id: "a21", marktId: "rewe", produktname: "Bio-Vollmilch 3,8% 1L", kategorie: "milch", preis: 1.39, normalpreis: 1.59, einheit: "1L", istBio: true, gueltigBis: "2026-06-21"),
        Angebot(id: "a22", marktId: "lidl", produktname: "Eier Bodenhaltung 10er", kategorie: "eier", preis: 1.79, normalpreis: 2.29, einheit: "10 Stk", istBio: false, gueltigBis: "2026-06-21"),
        Angebot(id: "a23", marktId: "edeka", produktname: "Bio-Eier 6er", kategorie: "eier", preis: 2.49, normalpreis: 2.99, einheit: "6 Stk", istBio: true, gueltigBis: "2026-06-21"),
        Angebot(id: "a24", marktId: "aldi", produktname: "Gouda jung 400g", kategorie: "kaese", preis: 2.99, normalpreis: 3.79, einheit: "400g", istBio: false, gueltigBis: "2026-06-21"),
        Angebot(id: "a25", marktId: "rewe", produktname: "Parmigiano Reggiano 150g", kategorie: "kaese", preis: 2.99, normalpreis: 3.49, einheit: "150g", istBio: false, gueltigBis: "2026-06-21"),
        Angebot(id: "a26", marktId: "lidl", produktname: "Feta 200g", kategorie: "kaese", preis: 1.49, normalpreis: 1.99, einheit: "200g", istBio: false, gueltigBis: "2026-06-21"),
        Angebot(id: "a27", marktId: "edeka", produktname: "Olivenöl nativ extra 500ml", kategorie: "oel", preis: 4.99, normalpreis: 6.49, einheit: "500ml", istBio: false, gueltigBis: "2026-06-21"),
        Angebot(id: "a28", marktId: "rewe", produktname: "Rote Currypaste 195g", kategorie: "gewuerze", preis: 1.99, normalpreis: 2.49, einheit: "195g", istBio: false, gueltigBis: "2026-06-21"),
    ]

    // Stichwörter fürs unscharfe Matching (Platzhalter für KI-Produktabgleich).
    static let matchStichworte: [String: [String]] = [
        "hackfleisch": ["hackfleisch", "hack"],
        "spaghetti": ["spaghetti", "pasta", "nudeln"],
        "zwiebeln": ["zwiebel"],
        "tomaten (dose)": ["gehackte tomaten", "tomaten 400", "dose"],
        "knoblauch": ["knoblauch"],
        "parmesan": ["parmesan", "parmigiano"],
        "kokosmilch": ["kokosmilch"],
        "paprika": ["paprika"],
        "reis": ["reis", "basmati"],
        "currypaste": ["currypaste", "curry"],
        "hähnchenbrust": ["hähnchenbrust", "hähnchen", "huhn"],
        "brokkoli": ["brokkoli"],
        "eier": ["eier"],
        "milch": ["milch", "vollmilch"],
        "käse": ["gouda", "käse", "emmentaler"],
        "tomaten": ["rispentomaten", "tomaten 500", "tomaten"],
        "gurke": ["gurke"],
        "feta": ["feta"],
        "olivenöl": ["olivenöl", "olivenoel"],
        "pesto": ["pesto"],
    ]

    static let wochentage = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
}
