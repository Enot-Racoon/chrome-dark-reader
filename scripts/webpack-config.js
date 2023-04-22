/* eslint-disable @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-return */

const WebpackConfigModifier = require("./weppack-modifier");
const entries = require("./webpack-entries");

module.exports = (config, env) => {
  return new WebpackConfigModifier(config, env)
    .patchEntry(entries)
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
    .removePlugins("WebpackManifestPlugin")
    .log(true, true).config;
};
