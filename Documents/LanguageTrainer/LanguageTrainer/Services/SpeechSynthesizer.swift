import AVFoundation

@Observable
class SpeechSynthesizer {
    private let synthesizer = AVSpeechSynthesizer()
    var isSpeaking: Bool = false

    func speak(_ text: String, language: Language, speed: SpeechSpeed, phrase: Phrase? = nil) {
        stop()

        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = enhancedVoice(for: language) ?? AVSpeechSynthesisVoice(language: language.voiceIdentifier)

        if let phrase = phrase {
            utterance.rate = speed == .slow ? phrase.slowSpeechRate : phrase.normalSpeechRate
        } else {
            utterance.rate = speed == .slow ? 0.35 : 0.5
        }

        utterance.pitchMultiplier = 1.0
        utterance.preUtteranceDelay = 0.1
        utterance.postUtteranceDelay = speed == .slow ? 0.5 : 0.2

        isSpeaking = true
        synthesizer.speak(utterance)
    }

    func stop() {
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }
        isSpeaking = false
    }

    private func enhancedVoice(for language: Language) -> AVSpeechSynthesisVoice? {
        let voices = AVSpeechSynthesisVoice.speechVoices()
        let languageCode = language.voiceIdentifier

        // Prefer enhanced quality voices
        let enhanced = voices.first { voice in
            voice.language == languageCode && voice.quality == .enhanced
        }
        return enhanced
    }
}
