# Visual review: look at the rendered page before you say it is done

`check_page`, `validate_code` and `audit_source` prove the page follows the rules. They cannot see it. A page can pass every gate and still feel flat, dim or empty. This step is the only one that judges the result, so it is required for every page and for any section you rework.

Contents: 1 Capture · 2 Rubric · 3 Measure · 4 Fix loop · 5 No browser

## 1. Capture

Run the dev server, open the page in a real browser (built-in browser, Claude in Chrome or Playwright) and screenshot at 375, 768 and 1280 wide. Scroll the whole page with real scrolling, not by jumping, so reveal and scroll-linked motion actually run. Look at each section as a viewer would, one viewport at a time.

## 2. Rubric

Score each viewport. Any "no" is a defect to fix, not a note.

| Check | Pass when |
|---|---|
| Focal point | One clear thing wins the eye in every viewport |
| Hierarchy | Headline, support text, action and meta read as four distinct levels |
| Depth | Surfaces differ by role (page, card, raised, inset). Identical gray cards everywhere is a defect |
| Bold moment | The moment named in the plan is built and visible, not just planned |
| Real UI | Product visuals look like a real product: believable data, layered, no placeholder boxes |
| Dead space | No card or frame stretched around content that does not fill it; no gap taller than about one viewport between related items |
| Rhythm | Section heights and densities alternate; no three similar sections in a row |
| Motion | Scroll through once. Reveals fire, nothing stays hidden, the signature scene (if any) works and reduced motion shows the final state |
| Copy | Specific to the product, no filler, no invented proof |
| Mobile | No horizontal scroll, tap targets at least 44px, nothing clipped |

Content-sized UI (cards, panels, product mockups) is never forced into a fixed aspect ratio. Fix the height to the tallest state and centre the others, or let each keep its natural height.

## 3. Measure

Do not judge contrast by eye. In the page console, compute the contrast of body text, descriptions and meta against their real backgrounds. Text that carries meaning needs at least 4.5:1 (3:1 for 24px and up). If a token pair fails, use the next token up for that text and report the token.

## 4. Fix loop

Fix the defects, re-screenshot the same viewports, and repeat up to three times. Then report what you checked, what you fixed and what remains. Never say "polished" without having looked.

## 5. No browser

If no browser is available, say the page was not visually reviewed and list what the rubric would check. Do not claim it passed.
