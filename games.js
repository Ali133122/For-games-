// The games in the Flint Arcade (index.html). Each one becomes a cabinet.
//
// To add a game:
//   1. Put it in its own folder next to index.html, with an index.html inside (e.g. my-game/index.html).
//   2. Add an entry below. The arcade makes room for any number of cabinets.
//
//   title    shown on the cabinet's marquee
//   path     the page to open (a folder in this repo, or a full https:// address that allows embedding)
//   color    the cabinet's neon color
//   tagline  one line under the title
//   controls how to play, shown when you walk up to the cabinet
//   room     1 = main floor (the default), 2 = the back room, through the glowing doorway
window.ARCADE_GAMES = [
  {
    title: 'Orb Rush',
    path: 'orb-rush/index.html',
    color: '#ff3fb0',
    tagline: '3D neon lane runner',
    controls: '←/→ change lane · Space jump · swipe on touch',
  },
  {
    title: 'Stack Tower',
    path: 'stack-tower/index.html',
    color: '#8dffa8',
    tagline: '3D: build the tallest tower you can',
    controls: 'Space, click or tap to drop each block',
  },
  {
    title: 'Bot Bop',
    path: 'bot-bop/index.html',
    color: '#5aa9ff',
    tagline: '3D: bop the bots, dodge the red ones',
    controls: 'Click or tap bots · or Q W E / A S D / Z X C',
  },
  {
    title: 'Star Sweeper',
    path: 'star-sweeper/index.html',
    color: '#29e3ff',
    tagline: 'Neon arena shooter, endless waves',
    controls: 'WASD move · mouse aims · X bomb · drag on touch',
    room: 2,
  },
  {
    title: 'Prism Breaker',
    path: 'prism-breaker/index.html',
    color: '#9b8cff',
    tagline: 'Brick breaker with power-ups',
    controls: '←/→ or mouse move · Space launch · P pause',
    room: 2,
  },
  {
    title: 'Mini Putt',
    path: 'mini-putt/index.html',
    color: '#4cbf6b',
    tagline: '3D: five holes of mini golf',
    controls: 'Drag back and let go · or ←/→ aim, hold Space',
  },
  {
    title: 'Sky Glider',
    path: 'sky-glider/index.html',
    color: '#ff8a5a',
    tagline: '3D: fly through rings to beat the clock',
    controls: 'Arrows / WASD or mouse steer · drag on touch',
  },
  {
    title: 'Beat Lanes',
    path: 'beat-lanes/index.html',
    color: '#ffe066',
    tagline: 'Rhythm game with three difficulties',
    controls: 'D F J K or arrows on the beat · tap lanes',
    room: 2,
  },
  {
    title: 'Tile Twins',
    path: 'tile-twins/index.html',
    color: '#ff6b8b',
    tagline: 'Memory match puzzle, three boards',
    controls: 'Click or tap tiles · or arrows and Space',
    room: 2,
  },
  {
    title: 'Sparkwood',
    path: 'sparkwood/index.html',
    color: '#ff8a3d',
    tagline: 'Pixel platformer, two levels',
    controls: '←/→ move · Space jump · ↓ drop through · Esc pause',
  },
  {
    title: 'Lantern Drift',
    path: 'lantern-drift/index.html',
    color: '#ffd23f',
    tagline: 'Keep your light alive in the dark',
    controls: 'WASD or mouse move · Space or click to flare',
  },
  {
    title: 'Royal Gambit',
    path: 'royal-gambit/index.html',
    color: '#5aa9ff',
    tagline: 'Chess against five computer levels',
    controls: 'Drag or click pieces · H hint · U undo',
  },
  {
    title: 'Drift Kart',
    path: 'drift-kart/index.html',
    color: '#ff5a3d',
    tagline: '3D: three laps, beat your best time',
    controls: '↑/W gas · ←/→ steer · Space drift · touch buttons',
    room: 2,
  },
  {
    title: 'Tower Guard',
    path: 'tower-guard/index.html',
    color: '#8dffa8',
    tagline: 'Build towers, hold the path for 15 waves',
    controls: 'Click or tap to build and upgrade · Space next wave',
    room: 2,
  },
  {
    title: 'Deep Cast',
    path: 'deep-cast/index.html',
    color: '#4dd9e8',
    tagline: 'Fishing: cast, hook and reel them in',
    controls: 'Hold Space or press to cast and reel',
    room: 2,
  },
  {
    title: 'Bubble Burst',
    path: 'bubble-burst/index.html',
    color: '#ff8fd0',
    tagline: 'Pop three or more of a color',
    controls: 'Aim with the mouse or ←/→ · click or Space shoots',
    room: 2,
  },
];
