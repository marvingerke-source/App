import SwiftUI

struct VorgabenView: View {
    @EnvironmentObject var app: AppState

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("Wochenbudget").font(.body.weight(.semibold))
                            Spacer()
                            Text(EuroFormat.string(app.vorgaben.budget))
                                .font(.body.weight(.bold)).foregroundStyle(Color.akzent)
                        }
                        Slider(value: $app.vorgaben.budget, in: 10...100, step: 5)
                    }
                    Toggle(isOn: $app.vorgaben.bioGewuenscht) {
                        VStack(alignment: .leading) {
                            Text("Bio bevorzugen")
                            Text("Wählt Bio-Angebote, wo verfügbar")
                                .font(.caption).foregroundStyle(.secondary)
                        }
                    }
                }

                Section("Wie viele Läden willst du anfahren?") {
                    Stepper(value: $app.vorgaben.maxLaeden, in: 1...4) {
                        VStack(alignment: .leading) {
                            Text("Maximal \(app.vorgaben.maxLaeden) \(app.vorgaben.maxLaeden == 1 ? "Laden" : "Läden")")
                            Text("Mehr Läden = mehr Sparpotenzial, mehr Fahrten")
                                .font(.caption).foregroundStyle(.secondary)
                        }
                    }
                }

                Section {
                    Text("Die App wägt automatisch ab, ob sich ein zusätzlicher Laden für eine kleine Ersparnis überhaupt lohnt.")
                        .font(.footnote).foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Vorgaben")
        }
    }
}
