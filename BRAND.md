# Grubl. — Brand

The single source of truth for Grubl's identity. If a design choice isn't here,
it isn't decided yet. Values live in code at [`src/theme/tokens.ts`](src/theme/tokens.ts).

## Positioning

**Grubl decides where you eat, so you don't have to.** Set a location, swipe a
short deck, and let the reel make the call. The whole point is ending decision
paralysis — it deliberately never asks what you're craving.

**Feel:** a warm, appetizing **food app** first. The playful "spin" side reads
**cozy-cute game night** — friendly, warm, a little delightful — **not casino**.

## Name & wordmark

- The name is **Grubl.** — capital **G**, always with the **persimmon dot** (a
  decisive full-stop: "decided. done.").
- Never "gruble" / "grubble" (pronunciation drifts to *ruble*, loses "grub").
- In running copy it's **Grubl** (capitalized, no dot needed mid-sentence).
- **App icon:** a lowercase **`g.`** monogram — a cream mark on a full-bleed
  **persimmon** tile (the appetite colour leads; stands out on a home screen). The
  chip-square dot echoes the wordmark's full-stop. Monochrome by design so it holds
  up at 40px. Android adaptive uses the same cream mark on a persimmon background;
  the splash flips it (persimmon mark on the cream ground).

## Voice

Decisive, dry, food-native. Short imperatives. Confidence, not hype.

- **Do:** "That's the one." · "Locked in." · "GO EAT AT [NAME]" · "SNIFFING OUT
  SPOTS" · "TOUGH CROWD." · "Go eat."
- **Don't:** exclamation-spam, "Winner winner 🎉", game-show/casino hype, baby-talk.
- **Tagline:** *Stop scrolling menus. Swipe. Eat. Done.*

## Color

**Light is the default** — warm, appetizing, daylight-friendly. Persimmon (the
appetite colour) leads; food, not games.

| Token | Hex | Role |
|---|---|---|
| `cream` / `ground` | `#FBF4E6` | app background (warm bone) |
| `paper` / `panel` | `#FFFDF8` | cards / panels |
| `ink` | `#2A1C14` | espresso text + hairline outlines |
| `muted` | `#8A7C6B` | secondary text |
| `brass` / `brassDeep` (`tomato`) | `#D8481F` / `#B23A16` | **primary — persimmon** |
| `jade` (`green`) | `#2FA46B` | **yes / YUM** (basil) |
| `rose` | `#C6455F` | **no / NAH** (berry) |
| `yolk` | `#E9A23B` | secondary accent (honey/amber) |
| `amber` / `teal` / `amethyst` / `stone` | — | reserved hues (segments / future) |
| `shadow` | `#3A2A1E` | warm dark hard offset |
| `line` | `rgba(42,28,20,.12)` | subtle divider |
| `onAccent` | `#FFF7EC` | text/icon on a **saturated** accent (persimmon/basil/berry) |
| `onWarm` | `#2A1C14` | text/icon on the **light** honey accent |

`onAccent` / `onWarm` are **theme-stable** (identical in light and dark): an accent
sits at the same brightness in both themes, so button text stays legible instead of
inverting into mud when the ground flips.

**Semantic rules (no colour does two jobs):**
- **Persimmon = the hero.** Primary CTAs (Feed Me, Find Food, Spin, Open in Maps)
  and the wordmark dot. Espresso `ink` is the steady secondary (high contrast).
- **Basil (`jade`) = yes** — YUM swipe + stamp, toggles on.
- **Berry (`rose`) = no** — NAH stamp / skip.
- **Honey (`yolk`) = secondary** — "use my location", undo, adjust-search.

**Theming:** two palettes (`LIGHT`, `DARK`) in `tokens.ts` sit behind a runtime
theme (`src/theme/theme.tsx`). Screens read colours via `useColors()` and build
styles with `useThemedStyles(makeStyles)` — never hardcode — so a flip re-themes
every surface live. **Dark is a true food-first "night", not a jewel/casino look:**
warm near-black ground, cream ink, **persimmon still leads**. Legacy names
(`cream`→ground, `paper`→panel, `tomato`→primary, `yolk`→secondary, `green`→jade)
are aliases; prefer the semantic names in new code.

**The toggle** follows the OS colour scheme until the user flips it (a sun/moon
`ThemeToggle` on the Intro and Search screens), which pins an explicit override for
the session. The override is in-memory — a cold start re-follows the system — until
we add a KV store for persistence.

## Typography

- **Display:** `Archivo Black` (single weight) — headlines, wordmark, CTAs. The
  heavy grotesque keeps us out of the generic "cream + serif" food-app template.
- **Body:** `Space Grotesk` 400 / 500 / 600 / 700.

## Structure & motion

- **Border:** `1.5px` hairline. **Radii:** card 24 · sticker 16 · cta 18 · pill 999.
- **Shadows:** hard offset (no blur), warm-dark on cream.
- **The spin = a slot machine.** The food places physically **roll past a fixed
  window and decelerate** onto the pick ([`SlotReel.tsx`](src/components/SlotReel.tsx))
  — a real reel, not a moving highlight, not a conic wheel. Its treatment should
  feel **cozy-cute** (warm frame, friendly haptics), not casino.

## Imagery

No photos. Each place is a **diagonal two-tone stripe field** tinted by a per-place
hue, with the **cuisine emoji** standing in for a photo. A deliberate identity
(keeps every screen on-palette), not a placeholder.

## Theme

**Light default** (food-first), with a **dark food-first night mode** wired to a
runtime toggle (follows the OS scheme, user can override). Both palettes live in
`tokens.ts`.

## Still open

- [x] **Slot-reel spin** — built, with a cozy landing (overshoot settle + sparkle flourish).
- [x] **Primary** — persimmon `#D8481F`.
- [x] **NAH colour** — berry `#C6455F`.
- [x] **App icon + splash** — cream `g.` monogram on a persimmon tile; adaptive +
      splash + favicon regenerated to match.
- [x] **Dark night-mode toggle** — wired (`useColors`/`useThemedStyles` + `ThemeToggle`);
      dark is now a food-first twin (persimmon-led), not the old jewel look.
- [ ] **Persist the theme override** — currently in-memory; add a KV store so it
      survives a cold start instead of re-following the system.
- [ ] **Name legal/availability check** — Grubl vs Grubhub (trademark), domain, store.
