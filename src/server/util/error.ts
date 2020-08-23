import { exit } from "process";

const EXIT_FATAL = 5;

export function fatalError(err: any, msg?: string): void {
  if (err instanceof WrappedError) {
    console.log(err.toString());
  } else {
    console.log(err);
  }

  if (typeof msg !== "undefined") {
    console.log(msg);
  }
  exit(EXIT_FATAL);
}

export function prettyError(err: any): string {
  let message: string;
  if (err instanceof WrappedError) {
    message = err.toString();
  } else if (err.stack) {
    const stack = err.stack as string;
    message = stack;
  } else {
    message = JSON.stringify(err) + " (error has no stack)";
  }

  if (typeof err !== "object") {
    message += `\nError type ${typeof err}`;
  }
  return message;
}

export class WrappedError extends Error {
  public causedBy: any[];

  public constructor(message: string, causedBy: any | any[]) {
    super(message);
    if (Array.isArray(causedBy)) {
      this.causedBy = causedBy;
    } else {
      this.causedBy = [causedBy];
    }
  }

  public toString(): string {
    const causedByMessage = this.causedBy
      .map(entry => {
        if (entry instanceof WrappedError) {
          return "->  " + entry.toString().replace(/\r?\n/g, "\n    ");
        } else if (entry.stack) {
          return entry.stack.toString();
        } else {
          return entry.toString();
        }
      })
      .join("\n-----\n");
    return `${this.stack}\ncaused by\n${causedByMessage}`;
  }
}
