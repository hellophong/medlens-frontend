# MedLens capsule avatar

An animated helper that sits fixed in the bottom-right corner of the page and
reacts to the search bar.

## What it's for

The avatar is the **voice of context**. It deliberately does *not* repeat the
results already shown on the page — the result card already covers indication,
side effects, and company details. Instead it reminds people that a drug lookup
is not medical advice, and nudges them toward a doctor or pharmacist before they
act on anything they read.

It has no text box of its own. It only reacts to the existing search input, so
there's no second thing to learn and nothing extra to type into.

It also carries the one piece of context the rest of the UI can't express well:
when the backend has gone to sleep on its free hosting tier, a search can take up
to a minute. Rather than leaving a spinner to look broken, the avatar explains
what's happening after about six seconds of waiting.

## The six states

| State | When it fires | What it does |
|---|---|---|
| `welcome` | On page load | Pops in, waves quickly, and says "Hi! Type a drug name in the search bar and I'll go find it." Falls back to `idle` after 5.5s. |
| `idle` | Default resting state | Breathes, sways, blinks, waves occasionally, nudges the monocle, and every 6–12s does a little stretch. No speech bubble. |
| `attentive` | Typing in the search box | Leans toward the input, brows up. Clears back to `idle` if the box is emptied. |
| `thinking` | A lookup is in flight | Ponders, flat mouth, gaze up, animated dots. After 6s adds the cold-start explanation. |
| `answering` | Results came back | Hops, cheers, grins, sparkles. Says what was found plus a check-with-a-professional reminder — stronger wording if the query mentioned mixing, dosing, pregnancy, or children. |
| `notfound` | No match, or the request failed | Shakes, worried brows, small "o" mouth. Suggests a spelling/generic-name retry, or explains the request didn't go through. |

State is driven by a `data-state` attribute on `#mlAvatar`; all the animation
selectors key off it.

### How long the bubble stays up

Two states clear their own bubble on a timer, set by constants at the top of
`avatar.js`. Any new search cancels a pending hide and shows the new line.

| Constant | Value | Applies to |
|---|---|---|
| `ML_ANSWER_HOLD_MS` | 10 minutes | `answering` — stays long enough to keep referring back to while reading the card |
| `ML_NOTFOUND_HOLD_MS` | 10 seconds | `notfound` — a short correction, including the network-failure line |

`welcome` has no hold of its own; it clears when the 5.5s timer switches to
`idle`. `idle`, `attentive` and `thinking` show no bubble, except for the
cold-start line `thinking` adds after six seconds.

When a held bubble expires, the avatar also drops back to `idle` — otherwise the
capsule would keep a worried or grinning face long after the message it belonged
to had gone. That reset only applies to `answering` and `notfound`, and only if
nothing else has moved the avatar on in the meantime, so typing during the hold
still wins.

### Tickle

Clicking the capsule makes it grin, squint and bounce for about 0.9s. It's
purely decorative: it doesn't change `data-state` and doesn't touch the speech
bubble, so it can't interrupt a message mid-display.

It works by toggling an `ml-tickle` class on `#mlAvatar`. Those rules sit at the
end of `avatar.css` on purpose — they tie on specificity with the per-state
rules, so source order is what lets them win while the class is applied. The
handler also clears `ml-beat` first, since the idle-stretch selector outranks
them.

Only the drawn capsule is clickable, not the whole SVG box: `pointer-events` is
re-enabled on `.ml-react` rather than the `<svg>`, so SVG hit-testing reacts to
painted pixels only and clicks through the transparent corners still reach the
page underneath.

Under `prefers-reduced-motion` the bounce and squint are suppressed and only the
grin remains.

## Where the code lives

| File | Contains |
|---|---|
| `avatar.css` | All avatar styling and animation. Every class is prefixed `ml-`. |
| `avatar.js` | `createMedLensAvatar`, `attachAvatarToSearch`, `extractDrug`, `answerLine`, `notFoundLine`. Loaded before the main inline script. |
| `index.html` | The `<div id="mlAvatar">` markup near the end of `<body>`, the stylesheet link in `<head>`, and the wiring inside `doSearch()` plus the init block at the end of the inline script. |

### How it's wired

All four ways to start a search — the Search button, Enter in the input, the
suggestion chips, and the "Other Drugs by…" links — funnel through
`doSearch()`, so the avatar is wired there once rather than at each entry point.

`doSearch()` reduces what was typed to a drug name before calling the API, so a
question like "side effects of metformin" still reaches it as `metformin`.

That reduction is guarded. `extractDrug()` keeps only the *first* word that isn't
filler, which is correct for a sentence but wrong for a drug whose name is
several words — run unconditionally it would turn `insulin glargine` into
`insulin`. So `mlSearchTerm()` in `index.html` compares word counts first: if no
filler words were removed, the text was never a sentence and goes to the API
exactly as typed. Only queries that actually contained filler get reduced.

| Typed | Sent to the API |
|---|---|
| `side effects of metformin` | `metformin` |
| `insulin glargine` | `insulin glargine` |
| `Wegovy` | `Wegovy` |

`lookupDrug()` returns `null` for both a 404 and a network failure, so it also
records which happened in `lastLookupFailure`. That's what lets `notfound`
distinguish "no such drug" from "the request didn't go through."

## Changing the colours

Every colour is a CSS custom property declared at the top of `avatar.css`, in the
`.ml-avatar` rule. Edit them there:

```css
.ml-avatar {
  --ml-capsule-top: #2E9E6B;      /* upper half of the capsule */
  --ml-capsule-bottom: #CDEFD9;   /* lower half */
  --ml-capsule-seam: #1F7A50;     /* centre band, arms, bubble border */
  --ml-face: #10372A;             /* eyes, brows, mouth */
  --ml-cheek: #F4A6A0;            /* blush */
  --ml-frames: #10372A;           /* monocle rim and chain */
  --ml-lens: rgba(255,255,255,.22);
  --ml-shine: rgba(255,255,255,.55);
  --ml-shadow: rgba(16,55,42,.16); /* ground shadow + bubble shadow */
  --ml-spark: #FFD66B;            /* success sparkles */
  --ml-bubble-bg: #FFFFFF;
  --ml-bubble-text: #1C3A2E;
  --ml-size: 132px;               /* overall width; height follows */
}
```

To match MedLens's own blue instead of the green, set `--ml-capsule-top` to
`#0066CC`, `--ml-capsule-seam` to a darker blue, and `--ml-capsule-bottom` to a
pale tint of it.

### Dark mode

MedLens themes by setting `data-theme` on `<body>`, not by the OS
`prefers-color-scheme` setting. The avatar's dark overrides therefore key off
`body[data-theme="dark"] .ml-avatar`, further down `avatar.css` — if you add new
colours that need a dark variant, add them to that rule, not to a media query,
or they won't follow the site's toggle.

### Size and spacing

`--ml-size` sets the width. `avatar.css` also adds `padding-bottom` to `main` so
the capsule doesn't cover the end of a result card, and a `max-width: 520px`
breakpoint that shrinks both the capsule and the bubble on phones. If you change
`--ml-size`, revisit that padding.

### Reduced motion

A `prefers-reduced-motion: reduce` block turns off every animation and
transition, leaving the capsule in a static resting pose. The speech bubble and
all six states still work — only the movement stops.
