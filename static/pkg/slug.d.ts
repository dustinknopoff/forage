/* tslint:disable */
/* eslint-disable */
/**
* Convert any unicode string to an ascii "slug" (useful for file names/url components)
*
* The returned "slug" will consist of a-z, 0-9, and '-'. Furthermore, a slug will
* never contain more than one '-' in a row and will never start or end with '-'.
*
* ```rust
* use self::slug::slugify;
*
* assert_eq!(slugify("My Test String!!!1!1"), "my-test-string-1-1");
* assert_eq!(slugify("test\nit   now!"), "test-it-now");
* assert_eq!(slugify("  --test_-_cool"), "test-cool");
* assert_eq!(slugify("Æúű--cool?"), "aeuu-cool");
* assert_eq!(slugify("You & Me"), "you-me");
* assert_eq!(slugify("user@example.com"), "user-example-com");
* ```
* @param {string} s
* @returns {string}
*/
export function slugify(s: string): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly slugify: (a: number, b: number, c: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_malloc: (a: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number) => number;
  readonly __wbindgen_free: (a: number, b: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {SyncInitInput} module
*
* @returns {InitOutput}
*/
export function initSync(module: SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
