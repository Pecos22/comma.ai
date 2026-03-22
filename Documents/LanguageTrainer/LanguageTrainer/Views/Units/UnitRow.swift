import SwiftUI

struct UnitRow: View {
    let unit: Unit

    var body: some View {
        HStack(spacing: 12) {
            Text("\(unit.number)")
                .font(.title3.bold())
                .frame(width: 36, height: 36)
                .background(Circle().fill(.blue.opacity(0.15)))
                .foregroundStyle(.blue)

            VStack(alignment: .leading, spacing: 4) {
                Text(unit.title)
                    .font(.headline)

                Text(unit.pronunciationFocusSummary)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)

                HStack(spacing: 4) {
                    Text("\(unit.phrases.count) phrases")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)

                    if !unit.dialogues.isEmpty {
                        Text("·")
                            .foregroundStyle(.tertiary)
                        Text("\(unit.dialogues.count) dialogues")
                            .font(.caption2)
                            .foregroundStyle(.tertiary)
                    }
                }
            }

            Spacer()

            ProgressCircle(progress: unit.progress)
        }
        .padding(.vertical, 4)
    }
}

struct ProgressCircle: View {
    let progress: Double

    var body: some View {
        ZStack {
            Circle()
                .stroke(.quaternary, lineWidth: 3)

            Circle()
                .trim(from: 0, to: progress)
                .stroke(.blue, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                .rotationEffect(.degrees(-90))

            if progress > 0 {
                Text("\(Int(progress * 100))%")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(.secondary)
            }
        }
        .frame(width: 36, height: 36)
    }
}
