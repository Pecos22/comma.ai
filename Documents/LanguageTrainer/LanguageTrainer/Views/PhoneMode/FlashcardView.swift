import SwiftUI
import SwiftData

struct FlashcardView: View {
    let unit: Unit
    @Environment(\.modelContext) private var modelContext
    @State private var currentIndex: Int = 0
    @State private var isFlipped: Bool = false
    @State private var showPronunciationNotes: Bool = false
    @State private var speechSynthesizer = SpeechSynthesizer()
    @State private var dragOffset: CGSize = .zero

    private var phrases: [Phrase] {
        unit.phrases
    }

    private var currentPhrase: Phrase? {
        guard currentIndex >= 0, currentIndex < phrases.count else { return nil }
        return phrases[currentIndex]
    }

    var body: some View {
        VStack(spacing: 20) {
            // Progress indicator
            HStack {
                Text("Unit \(unit.number): \(unit.title)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Spacer()
                Text("\(currentIndex + 1) / \(phrases.count)")
                    .font(.subheadline.monospacedDigit())
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal)

            // Progress bar
            GeometryReader { geo in
                Capsule()
                    .fill(.quaternary)
                    .frame(height: 4)
                    .overlay(alignment: .leading) {
                        Capsule()
                            .fill(.blue)
                            .frame(width: geo.size.width * CGFloat(currentIndex + 1) / CGFloat(max(phrases.count, 1)), height: 4)
                    }
            }
            .frame(height: 4)
            .padding(.horizontal)

            Spacer()

            // Flashcard
            if let phrase = currentPhrase {
                flashcard(for: phrase)
                    .offset(x: dragOffset.width)
                    .rotationEffect(.degrees(Double(dragOffset.width) / 20))
                    .gesture(swipeGesture)
                    .animation(.interactiveSpring, value: dragOffset)
            }

            Spacer()

            // Controls
            if let phrase = currentPhrase {
                controlButtons(for: phrase)
            }
        }
        .navigationTitle("Flashcards")
        .navigationBarTitleDisplayMode(.inline)
    }

    @ViewBuilder
    private func flashcard(for phrase: Phrase) -> some View {
        VStack(spacing: 16) {
            if !isFlipped {
                // Front: target language
                VStack(spacing: 12) {
                    Text(phrase.text)
                        .font(.title.bold())
                        .multilineTextAlignment(.center)

                    Text(phrase.phoneticApprox)
                        .font(.title3)
                        .foregroundStyle(.blue)
                        .italic()

                    Text("Tap to reveal translation")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
            } else {
                // Back: translation + pronunciation
                VStack(spacing: 12) {
                    Text(phrase.text)
                        .font(.title2)
                        .foregroundStyle(.secondary)

                    Text(phrase.translation)
                        .font(.title.bold())
                        .multilineTextAlignment(.center)

                    Divider()

                    Text(phrase.phoneticApprox)
                        .font(.body)
                        .foregroundStyle(.blue)

                    if showPronunciationNotes {
                        Text(phrase.pronunciationNotes)
                            .font(.callout)
                            .foregroundStyle(.secondary)
                            .padding(.horizontal)
                            .transition(.move(edge: .top).combined(with: .opacity))
                    }

                    Button(showPronunciationNotes ? "Hide tips" : "How to say it") {
                        withAnimation {
                            showPronunciationNotes.toggle()
                        }
                    }
                    .font(.caption)
                    .buttonStyle(.bordered)
                }
            }
        }
        .padding(32)
        .frame(maxWidth: .infinity, minHeight: 300)
        .background {
            RoundedRectangle(cornerRadius: 20)
                .fill(.ultraThinMaterial)
                .shadow(radius: 8, y: 4)
        }
        .padding(.horizontal)
        .onTapGesture {
            withAnimation(.spring(duration: 0.3)) {
                isFlipped.toggle()
                showPronunciationNotes = false
            }
        }
    }

    private func controlButtons(for phrase: Phrase) -> some View {
        HStack(spacing: 24) {
            // Didn't know
            Button {
                markPhrase(quality: 1)
                advance()
            } label: {
                Label("Didn't know", systemImage: "xmark.circle.fill")
                    .font(.headline)
                    .foregroundStyle(.red)
            }
            .buttonStyle(.bordered)

            // Play audio
            Button {
                speechSynthesizer.speak(
                    phrase.text,
                    language: unit.language,
                    speed: .slow,
                    phrase: phrase
                )
            } label: {
                Image(systemName: speechSynthesizer.isSpeaking ? "speaker.wave.3.fill" : "speaker.wave.2.fill")
                    .font(.title2)
                    .foregroundStyle(.blue)
            }
            .buttonStyle(.bordered)
            .clipShape(Circle())

            // Knew it
            Button {
                markPhrase(quality: 4)
                advance()
            } label: {
                Label("Knew it", systemImage: "checkmark.circle.fill")
                    .font(.headline)
                    .foregroundStyle(.green)
            }
            .buttonStyle(.bordered)
        }
        .padding(.bottom)
    }

    private var swipeGesture: some Gesture {
        DragGesture()
            .onChanged { value in
                dragOffset = value.translation
            }
            .onEnded { value in
                if value.translation.width > 100 {
                    markPhrase(quality: 4)
                    advance()
                } else if value.translation.width < -100 {
                    markPhrase(quality: 1)
                    advance()
                }
                dragOffset = .zero
            }
    }

    private func markPhrase(quality: Int) {
        guard let phrase = currentPhrase else { return }
        if phrase.progress == nil {
            let progress = PhraseProgress(phrase: phrase, language: unit.language)
            phrase.progress = progress
            modelContext.insert(progress)
        }
        if let progress = phrase.progress {
            let engine = SpacedRepetitionEngine()
            engine.updateProgress(progress, quality: quality, pronunciationScore: 0.5)
        }
    }

    private func advance() {
        withAnimation {
            isFlipped = false
            showPronunciationNotes = false
            if currentIndex < phrases.count - 1 {
                currentIndex += 1
            }
        }
    }
}
