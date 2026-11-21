export class DemoModeError extends Error {
  constructor(actionName = "This action") {
    super(`${actionName} is disabled in demo mode.`);
    this.name = "DemoModeError";
  }
}

/**
 * Checks if the application is currently running in public DEMO_MODE.
 * Reads directly from process.env for lightweight, universal access.
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true" || process.env.DEMO_MODE === "1";
}

/**
 * Guard that must be called as the first line of any mutating or quota-spending action.
 * Throws a typed DemoModeError when DEMO_MODE is active.
 */
export function assertWritable(actionName = "This action"): void {
  if (isDemoMode()) {
    throw new DemoModeError(actionName);
  }
}
