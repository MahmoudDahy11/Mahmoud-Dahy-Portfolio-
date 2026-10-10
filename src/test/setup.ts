import '@testing-library/jest-dom/vitest'

/**
 * Test environment setup, loaded before every test file via `test.setupFiles` in
 * vite.config.ts.
 */

// jsdom does not implement matchMedia, which the theme provider relies on. Tests that
// care about the resolved theme can override this per test; the default keeps
// components that read it from throwing.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

// React Router scrolls to the top on navigation. jsdom has no layout engine and throws a
// "not implemented" notice, so the call is stubbed to keep test output readable.
window.scrollTo = () => {}

// jsdom implements no layout either, so `scrollIntoView` is missing entirely. The dialogs
// call it to bring the field that failed validation into view, and a missing method there
// would reject the submit handler rather than being a harmless no-op.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}
