# Personalized Language Trainer - Project Plan

## Overview

A personalized language learning app for **French** and **Italian**, designed for a 30-40 year old adult learner. Optimized for two primary consumption modes: **phone (visual/interactive)** and **driving/hands-free (audio/speak)**. The curriculum is conversation-first, organized by real-life topics and use cases — not exhaustive vocabulary lists.

---

## Core Design Principles

1. **Topic-based units** — Learn what you need for real situations (ordering food, not memorizing colors)
2. **Two modes** — Phone mode (tap, read, type) and Drive mode (listen, repeat, speak)
3. **Pronunciation-first** — Audio for every word/phrase, spaced repetition weighted toward spoken recall
4. **Conversational focus** — Full phrases and mini-dialogues over isolated words
5. **Adult learner optimized** — No gamification fluff; efficient, respect the learner's time

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| UI Framework | **SwiftUI** | Native iOS, declarative, excellent animations |
| Audio/TTS | **AVSpeechSynthesizer** (on-device) + **ElevenLabs API** (premium) | AVSpeech for instant playback; ElevenLabs for natural pre-recorded audio |
| Speech Recognition | **Apple Speech framework** (`SFSpeechRecognizer`) | On-device, low latency, supports French & Italian |
| CarPlay / Drive Mode | **CarPlay framework** + **AVAudioSession** | Native car integration, background audio |
| Siri Integration | **App Intents / SiriKit** | "Hey Siri, start my French lesson" |
| Database | **SwiftData** (Core Data successor) | Native persistence, iCloud sync built-in |
| AI/Personalization | **Claude API** (via Anthropic Swift SDK) | Generate contextual examples, adapt difficulty |
| Content Storage | **JSON bundles** in app + **Swift Packages** | Bundled curriculum, easy to update |
| Notifications | **UserNotifications** | Daily practice reminders |
| Widgets | **WidgetKit** | Lock screen / home screen word of the day |

### iOS-Specific Advantages
- **On-device speech recognition** — No network needed for Drive Mode pronunciation checks
- **CarPlay support** — Dedicated Drive Mode UI on the car's screen
- **Live Activities** — Show current lesson progress on lock screen during a session
- **Shortcuts/Siri** — Voice-launch specific lessons or review sessions
- **iCloud sync** — Progress syncs across iPhone/iPad automatically via SwiftData
- **Haptic feedback** — Subtle haptics for correct/incorrect answers (UIFeedbackGenerator)

---

## Consumption Modes

### Phone Mode (Visual/Interactive)
- Flashcards with audio playback
- Tap-to-reveal translations
- Type-the-word exercises
- Mini-dialogue read-alongs with audio
- Visual pronunciation guides (phonetic spelling)
- Progress dashboard per unit/topic

### Drive Mode (Audio/Speak)
- Fully hands-free, voice-controlled
- **Listen & Repeat** — Hear a word/phrase, pause, repeat it
- **Audio Quiz** — "How do you say 'the bill' in French?" → speak answer → feedback
- **Mini-Dialogue Practice** — Play one role in a conversation
- **Review Loop** — Resurfaces words you got wrong, spaced repetition
- Large play/pause button, no visual attention required
- Session length presets: 10min, 20min, 30min (matched to commute)

---

## Curriculum Structure

Each language has **20 units**, organized by real-life use case. Each unit contains:
- **30-50 core words/phrases** (not exhaustive vocabulary)
- **5-8 mini-dialogues** (2-4 exchanges each)
- **Cultural notes** (1-2 per unit, e.g., tipping norms, formal vs informal)
- **Pronunciation focus** (specific sounds highlighted per unit)

### Unit Map (French & Italian share the same structure)

| # | Unit Title | Key Phrases | Pronunciation Focus |
|---|-----------|-------------|-------------------|
| 1 | **Greetings & Basics** | Hello, goodbye, please, thank you, yes/no | Nasal vowels (FR), double consonants (IT) |
| 2 | **Introducing Yourself** | Name, age, where from, what you do | Liaison (FR), rolled R (IT) |
| 3 | **At a Café / Bar** | Ordering coffee, water, beer, the bill | Silent letters (FR), open/closed vowels (IT) |
| 4 | **At a Restaurant** | Reservations, ordering food, dietary needs, paying | R sound (FR), GL/GN sounds (IT) |
| 5 | **Getting Around Town** | Directions, taxi, metro, walking | "Où" / "Dove", nasal "en/an" (FR) |
| 6 | **At the Hotel** | Check-in/out, room issues, amenities | H aspiré (FR), stress patterns (IT) |
| 7 | **Shopping & Markets** | Prices, sizes, colors, bargaining | Numbers fluency, "SC" sound (IT) |
| 8 | **Emergency & Health** | Pharmacy, doctor, pain, allergies | Urgency phrases, "CHI/CHE" (IT) |
| 9 | **Phone & Digital** | WiFi, calling, apps, battery | Tech loanwords, pronunciation traps |
| 10 | **Making Plans** | Suggesting, agreeing, declining, time/date | Future tense basics, conditional |
| 11 | **Small Talk & Weather** | Weather, weekend plans, hobbies | Subjunctive hints (FR), "fare" idioms (IT) |
| 12 | **At Work / Business** | Meetings, emails, deadlines, colleagues | Formal register, "vous/Lei" |
| 13 | **Family & Relationships** | Family members, ages, descriptions | Possessives, adjective agreement |
| 14 | **Food & Cooking** | Ingredients, recipes, preferences | Food vocabulary (region-specific) |
| 15 | **Travel & Transport** | Trains, flights, delays, tickets | Announcements comprehension |
| 16 | **Culture & Entertainment** | Movies, music, books, museums | Opinions & preferences |
| 17 | **Sports & Fitness** | Gym, running, football, swimming | Body parts, action verbs |
| 18 | **Home & Daily Routine** | Morning routine, chores, furniture | Reflexive verbs, time expressions |
| 19 | **Opinions & Debates** | Agreeing, disagreeing, politics-light | Connectors (mais, cependant / però, tuttavia) |
| 20 | **Putting It All Together** | Mixed scenarios, role-play, freestyle | Full conversation practice |

