# Language Trainer — iOS App (SwiftUI)

> **Instructions for Claude Code**: This file describes the full design and implementation plan for a personalized French/Italian language trainer iOS app. Build this as a native SwiftUI project in Xcode. Follow the architecture, data models, and phased implementation order described below. When implementing, start with Phase 1 and work sequentially.

---

## What This App Is

A personalized language learning app for **French** and **Italian**, designed for a 30-40 year old adult learner. Two consumption modes:

1. **Phone Mode** — Visual/interactive (flashcards, typing, dialogues)
2. **Drive Mode** — Fully hands-free audio (listen, repeat, speak) for use while driving

The curriculum is **conversation-first**, organized by real-life topics (ordering food, getting directions, etc.) — not exhaustive vocabulary. Each unit teaches 30-50 core phrases with pronunciation drills, mini-dialogues, and cultural context.

---

## Core Design Principles

1. **Topic-based units** — Learn what you need for real situations
2. **Pronunciation is a first-class feature** — Every interaction includes pronunciation training (see dedicated section below)
3. **Two modes** — Phone mode (tap, read, type) and Drive mode (listen, repeat, speak)
4. **Conversational focus** — Full phrases and mini-dialogues over isolated words
5. **Adult learner optimized** — No gamification fluff; efficient, respect the learner's time
6. **Offline-first** — All curriculum bundled, TTS and speech recognition on-device

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| UI | **SwiftUI** (iOS 17+) | Declarative, native animations, NavigationStack |
| TTS | **AVSpeechSynthesizer** | On-device, supports `fr-FR` and `it-IT` voices, no network needed |
| Speech Recognition | **Speech framework** (`SFSpeechRecognizer`) | On-device recognition for French & Italian, real-time |
| Pronunciation Scoring | **Custom scorer** using `SFSpeechRecognizer` + string comparison | See Pronunciation System section |
| Database | **SwiftData** | Native persistence, iCloud sync, @Model macros |
| Charts | **Swift Charts** | Progress visualization |
| Background Audio | **AVAudioSession** | Drive Mode continues with screen off |
| Widgets | **WidgetKit** | Word of the day, streak counter |
| Siri | **App Intents** | "Hey Siri, start my French lesson" |
| AI (Phase 4) | **Claude API** | Adaptive difficulty, contextual example generation |
| Notifications | **UserNotifications** | Daily practice reminders |

**No third-party dependencies for MVP.** All core features use Apple frameworks.

---

## Pronunciation System (Critical Feature)

Pronunciation is not a side feature — it is woven into every exercise type. The app teaches pronunciation through three layers: **guidance** (how to make the sound), **practice** (hear and repeat), and **scoring** (measure accuracy).

### Pronunciation Data Per Phrase

Every phrase in the curriculum JSON includes pronunciation metadata:

```json
{
  "text": "Je voudrais un café, s'il vous plaît",
  "translation": "I would like a coffee, please",
  "phonetic_ipa": "ʒə vudʁɛ œ̃ kafe sil vu plɛ",
  "phonetic_approx": "zhuh voo-DREH uhn ka-FAY seel voo PLEH",
  "pronunciation_notes": "The 'r' in 'voudrais' is a uvular fricative — made in the back of the throat, not rolled. The nasal 'un' sounds like a nasalized 'uh'.",
  "difficulty_sounds": ["ʁ", "œ̃", "ɛ"],
  "slow_speech_rate": 0.35,
  "normal_speech_rate": 0.5
}
```

Fields:
- `phonetic_ipa` — Full IPA transcription for reference
- `phonetic_approx` — Simplified English-friendly pronunciation guide (stress in CAPS)
- `pronunciation_notes` — Plain-English tips for the hardest sounds in this phrase
- `difficulty_sounds` — IPA symbols of the challenging sounds (used to link to pronunciation guides)
- `slow_speech_rate` — `AVSpeechUtterance.rate` for slow playback (learning)
- `normal_speech_rate` — Rate for natural-speed playback

### Pronunciation Guide Library

Each language has a library of **pronunciation guides** for its challenging sounds. These are standalone reference entries linked from phrases via `difficulty_sounds`.

