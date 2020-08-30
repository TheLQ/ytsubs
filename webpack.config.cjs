// import path from "path";
const path = require("path")
const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = {
  entry: "./src/web/index.ts",
  devtool: "inline-source-map",
  // note: This will break Vue in the browser! 
  // target: "node",

  module: {
    rules: [
      // {
      //   test: /\.node$/,
      //   use: "node-loader"
      // },
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
            // get some very strange errors without this
            // export 'default' (imported as 'mod') was not found in
            options: { appendTsSuffixTo: [/\.vue$/] }
          }
        ]
      }
    ]
  },
  mode: "production",
  resolve: {
    extensions: [
      ".tsx",
      ".ts",
      ".js",
      ".mjs",
      ".js",
      ".vue",
      ".json",
      ".gql",
      ".graphql"
    ]
  },
  plugins: [
    // make sure to include the plugin!
    new VueLoaderPlugin()
  ],
  devtool: "source-map",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist", "client")
  }
};
