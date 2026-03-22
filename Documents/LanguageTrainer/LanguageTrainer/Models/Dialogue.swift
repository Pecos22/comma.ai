import Foundation
import SwiftData

struct Exchange: Codable, Hashable {
    var speaker: String
    var text: String
    var translation: String
    var phoneticApprox: String
}

@Model
class Dialogue {
    @Attribute(.unique) var id: UUID
    var context: String
    var exchanges: [Exchange]
    var notes: String
    var unit: Unit?

    init(
        id: UUID = UUID(),
        context: String,
        exchanges: [Exchange] = [],
        notes: String = ""
    ) {
        self.id = id
        self.context = context
        self.exchanges = exchanges
        self.notes = notes
    }
}

@Model
class CulturalNote {
    @Attribute(.unique) var id: UUID
    var title: String
    var content: String
    var unit: Unit?

    init(id: UUID = UUID(), title: String, content: String) {
        self.id = id
        self.title = title
        self.content = content
    }
}
