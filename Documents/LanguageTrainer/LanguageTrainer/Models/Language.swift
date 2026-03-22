import Foundation

enum Language: String, Codable, CaseIterable, Identifiable {
    case french, italian

    var id: String { rawValue }

    var voiceIdentifier: String {
        switch self {
        case .french: return "fr-FR"
        case .italian: return "it-IT"
        }
    }

    var displayName: String {
        switch self {
        case .french: return "French"
        case .italian: return "Italian"
        }
    }

    var flag: String {
        switch self {
        case .french: return "🇫🇷"
        case .italian: return "🇮🇹"
        }
    }
}

enum LearningMode: String, Codable {
    case phone, drive
}

enum SpeechSpeed {
    case slow, normal
}
