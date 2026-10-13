import { describe, it, expect } from "vitest";
import { findHexViolations, looksLikeColorHex } from "../../packages/block-schema/hex-policy.mjs";

const FLAG: [string, string, ("css" | "js")?][] = [
  ["tailwind arbitrary bg", `<div className="bg-[#1a1a2e] p-4" />`],
  ["tailwind arbitrary text digits", `<p className="text-[#142]">x</p>`],
  ["tailwind arbitrary fill", `<svg className="fill-[#333]" />`],
  ["tailwind arbitrary css var", `<div className="[--x:#123456]" />`],
  ["tailwind shadow arbitrary", `<div className="shadow-[0_0_0_1px_#111]" />`],
  ["style object color", `<div style={{color:"#333"}} />`],
  ["style object border shorthand", `<div style={{ border: "1px solid #142" }} />`],
  ["style string attr", `<div style="color: #142" />`],
  ["color key digits", `const t = { color: "#142" };`],
  ["backgroundColor key", `backgroundColor: "#1543",`],
  ["json colour key", `"color": "#142"`],
  ["*Color key", `const brandColor = "#142";`],
  ["stopColor attr", `<stop offset="0%" stopColor="#ffffff" />`],
  ["stop-color attr", `<stop stop-color="#142" />`],
  ["fill attr", `<path fill="#142" />`],
  ["stroke attr", `<path stroke='#999' />`],
  ["standalone #fff", `const c = "#fff";`],
  ["standalone #000", `const c = '#000';`],
  ["standalone grey #999", `const c = "#999";`],
  ["standalone 6 digit", `const c = "#123456";`],
  ["standalone 8 digit", `const c = "#12345678";`],
  ["standalone hex letters", `accent: "#bdee63",`],
  ["standalone in array", `const palette = ["#ef4444", "#22c55e"];`],
  ["standalone alpha suffix", `const c = "#142/50";`],
  ["gradient in string", `const g = "linear-gradient(90deg, #142 0%, #000 100%)";`],
  ["template literal standalone", "const c = `#abc`;"],
  ["fallback ?? hex", `x?.hex ?? "#bdee63"`],
  ["css file", `.a { color: #142; }`, "css"],
  ["css file var", `:root { --brand: #123; }`, "css"],
];

const NO_FLAG: [string, string, ("css" | "js")?][] = [
  ["order number jsx text", `<span>Order #1543</span>`],
  ["store number jsx text", `<Text>Shell #4410</Text>`],
  ["apostrophe jsx text", `<Text>Trader Joe's #142</Text>`],
  ["store number data string", `merchant: "Fred Meyer #376",`],
  ["PR ref", `title: "PR #12 merged"`],
  ["invoice id", `const label = "Invoice #A1B2-77";`],
  ["digit-only short id in data", `const id = "#142";`],
  ["digit-only 4 id in data", `{ ref: "#1543" }`],
  ["href fragment", `<a href="#faq">FAQ</a>`],
  ["href fragment hex-looking", `<a href="#add">Add</a>`],
  ["to fragment", `<Link to="#bad">x</Link>`],
  ["template fragment", "const url = `#${id}`;"],
  ["path fragment", `const u = "/docs#abc";`],
  ["svg url ref", `<path fill="url(#abc)" />`],
  ["html entity", `<span>&#123;</span>`],
  ["markdown heading", `const md = "# Add a section";`],
  ["markdown h2", `const md = "## Deadbeef";`],
  ["5-digit run", `<span>Ticket #15432</span>`],
  ["hex in prose with words", `description: "Use #fff for white text"`],
  ["css url fragment", `.a { fill: url(#abc); }`, "css"],
];

describe("hex-policy: flags colour hex", () => {
  it.each(FLAG)("%s", (_name, src, lang) => {
    expect(findHexViolations(src, { lang }).length).toBeGreaterThan(0);
  });
});

describe("hex-policy: ignores content hex", () => {
  it.each(NO_FLAG)("%s", (_name, src, lang) => {
    expect(findHexViolations(src, { lang })).toEqual([]);
  });
});

describe("hex-policy: details", () => {
  it("reports line + reason per match in multi-line source", () => {
    const src = `<Card>\n  <Text>Order #1543</Text>\n  <div className="bg-[#1a1a2e]" style={{ color: "#333" }} />\n</Card>`;
    const v = findHexViolations(src);
    expect(v.map((x) => [x.hex, x.line, x.reason])).toEqual([
      ["#1a1a2e", 3, "arbitrary-class"],
      ["#333", 3, "style"],
    ]);
    expect(src.slice(v[0].index, v[0].index + 7)).toBe("#1a1a2e");
  });

  it("infers css from filename", () => {
    expect(findHexViolations("a { b: #142 }", { filename: "x.scss" })).toHaveLength(1);
    expect(findHexViolations("a { b: #142 }", { filename: "x.tsx" })).toHaveLength(0);
  });

  it.each([
    ["#fff", true], ["#000", true], ["#142", false], ["#1543", false], ["#123456", true], ["#1a2", true],
  ] as const)("looksLikeColorHex(%s) = %s", (hex, want) => {
    expect(looksLikeColorHex(hex)).toBe(want);
  });
});
