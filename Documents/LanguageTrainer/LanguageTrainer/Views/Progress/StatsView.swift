import SwiftUI
import SwiftData

struct StatsView: View {
    let language: Language
    @Query private var sessionLogs: [SessionLog]
    @Query private var phraseProgress: [PhraseProgress]

    private var languageSessions: [SessionLog] {
        sessionLogs.filter { $0.language == language }
    }

    private var languageProgress: [PhraseProgress] {
        phraseProgress.filter { $0.language == language }
    }

    var body: some View {
        List {
            Section("Overview") {
                statRow("Total Sessions", value: "\(languageSessions.count)")
                statRow("Phrases Studied", value: "\(languageProgress.filter { $0.totalAttempts > 0 }.count)")
                statRow("Avg Accuracy", value: formatPercent(averageAccuracy))
                statRow("Avg Pronunciation", value: formatPercent(averagePronunciation))
            }

            Section("Study Time") {
                statRow("Total Time", value: formatDuration(totalStudyTime))
            }

            Section("Mastery") {
                statRow("Mastered", value: "\(countByMastery(.mastered))")
                statRow("Familiar", value: "\(countByMastery(.familiar))")
                statRow("Learning", value: "\(countByMastery(.learning))")
                statRow("New", value: "\(countByMastery(.new))")
            }
        }
        .navigationTitle("Statistics")
    }

    private func statRow(_ label: String, value: String) -> some View {
        HStack {
            Text(label)
            Spacer()
            Text(value)
                .foregroundStyle(.secondary)
                .monospacedDigit()
        }
    }

    private var averageAccuracy: Double {
        let sessions = languageSessions
        guard !sessions.isEmpty else { return 0 }
        return sessions.map(\.overallAccuracy).reduce(0, +) / Double(sessions.count)
    }

    private var averagePronunciation: Double {
        let progress = languageProgress.filter { $0.totalAttempts > 0 }
        guard !progress.isEmpty else { return 0 }
        return progress.map(\.pronunciationAccuracy).reduce(0, +) / Double(progress.count)
    }

    private var totalStudyTime: TimeInterval {
        languageSessions.map(\.duration).reduce(0, +)
    }

    private func countByMastery(_ level: MasteryLevel) -> Int {
        languageProgress.filter { $0.masteryLevel == level }.count
    }

    private func formatPercent(_ value: Double) -> String {
        "\(Int(value * 100))%"
    }

    private func formatDuration(_ seconds: TimeInterval) -> String {
        let hours = Int(seconds) / 3600
        let minutes = (Int(seconds) % 3600) / 60
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        }
        return "\(minutes)m"
    }
}
