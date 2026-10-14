import ExpoModulesCore
import Foundation

/// What JavaScript can ask of the wallet core: the operations of `MarigoldCore` (the generated binding), one for one,
/// with the records as dictionaries, the errors as exceptions that carry the words to show, and the core's events
/// as module events. The typed wrapper over this is `src/index.ts`.
public class MarigoldCoreModule: Module {
  private var current: MarigoldCore?
  private let ears = Ears()

  public func definition() -> ModuleDefinition {
    Name("MarigoldCore")

    Events("say", "notesChanged", "connection")

    OnCreate {
      self.ears.module = self
    }

    Function("version") { () -> String in
      coreVersion()
    }

    /// Where the wallets live is the app's own documents folder; the network is testnet-10 unless named.
    Function("configure") { (network: String?) throws -> [String: Any] in
      let documents = try FileManager.default.url(for: .documentDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
      let folder = documents.appendingPathComponent("wallets", isDirectory: true)
      try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
      let made = try self.guarded { try MarigoldCore(dataDir: folder.path, network: network) }
      made.setListener(listener: self.ears)
      self.current = made
      return Self.dict(made.probe())
    }

    AsyncFunction("listWallets") { () async throws -> [[String: Any]] in
      try await self.guarded { try await self.core().listWallets() }.map(Self.dict)
    }
    AsyncFunction("createWallet") { (name: String, password: String, allowEmpty: Bool) async throws -> [String: Any] in
      Self.dict(try await self.guarded { try await self.core().createWallet(name: name, password: password, allowEmpty: allowEmpty) })
    }
    AsyncFunction("restoreFromWords") { (name: String, password: String, words: String) async throws -> [String: Any] in
      Self.dict(try await self.guarded { try await self.core().restoreFromWords(name: name, password: password, words: words) })
    }
    AsyncFunction("restoreTelegram") { (token: String, words: String, name: String) async throws -> String in
      try await self.guarded { try await self.core().restoreTelegram(token: token, words: words, name: name) }
    }
    AsyncFunction("open") { (wallet: String, password: String, node: String) async throws -> [String: Any] in
      Self.dict(try await self.guarded { try await self.core().open(wallet: wallet, password: password, node: node) })
    }
    AsyncFunction("closeWallet") { () async throws in
      try await self.core().closeWallet()
    }
    AsyncFunction("balance") { () async throws -> String in
      try await self.guarded { try await self.core().balance() }
    }
    AsyncFunction("status") { () async throws -> String in
      try await self.guarded { try await self.core().status() }
    }
    AsyncFunction("history") { () async throws -> String in
      try await self.guarded { try await self.core().history() }
    }
    AsyncFunction("receive") { (code: String) async throws -> String in
      try await self.guarded { try await self.core().receive(code: code) }
    }
    AsyncFunction("request") { (amount: String) async throws -> [String: Any] in
      Self.dict(try await self.guarded { try await self.core().request(amount: amount) })
    }
    AsyncFunction("waitRequest") { (code: String, seconds: Int) async throws -> String? in
      try await self.guarded { try await self.core().waitRequest(code: code, seconds: UInt64(max(0, seconds))) }
    }
    Function("payPreview") { (code: String) throws -> [String: Any] in
      Self.dict(try self.guarded { try self.core().payPreview(code: code) })
    }
    AsyncFunction("pay") { (code: String, amount: String) async throws -> [String: Any] in
      Self.dict(try await self.guarded { try await self.core().pay(code: code, amount: amount) })
    }
    AsyncFunction("shareKey") { () async throws -> String in
      try await self.guarded { try await self.core().shareKey() }
    }
    AsyncFunction("give") { (amount: String, key: String, minutes: Int) async throws -> [String: Any] in
      Self.dict(try await self.guarded { try await self.core().give(amount: amount, key: key, minutes: UInt64(max(0, minutes))) })
    }
    AsyncFunction("recoveryWords") { (password: String) async throws -> String in
      try await self.guarded { try await self.core().recoveryWords(password: password) }
    }
    AsyncFunction("changePassword") { (old: String, new: String, allowEmpty: Bool) async throws in
      try await self.guarded { try await self.core().changePassword(old: old, new: new, allowEmpty: allowEmpty) }
    }
    AsyncFunction("backupStatus") { () async throws -> [String: Any] in
      Self.dict(try await self.guarded { try await self.core().backupStatus() })
    }
    AsyncFunction("backupNow") { () async throws -> String in
      try await self.guarded { try await self.core().backupNow() }
    }
    AsyncFunction("backupAutomatic") { (on: Bool) async throws in
      try await self.guarded { try await self.core().backupAutomatic(on: on) }
    }
    AsyncFunction("backupDecline") { () async throws in
      try await self.guarded { try await self.core().backupDecline() }
    }
    AsyncFunction("backupCover") { (name: String, words: String) async throws in
      try await self.guarded { try await self.core().backupCover(name: name, words: words) }
    }
    AsyncFunction("telegramSetup") { (token: String, pin: String) async throws -> String in
      try await self.guarded { try await self.core().telegramSetup(token: token, pin: pin) }
    }
    AsyncFunction("lightStatus") { () async throws -> [String: Any] in
      Self.dict(try await self.guarded { try await self.core().lightStatus() })
    }
  }

  private func core() throws -> MarigoldCore {
    guard let current else { throw coreException("NotConfigured", "The wallet core has not been started.") }
    return current
  }

  /// Runs a call of the core and turns its errors into exceptions that carry the words for the person.
  private func guarded<T>(_ body: () throws -> T) throws -> T {
    do { return try body() } catch let error as WalletError { throw coreException(error) }
  }

  private func guarded<T>(_ body: () async throws -> T) async throws -> T {
    do { return try await body() } catch let error as WalletError { throw coreException(error) }
  }

  fileprivate func emit(_ name: String, _ body: [String: Any] = [:]) {
    sendEvent(name, body)
  }

  // The records of the core, as the dictionaries JavaScript receives.
  private static func dict(_ r: Probe) -> [String: Any] { ["folder": r.folder, "network": r.network] }
  private static func dict(_ r: WalletEntry) -> [String: Any] { ["filename": r.filename, "title": r.title] }
  private static func dict(_ r: Created) -> [String: Any] { ["filename": r.filename, "words": r.words] }
  private static func dict(_ r: Opened) -> [String: Any] {
    ["wallet": r.wallet, "network": r.network, "access": r.access, "ticker": r.ticker]
  }
  private static func dict(_ r: Classified) -> [String: Any] { ["kind": r.kind, "amount": r.amount] }
  private static func dict(_ r: PaidOut) -> [String: Any] {
    ["receipt": r.receipt, "value": r.value, "fee": r.fee, "notes": Int(r.notes)]
  }
  private static func dict(_ r: Given) -> [String: Any] {
    ["code": r.code, "value": r.value, "fee": r.fee, "notes": Int(r.notes)]
  }
  private static func dict(_ r: Requested) -> [String: Any] { ["code": r.code, "amount": r.amount] }
  private static func dict(_ r: LightInfo) -> [String: Any] {
    ["active": r.active, "notes": Double(r.notes), "anchoredDaa": Double(r.anchoredDaa), "checkedMs": Double(r.checkedMs)]
  }
  private static func dict(_ r: BackupInfo) -> [String: Any] {
    [
      "destination": r.destination, "bot": r.bot, "paired": r.paired, "pairingCode": r.pairingCode as Any, "automatic": r.automatic,
      "offer": r.offer, "checkpointAt": Double(r.checkpointAt), "checkpointBytes": Double(r.checkpointBytes), "deltas": Int(r.deltas),
      "lastPostAt": Double(r.lastPostAt), "wallets": r.wallets, "uncovered": r.uncovered, "folder": r.folder as Any,
    ]
  }
}

/// An error of the core, with the code JavaScript tells it by and the words to show.
func coreException(_ kind: String, _ words: String) -> Exception {
  Exception(name: kind, description: words, code: kind)
}

func coreException(_ error: WalletError) -> Exception {
  switch error {
  case .NoWalletOpen: return coreException("NoWalletOpen", "No wallet is open.")
  case .Network(let text): return coreException("Network", text)
  case .Failed(let text): return coreException("Failed", text)
  }
}

/// Hears the core and passes what it hears on as module events.
private final class Ears: EventListener, @unchecked Sendable {
  weak var module: MarigoldCoreModule?

  func onSay(line: String) { module?.emit("say", ["line": line]) }
  func onNotesChanged() { module?.emit("notesChanged") }
  func onConnection(connected: Bool) { module?.emit("connection", ["connected": connected]) }
}
