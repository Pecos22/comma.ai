import Foundation
import SwiftData

@Model
class Phrase {
    @Attribute(.unique) var id: UUID
    var text: String
    var translation: String
    var phoneticIPA: String
    var phoneticApprox: String
    var pronunciationNotes: String
    var difficultySounds: [String]
    var exampleSentence: String
    var tags: [String]
    var slowSpeechRate: Float
    var normalSpeechRate: Float
    var unit: Unit?
    @Relationship(deleteRule: .cascade) var progress: PhraseProgress?

    init(
        id: UUID = UUID(),
        text: String,
        translation: String,
        phoneticIPA: String = "",
        phoneticApprox: String = "",
        pronunciationNotes: String = "",
        difficultySounds: [String] = [],
        exampleSentence: String = "",
        tags: [String] = [],
        slowSpeechRate: Float = 0.35,
        normalSpeechRate: Float = 0.5
    ) {
        self.id = id
        self.text = text
        self.translation = translation
        self.phoneticIPA = phoneticIPA
        self.phoneticApprox = phoneticApprox
        self.pronunciationNotes = pronunciationNotes
        self.difficultySounds = difficultySounds
        self.exampleSentence = exampleSentence
        self.tags = tags
        self.slowSpeechRate = slowSpeechRate
        self.normalSpeechRate = normalSpeechRate
    }
}
