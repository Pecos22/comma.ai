import SwiftUI

struct LanguageCard: View {
    let language: Language
    let sessionsCount: Int

    var body: some View {
        HStack(spacing: 16) {
            Text(language.flag)
                .font(.system(size: 48))

            VStack(alignment: .leading, spacing: 4) {
                Text(language.displayName)
                    .font(.title2.bold())
                    .foregroundStyle(.primary)

                Text(sessionsCount == 0 ? "Start learning" : "\(sessionsCount) sessions completed")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.title3)
                .foregroundStyle(.tertiary)
        }
        .padding(20)
        .background {
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
        }
        .overlay {
            RoundedRectangle(cornerRadius: 16)
                .strokeBorder(.quaternary, lineWidth: 1)
        }
    }
}

#Preview {
    VStack(spacing: 16) {
        LanguageCard(language: .french, sessionsCount: 0)
        LanguageCard(language: .italian, sessionsCount: 5)
    }
    .padding()
}
