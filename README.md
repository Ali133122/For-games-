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

Add `room: 2` or `room: 3` to choose a room. The arcade has three rooms in a row, each with its own look: the **main floor**, the **back room** and the **sky deck**. Each room's east doorway leads to the next room and its west doorway leads back. Each room grows to fit however many cabinets it has. You can also press **+ Add game** inside the arcade to add a cabinet without editing files. Those are saved in your browser only.

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

### Star Sweeper (back room)
Open [`star-sweeper/index.html`](star-sweeper/index.html). Built with Flint.

A neon arena shooter. Your ship fires automatically, at the mouse if you're using one and otherwise at the nearest enemy.

- **Move:** WASD or arrows, or drag on a touch screen. **Bomb:** X (clears the screen, +1 bomb per wave). **Pause:** P or Esc
- Enemies: drifters chase you, dashers flash a line before they charge, rocks split in two, and gunners shoot back from a distance
- Collect the green gems that enemies drop to raise your score multiplier, up to ×5. Getting hit resets it. **T** gives triple shot and **S** gives a shield

### Prism Breaker (back room)
Open [`prism-breaker/index.html`](prism-breaker/index.html). Built with Flint.

A brick breaker with five levels. They loop, getting faster each time.

- **Move:** ←/→ or the mouse, or drag on touch. **Launch:** Space or tap. **Pause:** P
- Silver bricks take two hits, dark steel ones can't be broken (except by explosions), and ✸ bricks blow up their neighbors
- Capsules: **W** wide paddle, **M** multiball, **S** slow ball, **L** extra life. Break bricks without touching the paddle to build a combo

### Mini Putt
Open [`mini-putt/index.html`](mini-putt/index.html). A 3D game built with Flint3D.

Five holes of mini golf (par 14): a warm-up, a dogleg, a spinning windmill bar, a sand trap island and a zigzag.

- **Putt:** drag back from anywhere and let go, like a slingshot. The farther you drag, the harder the shot. Or turn with ←/→, hold Space to charge, and release
- Sand slows the ball down, and the windmill bar knocks it around. After 8 strokes you pick up and take 9
- A scorecard at the end shows birdies in green and bogeys in red. Your best round is saved

### Sky Glider
Open [`sky-glider/index.html`](sky-glider/index.html). A 3D game built with Flint3D.

Fly a glider down a sunset canyon. Every gold ring you fly through adds time to the clock, and rings in a row multiply your points. Pillars and beams start appearing once you're under way, and you keep speeding up.

- **Steer:** arrows or WASD, the mouse, or drag on a touch screen
- The game ends when you crash or the clock runs out. Your best score is saved

### Beat Lanes (back room)
Open [`beat-lanes/index.html`](beat-lanes/index.html). Built with Flint.

A rhythm game. Notes fall down four lanes, and you hit each one as it crosses the line. The music (drums, bass and chords) is synthesized in code, and each note you hit plays part of the melody.

- **Hit:** D F J K (or ← ↓ ↑ →), or tap the lanes on a touch screen. Multi-touch works for two-note chords
- Easy, Normal and Hard each have their own note chart. You're graded Perfect, Great, Good or Miss on every note, and S to D at the end. Your best score per difficulty is saved

### Tile Twins (back room)
Open [`tile-twins/index.html`](tile-twins/index.html). Built with Flint.

A memory puzzle. Flip two tiles at a time to find matching pairs, across three boards that get bigger (6, 10 and 12 pairs). Fewer flips earn more stars, up to 9 in total.

- **Flip:** click or tap a tile, or use the arrow keys and Space

### Drift Kart (back room)
Open [`drift-kart/index.html`](drift-kart/index.html). A 3D game built with Flint3D.

A three-lap kart race against three rivals on a tree-lined circuit. You start third on the grid. The rivals drive with the same kart physics as you: they follow a racing line, brake for corners, drift for boosts and go around slower karts. Pick Easy, Normal or Hard on the title screen with ←/→. The results show the full standings with everyone's finish time.

