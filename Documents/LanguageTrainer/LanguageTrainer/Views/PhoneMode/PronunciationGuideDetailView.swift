import SwiftUI

struct PronunciationGuideDetailView: View {
    let guide: PronunciationGuide
    @State private var speechSynthesizer = SpeechSynthesizer()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Header
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text(guide.ipaSymbol)
                            .font(.system(size: 48, weight: .light, design: .serif))
                            .foregroundStyle(.blue)
                        Spacer()
                    }
                    Text(guide.displayName)
                        .font(.title.bold())
                    Text(guide.descriptionText)
                        .font(.body)
                        .foregroundStyle(.secondary)
                }

                // How to produce
                VStack(alignment: .leading, spacing: 12) {
                    Label("How to Make This Sound", systemImage: "mouth.fill")
                        .font(.headline)

                    ForEach(Array(guide.howToProduce.enumerated()), id: \.offset) { index, step in
                        HStack(alignment: .top, spacing: 12) {
                            Text("\(index + 1)")
                                .font(.caption.bold())
                                .frame(width: 24, height: 24)
                                .background(Circle().fill(.blue.opacity(0.15)))
                                .foregroundStyle(.blue)

                            Text(step)
                                .font(.body)
                        }
                    }
                }

                // Common mistakes
                if !guide.commonMistakes.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Label("Common Mistakes", systemImage: "exclamationmark.triangle")
                            .font(.headline)
                            .foregroundStyle(.orange)

                        ForEach(guide.commonMistakes, id: \.self) { mistake in
                            HStack(alignment: .top, spacing: 8) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundStyle(.red.opacity(0.7))
                                    .font(.caption)
                                    .padding(.top, 3)
                                Text(mistake)
                                    .font(.body)
                            }
                        }
                    }
                }

                // Example words
                if !guide.exampleWords.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Label("Example Words", systemImage: "text.book.closed")
                            .font(.headline)

                        ForEach(guide.exampleWords, id: \.text) { example in
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(example.text)
                                        .font(.title3.bold())
                                    HStack(spacing: 8) {
                                        Text("/\(example.ipa)/")
                                            .font(.subheadline)
                                            .foregroundStyle(.blue)
                                        Text(example.meaning)
                                            .font(.subheadline)
                                            .foregroundStyle(.secondary)
                                    }
                                }

                                Spacer()

                                Button {
                                    speechSynthesizer.speak(
                                        example.text,
                                        language: guide.language,
                                        speed: .slow
                                    )
                                } label: {
                                    Image(systemName: "speaker.wave.2.fill")
                                        .font(.body)
                                }
                                .buttonStyle(.bordered)
                                .clipShape(Circle())
                            }
                            .padding(.vertical, 4)
                        }
                    }
                }

                // Minimal pairs
                if !guide.practicePairs.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Label("Minimal Pairs", systemImage: "arrow.left.arrow.right")
                            .font(.headline)

                        ForEach(guide.practicePairs, id: \.word1) { pair in
                            VStack(alignment: .leading, spacing: 8) {
                                HStack(spacing: 16) {
                                    pairButton(pair.word1)
                                    Text("vs")
                                        .foregroundStyle(.tertiary)
                                    pairButton(pair.word2)
                                }
                                Text(pair.explanation)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            .padding()
                            .background(RoundedRectangle(cornerRadius: 12).fill(.ultraThinMaterial))
                        }
                    }
                }
            }
            .padding()
        }
        .navigationTitle(guide.displayName)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func pairButton(_ word: String) -> some View {
        Button {
            speechSynthesizer.speak(word, language: guide.language, speed: .slow)
        } label: {
            HStack(spacing: 4) {
                Text(word)
                    .font(.title3.bold())
                Image(systemName: "speaker.wave.1.fill")
                    .font(.caption)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Capsule().fill(.blue.opacity(0.1)))
        }
        .buttonStyle(.plain)
    }
}
