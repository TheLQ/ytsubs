// "npm run templates" puts this in dist
// import "./precompiled.cjs";
import logger from "../util/logger";
import Handlebars, { HelperOptions } from "handlebars";
import HandlebarsRuntime from "handlebars/runtime";
import Path from "path";
import { exec } from "child_process";
import fs from "fs";
import process from "process";
import { fatalError } from "../util/error";
import { promiseAllThrow } from "../util/apputil";

const log = logger("server/templates");
// eslint-disable-next-line no-undefined
const PROD = process.env.PROD !== undefined || false;

Handlebars.registerHelper("nl2br", text => {
  const result: string =
    typeof text === "string"
      ? text.replace(/\n/gu, "<br/>")
      : JSON.stringify(text);
  return new Handlebars.SafeString(result);
});
// this argument fixes "`this` implicitly has type `any`" TS error
Handlebars.registerHelper("ifequals", function(
  this: any,
  a,
  b,
  options: HelperOptions
) {
  if (a == b) {
    return options.fn(this);
  }
  return options.inverse(this);
});

function loadPartials(templateSource: any): void {
  // Load all partial templates
  for (const template of Object.keys(templateSource)) {
    if (template.startsWith("partial")) {
      // Strip extension
      const name = template.substr(0, template.indexOf("."));
      Handlebars.registerPartial(name, templateSource[template]);
      log.silly(`loaded partial ${name}`);
    }
  }
}

function initPartials(): void {
  loadCachedTemplate("partialBodyStart");
  loadCachedTemplate("partialHead", () => loadPartials(cachedTemplates));
}

const cachedTemplates: {
  [name: string]: HandlebarsTemplateDelegate;
} = {};
if (PROD) {
  loadPartials(Handlebars.templates);
} else {
  initPartials();
}

export interface Lazy<T> {
  actual: null | T;
  get: HandlebarsTemplateDelegate;
}

export function loadTemplate(name: string): Lazy<HandlebarsTemplateDelegate> {
  let lazy: Lazy<HandlebarsTemplateDelegate>;
  if (PROD) {
    lazy = {
      actual: null,
      get get(): HandlebarsTemplateDelegate {
        return Handlebars.templates[`${name}.hbs`];
      }
    };
  } else {
    lazy = {
      actual: null,
      get get(): HandlebarsTemplateDelegate {
        return cachedTemplates[`${name}.hbs`];
      }
    };

    loadCachedTemplate(name);
  }

  return lazy;
}

async function loadCachedTemplate(
  name: string,
  cb?: () => void
): Promise<void> {
  const path = Path.join("src", "server", "templates", `${name}.hbs`);

  return fs.promises
    .readFile(path)
    .then((val: Buffer) => {
      cachedTemplates[`${name}.hbs`] = Handlebars.compile(val.toString());
      log.silly(`loaded template ${path}`);
    })
    .then(cb)
    .catch(err => fatalError(err, `cannot load template ${path}`));
}

export async function reload(): Promise<void> {
  if (PROD) {
    throw new Error("Cannot reload prod");
  }

  const promises = [];
  for (const template of Object.keys(cachedTemplates)) {
    const name = template.substr(0, template.indexOf("."));
    promises.push(loadCachedTemplate(name));
  }
  await promiseAllThrow(promises, "Unable to reload templates");
  initPartials();
}
