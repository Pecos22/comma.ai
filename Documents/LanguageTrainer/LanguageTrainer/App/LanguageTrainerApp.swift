import SwiftUI
import SwiftData

@main
struct LanguageTrainerApp: App {
    @State private var appState = AppState.shared

    var sharedModelContainer: ModelContainer = {
        let schema = Schema([
            Unit.self,
            Phrase.self,
            Dialogue.self,
            CulturalNote.self,
            PronunciationGuide.self,
            PhraseProgress.self,
            SessionLog.self
        ])
        let config = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)
        do {
            return try ModelContainer(for: schema, configurations: [config])
        } catch {
            fatalError("Could not create ModelContainer: \(error)")
        }
    }()

    var body: some Scene {
        WindowGroup {
            HomeView()
                .environment(appState)
                .onAppear {
                    loadCurriculumIfNeeded()
                }
        }
        .modelContainer(sharedModelContainer)
    }

    private func loadCurriculumIfNeeded() {
        guard !appState.curriculumLoaded else { return }
        let context = sharedModelContainer.mainContext
        let descriptor = FetchDescriptor<Unit>()
        let existingCount = (try? context.fetchCount(descriptor)) ?? 0

        if existingCount == 0 {
            let loader = CurriculumLoader()
            loader.loadAllCurriculum(into: context)
        }
        appState.curriculumLoaded = true
    }
}
