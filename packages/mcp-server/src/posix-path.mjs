import path from "node:path";

/** Forward-slash form of a path. Skill files are keyed and compared with "/" (references/compositions/..., SKILL.md frontmatter). */
export const toPosix = (p) => String(p).split("\\").join("/");

/** `path.relative(from, to)` with "/" separators on every platform. `pathImpl` is for tests (e.g. `path.win32`). */
export const relPosix = (from, to, pathImpl = path) => toPosix(pathImpl.relative(from, to));
