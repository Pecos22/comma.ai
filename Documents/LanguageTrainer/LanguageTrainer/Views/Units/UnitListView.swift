import SwiftUI
import SwiftData

struct UnitListView: View {
    let language: Language
    @Query private var allUnits: [Unit]

    var units: [Unit] {
        allUnits
            .filter { $0.language == language }
            .sorted { $0.number < $1.number }
    }

    var body: some View {
        List {
            ForEach(units, id: \.id) { unit in
                NavigationLink(value: unit) {
                    UnitRow(unit: unit)
                }
            }
        }
        .navigationTitle("\(language.flag) \(language.displayName)")
        .navigationDestination(for: Unit.self) { unit in
            FlashcardView(unit: unit)
        }
        .overlay {
            if units.isEmpty {
                ContentUnavailableView(
                    "No Units Yet",
                    systemImage: "book.closed",
                    description: Text("Curriculum content is loading...")
                )
            }
        }
    }
}

#Preview {
    NavigationStack {
        UnitListView(language: .french)
    }
    .modelContainer(for: Unit.self, inMemory: true)
}
