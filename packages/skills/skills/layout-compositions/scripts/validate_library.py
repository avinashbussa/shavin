#!/usr/bin/env python3
"""Validate the layout-compositions library.

Catches the failure modes found in the v1 catalogue:
  * compositions missing required metadata / labelled sections
  * misaligned ASCII wireframes
  * compositions missing from the selection guide (v1 omitted all of Pricing)
  * page recipes that reference compositions that do not exist
  * the bare-string grid bug (columns="3" gives 3 columns on mobile)

Usage:  python scripts/validate_library.py [path/to/skill-root]
Exit code 1 if any error is found.
"""
import re
import sys
from pathlib import Path

ROOT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent
REFS = ROOT / "references"
COMP_DIR = REFS / "compositions"

REQUIRED_KEYS = ["id", "name", "family", "job", "density", "styles", "treatments",
                 "media", "items", "slots", "motion"]
ENUMS = {
    "job": {"attention", "orientation", "understanding", "credibility", "desire", "action", "reference"},
    "density": {"low", "medium", "high"},
    "styles": {"structural", "marketing", "editorial", "hybrid", "documentation", "expressive"},
    "treatments": {"carded", "ruled", "flat", "full-bleed", "open"},
    "media": {"none", "product-ui", "code", "photo", "illustration", "video", "data", "logos"},
    "motion": {"tier0", "tier1", "choreography-ok"},
}
LIST_KEYS = {"styles", "treatments", "media", "slots"}
REQUIRED_LABELS = ["**Best for:**", "**Avoid when:**", "**Grid:**", "**Contract:**", "**Watch:**"]
ID_RE = re.compile(r"^[A-Z]{1,2}\d+$")
HEADING_RE = re.compile(r"^### ([A-Z]{1,2}\d+) · (.+)$", re.M)
ID_TOKEN = re.compile(r"\b(?:ST|[HFSTCPQGEDX])\d+\b")
BARE_GRID = re.compile(r'columns="\d+"')

errors, warnings = [], []


def fenced_blocks(text):
    """Return [(lang, content)] for every ``` fenced block, pairing fences line by line."""
    blocks, lang, buf, inside = [], "", [], False
    for line in text.splitlines():
        if line.startswith("```"):
            if inside:
                blocks.append((lang, "\n".join(buf)))
                lang, buf, inside = "", [], False
            else:
                lang, buf, inside = line[3:].strip(), [], True
        elif inside:
            buf.append(line)
    return blocks


def err(msg):
    errors.append(msg)


def parse_yaml_block(block):
    data = {}
    for line in block.splitlines():
        line = line.split("  #")[0].rstrip()
        if not line.strip() or ":" not in line:
            continue
        key, _, val = line.partition(":")
        key, val = key.strip(), val.strip()
        if key in LIST_KEYS:
            if not (val.startswith("[") and val.endswith("]")):
                err(f"key '{key}' must be a [list], got: {val}")
                data[key] = []
            else:
                data[key] = [v.strip() for v in val[1:-1].split(",") if v.strip()]
        else:
            data[key] = val.strip('"')
    return data


def check_wireframes(section, comp_id):
    boxes = [c for lang, c in fenced_blocks(section) if lang == "" and "┌" in c]
    if not boxes:
        err(f"{comp_id}: no wireframe (plain ``` block with a box)")
        return
    for box in boxes:
        lines = box.splitlines()
        widths = {len(l) for l in lines}
        if len(widths) != 1:
            err(f"{comp_id}: wireframe lines have unequal widths {sorted(widths)} (run render_wireframes.py)")


def main():
    if not COMP_DIR.is_dir():
        sys.exit(f"compositions dir not found: {COMP_DIR}")

    all_ids, families = {}, {}
    for md in sorted(COMP_DIR.glob("*.md")):
        text = md.read_text(encoding="utf-8")
        if "```wf" in text:
            err(f"{md.name}: contains unrendered ```wf block (run render_wireframes.py)")
        matches = list(HEADING_RE.finditer(text))
        for i, m in enumerate(matches):
            cid = m.group(1)
            end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
            section = text[m.start():end]
            if not ID_RE.match(cid):
                err(f"{md.name}: bad id {cid}")
            if cid in all_ids:
                err(f"{cid}: duplicate id (also in {all_ids[cid]})")
            all_ids[cid] = md.name
            yaml_blocks = [c for lang, c in fenced_blocks(section) if lang == "yaml"]
            if not yaml_blocks:
                err(f"{cid}: missing yaml metadata block")
                continue
            data = parse_yaml_block(yaml_blocks[0])
            for k in REQUIRED_KEYS:
                if k not in data:
                    err(f"{cid}: metadata missing '{k}'")
            if data.get("id") != cid:
                err(f"{cid}: heading id != metadata id ({data.get('id')})")
            if data.get("family") != md.stem:
                err(f"{cid}: family '{data.get('family')}' != file '{md.stem}'")
            for k, allowed in ENUMS.items():
                vals = data.get(k, [])
                vals = vals if isinstance(vals, list) else [vals]
                bad = [v for v in vals if v not in allowed]
                if bad:
                    err(f"{cid}: invalid {k} value(s) {bad}")
            for label in REQUIRED_LABELS:
                if label not in section:
                    err(f"{cid}: missing {label}")
            check_wireframes(section, cid)
            families.setdefault(md.stem, []).append(cid)

    # selection guide must mention every composition
    sg = (REFS / "selection-guide.md").read_text(encoding="utf-8")
    for cid in all_ids:
        if not re.search(rf"\b{cid}\b", sg):
            err(f"{cid}: not mentioned in selection-guide.md")

    # recipes must only reference real compositions
    rc = (REFS / "page-recipes.md").read_text(encoding="utf-8")
    for token in sorted(set(ID_TOKEN.findall(rc))):
        if token not in all_ids:
            err(f"page-recipes.md references unknown composition {token}")

    # bare-string grid bug anywhere in references
    for md in REFS.rglob("*.md"):
        for n, line in enumerate(md.read_text(encoding="utf-8").splitlines(), 1):
            if BARE_GRID.search(line):
                err(f"{md.relative_to(ROOT)}:{n}: bare-string grid columns (use a responsive object)")

    print(f"compositions: {len(all_ids)} across {len(families)} families")
    for fam, ids in families.items():
        print(f"  {fam:<14} {len(ids):>2}  {', '.join(ids)}")
    if errors:
        print(f"\n{len(errors)} error(s):")
        for e in errors:
            print("  ✗", e)
        sys.exit(1)
    print("\nOK — no errors")


if __name__ == "__main__":
    main()