```json
{
  "sound_id": "fr_uvular_r",
  "ipa_symbol": "ʁ",
  "display_name": "The French R",
  "description": "The French R is produced in the back of the throat (uvular). It sounds like a gentle gargle, NOT like an English R or a Spanish rolled R.",
  "how_to_produce": [
    "Open your mouth slightly",
    "Raise the back of your tongue toward your soft palate (the back roof of your mouth)",
    "Push air through the narrow gap — it should vibrate gently",
    "Think of it like a very soft gargle or the 'ch' in Scottish 'loch' but voiced"
  ],
  "common_mistakes": [
    "Using an English R (tongue tip curled) — keep tongue tip DOWN",
    "Rolling the R like Spanish — this is a different sound entirely",
    "Making it too harsh/guttural — it should be soft and smooth"
  ],
  "example_words": [
    { "text": "rouge", "ipa": "ʁuʒ", "meaning": "red" },
    { "text": "merci", "ipa": "mɛʁsi", "meaning": "thank you" },
    { "text": "restaurant", "ipa": "ʁɛstoʁɑ̃", "meaning": "restaurant" }
  ],
  "practice_pairs": [
    { "minimal_pair": ["rue", "lu"], "explanation": "R vs L — feel the difference in tongue position" }
  ],
  "audio_demo_rate": 0.3
}
```

#### French Pronunciation Guides to Include

| Sound | IPA | Key Challenge |
|-------|-----|---------------|
| Uvular R | ʁ | Back-of-throat, not English R |
| Nasal vowels | ɑ̃, ɛ̃, ɔ̃, œ̃ | Air through nose, mouth shape changes meaning |
| U vs OU | y vs u | Lips rounded + tongue forward (u) vs back (ou) |
| Silent letters | — | Final consonants usually silent, but sometimes linked |
| Liaison | — | Linking final consonant to next vowel (les‿amis) |
| É vs È | e vs ɛ | Closed vs open E — changes word meaning |
| H aspiré vs muet | — | Some H's block liaison, some don't |
| EN/AN vs IN/AIN | ɑ̃ vs ɛ̃ | Two different nasal vowels often confused |

#### Italian Pronunciation Guides to Include

| Sound | IPA | Key Challenge |
|-------|-----|---------------|
| Rolled R | r | Tongue tip trill against alveolar ridge |
| Double consonants | ː | Longer hold — changes meaning (pena vs penna) |
| GL sound | ʎ | Like "lli" in "million" (famiglia, figlio) |
| GN sound | ɲ | Like "ny" in "canyon" (gnocchi, bagno) |
| SC before E/I | ʃ | "Sh" sound (pesce, scienza) |
| C before E/I | tʃ | "Ch" sound (cena, cinema) |
| CH | k | Hard K sound before E/I (che, chi) |
| Open vs closed O/E | ɔ/o, ɛ/e | Regional but affects comprehension |
| Stress patterns | — | Usually penultimate, but many exceptions |
| Z voiced vs unvoiced | dz vs ts | Pizza (ts) vs zona (dz) |

### Pronunciation in Phone Mode

#### Flashcard View
- **Tap card** → plays audio at slow speed, shows `phonetic_approx` beneath the text
- **Long press** → plays at normal speed
- **"How to say it" button** → expands to show `pronunciation_notes` + links to relevant pronunciation guides
- **IPA toggle** (settings) → show/hide IPA transcription for users who want it

#### Pronunciation Drill View (dedicated screen per unit)
A focused exercise screen for the unit's `pronunciation_focus` sounds:
1. **Intro** — Show the pronunciation guide (description, how-to-produce steps, diagram/animation placeholder)
2. **Listen** — Play 3 example words slowly, highlight the target sound
3. **Repeat** — Record learner saying each word, score pronunciation
4. **Minimal Pairs** — Play two similar words, learner identifies which contains the target sound
5. **In Context** — Practice the sound in full phrases from the unit

#### Type Answer View
- After typing, show the correct pronunciation guide before moving on
- If the word contains a `difficulty_sound`, briefly flash the pronunciation tip

### Pronunciation in Drive Mode

Drive Mode is the primary pronunciation training context — learner speaks out loud.

