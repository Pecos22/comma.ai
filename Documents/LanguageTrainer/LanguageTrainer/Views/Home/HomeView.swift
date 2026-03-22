import SwiftUI
import SwiftData

struct HomeView: View {
    @Query private var sessionLogs: [SessionLog]
    @State private var selectedLanguage: Language?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    headerSection

                    ForEach(Language.allCases) { language in
                        NavigationLink(value: language) {
                            LanguageCard(language: language, sessionsCount: sessionsCount(for: language))
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding()
            }
            .navigationTitle("Language Trainer")
            .navigationDestination(for: Language.self) { language in
                UnitListView(language: language)
            }
        }
    }

    private var headerSection: some View {
        VStack(spacing: 8) {
            Text("What would you like to learn today?")
                .font(.headline)
                .foregroundStyle(.secondary)
        }
    }

    private func sessionsCount(for language: Language) -> Int {
        sessionLogs.filter { $0.language == language }.count
    }
}

#Preview {
    HomeView()
        .modelContainer(for: [Unit.self, SessionLog.self], inMemory: true)
}
