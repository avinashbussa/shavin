/// <reference types="vitest/globals" />
// Types-only file. The triple-slash reference above makes vitest's globals
// (describe/it/expect/…) known to `tsc --noEmit`, which includes tests via the
// root tsconfig's "**/*.tsx". The import pulls in jest-dom's vitest matcher
// augmentation, and the module block adds jest-axe's matcher (it only ships
// jest types). Keeps the suite type-clean without editing the root tsconfig.
import "@testing-library/jest-dom/vitest";

interface AxeMatchers<R = unknown> {
  toHaveNoViolations(): R;
}

declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<T = any> extends AxeMatchers<T> {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
