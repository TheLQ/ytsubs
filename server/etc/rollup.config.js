// rollup.config.js
import typescript from "rollup-plugin-typescript";
import resolve from "rollup-plugin-node-resolve";
// import nodeGlobals from 'rollup-plugin-node-globals';
import replace from "rollup-plugin-replace";
import sourcemaps from "rollup-plugin-sourcemaps";
import VuePlugin from "rollup-plugin-vue";
import commonjs from "rollup-plugin-commonjs";
import json from "rollup-plugin-json";
import nodeBuiltins from "rollup-plugin-node-builtins";
import globals from "rollup-plugin-node-globals";
import builtins from "builtin-modules";

export default [
  {
    input: "./src/web/index.ts",
    plugins: [
      json(),
      // Use officially recommended replace instead of this
      // nodeBuiltins(),
      resolve(),
      replace({
        "process.env.NODE_ENV": JSON.stringify("development")
      }),
      commonjs(),
      VuePlugin(),
      // sourcemaps(),
      typescript()
    ],
    output: [
      {
        file: "dist/js/index.js",
        sourcemap: true,
        format: "cjs"
      }
    ]
  }
  /*
  this doesn't work because of 
  (early 2019) some default export errors
  (late 2019) https://github.com/nodejs/readable-stream/issues/348

  instead use tsc to save to dist/jscli and run with node command
  */

  // {
  //   input: "./src/cli/index.ts",
  //   plugins: [

  //     json(),
  //     // globals(),
  //     // nodeBuiltins(),
  //     resolve({
  //       preferBuiltins: true
  //     }),
  //     commonjs({
  //       inclulde: 'node_modules/**',
  //       namedExports: {
  //         'node_modules/graphql/index.mjs': ['graphql']
  //       }
  //     }),
  //     // replace({
  //     //   delimiters: ['', ''],
  //     //   values: {
  //     //     "require('readable-stream/transform')": "require('stream').Transform",
  //     //     'require("readable-stream/transform")': "require('stream').Transform",
  //     //     "require('readable-stream/duplex')": "require('stream').Duplex",
  //     //     'require("readable-stream/duplex")': "require('stream').Duplex",
  //     //     "require('readable-stream/writable')": "require('stream').Writable",
  //     //     'require("readable-stream/writable")': "require('stream').Writable",
  //     //     'readable-stream': 'stream',
  //     //     'if(process.argv[1] && process.argv[1].match(__filename))': 'if(false)'
  //     //   }
  //     // }),
  //     // VuePlugin(),
  //     // sourcemaps(),

  //     typescript()
  //   ],
  //   // external: builtins,
  //   output: [
  //     {
  //       file: "dist/js/cli.mjs",
  //       format: "esm",
  //       sourcemap: true
  //     }
  //   ]
  // }
];
