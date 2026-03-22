import Foundation
import SwiftData

class CurriculumLoader {

    // MARK: - JSON Structures

    struct UnitJSON: Codable {
        let unitNumber: Int
        let language: String
        let title: String
        let pronunciationFocusSummary: String
        let pronunciationGuideIds: [String]
        let phrases: [PhraseJSON]
        let dialogues: [DialogueJSON]
        let culturalNotes: [CulturalNoteJSON]

        enum CodingKeys: String, CodingKey {
            case unitNumber = "unit_number"
            case language
            case title
            case pronunciationFocusSummary = "pronunciation_focus_summary"
            case pronunciationGuideIds = "pronunciation_guide_ids"
            case phrases
            case dialogues
            case culturalNotes = "cultural_notes"
        }
    }

    struct PhraseJSON: Codable {
        let id: String
        let text: String
        let translation: String
        let phoneticIpa: String
        let phoneticApprox: String
        let pronunciationNotes: String
        let difficultySounds: [String]
        let exampleSentence: String
        let tags: [String]
        let slowSpeechRate: Float
        let normalSpeechRate: Float

        enum CodingKeys: String, CodingKey {
            case id, text, translation
            case phoneticIpa = "phonetic_ipa"
            case phoneticApprox = "phonetic_approx"
            case pronunciationNotes = "pronunciation_notes"
            case difficultySounds = "difficulty_sounds"
            case exampleSentence = "example_sentence"
            case tags
            case slowSpeechRate = "slow_speech_rate"
            case normalSpeechRate = "normal_speech_rate"
        }
    }

    struct DialogueJSON: Codable {
        let id: String
        let context: String
        let exchanges: [ExchangeJSON]
        let notes: String
    }

    struct ExchangeJSON: Codable {
        let speaker: String
        let text: String
        let translation: String
        let phoneticApprox: String

        enum CodingKeys: String, CodingKey {
            case speaker, text, translation
            case phoneticApprox = "phonetic_approx"
        }
    }

    struct CulturalNoteJSON: Codable {
        let id: String
        let title: String
        let content: String
    }

    struct PronunciationGuideJSON: Codable {
        let soundId: String
        let language: String
        let ipaSymbol: String
        let displayName: String
        let description: String
        let howToProduce: [String]
        let commonMistakes: [String]
        let exampleWords: [PronunciationExampleJSON]
        let practicePairs: [MinimalPairJSON]
        let audioDemoRate: Float

        enum CodingKeys: String, CodingKey {
            case soundId = "sound_id"
            case language
            case ipaSymbol = "ipa_symbol"
            case displayName = "display_name"
            case description
            case howToProduce = "how_to_produce"
            case commonMistakes = "common_mistakes"
            case exampleWords = "example_words"
            case practicePairs = "practice_pairs"
            case audioDemoRate = "audio_demo_rate"
        }
    }

    struct PronunciationExampleJSON: Codable {
        let text: String
        let ipa: String
        let meaning: String
    }

    struct MinimalPairJSON: Codable {
        let word1: String
        let word2: String
        let explanation: String
    }

    // MARK: - Loading

    func loadAllCurriculum(into context: ModelContext) {
        loadUnits(for: .french, into: context)
        loadUnits(for: .italian, into: context)
        loadPronunciationGuides(for: .french, into: context)
        loadPronunciationGuides(for: .italian, into: context)
    }

    func loadUnits(for language: Language, into context: ModelContext) {
        let folder = language == .french ? "French" : "Italian"

        for i in 1...5 {
            let filename = String(format: "unit-%02d", i)
            guard let url = Bundle.main.url(forResource: filename, withExtension: "json", subdirectory: "Curriculum/\(folder)") else {
                print("Missing curriculum file: \(folder)/\(filename).json")
                continue
            }

            do {
                let data = try Data(contentsOf: url)
                let decoder = JSONDecoder()
                let unitJSON = try decoder.decode(UnitJSON.self, from: data)
                let unit = mapUnit(unitJSON)
                context.insert(unit)
            } catch {
                print("Error loading \(filename): \(error)")
            }
        }

        try? context.save()
    }

    func loadPronunciationGuides(for language: Language, into context: ModelContext) {
        let folder = language == .french ? "French" : "Italian"
        guard let url = Bundle.main.url(forResource: "pronunciation-guides", withExtension: "json", subdirectory: "Curriculum/\(folder)") else {
            print("Missing pronunciation guides for \(folder)")
            return
        }

        do {
            let data = try Data(contentsOf: url)
            let decoder = JSONDecoder()
            let guides = try decoder.decode([PronunciationGuideJSON].self, from: data)
            for guideJSON in guides {
                let guide = mapPronunciationGuide(guideJSON)
                context.insert(guide)
            }
            try? context.save()
        } catch {
            print("Error loading pronunciation guides: \(error)")
        }
    }

    // MARK: - Mapping

    private func mapUnit(_ json: UnitJSON) -> Unit {
        let language: Language = json.language == "french" ? .french : .italian

        let unit = Unit(
            language: language,
            number: json.unitNumber,
            title: json.title,
            pronunciationFocusSummary: json.pronunciationFocusSummary,
            pronunciationGuideIDs: json.pronunciationGuideIds
        )

        unit.phrases = json.phrases.map { p in
            Phrase(
                text: p.text,
                translation: p.translation,
                phoneticIPA: p.phoneticIpa,
                phoneticApprox: p.phoneticApprox,
                pronunciationNotes: p.pronunciationNotes,
                difficultySounds: p.difficultySounds,
                exampleSentence: p.exampleSentence,
                tags: p.tags,
                slowSpeechRate: p.slowSpeechRate,
                normalSpeechRate: p.normalSpeechRate
            )
        }

        unit.dialogues = json.dialogues.map { d in
            Dialogue(
                context: d.context,
                exchanges: d.exchanges.map { e in
                    Exchange(speaker: e.speaker, text: e.text, translation: e.translation, phoneticApprox: e.phoneticApprox)
                },
                notes: d.notes
            )
        }

        unit.culturalNotes = json.culturalNotes.map { cn in
            CulturalNote(title: cn.title, content: cn.content)
        }

        return unit
    }

    private func mapPronunciationGuide(_ json: PronunciationGuideJSON) -> PronunciationGuide {
        let language: Language = json.language == "french" ? .french : .italian

        return PronunciationGuide(
            soundID: json.soundId,
            language: language,
            ipaSymbol: json.ipaSymbol,
            displayName: json.displayName,
            descriptionText: json.description,
            howToProduce: json.howToProduce,
            commonMistakes: json.commonMistakes,
            exampleWords: json.exampleWords.map { PronunciationExample(text: $0.text, ipa: $0.ipa, meaning: $0.meaning) },
            practicePairs: json.practicePairs.map { MinimalPair(word1: $0.word1, word2: $0.word2, explanation: $0.explanation) },
            audioDemoRate: json.audioDemoRate
        )
    }
}
