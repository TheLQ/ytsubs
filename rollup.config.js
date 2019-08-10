// rollup.config.js
import typescript from "rollup-plugin-typescript";
import resolve from "rollup-plugin-node-resolve";
// import nodeGlobals from 'rollup-plugin-node-globals';
import replace from "rollup-plugin-replace";
import sourcemaps from "rollup-plugin-sourcemaps";
import VuePlugin from "rollup-plugin-vue";
import commonjs from "rollup-plugin-commonjs";

export default [
  {
    input: "./src/web/index.ts",
    plugins: [
      resolve(),
      // Use officially recommended replace instead of this
      // nodeGlobals(),
      replace({
        "process.env.NODE_ENV": JSON.stringify("development")
      }),
      commonjs(),
      VuePlugin(),
      sourcemaps(),
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
  // }, {
  //     input: './src/cli/index.ts',
  //     plugins: [
  //         resolve({
  //             preferBuiltins: true
  //         }),
  //         commonjs(),
  //         VuePlugin(),
  //         sourcemaps(),
  //         typescript(),
  //     ],
  //     external: [
  //         'http'
  //     ],
  //     output: [
  //         {
  //             file: 'dist/js/cli.js',
  //             format: 'cjs'
  //         }
  //     ]
  // }
];
