package cash.marigold.core.expo

import cash.marigold.core.BackupInfo
import cash.marigold.core.Classified
import cash.marigold.core.Created
import cash.marigold.core.EventListener
import cash.marigold.core.Given
import cash.marigold.core.LightInfo
import cash.marigold.core.MarigoldCore
import cash.marigold.core.Opened
import cash.marigold.core.PaidOut
import cash.marigold.core.Probe
import cash.marigold.core.Requested
import cash.marigold.core.WalletEntry
import cash.marigold.core.WalletException
import cash.marigold.core.coreVersion
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

/**
 * What JavaScript can ask of the wallet core: the operations of `MarigoldCore` (the generated binding), one for one,
 * with the records as maps, the errors as exceptions that carry the words to show, and the core's events as module
 * events. The typed wrapper over this is `src/index.ts`.
 */
class MarigoldCoreModule : Module() {
  private var core: MarigoldCore? = null

  private val ears = object : EventListener {
    override fun onSay(line: String) = sendEvent("say", mapOf("line" to line))
    override fun onNotesChanged() = sendEvent("notesChanged", mapOf<String, Any>())
    override fun onConnection(connected: Boolean) = sendEvent("connection", mapOf("connected" to connected))
  }

  override fun definition() = ModuleDefinition {
    Name("MarigoldCore")

    Events("say", "notesChanged", "connection")

    Function("version") { coreVersion() }

    // Where the wallets live is the app's own files folder; the network is testnet-10 unless named.
    Function("configure") { network: String? ->
      val context = appContext.reactContext ?: throw CodedException("NotConfigured", "marigold:NotConfigured:The app is not ready yet.", null)
      val folder = File(context.filesDir, "wallets").apply { mkdirs() }
      // An Android app has no home folder, and the wallet library looks for one (`~`) for its settings file.
      android.system.Os.setenv("HOME", context.filesDir.path, true)
      val made = guarded { MarigoldCore(folder.path, network) }
      made.setListener(ears)
      core = made
      dict(made.probe())
    }

    AsyncFunction("listWallets") Coroutine { -> guarded { core().listWallets() }.map(::dict) }
    AsyncFunction("createWallet") Coroutine { name: String, password: String, allowEmpty: Boolean ->
      dict(guarded { core().createWallet(name, password, allowEmpty) })
    }
    AsyncFunction("restoreFromWords") Coroutine { name: String, password: String, words: String ->
      dict(guarded { core().restoreFromWords(name, password, words) })
    }
    AsyncFunction("restoreTelegram") Coroutine { token: String, words: String, name: String ->
      guarded { core().restoreTelegram(token, words, name) }
    }
    AsyncFunction("open") Coroutine { wallet: String, password: String, node: String ->
      dict(guarded { core().open(wallet, password, node) })
    }
    AsyncFunction("closeWallet") Coroutine { -> guarded { core().closeWallet() } }
    AsyncFunction("balance") Coroutine { -> guarded { core().balance() } }
    AsyncFunction("status") Coroutine { -> guarded { core().status() } }
    AsyncFunction("history") Coroutine { -> guarded { core().history() } }
    AsyncFunction("receive") Coroutine { code: String -> guarded { core().receive(code) } }
    AsyncFunction("request") Coroutine { amount: String -> dict(guarded { core().request(amount) }) }
    AsyncFunction("waitRequest") Coroutine { code: String, seconds: Int ->
      guarded { core().waitRequest(code, maxOf(0, seconds).toULong()) }
    }
    Function("payPreview") { code: String -> dict(guarded { core().payPreview(code) }) }
    AsyncFunction("pay") Coroutine { code: String, amount: String -> dict(guarded { core().pay(code, amount) }) }
    AsyncFunction("shareKey") Coroutine { -> guarded { core().shareKey() } }
    AsyncFunction("give") Coroutine { amount: String, key: String, minutes: Int ->
      dict(guarded { core().give(amount, key, maxOf(0, minutes).toULong()) })
    }
    AsyncFunction("recoveryWords") Coroutine { password: String -> guarded { core().recoveryWords(password) } }
    AsyncFunction("changePassword") Coroutine { old: String, new: String, allowEmpty: Boolean ->
      guarded { core().changePassword(old, new, allowEmpty) }
    }
    AsyncFunction("backupStatus") Coroutine { -> dict(guarded { core().backupStatus() }) }
    AsyncFunction("backupNow") Coroutine { -> guarded { core().backupNow() } }
    AsyncFunction("backupAutomatic") Coroutine { on: Boolean -> guarded { core().backupAutomatic(on) } }
    AsyncFunction("backupDecline") Coroutine { -> guarded { core().backupDecline() } }
    AsyncFunction("backupCover") Coroutine { name: String, words: String -> guarded { core().backupCover(name, words) } }
    AsyncFunction("telegramSetup") Coroutine { token: String, pin: String -> guarded { core().telegramSetup(token, pin) } }
    AsyncFunction("connection") Coroutine { ->
      val r = guarded { core().connection() }
      mapOf("connected" to r.connected, "words" to r.words)
    }
    AsyncFunction("resume") Coroutine { -> guarded { core().resume() } }
    AsyncFunction("lightStatus") Coroutine { -> dict(guarded { core().lightStatus() }) }
  }

