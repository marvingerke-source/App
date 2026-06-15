import Foundation

// Bausteine A (Zusammenführung), C (Matching) und D (Optimierung) aus dem Konzept.
enum Einkaufsplaner {

    // --- Baustein A: gleiche Zutaten über die Woche zusammenführen -----------
    static func bedarf(ausPlan plan: [String: PlanEintrag], rezepte: [Rezept]) -> [Bedarf] {
        var map: [String: Bedarf] = [:]
        for eintrag in plan.values {
            guard let rezept = rezepte.first(where: { $0.id == eintrag.rezeptId }) else { continue }
            let faktor = Double(eintrag.portionen) / Double(rezept.portionen)
            for z in rezept.zutaten {
                let key = "\(z.name.lowercased())|\(z.einheit)"
                let menge = (z.menge * faktor)
                if var vorhanden = map[key] {
                    vorhanden.menge += menge
                    if !vorhanden.ausRezepten.contains(rezept.name) {
                        vorhanden.ausRezepten.append(rezept.name)
                    }
                    map[key] = vorhanden
                } else {
                    map[key] = Bedarf(name: z.name, menge: menge, einheit: z.einheit,
                                      kategorie: z.kategorie, ausRezepten: [rezept.name])
                }
            }
        }
        return Array(map.values).sorted { $0.name < $1.name }
    }

    // --- Baustein C: unscharfes Matching (Platzhalter für KI) ----------------
    static func passendeAngebote(zu bedarf: Bedarf, angebote: [Angebot]) -> [Angebot] {
        let stichworte = Beispieldaten.matchStichworte[bedarf.name.lowercased()] ?? [bedarf.name.lowercased()]
        return angebote.filter { a in
            guard a.kategorie == bedarf.kategorie else { return false }
            let p = a.produktname.lowercased()
            return stichworte.contains { p.contains($0) }
        }
    }

    // --- Baustein D: Optimierung über Läden ----------------------------------
    static func plan(bedarf: [Bedarf], vorgaben: Vorgaben,
                     angebote: [Angebot], maerkte: [Markt]) -> Einkaufsplan {

        let positionen = bedarf.map { (b: $0, kandidaten: passendeAngebote(zu: $0, angebote: angebote)) }

        // Beste Zuordnung für eine erlaubte Laden-Teilmenge.
        func bewerte(_ erlaubt: Set<String>) -> (positionen: [PlanPosition], summe: Double, ersparnis: Double, laeden: Set<String>, treffer: Int) {
            var ergebnis: [PlanPosition] = []
            var summe = 0.0, ersparnis = 0.0
            var laeden = Set<String>()
            var treffer = 0
            for pos in positionen {
                let kand = pos.kandidaten.filter { erlaubt.contains($0.marktId) }
                guard !kand.isEmpty else {
                    ergebnis.append(PlanPosition(bedarf: pos.b, angebot: nil)); continue
                }
                var auswahl = kand
                var bioErsatz = false
                if vorgaben.bioGewuenscht {
                    let bio = kand.filter { $0.istBio }
                    if !bio.isEmpty { auswahl = bio } else { bioErsatz = true }
                }
                let best = auswahl.min { $0.preis < $1.preis }!
                summe += best.preis
                ersparnis += best.ersparnis
                laeden.insert(best.marktId)
                treffer += 1
                ergebnis.append(PlanPosition(bedarf: pos.b, angebot: best, bioErsatz: bioErsatz))
            }
            return (ergebnis, summe, ersparnis, laeden, treffer)
        }

        let alle = maerkte.map { $0.id }

        func beste(maxK: Int) -> (positionen: [PlanPosition], summe: Double, ersparnis: Double, laeden: Set<String>, treffer: Int)? {
            var beste: (positionen: [PlanPosition], summe: Double, ersparnis: Double, laeden: Set<String>, treffer: Int)?
            for sub in teilmengen(alle, maxGroesse: max(1, maxK)) {
                let e = bewerte(Set(sub))
                if beste == nil || e.treffer > beste!.treffer ||
                   (e.treffer == beste!.treffer && e.summe < beste!.summe) {
                    beste = e
                }
            }
            return beste
        }

        guard let gewinner = beste(maxK: vorgaben.maxLaeden) else {
            return Einkaufsplan(gruppen: [], ohneAngebot: bedarf, summe: 0, ersparnis: 0,
                                anzahlLaeden: 0, hinweis: nil, ueberBudget: false)
        }

        // Lohnt sich der letzte Laden?
        var hinweis: String?
        if gewinner.laeden.count >= 2,
           let weniger = beste(maxK: gewinner.laeden.count - 1),
           weniger.treffer == gewinner.treffer {
            let mehr = weniger.summe - gewinner.summe
            if mehr < 2.0 {
                hinweis = "Der zusätzliche Laden bringt nur \(EuroFormat.string(mehr)) Ersparnis – vielleicht nicht die extra Fahrt wert."
            }
        }

        // Gruppieren.
        let proMarkt = Dictionary(grouping: gewinner.positionen.filter { $0.angebot != nil }) {
            $0.angebot!.marktId
        }
        let gruppen = proMarkt.compactMap { (marktId, positionen) -> MarktGruppe? in
            guard let markt = maerkte.first(where: { $0.id == marktId }) else { return nil }
            return MarktGruppe(markt: markt, positionen: positionen)
        }.sorted { $0.markt.entfernungKm < $1.markt.entfernungKm }

        let ohneAngebot = gewinner.positionen.filter { $0.angebot == nil }.map { $0.bedarf }

        return Einkaufsplan(
            gruppen: gruppen, ohneAngebot: ohneAngebot,
            summe: gewinner.summe, ersparnis: gewinner.ersparnis,
            anzahlLaeden: gewinner.laeden.count, hinweis: hinweis,
            ueberBudget: gewinner.summe > vorgaben.budget
        )
    }

    private static func teilmengen(_ arr: [String], maxGroesse: Int) -> [[String]] {
        var res: [[String]] = []
        let n = arr.count
        for mask in 1..<(1 << n) {
            var sub: [String] = []
            for i in 0..<n where mask & (1 << i) != 0 { sub.append(arr[i]) }
            if sub.count <= maxGroesse { res.append(sub) }
        }
        return res
    }
}

enum EuroFormat {
    static func string(_ value: Double) -> String {
        let f = NumberFormatter()
        f.numberStyle = .currency
        f.locale = Locale(identifier: "de_DE")
        return f.string(from: NSNumber(value: value)) ?? "\(value) €"
    }
}
