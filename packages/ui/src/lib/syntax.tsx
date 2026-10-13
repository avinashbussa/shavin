import * as React from "react";
import type { ReactNode } from "react";

export type SupportedLanguage =
  | "tsx"
  | "typescript"
  | "jsx"
  | "javascript"
  | "html"
  | "css"
  | "scss"
  | "json"
  | "bash"
  | "shell"
  | "python"
  | "sql"
  | "markdown"
  | string;

interface TokenRule {
  className: string;
  re: RegExp;
}

// 1. TSX / TS / JSX / JS / React (Comprehensive VSCode-style syntax)
const JS_TSX_RULES: TokenRule[] = [
  { className: "text-code-comment italic", re: /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/ },
  { className: "text-code-string", re: /(`(?:\\.|[^`])*`|"(?:\\.|[^"])*"|'(?:\\.|[^'])*')/ },
  { className: "text-code-keyword font-medium", re: /\b(import|from|export|default|const|let|var|return|function|new|async|await|type|interface|class|extends|implements|try|catch|finally|throw|if|else|switch|case|break|continue|for|while|do|in|of|typeof|instanceof|as|enum|namespace|declare|readonly|public|private|protected|static|override|satisfies)\b/ },
  { className: "text-code-type font-medium", re: /\b(string|number|boolean|any|void|unknown|never|object|symbol|bigint|Record|Array|Promise|Partial|Required|Readonly|Pick|Omit|Exclude|Extract|NonNullable|Parameters|ReturnType|InstanceType|ReactNode|JSX\.Element|HTMLAttributes|ComponentProps)\b/ },
  { className: "text-code-num", re: /\b(true|false|null|undefined|NaN|Infinity|\d+(?:\.\d+)?)\b/ },
  { className: "text-code-type font-semibold", re: /(<\/?[A-Z][\w.-]*(?:\.[A-Z][\w.-]*)?)/ },
  { className: "text-code-tag", re: /(<\/?[a-z][\w.-]*)/ },
  { className: "text-code-attr", re: /(\b[a-zA-Z_][\w-]*(?=\s*=))/ },
  { className: "text-code-fn", re: /(\b[a-zA-Z_$][\w$]*(?=\s*\())/ },
  { className: "text-code-punct", re: /(\/>|<\/?|>=|=>|===|!==|==|!=|<=|&&|\|\||\?\?|\?|:|\+\+|--|\+|-|\*|\/|%|\^|&|\||~|!|=|[-+*\/=<>!&|{}()\[\];,])/ },
];

// 2. HTML / XML / SVG
const HTML_RULES: TokenRule[] = [
  { className: "text-code-comment italic", re: /(<!--[\s\S]*?-->)/ },
  { className: "text-code-string", re: /("(?:\\.|[^"])*"|'(?:\\.|[^'])*')/ },
  { className: "text-code-tag font-semibold", re: /(<\/?[a-zA-Z0-9:-]+)/ },
  { className: "text-code-attr", re: /(\b[a-zA-Z0-9_:-]+(?=\s*=))/ },
  { className: "text-code-keyword", re: /(&[a-zA-Z0-9#]+;)/ },
  { className: "text-code-punct", re: /(\/?>|<\/?|=)/ },
];

// 3. CSS / SCSS / PostCSS
const CSS_RULES: TokenRule[] = [
  { className: "text-code-comment italic", re: /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)/ },
  { className: "text-code-string", re: /("(?:\\.|[^"])*"|'(?:\\.|[^'])*')/ },
  { className: "text-code-keyword font-semibold", re: /(@[a-zA-Z_-]+|\.[a-zA-Z0-9_-]+|#[a-zA-Z0-9_-]+|::?[a-zA-Z0-9_-]+)/ },
  { className: "text-code-prop", re: /(\b[a-z-]+(?=\s*:))/ },
  { className: "text-code-fn", re: /\b(var|calc|rgb|rgba|hsl|hsla|linear-gradient|radial-gradient|url|min|max|clamp)(?=\()/ },
  { className: "text-code-num", re: /(-?\b\d+(?:\.\d+)?(?:px|rem|em|vh|vw|%|s|ms|deg|fr|ch|dvh)?\b|#[0-9a-fA-F]{3,8}\b)/ },
  { className: "text-code-punct", re: /([{}():;,\/!*+>~])/ },
];

// 4. JSON
const JSON_RULES: TokenRule[] = [
  { className: "text-code-prop font-medium", re: /("(?:\\.|[^"])*")(?=\s*:)/ },
  { className: "text-code-string", re: /("(?:\\.|[^"])*")/ },
  { className: "text-code-num", re: /(-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)/ },
  { className: "text-code-keyword font-semibold", re: /\b(true|false|null)\b/ },
  { className: "text-code-punct", re: /([{}[\]:,])/ },
];

// 5. Bash / Shell / Terminal / Zsh
const BASH_RULES: TokenRule[] = [
  { className: "text-code-comment italic", re: /(#[^\n]*)/ },
  { className: "text-code-string", re: /("(?:\\.|[^"])*"|'(?:\\.|[^'])*'|`[^`]*`)/ },
  { className: "text-code-keyword font-semibold", re: /\b(npm|npx|pnpm|yarn|bun|git|cd|mkdir|rm|cp|mv|echo|cat|grep|node|curl|wget|chmod|export|if|then|fi|for|do|done|while|case|esac|source|sudo|code)\b/ },
  { className: "text-code-attr", re: /(-{1,2}[a-zA-Z0-9_-]+)/ },
  { className: "text-code-type font-medium", re: /(\$[a-zA-Z0-9_]+|\$\{[^}]+\})/ },
  { className: "text-code-num", re: /\b\d+\b/ },
  { className: "text-code-punct", re: /([|&;><=\\()\[\]{}])/ },
];

