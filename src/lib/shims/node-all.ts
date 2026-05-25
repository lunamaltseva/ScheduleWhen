// Catch-all stub for Node.js built-ins used by @anthropic-ai/sdk server-only code.
// None of these are ever called in the browser build.
const noop = () => undefined;
export const promisify = () => noop;
export const execFile = noop;
export const Readable = class {};
export const pipeline = noop;
export const PassThrough = class {};
export const Transform = class {};
export const Writable = class {};
export default {};
