import Foundation
import SwiftData

@Observable
class SessionManager {
    var currentLanguage: Language = .french
    var currentMode: LearningMode = .phone
    var isSessionActive: Bool = false
    var sessionStartTime: Date?
    var phrasesReviewedCount: Int = 0
    var correctCount: Int = 0
    var pronunciationScoreSum: Double = 0

    func startSession(language: Language, mode: LearningMode) {
        currentLanguage = language
        currentMode = mode
        isSessionActive = true
        sessionStartTime = Date()
        phrasesReviewedCount = 0
        correctCount = 0
        pronunciationScoreSum = 0
    }

    func recordAttempt(correct: Bool, pronunciationScore: Double) {
        phrasesReviewedCount += 1
        if correct { correctCount += 1 }
        pronunciationScoreSum += pronunciationScore
    }

    func endSession(context: ModelContext) -> SessionLog? {
        guard isSessionActive, let startTime = sessionStartTime else { return nil }

        let duration = Date().timeIntervalSince(startTime)
        let overallAccuracy = phrasesReviewedCount > 0 ? Double(correctCount) / Double(phrasesReviewedCount) : 0
        let avgPronunciation = phrasesReviewedCount > 0 ? pronunciationScoreSum / Double(phrasesReviewedCount) : 0

        let log = SessionLog(
            language: currentLanguage,
            mode: currentMode,
            startedAt: startTime,
            duration: duration,
            phrasesReviewed: phrasesReviewedCount,
            overallAccuracy: overallAccuracy,
            pronunciationAccuracy: avgPronunciation
        )

        context.insert(log)
        try? context.save()

        isSessionActive = false
        sessionStartTime = nil

        return log
    }
}
