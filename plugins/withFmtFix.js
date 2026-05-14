// This plugin modifies the iOS Podfile to add a post_install hook that sets FMT_USE_CONSTEXPR=0 for the fmt pod, fixing a known issue with fmt on iOS.
// This issue started after updating xcode to v24.4.1 from v15.6.1
const { withPodfile } = require("@expo/config-plugins");

module.exports = function withFmtFix(config) {
  return withPodfile(config, (config) => {
    let contents = config.modResults.contents;

    // Avoid duplicate injection
    if (contents.includes("FMT_USE_CONSTEXPR=0")) {
      return config;
    }

    const fmtFixBlock = `
  #  Fix fmt consteval issue (auto-added)
  installer.pods_project.targets.each do |target|
    if target.name == 'fmt' || target.name.include?('fmt')
      target.build_configurations.each do |config|
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FMT_USE_CONSTEXPR=0'
        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'gnu++17'
      end
    end
  end
`;

    // Inject right AFTER react_native_post_install
    contents = contents.replace(
      /react_native_post_install\([\s\S]*?\)\n/,
      (match) => match + fmtFixBlock,
    );

    config.modResults.contents = contents;
    return config;
  });
};
