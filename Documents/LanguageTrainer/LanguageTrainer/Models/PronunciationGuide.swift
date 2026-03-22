import Foundation
import SwiftData

struct PronunciationExample: Codable, Hashable {
    var text: String
    var ipa: String
    var meaning: String
}

struct MinimalPair: Codable, Hashable {
    var word1: String
    var word2: String
    var explanation: String
}

@Model
class PronunciationGuide {
    @Attribute(.unique) var soundID: String
    var language: Language
    var ipaSymbol: String
    var displayName: String
    var descriptionText: String
    var howToProduce: [String]
    var commonMistakes: [String]
    var exampleWords: [PronunciationExample]
    var practicePairs: [MinimalPair]
    var audioDemoRate: Float

    init(
        soundID: String,
        language: Language,
        ipaSymbol: String,
        displayName: String,
        descriptionText: String,
        howToProduce: [String] = [],
        commonMistakes: [String] = [],
        exampleWords: [PronunciationExample] = [],
        practicePairs: [MinimalPair] = [],
        audioDemoRate: Float = 0.3
    ) {
        self.soundID = soundID
        self.language = language
        self.ipaSymbol = ipaSymbol
        self.displayName = displayName
        self.descriptionText = descriptionText
        self.howToProduce = howToProduce
        self.commonMistakes = commonMistakes
        self.exampleWords = exampleWords
        self.practicePairs = practicePairs
        self.audioDemoRate = audioDemoRate
    }
}