#### Listen & Repeat Flow
```
1. TTS plays phrase at SLOW speed
2. TTS plays phrase at NORMAL speed
3. 3-second silence (learner repeats)
4. SFSpeechRecognizer captures & transcribes
5. Score computed (see Scoring below)
6. Audio feedback:
   - Correct: "Bien!" / "Bene!" + chime + move to next
   - Close: "Almost — listen again" + replay at slow speed + retry
   - Incorrect: "Let's try that again" + replay slow + simplified hint
```

#### Audio Quiz with Pronunciation
```
1. "How do you say 'the bill' in French?"
2. 4-second silence (learner speaks)
3. Transcribe and score both CONTENT (right word?) and PRONUNCIATION
4. Feedback:
   - Right word, good pronunciation: "Parfait!"
   - Right word, poor pronunciation: "That's right! But listen to the pronunciation..." + replay
   - Wrong word: "The answer is 'l'addition'" + replay slow
```

#### Pronunciation-Focused Drive Session
A special session type focused entirely on sounds:
1. Pick the learner's weakest pronunciation areas (from `PhraseProgress.pronunciationAccuracy`)
2. Drill those specific sounds using words and phrases that contain them
3. "The French R: listen... 'rouge'... now you say it... 'merci'... now you..."
4. Cycle through 8-10 words per sound, then move to next weak sound

### Pronunciation Scoring System

#### How It Works (PronunciationScorer.swift)

```
Input: expected phrase text + SFSpeechRecognizer transcription result
Output: PronunciationScore (overall 0.0-1.0 + per-word breakdown)
```

**Scoring pipeline:**
1. **Normalize** both strings: lowercase, remove punctuation, expand contractions
2. **Tokenize** into words
3. **Align** words using Levenshtein distance on the word arrays
4. **Per-word score:**
   - Exact match → 1.0
   - Close match (edit distance ≤ 2 on the word) → 0.5-0.8 (scaled by distance)
   - Missing/extra word → 0.0
5. **Overall score** = weighted average of per-word scores
6. **Confidence adjustment**: Multiply by `SFSpeechRecognitionResult.bestTranscription.segments[n].confidence` — low-confidence transcriptions get a scoring boost (benefit of the doubt)

**Important:** The recognizer's locale MUST match the target language:
```swift
let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "fr-FR"))
// or
let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "it-IT"))
```

#### Score Thresholds
| Score | Meaning | Feedback |
|-------|---------|----------|
| 0.85+ | Excellent | Move on, positive reinforcement |
| 0.60-0.84 | Good but needs work | "Almost! Listen again..." + replay |
| 0.40-0.59 | Struggling | Slow replay + pronunciation tip for hardest word |
| < 0.40 | Didn't catch it | "Let's try again" + slow replay, max 3 attempts then move on |

#### Tracking Over Time

`PhraseProgress` stores `pronunciationAccuracy` as a rolling average:
```swift
pronunciationAccuracy = (pronunciationAccuracy * 0.7) + (newScore * 0.3)
```
This means recent attempts matter more, but old scores still have weight. The spaced repetition engine uses this: phrases with low pronunciation accuracy get scheduled more frequently, even if the learner gets the meaning right.

### AVSpeechSynthesizer Configuration

```swift
func speak(_ text: String, language: Language, speed: SpeechSpeed) {
    let utterance = AVSpeechUtterance(string: text)
    utterance.voice = AVSpeechSynthesisVoice(language: language.voiceIdentifier)
    utterance.rate = speed == .slow ? phrase.slowSpeechRate : phrase.normalSpeechRate
    utterance.pitchMultiplier = 1.0
    utterance.preUtteranceDelay = 0.1
    utterance.postUtteranceDelay = speed == .slow ? 0.5 : 0.2
    synthesizer.speak(utterance)
}

// Voice identifiers
extension Language {
    var voiceIdentifier: String {
        switch self {
        case .french: return "fr-FR"
        case .italian: return "it-IT"
        }
    }
}
```

Use **enhanced voices** when available (downloaded on device): `AVSpeechSynthesisVoice(identifier: "com.apple.voice.enhanced.fr-FR.Thomas")`. Fall back to compact voices if not downloaded.

---

