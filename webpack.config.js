const path = require("path");

module.exports = {
  entry: "./src/cli/index.ts",
  devtool: "inline-source-map",
  target: "node",
  module: {
    rules: [
      {
        test: /\.node$/,
        use: "node-loader"
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
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist")
  }
};
