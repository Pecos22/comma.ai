import Foundation
import SwiftData

@Model
class SessionLog {
    @Attribute(.unique) var id: UUID
    var language: Language
    var mode: LearningMode
    var startedAt: Date
    var duration: TimeInterval
    var phrasesReviewed: Int
    var overallAccuracy: Double
    var pronunciationAccuracy: Double

    init(
        id: UUID = UUID(),
        language: Language,
        mode: LearningMode,
        startedAt: Date = Date(),
        duration: TimeInterval = 0,
        phrasesReviewed: Int = 0,
        overallAccuracy: Double = 0,
        pronunciationAccuracy: Double = 0
    ) {
        self.id = id
        self.language = language
        self.mode = mode
        self.startedAt = startedAt
        self.duration = duration
        self.phrasesReviewed = phrasesReviewed
        self.overallAccuracy = overallAccuracy
        self.pronunciationAccuracy = pronunciationAccuracy
    }
}