  private fun core(): MarigoldCore = core ?: throw CodedException("NotConfigured", "marigold:NotConfigured:The wallet core has not been started.", null)

  /** Runs a call of the core and turns its errors into exceptions that carry the words for the person. */
  private inline fun <T> guarded(body: () -> T): T {
    try {
      return body()
    } catch (e: WalletException.NoWalletOpen) {
      throw CodedException("NoWalletOpen", "marigold:NoWalletOpen:No wallet is open.", null)
    } catch (e: WalletException.Network) {
      throw CodedException("Network", "marigold:Network:${e.text}", null)
    } catch (e: WalletException.Failed) {
      throw CodedException("Failed", "marigold:Failed:${e.text}", null)
    }
  }

  // The records of the core, as the maps JavaScript receives.
  private fun dict(r: Probe) = mapOf("folder" to r.folder, "network" to r.network)
  private fun dict(r: WalletEntry) = mapOf("filename" to r.filename, "title" to r.title)
  private fun dict(r: Created) = mapOf("filename" to r.filename, "words" to r.words)
  private fun dict(r: Opened) = mapOf("wallet" to r.wallet, "network" to r.network, "access" to r.access, "ticker" to r.ticker)
  private fun dict(r: Classified) = mapOf("kind" to r.kind, "amount" to r.amount)
  private fun dict(r: PaidOut) = mapOf("receipt" to r.receipt, "value" to r.value, "fee" to r.fee, "notes" to r.notes.toInt())
  private fun dict(r: Given) = mapOf("code" to r.code, "value" to r.value, "fee" to r.fee, "notes" to r.notes.toInt())
  private fun dict(r: Requested) = mapOf("code" to r.code, "amount" to r.amount)
  private fun dict(r: LightInfo) =
    mapOf("active" to r.active, "notes" to r.notes.toDouble(), "anchoredDaa" to r.anchoredDaa.toDouble(), "checkedMs" to r.checkedMs.toDouble())
  private fun dict(r: BackupInfo) = mapOf(
    "destination" to r.destination, "bot" to r.bot, "paired" to r.paired, "pairingCode" to r.pairingCode, "automatic" to r.automatic,
    "offer" to r.offer, "checkpointAt" to r.checkpointAt.toDouble(), "checkpointBytes" to r.checkpointBytes.toDouble(),
    "deltas" to r.deltas.toInt(), "lastPostAt" to r.lastPostAt.toDouble(), "wallets" to r.wallets, "uncovered" to r.uncovered,
    "folder" to r.folder,
  )
}
