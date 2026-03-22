import SwiftUI

struct DriveModeView: View {
    let unit: Unit
    @Environment(\.dismiss) private var dismiss
    @State private var isSessionActive = false
    @State private var currentPhraseIndex = 0
    @State private var sessionTimeRemaining: TimeInterval = 600
    @State private var selectedDuration: TimeInterval = 600

    private var phrases: [Phrase] {
        unit.phrases
    }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            if !isSessionActive {
                sessionSetup
            } else {
                activeSession
            }
        }
        .preferredColorScheme(.dark)
    }

    private var sessionSetup: some View {
        VStack(spacing: 32) {
            Text("Drive Mode")
                .font(.largeTitle.bold())
                .foregroundStyle(.white)

            Text("Hands-free practice — listen and repeat")
                .font(.title3)
                .foregroundStyle(.secondary)

            VStack(spacing: 16) {
                Text("Session Length")
                    .font(.headline)
                    .foregroundStyle(.secondary)

                HStack(spacing: 16) {
                    durationButton("10 min", duration: 600)
                    durationButton("20 min", duration: 1200)
                    durationButton("30 min", duration: 1800)
                }
            }

            Button {
                isSessionActive = true
            } label: {
                Label("Start Session", systemImage: "play.fill")
                    .font(.title2.bold())
                    .padding()
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .tint(.blue)
            .padding(.horizontal, 40)

            Button("Back") {
                dismiss()
            }
            .foregroundStyle(.secondary)
        }
    }

    private var activeSession: some View {
        VStack(spacing: 40) {
            // Large phrase display (for quick glances)
            if currentPhraseIndex < phrases.count {
                Text(phrases[currentPhraseIndex].text)
                    .font(.system(size: 36, weight: .bold))
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }

            // Oversized stop button
            Button {
                isSessionActive = false
            } label: {
                Image(systemName: "stop.circle.fill")
                    .font(.system(size: 80))
                    .foregroundStyle(.red)
            }
        }
    }

    private func durationButton(_ label: String, duration: TimeInterval) -> some View {
        Button {
            selectedDuration = duration
            sessionTimeRemaining = duration
        } label: {
            Text(label)
                .font(.headline)
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .background {
                    Capsule()
                        .fill(selectedDuration == duration ? .blue : .gray.opacity(0.3))
                }
        }
        .foregroundStyle(.white)
    }
}
