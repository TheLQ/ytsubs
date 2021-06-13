import tripleBeam from "triple-beam";
import winston from "winston";

export default function getLogger(filename: string): winston.Logger {
  // validate filename avoiding copy paste errors
  // TODO: this is going to break when webpacked, as all files will come from singleFileApp.js
  if (true) {
    const stack: any = {};
    Error.captureStackTrace(stack, getLogger);

    // re parse error message sillyness because node does not have Error.prepareStackTrace
    // Also __filename is undefined in es6 mode?

    // last frame
    // at getLogger (file:///some/folder/ytsubs/src/server/util/logger.ts:50:13)
    let lastCallSite: string = stack.stack.split("\n")[1];

    // filename is between ()
    if (lastCallSite.indexOf("(") !== -1 && lastCallSite.indexOf(")")) {
      lastCallSite = lastCallSite.substr(lastCallSite.indexOf("(") + 1);
      lastCallSite = lastCallSite.substr(0, lastCallSite.lastIndexOf(")") - 1);
    }

    // strip line and character number
    lastCallSite = lastCallSite.substr(0, lastCallSite.lastIndexOf(":"));
    lastCallSite = lastCallSite.substr(0, lastCallSite.lastIndexOf(":"));

    // remove root dir (assume file:// url)
    let rootName = "/dist/";
    let rootPos = lastCallSite.lastIndexOf(rootName);
    if (rootPos === -1) {
      // using sourceMaps
      rootName = "/src/";
      rootPos = lastCallSite.lastIndexOf(rootName);
    }
    if (rootPos === -1) {
      throw new Error(`Can't find root dir in ${lastCallSite}`);
    }
    lastCallSite = lastCallSite.substr(rootPos + rootName.length);

    // remove extension because irrelevant noise
    lastCallSite = lastCallSite.substr(0, lastCallSite.lastIndexOf("."));

    // remove index because irrelevant noise
    if (lastCallSite.endsWith("/index")) {
      lastCallSite = lastCallSite.substr(0, lastCallSite.indexOf("/index"));
    }

    if (filename !== lastCallSite) {
      throw new Error("expected filename " + lastCallSite + " got " + filename);
    }
  }

  if (winston.loggers.has(filename)) {
    return winston.loggers.get(filename);
  }

  return winston.loggers.add(filename, {
    format: winston.format.combine(
      // setup
      winston.format.label({ label: "category one" }),
      winston.format.timestamp(),
      // transform
      winston.format.errors(),
      // display
      winston.format.cli(),
      winston.format((info, opts) => {
        // TS Workaround: Type 'unique symbol' cannot be used as an index
        info[tripleBeam.MESSAGE as any] = `${info.timestamp} ${filename} ${
          info[tripleBeam.MESSAGE as any]
        }`;
        return info;
      })()
    ),
    transports: [new winston.transports.Console({ level: "silly" })],
  });
}
