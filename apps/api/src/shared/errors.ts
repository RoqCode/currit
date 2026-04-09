import { PollSourceErrorType } from "../features/polling/types";

export class PollingError extends Error {
  code: PollSourceErrorType;

  constructor(code: PollSourceErrorType, message: string) {
    super(message);
    this.name = "PollingError";
    this.code = code;
  }
}

export function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  );
}
