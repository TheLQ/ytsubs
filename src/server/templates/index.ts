// "npm run templates" puts this in dist
// import "./precompiled.cjs";
import fs from "fs";
import Handlebars, { HelperOptions } from "handlebars";
import Path from "path";
import process from "process";
import { promiseAllThrow } from "../util/apputil";
import { WrappedError } from "../util/error";
import logger from "../util/logger";

const log = logger("server/templates");
// eslint-disable-next-line no-undefined
const PROD = process.env.PROD !== undefined || false;

Handlebars.registerHelper("nl2br", (text) => {
  const result: string =
    typeof text === "string"
      ? text.replace(/\n/gu, "<br/>")
      : JSON.stringify(text);
  return new Handlebars.SafeString(result);
});
// this argument fixes "`this` implicitly has type `any`" TS error
Handlebars.registerHelper(
  "ifequals",
  function ifEqualsHandler(this: any, a, b, options: HelperOptions) {
    if (a === b) {
      return options.fn(this);
    }
    return options.inverse(this);
  }
);
// not created for templates
if (Handlebars.templates === undefined) {
  /*
    Typescript def says templates is readonly, but only because Precompiled templates init it
    Our on-demand templates simply re-use that map
    */
  (Handlebars as any).templates = {};
}

export async function initHandlebars() {
  if (PROD) {
    loadPartials();
  } else {
    await promiseAllThrow(
      [
        loadCachedTemplate("partialBodyStart"),
        loadCachedTemplate("partialHead"),
      ],
      "Failed to load partials"
    );

    loadPartials();
  }
}

export async function reload(): Promise<void> {
  if (PROD) {
    throw new Error("Cannot reload prod");
  }

  const promises = Object.keys(Handlebars.templates).map((template) =>
    loadCachedTemplate(template, false)
  );
  await promiseAllThrow(promises, "Unable to reload templates");

  // partials may of changed
  loadPartials();
}

function loadPartials(): void {
  // Load all partial templates
  for (const template of Object.keys(Handlebars.templates)) {
    if (template.startsWith("partial")) {
      // Strip extension
      const name = template.substr(0, template.indexOf("."));
      Handlebars.registerPartial(name, Handlebars.templates[template]);
      log.silly(`loaded partial ${name}`);
    }
  }
}

async function loadCachedTemplate(
  name: string,
  addExtension = true
): Promise<void> {
  const filename = addExtension ? `${name}.hbs` : name;
  const path = Path.join("src", "server", "templates", filename);

  try {
    const content = await fs.promises.readFile(path);
    Handlebars.templates[filename] = Handlebars.compile(content.toString());
    log.silly(`loaded template ${path}`);
  } catch (e) {
    throw new WrappedError(`cannot load template ${path}`, e);
  }
}

export async function loadTemplate(
  name: string
): Promise<HandlebarsTemplateDelegate> {
  const filename = `${name}.hbs`;
  if (!(filename in Handlebars.templates)) {
    await loadCachedTemplate(name);
  }
  return Handlebars.templates[filename];
}
