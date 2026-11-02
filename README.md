# For-games-
A repo for games 

## Games

### Lantern Drift
Open [`lantern-drift/index.html`](lantern-drift/index.html) in a browser. It's one file with no dependencies.

Your lantern is slowly going out. Collect embers to keep its light burning. Wraiths creep in from the dark and drain your light when they touch you. Flare to burn them away, but each flare costs light.

- **Move:** WASD, arrow keys, mouse, or touch-drag
- **Flare:** Space, click, or the on-screen FLARE button on mobile
- **Mute:** M, or the Sound button at the top right

**Power-ups** appear every 9–14 seconds and fade after 9 seconds if you don't grab them:

| Power-up | Effect | Duration |
|---|---|---|
| 🛡 Ward (blue) | Blocks the next wraith hit and destroys that wraith | 12s |
| ⚡ Swift (green) | Faster movement | 7s |
| ❄ Stillness (white) | Freezes every wraith in place | 4.5s |
| 🧲 Lure (pink) | Pulls nearby embers toward you | 9s |

**Enemies** join over time. A banner introduces each one the first time it shows up:

| Enemy | Appears after | Behavior | How to deal with it |
|---|---|---|---|
| Wraith | Start | Drifts toward you and slows down in bright light | Dodge or flare (+1) |
| Ashmoths | ~18s | Fast, erratic swarms of three that drain only a little light | Flare the whole swarm at once |
| Cinder Thief | ~28s | Harmless, but eats embers and runs from your lantern | Chase it down or flare it to win back +2 points and light per stolen ember |
| Lurker | ~42s | Hides in the dark; its red eyes flash before it lunges | Sidestep the lunge or flare it (+2) |
| Hollow | ~65s | Big and slow, takes two flares, hits hard and drains your light while near | Keep your distance, flare twice (+5) |

**Bosses** rise from the dark at 50 seconds and then 70 seconds after each one is defeated. A warning plays first. The three bosses rotate, and each pass through the cycle gives them more health and makes them more aggressive:

| Boss | Attacks | How to beat it |
|---|---|---|
| The Matriarch | Circles you, releases Ashmoth swarms, then screeches and dive-bombs | Dodge the dive, then flare her while she's close |
| The Eclipse | Fires rings of dark orbs and periodically halves your light radius | Flares destroy orbs. Slip through the gaps and strike |
| The Devourer | A serpent that chases you, spits fireballs and eats embers to heal | Only its head can be hurt. Its body hurts too, so don't get boxed in |

Only flares damage a boss. While a boss is out, extra embers spawn to fuel your flares, and regular enemies arrive less often. Defeating one gives bonus points, fully restores your light and drops two power-ups.

### Afterglow
Open [`afterglow/index.html`](afterglow/index.html) in a browser. It's a single-file WebGL2 glow tool with no dependencies, inspired by the Deep Glow plugin for After Effects.

Load an image or video (button, drag and drop, or paste), or use the built-in demo scene, then tune the glow and save a full-resolution PNG.

- **HDR pipeline:** 16-bit float buffers with an 11-octave bloom pyramid, so long glow tails stay smooth instead of banding
- **Physically based falloff:** each octave is weighted by a falloff curve. Lower falloff gives longer, hazier tails, and the radius control fades octaves in smoothly
- **Soft-knee threshold:** controls which parts of the image glow, without hard edges
- **Hot core:** very bright light spills into every channel and turns white-hot, like a real light source
- **Lens effects:** chromatic aberration, anamorphic stretch, horizontal streaks and flicker
- **Tint and saturation** for the glow
- **Filmic tone mapping and dithering** so bright areas roll off naturally and dark gradients don't band
- **Before/after split view**, glow-only view, and presets: Neon, Soft bloom, Haze, Anamorphic, Hot core and Dreamy

Double-click any slider to reset it.
