import Foundation
import SwiftData

@Model
class PhraseProgress {
    @Attribute(.unique) var id: UUID
    var phrase: Phrase?
    var language: Language
    var easeFactor: Double = 2.5
    var interval: Int = 0
    var nextReview: Date = Date()
    var totalAttempts: Int = 0
    var correctAttempts: Int = 0
    var pronunciationAccuracy: Double = 0.0
    var lastReviewed: Date?

    init(
        id: UUID = UUID(),
        phrase: Phrase? = nil,
        language: Language
    ) {
        self.id = id
        self.phrase = phrase
        self.language = language
    }

    var masteryLevel: MasteryLevel {
        guard totalAttempts > 0 else { return .new }
        let accuracy = Double(correctAttempts) / Double(totalAttempts)
        if accuracy >= 0.9 && pronunciationAccuracy >= 0.8 { return .mastered }
        if accuracy >= 0.7 { return .familiar }
        return .learning
    }
}

enum MasteryLevel: String {
    case new = "New"
    case learning = "Learning"
    case familiar = "Familiar"
    case mastered = "Mastered"

    var color: String {
        switch self {
        case .new: return "gray"
        case .learning: return "orange"
        case .familiar: return "blue"
        case .mastered: return "green"
        }
    }
}
