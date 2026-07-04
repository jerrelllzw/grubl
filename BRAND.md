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
- The icon may use a lowercase `g.` monogram — that pairing is intentional.

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

**Semantic rules (no colour does two jobs):**
- **Persimmon = the hero.** Primary CTAs (Feed Me, Find Food, Spin, Open in Maps)
  and the wordmark dot. Espresso `ink` is the steady secondary (high contrast).
- **Basil (`jade`) = yes** — YUM swipe + stamp, toggles on.
- **Berry (`rose`) = no** — NAH stamp / skip.
- **Honey (`yolk`) = secondary** — "use my location", undo, adjust-search.

**Theming:** two palettes (`LIGHT`, `DARK`) sit behind one `COLORS` export in
`tokens.ts`; screens never hardcode. The **dark jewel "night mode"** is kept in
sync there for a later toggle — switch with `PALETTES.dark`. Legacy names
(`cream`→ground, `paper`→panel, `tomato`→primary, `yolk`→secondary, `green`→jade)
are aliases; prefer the semantic names in new code.

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

**Light default** (food-first). Dark jewel **night mode** lives in `tokens.ts`,
ready to wire up later.

## Still open

- [x] **Slot-reel spin** — built, with a cozy landing (overshoot settle + sparkle flourish).
- [x] **Primary** — persimmon `#D8481F`.
- [x] **NAH colour** — berry `#C6455F`.
- [ ] **App icon + splash** — cream splash now matches the old art; revisit the
      icon to match the persimmon/refined mark.
- [ ] **Wire the dark night-mode toggle** + refine its ground.
- [ ] **Name legal/availability check** — Grubl vs Grubhub (trademark), domain, store.
