import Foundation
import SwiftData

class SpacedRepetitionEngine {

    /// Update phrase progress using SM-2 algorithm with pronunciation weighting
    func updateProgress(_ progress: PhraseProgress, quality: Int, pronunciationScore: Double) {
        progress.totalAttempts += 1
        if quality >= 3 { progress.correctAttempts += 1 }

        // Update pronunciation rolling average
        progress.pronunciationAccuracy = (progress.pronunciationAccuracy * 0.7) + (pronunciationScore * 0.3)

        // SM-2 core algorithm
        if quality >= 3 {
            if progress.interval == 0 {
                progress.interval = 1
            } else if progress.interval == 1 {
                progress.interval = 6
            } else {
                progress.interval = Int(Double(progress.interval) * progress.easeFactor)
            }
        } else {
            progress.interval = 0
        }

        progress.easeFactor = max(1.3,
            progress.easeFactor + (0.1 - Double(5 - quality) * (0.08 + Double(5 - quality) * 0.02)))

        // Pronunciation penalty: right meaning but bad pronunciation → review sooner
        if quality >= 3 && pronunciationScore < 0.6 {
            progress.interval = max(1, progress.interval / 2)
        }

        progress.nextReview = Calendar.current.date(byAdding: .day, value: progress.interval, to: Date()) ?? Date()
        progress.lastReviewed = Date()
    }

    /// Get phrases due for review, sorted by priority
    func phrasesForReview(from phrases: [Phrase], limit: Int = 20) -> [Phrase] {
        let now = Date()
        let due = phrases.filter { phrase in
            guard let progress = phrase.progress else { return true }
            return progress.nextReview <= now
        }

        let sorted = due.sorted { a, b in
            let progressA = a.progress
            let progressB = b.progress

            // New phrases first
            if progressA == nil && progressB != nil { return true }
            if progressA != nil && progressB == nil { return false }

            guard let pA = progressA, let pB = progressB else { return false }

            // Lower pronunciation accuracy = higher priority
            if abs(pA.pronunciationAccuracy - pB.pronunciationAccuracy) > 0.1 {
                return pA.pronunciationAccuracy < pB.pronunciationAccuracy
            }

            // Earlier review date = higher priority
            return pA.nextReview < pB.nextReview
        }

        return Array(sorted.prefix(limit))
    }
}
