# Peen Corporate Identity (CI) Style Guide

Single source of truth for visual and verbal identity across landing, legal pages, and product UI. Use this guide for every new screen or surface so Peen stays consistent and on-brand.

---

## 1. Brand Foundation

### Personality and principles
- **Outdoor-first, premium but approachable:** Feels built for climbers and long days out, not corporate.
- **Dark, calm base with soft accent:** Black/dark gray foundation; lavender and cream as primary accents. Avoid harsh contrast or neon.
- **Clarity over decoration:** Content hierarchy is clear; motion and 3D are decorative only and never block core actions.
- **Trust and privacy:** Messaging and layout support “privacy-first,” “offline-ready,” and “your data.”

### Logo usage
- **Primary:** Logo mark (e.g. mountain/icon) + word “Peen” on one line. Use on dark backgrounds (default).
- **Logo mark only:** 28×28px minimum (8px corner radius), gradient fill: lavender → cream (135deg). Text on mark: dark (#071014).
- **Do:** Keep clear space; use provided gradient. **Don’t:** Stretch, change gradient direction for primary lockup, or place on busy imagery without sufficient contrast.

---

## 2. Design Tokens

### Color system

| Role | Token | Hex / value | Usage |
|------|--------|-------------|--------|
| Background | `bg` | `#000000` | Page and main surfaces |
| Background soft | `bg-soft` | `#111111` | Sections, panels |
| Surface / card | `card` | `#1a1a1a` | Cards, inputs, modals |
| Text primary | `text` | `#ffffff` | Body and headings |
| Text muted | `muted` | `#a0a0a0` | Secondary copy, captions, nav links |
| Accent primary | `brand` | `#d4c8f9` | Primary CTAs, links, logo start |
| Accent secondary | `brand-2` | `#fae3b9` | Logo end, gradient end |
| Success | — | `#7DFFAF` | Success state (e.g. “You’re on the list”) |
| Border default | — | `rgba(255,255,255,.06)`–`.12` | Dividers, card borders (decorative only) |
| Border emphasis | — | `rgba(255,255,255,.15)`–`.18` | Secondary buttons, decorative emphasis |
| **Control border** | `control-border` | `rgba(255,255,255,.30)` (~#4d4d4d) | Form inputs, toggles, segmented controls, map layer switches; any interactive boundary. Use for non-text contrast (WCAG) and outdoor legibility. |
| **Control surface** | `control-surface` | `#222` | Optional: input/toggle background when legibility outdoors matters. |

**Border usage:** Subtle borders (`border-default` / `border-muted` / `border-strong`) are for decorative surfaces only (cards, panels, dividers). Interactive controls must use `control-border` (or stronger) so component boundaries are perceivable, especially outdoors and on low-end displays.

**Secondary palette (decorative / ambient):**
- Cream: `#fae3b9`
- Blue-gray: `#d7e5e6`
- Sage: `#d6e7d4`
- Lavender: `#d4c8f9`

Use these for gradients, hero glows, and subtle UI tints. Never as primary text.

### Typography
- **Font family:** `Lexend`, fallback: `ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`
- **Weights:** 400 (body), 600 (nav, links), 700 (labels, emphasis), 800 (headings, CTAs)
- **Scale (responsive):**
  - Hero H1: `clamp(2rem, 5vw, 4rem)`, line-height 1.08
  - Section title: `clamp(1.4rem, 3vw, 2rem)`
  - Body / hero subtext: `clamp(1rem, 1.5vw, 1.15rem)`
  - Legal H1: `clamp(1.5rem, 4vw, 2rem)`; H2: `1.2rem`
  - Small / form note: `0.9rem`
- **Line height:** 1.6 (body), 1.7 (legal), 1.08 (hero headline)
- **Smoothing:** `-webkit-font-smoothing: antialiased`

### Spacing and layout
- **Container max width:** `1200px` (content), `720px` (legal body)
- **Section padding:** `4.5rem` vertical
- **Grid gap:** `1rem` (cards, screens), `.75rem`–`.8rem` (nav, form fields)
- **Rhythm:** Prefer 4pt/8pt multiples (e.g. .5rem, .75rem, 1rem, 1.5rem, 2rem)

### Radius and shadow
- **Radius default:** `16px` (cards, panels, inputs)
- **Radius pill:** `999px` (buttons, chips)
- **Radius small:** `8px` (logo mark), `10px` (nav panel links), `12px` (inputs)
- **Shadow default:** `0 10px 30px rgba(0,0,0,.35)`
- **Shadow strong:** `0 20px 60px rgba(0,0,0,.5)` (modals, dropdowns)

### Motion
- **Duration short:** ~0.16–0.2s (focus, toggles)
- **Duration medium:** ~0.4s (opacity, 3D canvas fade-in)
- **Duration long:** ~0.6s (reveal, scroll-in)
- **Easing:** `ease` for most; `linear` for infinite decorative animation
- **Reduced motion:** Respect `prefers-reduced-motion: reduce`: disable or simplify parallax, 3D, and reveal animations; keep instant state changes (e.g. focus). See Accessibility below.

---

## 3. Core Components

### Buttons
- **Primary:** Gradient `brand` → `brand-2`, text `#041013`, weight 800, pill radius, min-height 44px, shadow default. Use for main CTAs (Get the App, Join waitlist).
- **Secondary:** Transparent bg, border `rgba(255,255,255,.15)`, text `text`. Use for secondary actions (View Screens).
- **CTA (compact):** Same as primary with smaller padding (e.g. `.65rem 1rem`) for nav.
- **Icon button:** 44×44px, pill, border `rgba(255,255,255,.18)`, bg `rgba(255,255,255,.06)`. Use for menu toggle.
- **Focus:** `outline: 3px solid #fff; outline-offset: 2px`. No focus ring on decorative only.

### Navigation / header
- Sticky, blur backdrop (10px), gradient `rgba(0,0,0,.9)` → `.55`, bottom border `rgba(255,255,255,.06)`.
- Desktop: logo left; nav links (muted, 600) + primary CTA right.
- Mobile: logo left; hamburger + CTA right. **Mobile drawer** is a `<nav aria-label="Mobile navigation">`; do not use `role="menu"`. Scrim + panel (max-width 640px), bg `#0f0f0f`, border `rgba(255,255,255,.12)`, radius 16px; links 14px padding, 10px radius; include Privacy and Terms in panel. **Escape** closes the drawer; focus returns to the menu button.

### Cards
- **Feature card:** Gradient `rgba(255,255,255,.05)` → `.02`, border `.08`, radius 16px, padding 1.2rem, shadow default. Title 1.1rem; body muted.
- **Screen / device card:** Aspect ratio 9/16, radius 28px, border `.08`, optional inner gradient overlay (lavender/cream conic) at low opacity.

### Forms
- **Container:** Gradient bg, border `.1`, padding 1rem, radius 16px.
- **Input (email):** Full width, padding `.9rem 1rem`, radius 12px, bg `card` or `control-surface`, border `control-border` (for non-text contrast and outdoor legibility), color `text`.
- **Label:** Weight 700.
- **Form note:** Muted, 0.9rem. Use for “We’ll only use this…” and legal line (Terms + Privacy links in brand color).

### FAQ / disclosure
- **Details:** Bg `rgba(255,255,255,.04)`, border `.08`, padding `.9rem 1rem`, radius 12px.
- **Summary:** No default marker; ensure focus and keyboard open/close.

### Footer
- Border top `.06`, padding 2.2rem 0, muted text.
- Layout: row with copyright and link group (Privacy Policy, Terms of Use, Contact mailto). Links weight 600; hover to `text`.

### Hero composition
- Min height 92svh; content z-index above decorative layers.
- **Text:** Chip/tag (optional) → H1 → paragraph → actions (primary + secondary) → proof line (e.g. “Trusted by…”).
- **Decorative 3D/parallax:** Behind content only (z-index 0–1). Never trap focus or block CTAs. Provide gradient fallback when 3D is off or loading.

---

## 4. Product / topo app (outdoor and map UI)

### Outdoor readability (sunlight legibility)
For key app screens used in bright conditions (route list, topo view, map), support an outdoor-readability variant:
- **Surface separation:** Use `control-surface` (#222) or a step lighter than `card` so boundaries are clear.
- **Dividers:** Use `control-border` or a step stronger so section boundaries remain visible in sunlight.
- **Type:** Slightly larger default type for critical readouts (route name, grade, distance). This mode should be available wherever users are in bright outdoor conditions (climbing, approach).

### Topo / map semantic palette (functional colors)
Use named tokens so topo and map UI stay consistent; avoid one-off hex values.

| Token | Purpose |
|-------|---------|
| `topo-route-normal` | Default route line (e.g. unclimbed) |
| `topo-route-selected` | Selected route |
| `topo-route-done` | Completed/sent route |
| `topo-anchor` | Anchors, bolts, fixed gear icons |
| `topo-hazard` | Hazard/warning (loose rock, access issues, seasonal closure) |
| `status-offline-done` | Area/layer downloaded |
| `status-offline-downloading` | Download in progress |
| `status-offline-failed` | Download failed |
| `gps-good` / `gps-poor` / `gps-none` | GPS accuracy indicator states |

Define hex (or refs to the main palette) in `ci-tokens.json`; use in topo view, list icons, map layers, and status indicators.

### Data visualization (charts, progress)
- **Categorical palette:** Use a small set of color-blind considerate colors (distinct hue + lightness) for charts and progress views.
- **Encoding:** Do not encode critical information (e.g. grade) by color alone; use color + shape or pattern (WCAG).
- **Charts on dark:** Minimum stroke width and contrast for lines and labels on dark backgrounds so they remain readable outdoors and in low light.

---

## 5. Content and Messaging Rules

### Voice and tone
- **Headlines:** Short, action-oriented (“Conquer routes. Log sends. Push higher.”).
- **Body:** Clear, benefit-led; mention offline, privacy, and control.
- **CTAs:** Direct (“Get the App,” “Join the waitlist,” “Get Started Free”).

### Trust and legal
- **Placement:** Legal links in footer and (on mobile) in nav panel. Waitlist form must include “By joining you agree to our Terms of Use and Privacy Policy” with links.
- **Waitlist disclosure:** If the form collects more than email (e.g. referral/UTM data), disclose what is collected and why (in Privacy Policy and optionally one line near the form).
- **Legal pages:** Same header/footer as landing; body max-width 720px; H1 + last updated; sections with H2; contact mailto in brand color.

### Social proof
- One line under hero CTAs is enough (e.g. “Trusted by early adopters • Rated 4.9/5 • No ads”). Keep factual and minimal.

---

## 6. Accessibility and Compliance

### Contrast
- **Primary text on bg:** White on black meets WCAG AAA for normal text.
- **Muted on bg:** Ensure muted (#a0a0a0) meets at least AA for large text; use for secondary copy only.
- **Buttons:** Gradient background with dark text (#041013) must meet AA (check contrast with both lavender and cream).

### Focus and interaction
- **Focus ring:** 3px solid white, 2px offset on all interactive elements (buttons, links, inputs).
- **Skip link:** “Skip to main content” visible on focus only; bg brand, dark text.
- **Hit targets:** Minimum 44×44px for buttons and icon buttons.
- **Keyboard:** All actions (nav, form, FAQ, modals) reachable and operable by keyboard.

### Reduced motion
- **Respect `prefers-reduced-motion: reduce`:** Disable or replace parallax, 3D hero, scroll-reveal, and decorative motion with static or minimal transition (e.g. opacity only). Do not rely on a single “pause animation” control; honor the media query globally.
- **Decorative canvas:** Mark with `aria-hidden="true"`; never require interaction with 3D for core tasks.

### Decorative 3D and performance
- **Lazy init:** Load 3D only when hero is in or near viewport (e.g. IntersectionObserver).
- **Fallback:** Always show gradient (or static image) when WebGL is unavailable or when reduced motion is set.
- **No blocking:** Never block main content or first input on 3D load. Cap device pixel ratio (e.g. 2) and pause render when offscreen.

---

## 7. Implementation Guidance

### Mapping: current CSS → CI tokens

| Current (index.html / legal) | CI token / role |
|------------------------------|------------------|
| `--primary-black` | `bg` |
| `--primary-white` | `text` |
| `--bg`, `--bg-soft`, `--card` | Background / surface roles |
| `--text`, `--muted` | Text primary / muted |
| `--brand`, `--brand-2` | Accent primary / secondary |
| `--radius` | Radius default (16px) |
| `--shadow` | Shadow default |
| `--maxw` | Container width (1200px) |
| `--legal-maxw` | Legal content width (720px) |
| `.btn` | Primary button |
| `.btn.secondary` | Secondary button |
| `.btn.cta` | Compact CTA |
| `.logo`, `.logo-mark` | Logo and mark |
| `.feature-card` | Feature card |
| `.footer-links` | Footer nav |
| `.section-title` | Section heading |
| `.form-note` | Form helper / legal line |
| `--control-border`, `--control-surface` | Interactive controls, outdoor legibility |

### Do
- Use design tokens (or CSS variables that map to this doc) for every new component.
- Keep one container width for marketing (1200px) and one for legal body (720px).
- Use Lexend and the defined scale for type.
- Provide skip link, focus rings, and 44px targets on all interactive elements.
- Honor reduced motion and provide 3D fallback.

### Don’t
- Introduce new accent colors or typefaces without updating this guide.
- Use motion for critical feedback only (e.g. focus); keep heavy animation decorative.
- Put primary CTAs inside or behind 3D canvas.
- Omit Privacy/Terms from footer or waitlist context.

---

## 8. CI Pass Checklist (before shipping UI)

- [ ] Colors use only CI palette and tokens.
- [ ] Typography is Lexend with defined weights and scale.
- [ ] Buttons and links have focus ring and min 44px target.
- [ ] Skip link present (landing/legal); main landmark has id for skip target.
- [ ] Reduced motion respected (parallax/3D/reveal disabled or static).
- [ ] Footer includes Privacy, Terms, Contact; waitlist form includes legal line.
- [ ] No new one-off styles that should be tokens or components (refactor into CI first).
- [ ] Interactive form controls and toggles use `control-border` (not decorative border tokens).

---

*Reuse this guide across all Peen surfaces (landing, legal, app, future web). For machine-readable tokens see `ci-tokens.json` in this folder.*
