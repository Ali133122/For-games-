# For-games-
A repo for games 

## Flint Arcade
Open [`index.html`](index.html) in a browser to walk around a 3D neon arcade. Every game in this repo is a cabinet. Walk up to one and press <kbd>E</kbd> (or tap it) to play, and use **← Back to arcade** to return.

- **Walk:** WASD or ↑/↓. **Look:** drag with the mouse, or ←/→ to turn. **Play:** E, Enter or Space
- **Touch:** your left thumb walks, your right thumb looks, and tapping a cabinet plays it
- **All games** lists every game with a Play button, if you'd rather skip the walk

**Adding your games:**
1. Put the game in its own folder with an `index.html` inside, e.g. `my-game/index.html`.
2. Add an entry to [`games.js`](games.js) with a title, path, neon color, tagline and controls.

The room grows to fit however many cabinets there are. You can also press **+ Add game** inside the arcade to add a cabinet without editing files. Those are saved in your browser only.

## Flint game engine
[`flint/flint.js`](flint/flint.js) is a tiny 2D game engine in one file with no dependencies. It covers scenes, entities, tilemaps with collision, a camera, keyboard/mouse/touch/gamepad input, sprites and animation, particles, tweens and synthesized sound.

[`flint/flint3d.js`](flint/flint3d.js) adds 3D on top of it with WebGL: meshes, lights, fog, glowing materials, canvas textures, a scene graph, 3D particles and collision. The arcade and Orb Rush are built with it.

See the [Flint README](flint/README.md) for the guide and API, and [`flint/examples/hello.html`](flint/examples/hello.html) for a 40-line example.

## Games

### Orb Rush
Open [`orb-rush/index.html`](orb-rush/index.html) in a browser. It's a 3D game built with Flint3D.

Roll a glowing orb down a neon highway toward a synthwave sunset. It keeps getting faster.

- **Change lane:** ←/→ or A/D, or swipe. **Jump:** Space or ↑, or tap. **Slam down:** ↓
- Purple walls must be dodged. Orange walls are low enough to jump. Gems are worth 10 points each
- Your best score is saved

### Stack Tower
Open [`stack-tower/index.html`](stack-tower/index.html). A 3D game built with Flint3D.

A block slides back and forth above your tower. Drop it (Space, click or tap) so it lands on the block below. Any overhang gets sliced off and falls away, so your blocks keep shrinking. Land three perfect drops in a row and the block starts growing back. Your best height is saved.

### Bot Bop
Open [`bot-bop/index.html`](bot-bop/index.html). A 3D game built with Flint3D.

Robots pop out of nine pipes. Bop them with the mallet before they duck back down. You have 60 seconds.

- **Bop:** click or tap a bot, or use the keys that match the grid: Q W E / A S D / Z X C (or the number pad)
- Blue bots are worth 1 point and gold bots 3. **Never bop the red, spiky ones:** each one costs a heart, and you have three
- Five hits in a row starts a combo multiplier. Missing, or hitting an empty pipe, resets it

### Star Sweeper
Open [`star-sweeper/index.html`](star-sweeper/index.html). Built with Flint.

A neon arena shooter. Your ship fires automatically, at the mouse if you're using one and otherwise at the nearest enemy.

- **Move:** WASD or arrows, or drag on a touch screen. **Bomb:** X (clears the screen, +1 bomb per wave). **Pause:** P or Esc
- Enemies: drifters chase you, dashers flash a line before they charge, rocks split in two, and gunners shoot back from a distance
- Collect the green gems that enemies drop to raise your score multiplier, up to ×5. Getting hit resets it. **T** gives triple shot and **S** gives a shield

### Prism Breaker
Open [`prism-breaker/index.html`](prism-breaker/index.html). Built with Flint.

A brick breaker with five levels. They loop, getting faster each time.

- **Move:** ←/→ or the mouse, or drag on touch. **Launch:** Space or tap. **Pause:** P
- Silver bricks take two hits, dark steel ones can't be broken (except by explosions), and ✸ bricks blow up their neighbors
- Capsules: **W** wide paddle, **M** multiball, **S** slow ball, **L** extra life. Break bricks without touching the paddle to build a combo

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
- **Friendly pieces:** soft, rounded pieces in cheerful colors, with a star on the king's crown instead of a cross. They're on by default. Switch to the Classic set under Pieces in the settings.
- **Extras:** four board colors, light and dark mode, sound effects, and your game is saved automatically if you close the tab

**Puzzles:** choose 🧩 Puzzles in the New game menu. Each puzzle starts with your opponent's mistake, and your job is to punish it.

| Type | Goal |
|---|---|
| Mate in 1 (52) | Deliver checkmate in one move |
| Mate in 2 (48) | Force checkmate in two moves, whatever your opponent does |
| Mate in 3 (87) | Force checkmate in three moves |
| Win material (265) | Find the fork, pin or skewer that wins a piece |
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