- **Drive:** ↑ or W for gas, ←/→ to steer, ↓ to brake. On touch screens, use the on-screen buttons (A is gas, B is drift)
- **Drift:** hold Space while you steer through a corner. The sparks turn blue, then orange. Let go for a boost, and the longer the drift, the bigger the boost
- Leaving the road slows you down. A minimap shows everyone's position. Your best race and best lap times are saved

### Tower Guard (back room)
Open [`tower-guard/index.html`](tower-guard/index.html). Built with Flint.

Tower defense across 15 waves. Build towers on the grass beside the road so nothing reaches the end.

- **Towers:** Bolt (fast single zaps), Frost (slows everything nearby) and Cannon (splash damage). Each can be upgraded twice
- Click or tap a tile to build, or click a tower to upgrade (U) or sell (S). 1, 2 and 3 pick a tower type, Space sends the next wave early, and F switches between normal and double speed
- Waves 5, 10 and 15 bring a boss. A boss that reaches the end costs 5 of your 20 lives

### Deep Cast (back room)
Open [`deep-cast/index.html`](deep-cast/index.html). Built with Flint.

A fishing game played with one button (Space, click or touch). Hold to charge your cast and let go to throw. Hold again to reel in, and press quickly when a fish bites. Then keep the line tension in the green: too tight and the line snaps, too slack and the fish swims off.

- Six catches, from minnows near the surface down to pike and a rare Golden Koi in the depths. You might also hook an old boot
- A day lasts two and a half minutes. Your journal remembers every species you've caught and the biggest of each

### Bubble Burst (back room)
Open [`bubble-burst/index.html`](bubble-burst/index.html). Built with Flint.

A bubble shooter. Pop groups of three or more of one color. Any bubbles left hanging when their support pops fall off for bonus points.

- **Aim:** mouse or ←/→ (drag on touch). **Shoot:** click or Space (let go on touch). **Swap with the next bubble:** X
- Each shot that doesn't pop anything brings the ceiling closer. Clearing the board starts a new level with one more color. Don't let the bubbles reach the dashed line

### Neon Maze (sky deck)
Open [`neon-maze/index.html`](neon-maze/index.html). A 3D game built with Flint3D.

A first-person maze. Find every glowing orb before the clock runs out. Each orb adds 6 seconds, and the minimap fills in as you explore. A red sentry patrols the corridors and chases you if it spots you down a straight hallway. Getting caught costs 10 seconds. Each maze you clear brings a bigger one with more orbs.

- **Move:** WASD. **Look:** drag the mouse, or ←/→. On touch screens, your left thumb walks and your right thumb looks

### Bumper Ring (sky deck)
Open [`bumper-ring/index.html`](bumper-ring/index.html). A 3D game built with Flint3D.

Sumo bumper cars on a floating ring, against three rivals. Shove the others off the edge; the last one on wins the round, and the first to win 3 rounds takes the match. After 15 seconds the ring's outer tiles start shaking and falling away.

- **Move:** WASD or arrows (drag on touch). **Dash:** Space (or B on touch). A dash hits much harder and recharges in 1.6 seconds
- The rivals go after whoever is nearest the edge, steer back from the edge themselves, and get tougher each round

### Pipe Flow (sky deck)
Open [`pipe-flow/index.html`](pipe-flow/index.html). Built with Flint.

Turn the pipe tiles so the water can run from the tap to the drain. The water starts on its own when the timer runs out, or press F to start it early for bonus points. A leak costs one of your three lives. Every board is randomly generated and always solvable, and each one is bigger than the last.

- **Turn a pipe:** click or tap it, or use the arrow keys and Space

### Cloud Hopper (sky deck)
Open [`cloud-hopper/index.html`](cloud-hopper/index.html). Built with Flint.

Bounce from cloud to cloud and climb as high as you can. The sky turns from day to sunset to night to space as you go. Grey storm clouds break when you land on them, pink springs launch you, moving clouds drift sideways, and spiky birds show up higher up. Stomp them from above, but don't touch them otherwise.

- **Move:** ←/→, the mouse, or the on-screen buttons. The sides of the screen wrap around

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
