/**
 * Minimal typing for the one Node built-in the live test suite imports.
 *
 * The app tsconfig deliberately excludes the whole of `@types/node` so Node globals never
 * leak into application code. The live admin test imports `File` from `node:buffer` because
 * jsdom's `File` is a placeholder object that the storage upload's real HTTP call cannot
 * consume, and this module declaration types exactly that class — nothing more from Node.
 */
declare module 'node:buffer' {
  export class File extends Blob {
    constructor(sources: BlobPart[], name: string, options?: FilePropertyBag)
    readonly lastModified: number
    readonly name: string
  }
}
