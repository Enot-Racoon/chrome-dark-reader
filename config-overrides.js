class WebpackConfig {
  #config;
  #env;

  constructor(config, env) {
    this.#config = config;
    this.#env = env;
  }

  get config() {
    return this.#config;
  }

  patchEntry(dataOrCallback) {
    this.#config.entry = dataOrCallback.call
      ? dataOrCallback.call(null, this.#config.entry)
      : dataOrCallback;

    return this;
  }

  patchOutput(dataOrCallback) {
    this.#config.output = dataOrCallback.call
      ? dataOrCallback.call(null, this.#config.output)
      : Object.assign(this.#config.output, dataOrCallback);

    return this;
  }

  removePlugins = (...pluginNames) => {
    const names = pluginNames.flat();
    this.#config.plugins = this.#config.plugins.filter(
      (plugin) => !names.includes(plugin.constructor.name)
    );

    return this;
  };

  patchPlugin(pluginName, dataOrCallback) {
    const pluginIndex = this.#config.plugins.findIndex(
      (plugin) => plugin.constructor.name === pluginName
    );

    if (pluginIndex > -1) {
      const plugin = this.#config.plugins[pluginIndex];

      this.#config.plugins[pluginIndex] = Object.assign(
        plugin,
        dataOrCallback.call ? dataOrCallback.call(null, plugin) : dataOrCallback
      );
    }

    return this;
  }

  log(useJson = false, off = false) {
    try {
      !off &&
        console.log(
          "\nRunning webpack with: ",
          useJson ? JSON.stringify(this.#config, null, 2) : this.#config
        );
    } catch (e) {
      //
    }

    return this;
  }
}

module.exports = (config, env) => {
  const SRC_DIR = `${__dirname}/src`;
  return new WebpackConfig(config, env)
    .patchEntry({
      popup: `${SRC_DIR}/popup.tsx`,
      setting: `${SRC_DIR}/index.tsx`,
      foreground: `${SRC_DIR}/foreground.ts`,
      background: `${SRC_DIR}/background.ts`,
    })
    .patchOutput({
      filename: "static/js/[name].js",
      chunkFilename: "static/js/[name].chunk.js",
      assetModuleFilename: "static/media/[name][ext]",
    })
    .patchPlugin("MiniCssExtractPlugin", ({ options }) => ({
      options: {
        ...options,
        filename: "static/css/[name].css",
        chunkFilename: "static/css/[name].chunk.css",
      },
    }))
    .removePlugins("HtmlWebpackPlugin", "WebpackManifestPlugin")
    .log(true, true).config;
};
