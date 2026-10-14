import ExpoModulesCore

/// What JavaScript can ask of the wallet core. The functions arrive with PH-M4e; PH-M4c shows the version.
public class MarigoldCoreModule: Module {
  public func definition() -> ModuleDefinition {
    Name("MarigoldCore")

    Function("version") { () -> String in
      coreVersion()
    }
  }
}
