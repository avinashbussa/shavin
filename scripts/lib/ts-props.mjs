/**
 * Fallback prop extraction via the TypeScript compiler API.
 * Used by gen-manifest for components whose props are not a plain
 * `export interface NameProps { ... }` (type aliases, inline param types,
 * Radix/forwardRef wrappers). Returns only props declared in project code or
 * third-party UI libs (e.g. Radix) — DOM/React base attributes are dropped
 * and reported via `inherits`.
 */
import ts from "typescript";
import { join } from "node:path";

let cache = null;
function getProgram(uiDir, files) {
  if (cache) return cache;
  const cfgPath = join(uiDir, "tsconfig.json");
  const cfg = ts.readConfigFile(cfgPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(cfg.config, ts.sys, uiDir);
  const program = ts.createProgram({ rootNames: files, options: { ...parsed.options, noEmit: true } });
  cache = { program, checker: program.getTypeChecker() };
  return cache;
}

const BASE = /node_modules\/(typescript|@types\/react|@types\/react-dom|csstype)\/|node_modules\/typescript\/lib\//;

const LITERAL = ts.TypeFlags.StringLiteral | ts.TypeFlags.NumberLiteral;

/**
 * A prop's type as text. Unions of string/number literals are always spelled
 * out ("horizontal" | "vertical"), never as a library alias (Orientation): some
 * Radix releases export the alias and some inline it, so the alias form would
 * make components.json depend on which patch version is installed.
 */
function typeText(checker, t, d) {
  const flags = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope;
  if (t.isUnion()) {
    const members = t.types.filter((m) => !(m.flags & ts.TypeFlags.Undefined));
    if (members.length > 1 && members.every((m) => m.flags & LITERAL)) {
      return members.map((m) => checker.typeToString(m, d, flags)).join(" | ");
    }
  }
  // @types/react 19.3 prints RefObject<T | null> where 19.2 printed RefObject<T>.
  return checker.typeToString(t, d, flags).replace(/ \| undefined$/, "").replace(/RefObject<(.+?) \| null>/g, "RefObject<$1>");
}

export function tsProps(uiDir, absFiles, absFile, name) {
  const { program, checker } = getProgram(uiDir, absFiles);
  const sf = program.getSourceFile(absFile);
  if (!sf) return null;
  const mod = checker.getSymbolAtLocation(sf);
  const sym = mod && checker.getExportsOfModule(mod).find((s) => s.name === name);
  if (!sym) return null;
  const decl = sym.valueDeclaration ?? sym.declarations?.[0];
  if (!decl) return null;
  const type = checker.getTypeOfSymbolAtLocation(sym, decl);
  const sig = type.getCallSignatures()[0];
  const param = sig?.getParameters()[0];
  if (!param) return null;
  const pType = checker.getTypeOfSymbolAtLocation(param, param.valueDeclaration ?? decl);
  const props = [];
  let dropped = 0;
  for (const p of checker.getPropertiesOfType(pType)) {
    const d = p.declarations?.[0];
    if (!d) continue;
    const file = d.getSourceFile().fileName;
    if (BASE.test(file) || /^(aria-|data-)/.test(p.name) || /^on[A-Z]/.test(p.name) && BASE.test(file)) { dropped++; continue; }
    if (["children", "className", "style", "ref", "key"].includes(p.name) && BASE.test(file)) { dropped++; continue; }
    const t = checker.getTypeOfSymbolAtLocation(p, d);
    const optional = !!(p.flags & ts.SymbolFlags.Optional);
    const doc = ts.displayPartsToString(p.getDocumentationComment(checker)).replace(/\s+/g, " ").trim();
    const defTag = p.getJsDocTags().find((x) => x.name === "default");
    const def = defTag ? ts.displayPartsToString(defTag.text).replace(/["']/g, "").trim() : undefined;
    props.push({
      name: p.name,
      type: typeText(checker, t, d),
      required: !optional,
      doc,
      ...(def ? { default: def } : {}),
    });
  }
  props.sort((a, b) => a.name.localeCompare(b.name));
  return { props, inherits: dropped > 0 };
}