---

## Spaced Repetition & Progress System

- **SM-2 algorithm variant** for scheduling reviews
- Each word/phrase tracked independently per language
- Weighting factors:
  - Words you got wrong in Drive mode → higher priority
  - Pronunciation errors (detected via speech recognition) → flagged for extra drill
  - Recency of unit completion → newer units reviewed more often
- **Streaks & stats** — daily practice streak, words learned, pronunciation accuracy %
- No XP, no leaderboards, no artificial urgency — just clear progress metrics

---

## Data Model (SwiftData @Model)

```swift
@Model class Phrase {
    var id: UUID
    var text: String              // Target language text
    var translation: String       // English
    var phonetic: String          // IPA pronunciation
    var exampleSentence: String
    var tags: [String]            // ["formal", "food", "greeting"]
    var unit: Unit?               // Relationship
}

@Model class Unit {
    var id: UUID
    var language: Language        // .french or .italian
    var number: Int               // 1-20
    var title: String
    var pronunciationFocus: String
    var phrases: [Phrase]
    var dialogues: [Dialogue]
    var culturalNotes: [CulturalNote]
}

@Model class Dialogue {
    var id: UUID
    var context: String           // e.g., "at a café"
    var exchanges: [Exchange]     // Codable struct
    var notes: String
    var unit: Unit?
}

struct Exchange: Codable {
    var speaker: String
    var text: String
    var translation: String
}

@Model class CulturalNote {
    var id: UUID
    var title: String
    var content: String
    var unit: Unit?
}

@Model class PhraseProgress {
    var id: UUID
    var phrase: Phrase?
    var easeFactor: Double        // SM-2 ease factor (default 2.5)
    var interval: Int             // Days until next review
    var nextReview: Date
    var totalAttempts: Int
    var correctAttempts: Int
    var pronunciationAccuracy: Double  // 0.0 - 1.0
    var lastReviewed: Date?
}

@Model class SessionLog {
    var id: UUID
    var language: Language
    var mode: LearningMode        // .phone or .drive
    var startedAt: Date
    var duration: TimeInterval
    var phrasesReviewed: Int
    var accuracy: Double
}

enum Language: String, Codable { case french, italian }
enum LearningMode: String, Codable { case phone, drive }
```

---

## Project Structure (Xcode / SwiftUI)

