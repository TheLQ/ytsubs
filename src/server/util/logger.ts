import winston from "winston";
import tripleBeam from "triple-beam";

export default function getLogger(filename: string): winston.Logger {
  // validate filename avoiding copy paste errors
  // TODO: this is going to break when webpacked, as all files will come from singleFileApp.js
  if (false) {
    const stack: any = {};
    Error.captureStackTrace(stack, getLogger);

    // re parse error message sillyness because node does not have Error.prepareStackTrace
    // Also __filename is undefined in es6 mode?

    // last frame
    let lastCallSite: string = stack.stack.split("\n")[1];
    // filename is between ()
    if (lastCallSite.indexOf("(") != -1 && lastCallSite.indexOf(")")) {
      lastCallSite = lastCallSite.substr(lastCallSite.indexOf("(") + 1);
      lastCallSite = lastCallSite.substr(0, lastCallSite.lastIndexOf(")") - 1);
    }
    // strip line and character number
    lastCallSite = lastCallSite.substr(0, lastCallSite.lastIndexOf(":"));
    lastCallSite = lastCallSite.substr(0, lastCallSite.lastIndexOf(":"));
    // get path (assume file:// url)
    lastCallSite = lastCallSite.substr(
      lastCallSite.lastIndexOf("/dist/") + "/dist/".length
    );
    // remove extension because irrelevant
    lastCallSite = lastCallSite.substr(0, lastCallSite.lastIndexOf("."));
    // skip index
    if (lastCallSite.endsWith("/index")) {
      lastCallSite = lastCallSite.substr(0, lastCallSite.indexOf("/index"));
    }

    if (filename != lastCallSite) {
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
        info[tripleBeam.MESSAGE] = `${info["timestamp"]} ${filename} ${
          info[tripleBeam.MESSAGE]
        }`;
        return info;
      })()
    ),
    transports: [new winston.transports.Console({ level: "silly" })]
  });
}