#!/usr/bin/env python3
"""Render ```wf blocks into perfectly aligned box-drawing wireframes, in place.

Why this exists: hand-drawn ASCII wireframes drift out of alignment, and a model
reads misaligned boxes as ambiguous structure. Write the wireframe in the tiny DSL
below, run this script, and the block is replaced by an aligned plain code fence.

DSL (one row per line):
    Some text                 single full-width cell, centered
    <Some text                single cell, left-aligned
    a | b | c                 three equal cells
    {7:5} a | b               two cells, weighted 7:5 (weights apply to that row only)
    .                         spacer row (continues the previous row's column dividers)
    ---                       horizontal rule across the whole box (junctions computed)

Usage:
    python render_wireframes.py references/compositions/*.md
"""
import re
import sys
from pathlib import Path

INNER = 47  # inner width in characters (outer = 49)
BLOCK = re.compile(r"```wf\n(.*?)\n```", re.DOTALL)


def parse_row(line):
    weights = None
    m = re.match(r"^\{([\d:]+)\}\s*(.*)$", line)
    if m:
        weights = [int(x) for x in m.group(1).split(":")]
        line = m.group(2)
    cells = [c.strip() for c in line.split("|")]
    if weights is None:
        weights = [1] * len(cells)
    if len(weights) != len(cells):
        raise ValueError(f"weights {weights} do not match {len(cells)} cells in: {line!r}")
    return cells, weights


def widths_for(weights):
    n = len(weights)
    avail = INNER - (n - 1)
    total = sum(weights)
    ws = [avail * w // total for w in weights]
    ws[-1] += avail - sum(ws)
    return ws


def dividers(ws):
    pos, acc = set(), 0
    for i, w in enumerate(ws[:-1]):
        acc += w
        pos.add(acc + i + 1)
    return pos


def cell_text(text, width):
    left = text.startswith("<")
    if left:
        text = " " + text[1:].strip()
    if len(text) > width:
        print(f"  warning: truncating {text!r} to {width} chars", file=sys.stderr)
        text = text[: width - 1] + "…"
    return text.ljust(width) if left else text.center(width)


def border(kind, divs):
    left, mid, right = {"top": ("┌", "┬", "┐"), "bottom": ("└", "┴", "┘")}[kind]
    return left + "".join(mid if p in divs else "─" for p in range(1, INNER + 1)) + right


def rule(above, below):
    out = "├"
    for p in range(1, INNER + 1):
        a, b = p in above, p in below
        out += "┼" if a and b else "┴" if a else "┬" if b else "─"
    return out + "┤"


def render(source):
    items = []  # ("row", cells, ws) | ("rule",)
    last_ws = [INNER]
    for raw in source.splitlines():
        line = raw.rstrip()
        if not line.strip():
            continue
        if line.strip() == "---":
            items.append(("rule",))
        elif line.strip() == ".":
            items.append(("row", [""] * len(last_ws), last_ws))
        else:
            cells, weights = parse_row(line.strip())
            ws = widths_for(weights)
            last_ws = ws
            items.append(("row", cells, ws))

    rows = [i for i in items if i[0] == "row"]
    if not rows:
        raise ValueError("wireframe has no rows")

    def divs_near(idx, step):
        j = idx + step
        while 0 <= j < len(items):
            if items[j][0] == "row":
                return dividers(items[j][2])
            j += step
        return set()

    lines = [border("top", dividers(rows[0][2]))]
    for idx, it in enumerate(items):
        if it[0] == "rule":
            lines.append(rule(divs_near(idx, -1), divs_near(idx, +1)))
        else:
            _, cells, ws = it
            lines.append("│" + "│".join(cell_text(c, w) for c, w in zip(cells, ws)) + "│")
    lines.append(border("bottom", dividers(rows[-1][2])))
    return "\n".join(lines)


def main(paths):
    total = 0
    for p in map(Path, paths):
        text = p.read_text(encoding="utf-8")
        count = len(BLOCK.findall(text))
        if not count:
            continue
        new = BLOCK.sub(lambda m: "```\n" + render(m.group(1)) + "\n```", text)
        p.write_text(new, encoding="utf-8")
        total += count
        print(f"{p}: rendered {count} wireframe(s)")
    print(f"done: {total} wireframe(s) rendered")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1:])
