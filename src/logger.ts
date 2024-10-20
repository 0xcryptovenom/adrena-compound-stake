import { SETTINGS } from "./settings";

const createLogFn = (method: "log" | "error" | "debug") =>
  function logFn(...args: unknown[]) {
    if (method !== "debug" || SETTINGS.DEBUG) {
      console[method](
        "[ADRENA-COMPOUND-STAKE]",
        new Date().toISOString(),
        ...args,
      );
    }
  };

export const logger = {
  log: createLogFn("log"),
  debug: createLogFn("debug"),
  error: createLogFn("error"),
};
