// import path from "path";
const path = require("path")
const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = {
  entry: "./src/web/index.ts",
  devtool: "inline-source-map",
  target: "node",
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
        use: "ts-loader",
        exclude: /node_modules/
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
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist")
  }
};
