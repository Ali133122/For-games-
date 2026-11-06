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
  },
  {
    title: 'Prism Breaker',
    path: 'prism-breaker/index.html',
    color: '#9b8cff',
    tagline: 'Brick breaker with power-ups',
    controls: '←/→ or mouse move · Space launch · P pause',
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
];
