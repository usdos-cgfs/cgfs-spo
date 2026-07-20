# CGFS Home CEWP Restyle — Design

**Date:** 2026-07-20
**File:** `pages/home/home.txt` (HTML fragment loaded into a Content Editor Web
Part on the SharePoint classic home page)

## Goal

Reduce the density of the page's styling and make its naming consistent,
with wholesale restructuring allowed (markup flattening, flex→grid, CSS
rewrite). The rendered layout must stay visually the same: banner + update
notice, app-buttons band, card stack beside the collapsible Quick Apps drawer.

## Decisions

- **Depth:** restructure HTML too — rename ids/classes and flatten redundant
  wrappers. Ids referenced by the script are renamed in both places.
- **Browser baseline:** modern evergreen (custom properties, grid + gap,
  `:is()`; no IE11).
- **Hover swap:** replace the inline `onmouseover/onmouseout` image swaps with
  a CSS cross-fade.
- **Chrome CSS:** the SharePoint master-page overrides stay but are compacted
  with tokens and grouped selectors — no computed-style changes intended.
- **Parked "seemingly unused" CSS block:** kept as-is; anything newly orphaned
  by the restructure is parked there too, not deleted.
- **Naming:** ids camelCase, classes kebab-case. Elements inside a component
  are styled by scope (`.card h2`), not one class per element.

## Design

### 1. Design tokens

`:root` custom properties used by all sections, including chrome overrides:

- `--page-max: 1366px`
- Colors: `--brand-blue: #005696`, `--nav-blue: #236a9f`, `--gold: #ffc02a`,
  `--panel-dark: #2e2e2e`, `--link-blue: #24476a`,
  `--hover-tint: rgba(137, 157, 175, 0.4)`
- Font stacks: `--font-light` ("Calibri Light", Candara, …),
  `--font-heavy` ("Arial Black", Arial, …), `--font-ui` (Calibri, Arial),
  `--font-link` ("Calibri Regular", Arial — kept verbatim; in practice it
  falls back to Arial, and "fixing" it would change rendering)

### 2. Naming and markup restructure

| Today | Becomes |
|---|---|
| `.banner-container > .banner` (2 divs) | one `<header class="home-banner">` |
| `.stars-above` | `.update-notice` (keeps star/rule pseudo-elements; inline styles already extracted) |
| `#middleContainer > ul#buttonsArea.buttonsArea-list` | `<nav class="app-buttons" aria-label="Featured resources"> > ul` |
| `li.actButton > div#buttonN.buttonImgWrap > a > img` + `p.cButtonText` | `li.app-button > a > img` + `p` (wrapper div, per-button ids, and inline handlers gone) |
| `#cardStack` | `.card-stack` |
| `.cards#cardN > .cardLabel > h2.cardLabelText` | `<section class="card"> > h2` (flex centering replaces `display: table`) |
| `.cardShadow > .linkContainer > .linkArea > ul` | `.card-body > ul` (single wrapper carrying the gradient + `min-height: 215px`) |
| `.linkAreaSplit1/2` floated divs | `.card-body.two-col` — a 2-column grid holding two `ul`s; item placement unchanged |
| `.slider-container` / `.open-slider` / `.slider` / `.close-slider` / `.slider-body` | `.quick-apps` / `.quick-apps-toggle` / `.quick-apps-panel` / `.quick-apps-close` / `.quick-apps-grid` |
| `#openSlider` / `#closeSlider` / `#slider` | `#quickAppsToggle` / `#quickAppsClose` / `#quickAppsPanel` (script updated) |
| outer `div.flex` | `.content-row` — grid, `grid-template-columns: minmax(0, 1fr) auto` |

Unchanged: `.visually-hidden` utility and all "(opens in a new tab)" spans,
`.new-ribbon` badge, `.quick-link` / `.link-text`, all link URLs and text, the
intentionally-commented-out blocks (DEIA/CBGC buttons, Hot Topics, FMS card).

Layout-parity details preserved deliberately:

- `.app-button` `li`s get no fixed width (labels size the item, as today);
  the 155×155 constraint lives on the `a`, which replaces `.buttonImgWrap`
  including `margin: auto`.
- `.card-stack` keeps `height: fit-content` so it doesn't stretch to the
  drawer's height.
- The 1366px media query survives with selectors updated
  (`#middleContainer` → `.app-buttons`, `#cardStack` → `.card-stack`).

### 3. CSS hover swap

Each button `li` carries `style="--hover-img: url('…-hover.png')"` — one
attribute replacing two handler attributes. CSS:

```css
.app-button a::after {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--hover-img) center / contain no-repeat;
  opacity: 0;
  transition: opacity 0.25s ease-in-out;
}
.app-button a:hover img { opacity: 0; }
.app-button a:hover::after { opacity: 1; }
```

True cross-fade (the original `transition: opacity` intent). The overlay
exists at `opacity: 0`, so hover images preload — no first-hover flicker.

### 4. Chrome overrides: compacted, not redesigned

Same properties, rewritten with tokens; shared declarations grouped (e.g. the
banner text rules share `color`/`font-family` via grouped selectors;
`#topContainer`/`#topContainer2` merge). No computed-style change intended.

### 5. Parked block and script

- Parked CSS block: unchanged, plus two newly orphaned rules —
  `#buttonArea1 { padding-left: 5px }` (id removed; a 5px nudge on one button)
  and the `.flex` utility (replaced by `.content-row`).
- Script: the live master-page banner-swap block stays. The dead
  "About us" overlay handlers (their elements are permanently hidden) and the
  no-op `$("#topBanner").height = "220px"` line move into a comment beside it.
  The drawer disclosure logic is unchanged except for the new ids.

### 6. Verification

Declaration-diffing can't prove parity for a rewrite, so:

1. Local harness: render before/after in headless Chrome with remote images
   stubbed to correctly-sized placeholders; compare section geometry and
   screenshots (best effort — depends on a local browser being available).
2. Static checks: every class/id in the markup has a matching rule or is a
   known SharePoint/utility name; no legacy names remain; script ids match
   the markup; balanced braces.
3. Checklist: drawer open/close/Escape, hover cross-fade, new-ribbon badges,
   two-column card, visually-hidden spans intact.
4. Final confirmation: page loaded in SharePoint by the author.

## Out of scope

- The bio pages (`pages/*/**-bio.txt`) that carry copies of the old CSS.
- Any visual redesign — colors, spacing, and imagery stay as they are.
