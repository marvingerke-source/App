import SwiftUI

struct ErgebnisView: View {
    @EnvironmentObject var app: AppState

    var body: some View {
        NavigationStack {
            Group {
                if app.offenerBedarf.isEmpty {
                    ContentUnavailableView("Noch kein Paket",
                                           systemImage: "cart",
                                           description: Text("Plane erst Gerichte, dann zeige ich dir das beste Angebots-Paket."))
                } else {
                    let plan = app.einkaufsplan
                    ScrollView {
                        VStack(spacing: 16) {
                            HeroKarte(plan: plan, budget: app.vorgaben.budget)
                            if let hinweis = plan.hinweis {
                                HinweisKarte(text: hinweis)
                            }
                            ForEach(plan.gruppen) { g in
                                MarktKarte(gruppe: g)
                            }
                            if !plan.ohneAngebot.isEmpty {
                                OhneAngebotKarte(positionen: plan.ohneAngebot)
                            }
                        }
                        .padding()
                    }
                    .background(Color(.systemGroupedBackground))
                }
            }
            .navigationTitle("Bestes Paket")
        }
    }
}

private struct HeroKarte: View {
    let plan: Einkaufsplan
    let budget: Double

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(EuroFormat.string(plan.summe))
                .font(.system(size: 40, weight: .bold))
            Text("Du sparst \(EuroFormat.string(plan.ersparnis)) gegenüber Normalpreis")
                .font(.headline).opacity(0.95)
            Text("\(plan.anzahlLaeden) \(plan.anzahlLaeden == 1 ? "Laden" : "Läden") · "
                 + (plan.ueberBudget ? "über Budget (\(EuroFormat.string(budget)))" : "im Budget"))
                .font(.subheadline).opacity(0.85).padding(.top, 6)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(22)
        .foregroundStyle(.white)
        .background(
            LinearGradient(colors: [.akzent, Color(red: 0.17, green: 0.55, blue: 0.27)],
                           startPoint: .topLeading, endPoint: .bottomTrailing),
            in: RoundedRectangle(cornerRadius: 22)
        )
    }
}

private struct HinweisKarte: View {
    let text: String
    var body: some View {
        Label(text, systemImage: "lightbulb")
            .font(.subheadline)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            .background(Color.akzent.opacity(0.15), in: RoundedRectangle(cornerRadius: 16))
    }
}

private struct MarktKarte: View {
    let gruppe: MarktGruppe
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(gruppe.markt.name).font(.title3.weight(.bold))
                Spacer()
                Text(EuroFormat.string(gruppe.summe)).font(.headline)
            }
            Text(String(format: "%.1f km entfernt · %d Artikel", gruppe.markt.entfernungKm, gruppe.positionen.count))
                .font(.caption).foregroundStyle(.secondary)
            ForEach(gruppe.positionen) { pos in
                if let a = pos.angebot {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            HStack(spacing: 6) {
                                Text(pos.bedarf.name)
                                if a.istBio { TagAnsicht(text: "BIO", aktiv: true) }
                                if pos.bioErsatz { TagAnsicht(text: "kein Bio", aktiv: false) }
                            }
                            Text(a.produktname).font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(EuroFormat.string(a.preis)).font(.body.weight(.semibold))
                            if a.ersparnis > 0 {
                                Text("−\(EuroFormat.string(a.ersparnis))")
                                    .font(.caption).foregroundStyle(Color.akzent)
                            }
                        }
                    }
                    .padding(.vertical, 4)
                    Divider()
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 18))
    }
}

private struct OhneAngebotKarte: View {
    let positionen: [Bedarf]
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Kein Angebot – regulär kaufen")
                .font(.caption.weight(.semibold)).foregroundStyle(.secondary)
            ForEach(positionen) { b in
                VStack(alignment: .leading, spacing: 2) {
                    Text(b.name)
                    Text("diese Woche kein Prospekt-Treffer")
                        .font(.caption).foregroundStyle(.secondary)
                }
                .padding(.vertical, 2)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 18))
    }
}

private struct TagAnsicht: View {
    let text: String
    let aktiv: Bool
    var body: some View {
        Text(text)
            .font(.caption2.weight(.bold))
            .padding(.horizontal, 8).padding(.vertical, 2)
            .background((aktiv ? Color.akzent.opacity(0.15) : Color(.systemGray5)),
                        in: RoundedRectangle(cornerRadius: 8))
            .foregroundStyle(aktiv ? Color.akzent : .secondary)
    }
}
