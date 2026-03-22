import SwiftUI

struct AudioPlayerButton: View {
    let text: String
    let language: Language
    let phrase: Phrase?
    var speed: SpeechSpeed = .slow
    @State private var synthesizer = SpeechSynthesizer()

    var body: some View {
        Button {
            synthesizer.speak(text, language: language, speed: speed, phrase: phrase)
        } label: {
            Image(systemName: synthesizer.isSpeaking ? "speaker.wave.3.fill" : "speaker.wave.2.fill")
                .contentTransition(.symbolEffect(.replace))
        }
    }
}

struct PhoneticText: View {
    let ipa: String
    let approx: String
    var showIPA: Bool = false

    var body: some View {
        VStack(spacing: 2) {
            Text(approx)
                .font(.subheadline)
                .foregroundStyle(.blue)
                .italic()
            if showIPA {
                Text("/\(ipa)/")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

struct PronunciationScoreView: View {
    let score: Double

    var color: Color {
        if score >= 0.85 { return .green }
        if score >= 0.60 { return .yellow }
        if score >= 0.40 { return .orange }
        return .red
    }

    var label: String {
        if score >= 0.85 { return "Excellent" }
        if score >= 0.60 { return "Good" }
        if score >= 0.40 { return "Keep trying" }
        return "Let's practice"
    }

    var body: some View {
        VStack(spacing: 4) {
            ZStack {
                Circle()
                    .stroke(.quaternary, lineWidth: 6)
                Circle()
                    .trim(from: 0, to: score)
                    .stroke(color, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                Text("\(Int(score * 100))%")
                    .font(.headline.monospacedDigit())
            }
            .frame(width: 60, height: 60)

            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}

struct ModeToggle: View {
    @Binding var mode: LearningMode

    var body: some View {
        Picker("Mode", selection: $mode) {
            Label("Phone", systemImage: "iphone")
                .tag(LearningMode.phone)
            Label("Drive", systemImage: "car.fill")
                .tag(LearningMode.drive)
        }
        .pickerStyle(.segmented)
    }
}
