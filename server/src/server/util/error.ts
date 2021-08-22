export function prettyError(err: any): string {
  let message: string;
  if (err instanceof WrappedError) {
    message = err.toString();
  } else if (err.stack) {
    message = err.stack as string;
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
      .map((entry) => {
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
