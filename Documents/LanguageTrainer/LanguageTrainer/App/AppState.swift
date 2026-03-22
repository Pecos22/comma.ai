import SwiftUI

@Observable
class AppState {
    var selectedLanguage: Language?
    var learningMode: LearningMode = .phone
    var showIPAByDefault: Bool = false
    var dailyGoalMinutes: Int = 15
    var hasCompletedOnboarding: Bool = false
    var curriculumLoaded: Bool = false

    static let shared = AppState()
}
