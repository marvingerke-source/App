import SwiftUI

struct WochenplanView: View {
    @EnvironmentObject var app: AppState
    @State private var ausgewaehlterTag: String?

    private var geplant: Int { Beispieldaten.wochentage.filter { app.plan[$0] != nil }.count }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 12) {
                    ForEach(Beispieldaten.wochentage, id: \.self) { tag in
                        TagKarte(tag: tag, eintrag: app.plan[tag])
                            .onTapGesture { ausgewaehlterTag = tag }
                    }
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Wochenplan")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Text("\(geplant)/7 Tage").foregroundStyle(.secondary).font(.subheadline)
                }
            }
            .sheet(item: Binding(get: { ausgewaehlterTag.map { TagWrapper(tag: $0) } },
                                 set: { ausgewaehlterTag = $0?.tag })) { wrapper in
                RezeptAuswahlSheet(tag: wrapper.tag)
            }
        }
    }
}

private struct TagWrapper: Identifiable { let tag: String; var id: String { tag } }

private struct TagKarte: View {
    @EnvironmentObject var app: AppState
    let tag: String
    let eintrag: PlanEintrag?

    var body: some View {
        let rezept = eintrag.flatMap { app.rezept($0.rezeptId) }
        HStack(spacing: 14) {
            Text(tag)
                .font(.headline).foregroundStyle(Color.akzent)
                .frame(width: 46, height: 46)
                .background(Color.akzent.opacity(0.15), in: RoundedRectangle(cornerRadius: 14))
            VStack(alignment: .leading, spacing: 2) {
                if let rezept, let eintrag {
                    Label(rezept.name, systemImage: rezept.symbol)
                        .font(.body.weight(.semibold))
                    Text("\(eintrag.portionen) Portionen · \(rezept.dauerMin) min")
                        .font(.subheadline).foregroundStyle(.secondary)
                } else {
                    Text("Kein Gericht – tippen zum Planen")
                        .font(.body).foregroundStyle(.secondary)
                }
            }
            Spacer()
            Image(systemName: rezept == nil ? "plus" : "chevron.right")
                .foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 18))
    }
}

private struct RezeptAuswahlSheet: View {
    @EnvironmentObject var app: AppState
    @Environment(\.dismiss) var dismiss
    let tag: String

    var body: some View {
        NavigationStack {
            List {
                if app.plan[tag] != nil {
                    Button(role: .destructive) {
                        app.setze(tag: tag, rezeptId: nil); dismiss()
                    } label: { Text("Gericht entfernen") }
                }
                ForEach(app.rezepte) { r in
                    Button {
                        app.setze(tag: tag, rezeptId: r.id); dismiss()
                    } label: {
                        HStack {
                            Image(systemName: r.symbol).foregroundStyle(Color.akzent).frame(width: 28)
                            VStack(alignment: .leading) {
                                Text(r.name).foregroundStyle(.primary)
                                Text("\(r.portionen) Portionen · \(r.dauerMin) min · \(r.zutaten.count) Zutaten")
                                    .font(.caption).foregroundStyle(.secondary)
                            }
                            Spacer()
                            if app.plan[tag]?.rezeptId == r.id {
                                Image(systemName: "checkmark").foregroundStyle(Color.akzent)
                            }
                        }
                    }
                }
            }
            .navigationTitle("\(tag): Gericht wählen")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Fertig") { dismiss() }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}