## Curriculum Structure

20 units per language, organized by real-life use case. Each unit contains:
- **30-50 core phrases** (with full pronunciation metadata)
- **5-8 mini-dialogues** (2-4 exchanges each)
- **1-2 cultural notes**
- **1 pronunciation focus** (links to pronunciation guide library)
- **1 pronunciation drill** (focused exercises for the unit's target sounds)

### Unit Map

| # | Unit Title | Pronunciation Focus (FR) | Pronunciation Focus (IT) |
|---|-----------|--------------------------|--------------------------|
| 1 | Greetings & Basics | Nasal vowels (bonjour, bien, bon) | Double consonants (buongiorno, piacere) |
| 2 | Introducing Yourself | Liaison (je suis‿un, c'est‿un) | Rolled R (mi chiamo, arrivederci) |
| 3 | At a Café / Bar | Silent final consonants (café, chocolat, lait) | Open vs closed vowels (caffè, birra) |
| 4 | At a Restaurant | Uvular R (restaurant, addition, garçon) | GL/GN sounds (aglio, gnocchi, tagliatelle) |
| 5 | Getting Around Town | U vs OU (rue, route, où, tout) | SC before E/I (scusi, uscita) |
| 6 | At the Hotel | H aspiré vs muet (hôtel, haut, l'heure) | Stress patterns (camera, prenotazione) |
| 7 | Shopping & Markets | Numbers (fluency with nasal vowels in quinze, vingt) | C/CH sounds (cinque, che, cento) |
| 8 | Emergency & Health | É vs È (médecin, urgence, fièvre) | Z sounds (farmacia, stazione, pizza) |
| 9 | Phone & Digital | EN/AN vs IN (internet, en ligne, bien, maintenant) | Double L (cellulare, quello) |
| 10 | Making Plans | Conditional endings (voudrais, pourrais, aimerais) | Conditional endings (vorrei, potrei) |
| 11 | Small Talk & Weather | Intonation patterns (questions vs statements) | Intonation patterns in Italian |
| 12 | At Work / Business | Formal register phrasing (vous-form fluency) | Formal register (Lei-form fluency) |
| 13 | Family & Relationships | Possessive contractions (mon, ma, mes + liaison) | Possessive patterns (mio, mia, i miei) |
| 14 | Food & Cooking | Food-specific sounds (ail, oignon, boeuf) | Regional food terms (bruschetta, focaccia) |
| 15 | Travel & Transport | Fast connected speech (j'y vais, qu'est-ce que) | Fast connected speech (andiamo, arriviamo) |
| 16 | Culture & Entertainment | "EU" sound (heure, peur, acteur) | Diphthongs (buono, uomo, piede) |
| 17 | Sports & Fitness | Body part sounds (genou, cuisse, épaule) | Body part sounds (ginocchio, coscia) |
| 18 | Home & Daily Routine | Reflexive verb flow (je me lève, je me couche) | Reflexive verb flow (mi sveglio, mi alzo) |
| 19 | Opinions & Debates | Connector fluency (cependant, néanmoins, pourtant) | Connector fluency (tuttavia, nonostante, però) |
| 20 | Putting It All Together | Mixed review — all sounds | Mixed review — all sounds |

---

## Data Model (SwiftData)

```swift
import SwiftData

// MARK: - Enums

enum Language: String, Codable, CaseIterable {
    case french, italian

    var voiceIdentifier: String {
        switch self {
        case .french: return "fr-FR"
        case .italian: return "it-IT"
        }
    }

    var displayName: String {
        switch self {
        case .french: return "French"
        case .italian: return "Italian"
        }
    }
}

enum LearningMode: String, Codable {
    case phone, drive
}

// MARK: - Curriculum Models

@Model class Unit {
    @Attribute(.unique) var id: UUID
    var language: Language
    var number: Int                          // 1-20
    var title: String
    var pronunciationFocusSummary: String    // Brief description
    var pronunciationGuideIDs: [String]      // Links to PronunciationGuide entries
    @Relationship(deleteRule: .cascade) var phrases: [Phrase]
    @Relationship(deleteRule: .cascade) var dialogues: [Dialogue]
    @Relationship(deleteRule: .cascade) var culturalNotes: [CulturalNote]
}

@Model class Phrase {
    @Attribute(.unique) var id: UUID
    var text: String                    // Target language
    var translation: String             // English
    var phoneticIPA: String             // Full IPA
    var phoneticApprox: String          // English-friendly guide ("zhuh voo-DREH")
    var pronunciationNotes: String      // Plain English tips
    var difficultySounds: [String]      // IPA symbols linking to guides
    var exampleSentence: String
    var tags: [String]                  // ["formal", "food", "greeting"]
    var slowSpeechRate: Float           // AVSpeechUtterance rate for slow
    var normalSpeechRate: Float         // AVSpeechUtterance rate for normal
    var unit: Unit?
}

@Model class Dialogue {
    @Attribute(.unique) var id: UUID
    var context: String
    var exchanges: [Exchange]           // Codable struct array
    var notes: String
    var unit: Unit?
}

struct Exchange: Codable, Hashable {
    var speaker: String                 // "waiter", "you", "clerk"
    var text: String
    var translation: String
    var phoneticApprox: String          // Pronunciation guide for this line
}

@Model class CulturalNote {
    @Attribute(.unique) var id: UUID
    var title: String
    var content: String
    var unit: Unit?
}

@Model class PronunciationGuide {
    @Attribute(.unique) var soundID: String  // "fr_uvular_r", "it_double_consonants"
    var language: Language
    var ipaSymbol: String
    var displayName: String             // "The French R"
    var description: String             // What this sound is
    var howToProduce: [String]          // Step-by-step mouth/tongue instructions
    var commonMistakes: [String]        // What English speakers get wrong
    var exampleWords: [PronunciationExample]
    var practicePairs: [MinimalPair]
    var audioDemoRate: Float            // Slow TTS rate for demos
}

struct PronunciationExample: Codable, Hashable {
    var text: String
    var ipa: String
    var meaning: String
}

struct MinimalPair: Codable, Hashable {
    var word1: String
    var word2: String
    var explanation: String             // "R vs L — feel the tongue position difference"
}

// MARK: - Progress Models

@Model class PhraseProgress {
    @Attribute(.unique) var id: UUID
    var phrase: Phrase?
    var language: Language
    var easeFactor: Double = 2.5        // SM-2 ease factor
    var interval: Int = 0               // Days until next review
    var nextReview: Date = Date()
    var totalAttempts: Int = 0
    var correctAttempts: Int = 0
    var pronunciationAccuracy: Double = 0.0  // Rolling average 0.0-1.0
    var lastReviewed: Date?
}

@Model class SessionLog {
    @Attribute(.unique) var id: UUID
    var language: Language
    var mode: LearningMode
    var startedAt: Date
    var duration: TimeInterval
    var phrasesReviewed: Int
    var overallAccuracy: Double
    var pronunciationAccuracy: Double   // Separate pronunciation tracking
}
```

---

## Project Structure

```
LanguageTrainer/
├── LanguageTrainer.xcodeproj
├── LanguageTrainer/
│   ├── App/
│   │   ├── LanguageTrainerApp.swift
│   │   └── AppState.swift
│   ├── Models/
│   │   ├── Language.swift
│   │   ├── Unit.swift
│   │   ├── Phrase.swift
│   │   ├── Dialogue.swift
│   │   ├── PronunciationGuide.swift
│   │   ├── PhraseProgress.swift
│   │   └── SessionLog.swift
│   ├── Views/
│   │   ├── Home/
│   │   │   ├── HomeView.swift
│   │   │   └── LanguageCard.swift
│   │   ├── Units/
│   │   │   ├── UnitListView.swift
│   │   │   └── UnitRow.swift
│   │   ├── PhoneMode/
│   │   │   ├── FlashcardView.swift
│   │   │   ├── TypeAnswerView.swift
│   │   │   ├── DialoguePracticeView.swift
│   │   │   ├── PronunciationDrillView.swift     # Dedicated pronunciation exercises
│   │   │   └── PronunciationGuideDetailView.swift  # Full guide for a sound
│   │   ├── DriveMode/
│   │   │   ├── DriveModeView.swift
│   │   │   ├── ListenRepeatView.swift
│   │   │   ├── AudioQuizView.swift
│   │   │   ├── PronunciationDriveSession.swift  # Sound-focused drive session
│   │   │   └── DriveSessionView.swift
│   │   ├── Progress/
│   │   │   ├── StatsView.swift
│   │   │   ├── PronunciationProgressView.swift  # Pronunciation-specific stats
│   │   │   └── ReviewScheduleView.swift
│   │   └── Components/
│   │       ├── AudioPlayerButton.swift
│   │       ├── PronunciationScoreView.swift     # Visual score display
│   │       ├── PhoneticText.swift               # Renders IPA or approx guides
│   │       ├── SoundWaveView.swift              # Visual feedback during recording
│   │       ├── ModeToggle.swift
│   │       └── StreakBadge.swift
│   ├── Services/
│   │   ├── SpeechSynthesizer.swift
│   │   ├── SpeechRecognizer.swift
│   │   ├── PronunciationScorer.swift
│   │   ├── SpacedRepetitionEngine.swift
│   │   ├── SessionManager.swift
│   │   └── CurriculumLoader.swift               # JSON → SwiftData import
│   ├── Resources/
│   │   ├── Curriculum/
│   │   │   ├── French/
│   │   │   │   ├── unit-01-greetings.json
│   │   │   │   ├── ...
│   │   │   │   └── pronunciation-guides.json
│   │   │   └── Italian/
│   │   │       ├── unit-01-greetings.json
│   │   │       ├── ...
│   │   │       └── pronunciation-guides.json
│   │   └── Audio/ (optional pre-recorded)
│   ├── Extensions/
│   │   ├── Color+Theme.swift
│   │   └── String+Phonetics.swift
│   └── Utilities/
│       ├── AudioSessionManager.swift
│       └── HapticManager.swift
├── LanguageTrainerWidgets/
│   ├── WordOfTheDayWidget.swift
│   └── StreakWidget.swift
├── LanguageTrainerTests/
│   ├── SpacedRepetitionTests.swift
│   ├── PronunciationScorerTests.swift
│   └── CurriculumLoaderTests.swift
└── LanguageTrainerUITests/
```

---

## Consumption Modes Detail

### Phone Mode

**Flashcard View:**
- Front: phrase in target language + audio button (slow) + `phoneticApprox`
- Back (tap to reveal): English translation + `pronunciationNotes` + links to guides for `difficultySounds`
- Long-press audio button → play at normal speed
- Swipe right = knew it, swipe left = didn't know

**Pronunciation Drill View** (per unit):
1. Show pronunciation guide intro (the sound, how to produce it)
2. Play example words — learner listens
3. Learner taps record, says each word — get scored
4. Minimal pair quiz — "Which word did you hear: rue or roue?"
5. Full phrase practice with the target sound

**Type Answer View:**
- Show English → type target language
- After submit, show phonetic guide + play audio
- If word has a `difficultySounds` entry, show a brief tip

**Dialogue Practice View:**
- Play full dialogue audio
- Highlight each exchange as it plays
- Role-play mode: learner takes one speaker's part (record + score)

### Drive Mode

All interactions are audio-only. Minimal UI (large play/pause, session timer).

**Listen & Repeat:**
1. TTS: slow → normal → 3s silence → record → score → feedback audio
2. If score < 0.60: replay slow + pronunciation tip (spoken) + retry (max 3)
3. Move on after success or 3 attempts

**Audio Quiz:**
1. English prompt spoken → 4s silence → record → score content + pronunciation
2. Separate feedback for meaning vs pronunciation

**Pronunciation-Focused Session:**
1. Picks learner's weakest sounds from `PhraseProgress.pronunciationAccuracy`
2. Drills 8-10 words per sound
3. "The French R — listen: rouge... now you say it... merci... now you..."

**Session Presets:** 10min / 20min / 30min (selectable before starting)

**Background audio:** Must work with screen off and over car Bluetooth. Configure `AVAudioSession` category `.playAndRecord` with options `.defaultToSpeaker` and `.allowBluetooth`.

---

## Spaced Repetition Engine

SM-2 variant with pronunciation weighting:

```swift
func updateProgress(_ progress: PhraseProgress, quality: Int, pronunciationScore: Double) {
    progress.totalAttempts += 1
    if quality >= 3 { progress.correctAttempts += 1 }

    // Update pronunciation rolling average
    progress.pronunciationAccuracy = (progress.pronunciationAccuracy * 0.7) + (pronunciationScore * 0.3)

    // SM-2 core
    if quality >= 3 {
        if progress.interval == 0 {
            progress.interval = 1
        } else if progress.interval == 1 {
            progress.interval = 6
        } else {
            progress.interval = Int(Double(progress.interval) * progress.easeFactor)
        }
    } else {
        progress.interval = 0 // Reset on failure
    }

    progress.easeFactor = max(1.3,
        progress.easeFactor + (0.1 - Double(5 - quality) * (0.08 + Double(5 - quality) * 0.02)))

    // Pronunciation penalty: if meaning is right but pronunciation is bad, review sooner
    if quality >= 3 && pronunciationScore < 0.6 {
        progress.interval = max(1, progress.interval / 2)
    }

    progress.nextReview = Calendar.current.date(byAdding: .day, value: progress.interval, to: Date())!
    progress.lastReviewed = Date()
}
```

Quality scale: 0 (no recall) to 5 (perfect recall + pronunciation).

---

## Implementation Phases

### Phase 1 — Foundation (MVP)
1. Xcode project setup (SwiftUI, iOS 17+ target, SwiftData)
2. All SwiftData `@Model` classes (including `PronunciationGuide`)
3. JSON curriculum for Units 1-5 (both languages) with full pronunciation metadata
4. `pronunciation-guides.json` for both languages (all guides listed above)
5. `CurriculumLoader` — JSON → SwiftData on first launch
6. `SpeechSynthesizer` wrapper (slow/normal speed, enhanced voice selection)
7. `FlashcardView` with audio playback + phonetic display
8. `PronunciationGuideDetailView` — full guide screen for a sound
9. `SpacedRepetitionEngine` (SM-2 with pronunciation weighting)
10. Navigation: HomeView → UnitListView → FlashcardView
11. Dark mode theme

### Phase 2 — Drive Mode + Pronunciation Scoring
1. `SpeechRecognizer` wrapper (French & Italian locale setup)
2. `PronunciationScorer` (normalize → tokenize → align → score pipeline)
3. `DriveModeView` (minimal UI, oversized controls)
4. `ListenRepeatView` (TTS → pause → record → score → feedback loop)
5. `AudioQuizView` (prompt → speak → score content + pronunciation)
6. `AVAudioSession` config for background audio + Bluetooth
7. Session timer (10/20/30 min)
8. Bluetooth detection → suggest Drive Mode

### Phase 3 — Drills, Dialogues & Content
1. `PronunciationDrillView` (Phone Mode — guided exercises per unit)
2. `PronunciationDriveSession` (Drive Mode — weak-sound focused sessions)
3. `DialoguePracticeView` + role-play with pronunciation scoring
4. Remaining Units 6-20 curriculum content (both languages)
5. `PronunciationProgressView` — per-sound accuracy charts
6. Cultural notes integration
7. WidgetKit: Word of the Day

### Phase 4 — Personalization & Polish
1. Claude API for adaptive difficulty & contextual examples
2. Smart session builder (mix weak pronunciation + weak vocabulary + new)
3. Full progress dashboard with Swift Charts
4. Settings (daily goal, preferred mode, notifications)
5. iCloud sync via SwiftData + CloudKit
6. App Intents / Siri ("Start my French pronunciation drill")
7. CarPlay extension (stretch)

---

## Sample Curriculum JSON (Unit 1 — French)

```json
{
  "unit_number": 1,
  "language": "french",
  "title": "Greetings & Basics",
  "pronunciation_focus_summary": "Nasal vowels — the sounds that make French sound French. Found in bonjour, bien, bon, and dozens of common words.",
  "pronunciation_guide_ids": ["fr_nasal_vowels", "fr_silent_letters"],
  "phrases": [
    {
      "id": "fr-01-001",
      "text": "Bonjour",
      "translation": "Hello / Good day",
      "phonetic_ipa": "bɔ̃ʒuʁ",
      "phonetic_approx": "bohn-ZHOOR",
      "pronunciation_notes": "The 'on' is a nasal vowel — say 'on' but let air flow through your nose. The 'j' sounds like 'zh' (like the 's' in 'measure'). The final 'r' is the soft French R.",
      "difficulty_sounds": ["ɔ̃", "ʒ", "ʁ"],
      "example_sentence": "Bonjour, comment allez-vous ?",
      "tags": ["greeting", "formal", "informal"],
      "slow_speech_rate": 0.35,
      "normal_speech_rate": 0.5
    },
    {
      "id": "fr-01-002",
      "text": "Bonsoir",
      "translation": "Good evening",
      "phonetic_ipa": "bɔ̃swaʁ",
      "phonetic_approx": "bohn-SWAHR",
      "pronunciation_notes": "Same nasal 'on' as bonjour. The 'soir' rhymes with 'swahr' — round your lips for the 'oi' sound.",
      "difficulty_sounds": ["ɔ̃", "wa", "ʁ"],
      "example_sentence": "Bonsoir, une table pour deux, s'il vous plaît.",
      "tags": ["greeting", "formal", "evening"],
      "slow_speech_rate": 0.35,
      "normal_speech_rate": 0.5
    },
    {
      "id": "fr-01-003",
      "text": "S'il vous plaît",
      "translation": "Please (formal)",
      "phonetic_ipa": "sil vu plɛ",
      "phonetic_approx": "seel voo PLEH",
      "pronunciation_notes": "Three words that flow together. The final 't' is silent. The 'aît' sounds like 'eh' (open E).",
      "difficulty_sounds": ["ɛ"],
      "example_sentence": "Un café, s'il vous plaît.",
      "tags": ["essential", "formal", "polite"],
      "slow_speech_rate": 0.35,
      "normal_speech_rate": 0.5
    }
  ],
  "dialogues": [
    {
      "id": "fr-01-d01",
      "context": "Meeting someone at a party",
      "exchanges": [
        { "speaker": "you", "text": "Bonjour !", "translation": "Hello!", "phonetic_approx": "bohn-ZHOOR" },
        { "speaker": "other", "text": "Bonjour ! Comment vous appelez-vous ?", "translation": "Hello! What's your name?", "phonetic_approx": "bohn-ZHOOR koh-MAHN vooz ah-play-VAY voo" },
        { "speaker": "you", "text": "Je m'appelle Marie. Et vous ?", "translation": "My name is Marie. And you?", "phonetic_approx": "zhuh mah-PEL mah-REE. ay VOO?" },
        { "speaker": "other", "text": "Enchanté ! Je m'appelle Pierre.", "translation": "Nice to meet you! My name is Pierre.", "phonetic_approx": "ahn-shahn-TAY! zhuh mah-PEL pee-AIR" }
      ],
      "notes": "Use 'vous' (formal you) with people you just met. Switch to 'tu' once you know each other better."
    }
  ],
  "cultural_notes": [
    {
      "id": "fr-01-cn01",
      "title": "La bise — the cheek kiss greeting",
      "content": "In France, friends and acquaintances greet each other with 'la bise' — light kisses on alternating cheeks. The number varies by region (1-4), but 2 is most common in Paris. In professional settings, a handshake is standard. When in doubt, follow the other person's lead."
    }
  ]
}
```

---

## Key UX Decisions

1. **No signup required** — Start immediately, iCloud syncs in background
2. **Mode detection** — "Connected to car Bluetooth? Try Drive Mode"
3. **Session-based** — Discrete sessions, not endless scroll
4. **Review-first** — Each session starts with 5 review phrases before new content
5. **Pronunciation always visible** — `phoneticApprox` shown on every card by default
6. **Dark mode default** — Follows system appearance
7. **Fully offline** — Curriculum bundled, TTS on-device
8. **Haptic feedback** — Subtle haptics for correct/incorrect
9. **Lock Screen widget** — Word of the day + streak

## Requirements

- **iOS 17+** (SwiftData, App Intents, interactive widgets)
- **Xcode 15+** (SwiftUI 5, Swift 5.9+)
- **No third-party dependencies for MVP**
