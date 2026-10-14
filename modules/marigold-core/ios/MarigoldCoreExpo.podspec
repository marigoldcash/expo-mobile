# The wallet core for iOS: the XCFramework and the Swift binding that scripts/fetch-core.js unpacks into
# Frameworks/ and Generated/, and the Expo module that exposes them to JavaScript.
# The pod is not called MarigoldCore because the generated binding has a class of that name.
Pod::Spec.new do |s|
  s.name           = 'MarigoldCoreExpo'
  s.version        = '1.0.0'
  s.summary        = 'The Marigold wallet core'
  s.description    = 'The Rust wallet core of Marigold, with its Swift binding, as an Expo module.'
  s.author         = 'marigold.cash Ltd'
  s.homepage       = 'https://marigold.cash'
  s.license        = { :type => 'MIT' }
  s.platforms      = {
    :ios => '16.4'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = ['*.swift', 'Generated/*.swift']
  s.vendored_frameworks = 'Frameworks/MarigoldCore.xcframework'
  # What the Rust library needs from the system.
  s.libraries = 'resolv', 'c++'
  s.frameworks = 'Security', 'SystemConfiguration', 'CoreFoundation'
end
