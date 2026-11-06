# For-games-
A repo for games 

## Flint game engine
[`flint/flint.js`](flint/flint.js) is a tiny 2D game engine in one file with no dependencies. It covers scenes, entities, tilemaps with collision, a camera, keyboard/mouse/touch/gamepad input, sprites and animation, particles, tweens and synthesized sound. See the [Flint README](flint/README.md) for the guide and API, and [`flint/examples/hello.html`](flint/examples/hello.html) for a 40-line example.

## Games

### Sparkwood
Open [`sparkwood/index.html`](sparkwood/index.html) in a browser. It's built with Flint and works offline.

A small two-level platformer. You play a little flame collecting sparks, lighting lantern checkpoints and racing to the flag.

- **Move:** ←/→ or A/D. **Jump:** Space, Z or ↑ (hold for higher). **Drop through platforms:** ↓. **Pause:** Esc or P. **Mute:** M
- Stomp slimes and bats. Spikes, pits and enemy hits each cost one of your three hearts
- Works with a gamepad, and shows on-screen buttons on touch screens
- Your best time is saved

### Royal Gambit
Open [`royal-gambit/index.html`](royal-gambit/index.html) in a browser. It's one file with no dependencies, and it works offline.

Full chess against a computer opponent, pass-and-play with a friend on one device, or a puzzles mode for practicing tactics.

- **Five computer levels:** Pawn, Knight, Bishop, Rook and Queen. They range from a beginner who blunders to a full-strength engine that thinks several moves ahead. Beat a level and you're offered the next one.
- **All the rules:** castling, en passant, promotion (you pick the piece), check, checkmate, stalemate, threefold repetition, the 50-move rule and insufficient material
- **Moving pieces:** drag them, or click a piece and then a highlighted square
- **Help:** 💡 Hint draws an arrow showing a strong move, and Undo takes back your last move
- **Evaluation bar:** shows who's ahead (you can turn it off)
- **Review:** click any move in the list, or use ← → to step through the game
- **Extras:** four board colors, light and dark mode, sound effects, and your game is saved automatically if you close the tab

**Puzzles:** choose 🧩 Puzzles in the New game menu. Each puzzle starts with your opponent's mistake, and your job is to punish it.

| Type | Goal |
|---|---|
| Mate in 1 (19) | Deliver checkmate in one move |
| Mate in 2 (23) | Force checkmate in two moves, whatever your opponent does |
| Mate in 3 (52) | Force checkmate in three moves |
| Win material (83) | Find the fork, pin or skewer that wins a piece |
| Mixed | A random unsolved puzzle from any type |

A wrong move flashes red and you can try again. When you play a correct move, the opponent replies automatically. 💡 Hint first shows which piece to move, and pressing it again shows the move itself. Solving a puzzle with no mistakes or hints adds to your streak. Your solved puzzles and best streak are saved. Every puzzle was checked by computer: mates are proven to be forced, with only one correct first move, and each Win material puzzle has a single move that clearly wins.

Keyboard: <kbd>H</kbd> hint · <kbd>N</kbd> next puzzle (in puzzle mode) · <kbd>U</kbd> undo · <kbd>F</kbd> flip board · <kbd>←</kbd>/<kbd>→</kbd> step through moves

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
