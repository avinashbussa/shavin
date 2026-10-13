# Composition → motion map

Suggested Tier 1 presets per composition. Numbers refer to sections in `presets.md`. "None" is a valid and often best answer. Pick one or two per page section, not all of them.

`◆` marks compositions whose metadata allows a choreography scene on top (see `layout-choreography`).

| ID | Suggested presets | Notes |
|---|---|---|
| ST1 | 8 sticky state; menu open/close at `--dur-base` | Never animate header height |
| ST2 | none | Dismiss can fade out at `--dur-fast` |
| ST3 | none | |
| ST4 | 1 reveal (wordmark, once) | Static wordmark must fit before it animates |
| ST5 | none | |
| ST6 | sidebar collapse at `--dur-base` | Animate width via transform/clip, or snap |
| H1 | 2 load sequence | Keep media (LCP) visible |
| H2 | 2 load sequence | Media may rise once via transform only |
| H3 ◆ | 2 load sequence; 10 light parallax on the visual | |
| H4 ◆ | none, or slow media drift ≤ 24px; scroll cue can bob | Reduced motion: poster only |
| H5 ◆ | 2 load sequence per line | Split-text sequences → choreography |
| F1 | 1 reveal with stagger (once) | |
| F2 | 1 reveal with stagger; 3 hover on linked cells | |
| F3 | 1 reveal per row (once) | |
| F4 | native smooth scroll on buttons | No autoplay |
| F5 | 5 tab crossfade | |
| F6 ◆ | 9 scroll-spy + crossfade of the pinned visual | Scrubbed transitions → choreography |
| F7 | 1 reveal with stagger | |
| F8 | 1 reveal, both panels together (never stagger A before B) | |
| F9 | 1 reveal (once); optional very slow icon drift | Keep drift subtle — this is ambient, not a focal point |
| S1 | none | |
| S2 | 1 reveal (once) | |
| S3 | 6 count-up | |
| T1 | 1 reveal (once) | |
| T2 | 1 reveal with stagger | |
| T3 | none | |
| T4 | 7 marquee with pause | |
| C1 | 1 reveal (once) | |
| C2 | copy-button feedback at `--dur-fast` | |
| C3 | static glow; at most a very slow drift | Reduced motion: static |
| C4 | field/validation state transitions at `--dur-fast` | |
| C5 | 1 reveal (once); submit/success state at `--dur-fast` | Announce success/error with a live region |
| P1 | price toggle crossfade at `--dur-base` | Announce with a live region |
| P2 | none | |
| P3 | none | |
| Q1 | 5 panel crossfade | |
| Q2 | 4 accordion height | |
| G1 | 1 reveal with stagger (first screenful only) | |
| G2 | 11 filter fade | |
| G3 | 7 marquee rows with pause | |
| G4 | 3 hover on linked items | |
| G5 | none | |
| E1 | none; optional reading-progress bar | |
| E2 | note highlight on hover/focus at `--dur-fast` | |
| E3 | none | |
| E4 | row hover at `--dur-fast` | |
| D1 | 9 scroll-spy on the TOC | Keep docs calm |
| D2 | tab switch instant or `--dur-fast` | |
| D3 | none | |
| D4 | search focus state at `--dur-fast` | |
| X1 ◆ | 1 reveal (once), staggered by element role; 10 parallax on one element | |
| X2 ◆ | line-by-line reveal (2) | Split-text/masked → choreography |
| X3 ◆ | crossfade of scroller items | Pinned scenes → choreography |
| X4 ◆ | progress bar update; button smooth scroll | Scroll-jacked horizontal → choreography |
| X5 ◆ | hover preview fade at `--dur-fast`; cursor-follow → choreography | Also on focus |

## Combining across a page

- Choose the single most important moment (usually the hero) for the richest motion; keep the rest to reveal-once or none.
- Adjacent sections shouldn't all reveal identically. If every section fades up, the effect is invisible.
- Sections that carry dense reading material (docs, articles) get almost no motion.
