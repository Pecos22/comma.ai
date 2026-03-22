import SwiftUI

extension Color {
    static let appBackground = Color(.systemBackground)
    static let cardBackground = Color(.secondarySystemBackground)
    static let accentBlue = Color.blue
    static let correctGreen = Color.green
    static let incorrectRed = Color.red
    static let pronunciationBlue = Color.blue.opacity(0.8)
}

extension ShapeStyle where Self == Color {
    static var appAccent: Color { .blue }
}