```
LanguageTrainer/
├── LanguageTrainer.xcodeproj
├── LanguageTrainer/
│   ├── App/
│   │   ├── LanguageTrainerApp.swift        # @main entry point
│   │   └── AppState.swift                  # Global app state (ObservableObject)
│   ├── Models/
│   │   ├── Language.swift                  # French, Italian enum
│   │   ├── Unit.swift                      # SwiftData @Model
│   │   ├── Phrase.swift                    # SwiftData @Model (word/phrase)
│   │   ├── Dialogue.swift                  # SwiftData @Model
│   │   ├── UserProgress.swift              # SwiftData @Model (per-phrase progress)
│   │   └── SessionLog.swift                # SwiftData @Model
│   ├── Views/
│   │   ├── Home/
│   │   │   ├── HomeView.swift              # Language select, continue learning
│   │   │   └── LanguageCard.swift
│   │   ├── Units/
│   │   │   ├── UnitListView.swift          # Browse units for a language
│   │   │   └── UnitRow.swift
│   │   ├── PhoneMode/
│   │   │   ├── FlashcardView.swift         # Visual flashcard exercise
│   │   │   ├── TypeAnswerView.swift        # Type-the-word exercise
│   │   │   ├── DialoguePracticeView.swift  # Mini-dialogue read-along
│   │   │   └── PronunciationGuideView.swift
│   │   ├── DriveMode/
│   │   │   ├── DriveModeView.swift         # Minimal UI, large controls
│   │   │   ├── ListenRepeatView.swift      # Listen & repeat flow
│   │   │   ├── AudioQuizView.swift         # Speak-the-answer flow
│   │   │   └── DriveSessionView.swift      # Session timer & controls
│   │   ├── Progress/
│   │   │   ├── ProgressView.swift          # Stats dashboard
│   │   │   └── ReviewScheduleView.swift
│   │   └── Components/
│   │       ├── AudioPlayerButton.swift
│   │       ├── PronunciationFeedback.swift
│   │       ├── ModeToggle.swift
│   │       └── StreakBadge.swift
│   ├── Services/
│   │   ├── SpeechSynthesizer.swift         # AVSpeechSynthesizer wrapper
│   │   ├── SpeechRecognizer.swift          # SFSpeechRecognizer wrapper
│   │   ├── SpacedRepetitionEngine.swift    # SM-2 algorithm
│   │   ├── SessionManager.swift            # Build & manage practice sessions
│   │   ├── PronunciationScorer.swift       # Compare spoken vs expected
│   │   └── ClaudeAPIService.swift          # Anthropic API for adaptive content
│   ├── Resources/
│   │   ├── Curriculum/
│   │   │   ├── French/
│   │   │   │   ├── unit-01-greetings.json
│   │   │   │   ├── unit-02-introducing.json
│   │   │   │   └── ...
│   │   │   └── Italian/
│   │   │       ├── unit-01-greetings.json
│   │   │       └── ...
│   │   └── Audio/                          # Pre-recorded premium audio (optional)
│   │       ├── French/
│   │       └── Italian/
│   ├── Extensions/
│   │   ├── Color+Theme.swift
│   │   └── String+Phonetics.swift
│   └── Utilities/
│       ├── AudioSessionManager.swift       # AVAudioSession config (Drive mode)
│       └── HapticManager.swift
├── LanguageTrainerWidgets/                 # WidgetKit extension
│   ├── WordOfTheDayWidget.swift
│   └── StreakWidget.swift
├── LanguageTrainerCarPlay/                 # CarPlay extension (future)
│   └── CarPlaySceneDelegate.swift
├── LanguageTrainerTests/
│   ├── SpacedRepetitionTests.swift
│   └── PronunciationScorerTests.swift
└── LanguageTrainerUITests/
```

---

## Implementation Phases

### Phase 1 — Foundation (MVP)
- [ ] Xcode project setup (SwiftUI, iOS 17+ target)
- [ ] SwiftData models (Language, Unit, Phrase, UserProgress)
- [ ] JSON curriculum authoring for Units 1-5 (both languages)
- [ ] JSON → SwiftData import pipeline (on first launch)
- [ ] Phone Mode: FlashcardView with AVSpeechSynthesizer playback
- [ ] Basic spaced repetition engine (SM-2) in Swift
- [ ] HomeView → UnitListView → FlashcardView navigation
- [ ] Dark mode theme & typography system

### Phase 2 — Drive Mode
- [ ] DriveModeView (minimal UI, oversized tap targets)
- [ ] SFSpeechRecognizer integration for spoken answers
- [ ] Listen & Repeat flow (TTS → pause → record → compare)
- [ ] Audio Quiz flow (prompt → speak → score)
- [ ] AVAudioSession configuration for background audio
- [ ] Session timer (10/20/30 min presets)
- [ ] Bluetooth connection detection → suggest Drive Mode

### Phase 3 — Dialogues & Depth
- [ ] DialoguePracticeView (mini-dialogue read-along + role-play)
- [ ] Pronunciation scoring (Levenshtein on transcription vs expected)
- [ ] Remaining units 6-20 curriculum content
- [ ] Cultural notes view per unit
- [ ] WidgetKit: Word of the Day widget

### Phase 4 — Personalization & Polish
- [ ] Claude API integration for adaptive difficulty & example generation
- [ ] Smart session builder (mix weak words + new content)
- [ ] Progress dashboard with Swift Charts
- [ ] Settings (daily goal, preferred mode, notifications via UNUserNotificationCenter)
- [ ] iCloud sync via SwiftData CloudKit integration
- [ ] App Intents / Siri Shortcuts ("Start my French lesson")
- [ ] CarPlay extension (future stretch goal)

---

## Key UX Decisions

1. **No signup required** — Start learning immediately, iCloud syncs in the background
2. **Mode detection hint** — "Connected to car Bluetooth? Try Drive Mode"
3. **Session-based** — Each practice is a discrete session (not endless scroll)
4. **Bilingual toggle** — Can practice French one session, Italian the next
5. **Review-first** — Each session starts with 5 review words before new content
6. **Dark mode default** — Follows system appearance, OLED-friendly
7. **Fully offline** — All curriculum bundled in app, TTS on-device via AVSpeechSynthesizer
8. **Native feel** — Uses standard iOS patterns (NavigationStack, TabView, sheets)
9. **Haptic feedback** — Subtle confirmation/error haptics for interactive exercises
10. **Lock Screen widget** — Word of the day & streak counter always visible

## Minimum iOS Requirements

- **iOS 17+** — Required for SwiftData, updated App Intents, interactive widgets
- **Xcode 15+** — SwiftUI 5, Swift 5.9+
- **No third-party dependencies for MVP** — All core features use Apple frameworks
