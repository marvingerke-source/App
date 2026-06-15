import SwiftUI

struct EinkaufenView: View {
    @EnvironmentObject var app: AppState

    var body: some View {
        NavigationStack {
            Group {
                if app.offenerBedarf.isEmpty {
                    ContentUnavailableView("Nichts einzukaufen",
                                           systemImage: "checkmark.circle",
                                           description: Text("Plane Gerichte und berechne das beste Paket."))
                } else {
                    let plan = app.einkaufsplan
                    let alle = plan.gruppen.flatMap { $0.positionen }.compactMap { $0.angebot?.id }
                    let erledigt = alle.filter { app.einkaufAbgehakt.contains($0) }.count
                    ScrollView {
                        VStack(spacing: 16) {
                            ProgressView(value: Double(erledigt), total: Double(max(alle.count, 1))) {
                                Text("\(erledigt) von \(alle.count) erledigt").font(.subheadline)
                            }
                            .tint(.akzent)

                            ForEach(plan.gruppen) { g in
                                MarktAbhakKarte(gruppe: g)
                            }

                            if erledigt == alle.count {
                                Label("Alles erledigt!", systemImage: "party.popper")
                                    .font(.headline).foregroundStyle(Color.akzent)
                                    .padding()
                            }
                        }
                        .padding()
                    }
                    .background(Color(.systemGroupedBackground))
                }
            }
            .navigationTitle("Einkaufen")
        }
    }
}

private struct MarktAbhakKarte: View {
    @EnvironmentObject var app: AppState
    let gruppe: MarktGruppe

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(gruppe.markt.name).font(.title3.weight(.bold))
                Spacer()
                Text(EuroFormat.string(gruppe.summe)).font(.headline)
            }
            Text(String(format: "%.1f km", gruppe.markt.entfernungKm))
                .font(.caption).foregroundStyle(.secondary)
            ForEach(gruppe.positionen) { pos in
                if let a = pos.angebot {
                    let on = app.einkaufAbgehakt.contains(a.id)
                    HStack(spacing: 12) {
                        Image(systemName: on ? "checkmark.circle.fill" : "circle")
                            .font(.title2)
                            .foregroundStyle(on ? Color.akzent : Color(.tertiaryLabel))
                        VStack(alignment: .leading, spacing: 2) {
                            Text(pos.bedarf.name).strikethrough(on)
                                .foregroundStyle(on ? .secondary : .primary)
                            Text(a.produktname).font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text(EuroFormat.string(a.preis)).font(.body.weight(.semibold))
                    }
                    .contentShape(Rectangle())
                    .onTapGesture { app.toggleEinkauf(a.id) }
                    .padding(.vertical, 4)
                    Divider()
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 18))
    }
}