// 6. Python
const PYTHON_RULES: TokenRule[] = [
  { className: "text-code-comment italic", re: /(#[^\n]*)/ },
  { className: "text-code-string", re: /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"])*"|'(?:\\.|[^'])*')/ },
  { className: "text-code-keyword font-medium", re: /\b(def|class|return|import|from|as|if|elif|else|for|while|try|except|finally|with|lambda|yield|raise|pass|break|continue|global|nonlocal|async|await|and|or|not|in|is)\b/ },
  { className: "text-code-fn", re: /\b(print|len|range|str|int|float|list|dict|set|tuple|bool|open|type|isinstance|enumerate|zip|map|filter|super|getattr|setattr|hasattr)\b/ },
  { className: "text-code-num", re: /\b(True|False|None|\d+(?:\.\d+)?)\b/ },
  { className: "text-code-type font-semibold", re: /\b[A-Z][a-zA-Z0-9_]*\b/ },
  { className: "text-code-punct", re: /([+\-*/%=<>!&|^~:;,\.()\[\]{}@])/ },
];

// 7. SQL
const SQL_RULES: TokenRule[] = [
  { className: "text-code-comment italic", re: /(--[^\n]*|\/\*[\s\S]*?\*\/)/ },
  { className: "text-code-string", re: /('(?:\\.|[^'])*'|"(?:\\.|[^"])*")/ },
  { className: "text-code-keyword font-semibold", re: /\b(SELECT|FROM|WHERE|INSERT|INTO|UPDATE|DELETE|JOIN|LEFT|RIGHT|INNER|OUTER|FULL|CROSS|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|AS|ON|AND|OR|NOT|IN|IS|NULL|CREATE|TABLE|DROP|ALTER|PRIMARY|KEY|FOREIGN|REFERENCES|UNION|ALL|DISTINCT|VALUES|SET|INDEX|VIEW|DATABASE|SCHEMA|CASE|WHEN|THEN|ELSE|END|EXISTS|BETWEEN|LIKE|ASC|DESC)\b/i },
  { className: "text-code-fn", re: /\b(COUNT|SUM|AVG|MIN|MAX|COALESCE|CONCAT|NOW|DATE|LOWER|UPPER|TRIM|SUBSTRING|ROUND|CAST)\b(?=\()/i },
  { className: "text-code-num", re: /\b\d+(?:\.\d+)?\b/ },
  { className: "text-code-punct", re: /([,;.()=*<>+-])/ },
];

/**
 * Resolves grammar rules based on language string or filename extension
 */
export function getLanguageRules(languageOrFilename?: string): TokenRule[] {
  if (!languageOrFilename) return JS_TSX_RULES;
  const lang = languageOrFilename.toLowerCase().trim();

  // HTML / XML
  if (lang === "html" || lang === "xml" || lang === "svg" || lang.endsWith(".html") || lang.endsWith(".xml") || lang.endsWith(".svg")) {
    return HTML_RULES;
  }
  // CSS / SCSS
  if (lang === "css" || lang === "scss" || lang === "postcss" || lang.endsWith(".css") || lang.endsWith(".scss")) {
    return CSS_RULES;
  }
  // JSON
  if (lang === "json" || lang.endsWith(".json")) {
    return JSON_RULES;
  }
  // Bash / Shell
  if (lang === "bash" || lang === "sh" || lang === "shell" || lang === "zsh" || lang === "terminal" || lang.endsWith(".sh") || lang.endsWith(".bash")) {
    return BASH_RULES;
  }
  // Python
  if (lang === "python" || lang === "py" || lang.endsWith(".py")) {
    return PYTHON_RULES;
  }
  // SQL
  if (lang === "sql" || lang.endsWith(".sql")) {
    return SQL_RULES;
  }
  // Default to JavaScript / TypeScript / TSX / React
  return JS_TSX_RULES;
}

/**
 * Universal multi-language syntax highlighter that compiles regex token streams
 * into semantic @shavin/ui tokens.
 */
export function highlightCode(code: string, languageOrFilename?: string): ReactNode[] {
  if (!code) return [];
  const rules = getLanguageRules(languageOrFilename);
  const combinedRegex = new RegExp(rules.map((r) => r.re.source).join("|"), "g");

  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  combinedRegex.lastIndex = 0;

  while ((m = combinedRegex.exec(code))) {
    if (m.index > last) {
      out.push(code.slice(last, m.index));
    }
    const matchIndex = rules.findIndex((_, i) => m![i + 1] !== undefined);
    out.push(
      <span key={key++} className={rules[matchIndex]?.className}>
        {m[0]}
      </span>
    );
    last = m.index + m[0].length;
    if (m[0].length === 0) combinedRegex.lastIndex++;
  }

  if (last < code.length) {
    out.push(code.slice(last));
  }

  return out;
}
