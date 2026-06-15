import SwiftUI

struct ListeView: View {
    @EnvironmentObject var app: AppState

    var body: some View {
        NavigationStack {
            Group {
                let bedarf = app.gesamterBedarf
                if bedarf.isEmpty {
                    ContentUnavailableView("Noch keine Gerichte geplant",
                                           systemImage: "basket",
                                           description: Text("Lege im Wochenplan los."))
                } else {
                    List {
                        Section {
                            ForEach(bedarf) { b in
                                BedarfZeile(bedarf: b, abgehakt: app.vorratAbgehakt.contains(b.id))
                                    .contentShape(Rectangle())
                                    .onTapGesture { app.toggleVorrat(b.id) }
                            }
                        } header: {
                            Text("Automatisch aus dem Plan erzeugt")
                        } footer: {
                            Text("Tippe eine Position an, um Vorräte abzuhaken – sie fallen dann aus dem Vergleich.")
                        }
                    }
                }
            }
            .navigationTitle("Einkaufsliste")
        }
    }
}

private struct BedarfZeile: View {
    let bedarf: Bedarf
    let abgehakt: Bool

    private var mengeText: String {
        let m = bedarf.menge.rounded() == bedarf.menge
            ? String(Int(bedarf.menge))
            : String(format: "%.1f", bedarf.menge)
        return "\(m) \(bedarf.einheit)"
    }

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: abgehakt ? "checkmark.circle.fill" : "circle")
                .font(.title2)
                .foregroundStyle(abgehakt ? Color.akzent : Color(.tertiaryLabel))
            VStack(alignment: .leading, spacing: 2) {
                Text(bedarf.name)
                    .strikethrough(abgehakt)
                    .foregroundStyle(abgehakt ? .secondary : .primary)
                Text("\(mengeText) · für \(bedarf.ausRezepten.joined(separator: ", "))")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
    }
}
