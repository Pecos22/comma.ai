import Foundation
import SwiftData

@Model
class Unit {
    @Attribute(.unique) var id: UUID
    var language: Language
    var number: Int
    var title: String
    var pronunciationFocusSummary: String
    var pronunciationGuideIDs: [String]
    @Relationship(deleteRule: .cascade) var phrases: [Phrase]
    @Relationship(deleteRule: .cascade) var dialogues: [Dialogue]
    @Relationship(deleteRule: .cascade) var culturalNotes: [CulturalNote]

    init(
        id: UUID = UUID(),
        language: Language,
        number: Int,
        title: String,
        pronunciationFocusSummary: String,
        pronunciationGuideIDs: [String] = [],
        phrases: [Phrase] = [],
        dialogues: [Dialogue] = [],
        culturalNotes: [CulturalNote] = []
    ) {
        self.id = id
        self.language = language
        self.number = number
        self.title = title
        self.pronunciationFocusSummary = pronunciationFocusSummary
        self.pronunciationGuideIDs = pronunciationGuideIDs
        self.phrases = phrases
        self.dialogues = dialogues
        self.culturalNotes = culturalNotes
    }

    var progress: Double {
        guard !phrases.isEmpty else { return 0 }
        let reviewed = phrases.compactMap { $0.progress }.filter { $0.totalAttempts > 0 }
        return Double(reviewed.count) / Double(phrases.count)
    }
}
