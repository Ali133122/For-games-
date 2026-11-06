# Flint

A tiny 2D game engine for the browser. It's one file ([`flint.js`](flint.js), about 1,000 lines) with no dependencies and no build step. Add it with a `<script>` tag and the game works when you open the HTML file directly, offline included.

- **See it in action:** [`../sparkwood/index.html`](../sparkwood/index.html) is a complete two-level platformer built with Flint
- **Smallest example:** [`examples/hello.html`](examples/hello.html), about 40 lines
- **3D:** [`flint3d.js`](flint3d.js) adds WebGL 3D (see [Flint3D](#flint3d) below). [`../orb-rush/index.html`](../orb-rush/index.html) and the arcade at [`../index.html`](../index.html) are built with it
- **Tests:** `node --test flint/test/*.test.js`

## What's in it

| Area | What you get |
|---|---|
| Game loop | Fixed 60 Hz updates with smooth interpolated rendering, frame-spike protection, auto-blur hook when the tab is hidden |
| Display | Fixed logical resolution scaled to fit with letterboxing, or fill-the-window mode; crisp pixel-art scaling; high-DPI aware |
| Scenes | `switch` (with fade), `push`/`pop` for overlays like pause menus, transparent scenes |
| Entities | `Entity` base class, `World` with tags, queries, overlap checks, z-ordering and deferred removal |
| Tilemaps | Build levels from strings; solid, one-way and custom tiles; spawn markers; draws only visible tiles |
| Physics | Tile collision with sub-stepping (no tunneling), one-way platforms, drop-through, grounded checks |
| Collision | Rect/rect, circle/circle, rect/circle, point, minimum push-out vector |
| Camera | Smooth follow, bounds, shake, zoom, screen↔world conversion |
| Input | Keyboard, mouse, touch and gamepad merged into named actions; on-screen touch buttons |
| Graphics | Sprite sheets, animations, text-to-pixel-art sprites, text drawing, particles |
| Audio | Synthesized sound effects (no files needed), note-name jingles, loaded sounds, persistent mute/volume |
| Utilities | Timers, tweens with 14 easings, seedable random, `Vec2`, math helpers, safe `localStorage` wrapper, asset loader |
| Debug | Press <kbd>`</kbd> for an overlay with FPS, entity counts, held keys and hitboxes |

## Quick start

```html
<script src="flint.js"></script>
<script>
class Play extends Flint.Scene {
  enter()        { this.x = 160; }
  update(dt)     { this.x += this.input.axis('left', 'right') * 100 * dt; }
  drawUI(ctx)    { ctx.fillStyle = '#fc0'; ctx.fillRect(this.x, 90, 8, 8); }
}
new Flint.Game({ width: 320, height: 180, pixelArt: true }).start(new Play());
</script>
```

## Core concepts

### Game

```js
const game = new Flint.Game({
  canvas: '#game',     // element or selector; omit it and Flint creates a full-window canvas
  width: 320, height: 180, // logical resolution. Omit both to fill the window (with optional `zoom`)
  pixelArt: true,      // nearest-neighbour + whole-number scaling
  background: '#000', letterbox: '#111',
  touchButtons: ['left', 'right', 'a', 'b'], // shown after the first touch
});
game.start(new TitleScene());
game.switch(new LevelScene(), { fade: 0.6 }); // replace all scenes
game.push(new PauseScene());                  // overlay; scenes underneath stop updating
game.pop();
```

`game.input`, `game.audio`, `game.assets`, `game.width/height`, `game.time` and `game.debug` are all available.

### Scenes

Subclass `Flint.Scene` and override what you need. Everything else is set up for you.

```js
class Level extends Flint.Scene {
  enter()  {}  // set up: this.map, this.add(entity)...
  exit()   {}  // left via switch/pop
  resume() {}  // a scene on top was popped
  blur()   {}  // tab hidden / window lost focus. A good place to pause
  update(dt) {}             // your logic, at a fixed rate
  drawBackground(ctx) {}    // screen space, behind the world
  drawWorld(ctx) {}         // world space (camera applied), above entities
  drawUI(ctx) {}            // screen space, on top
}
```

Each scene has `world`, `camera`, `particles`, `timers`, `tweens`, `input`, `audio`, an optional `map` (drawn automatically), and `time`. Set `transparent = true` to show the scene underneath, or `showTouch = false` to hide the touch buttons.

Each tick runs your `update(dt)`, then entity updates, particles, timers, tweens, and finally the camera.

### Entities and the world

```js
class Slime extends Flint.Entity {
  constructor(x, y) { super({ x, y, w: 12, h: 8, tags: ['enemy'] }); this.vx = 20; }
  update(dt) {
    this.vy += 900 * dt;
    const hit = this.move(dt);           // collide with scene.map; sets this.onGround
    if (hit.left || hit.right) this.vx *= -1;
  }
  draw(ctx) { ctx.fillStyle = '#6c6'; ctx.fillRect(this.x, this.y, this.w, this.h); }
}

scene.add(new Slime(40, 20));
scene.world.query('enemy');              // live entities with a tag
scene.world.first('player');
scene.world.overlapping(player, 'coin'); // overlap checks
entity.destroy();                        // removed at the end of the tick
```

Entities have `x, y, w, h, vx, vy, z, visible, tags`, plus `cx/cy/left/right/top/bottom`. Rendering is interpolated between ticks automatically. After teleporting an entity, call `entity.snap()` so it doesn't visibly slide to the new spot.

### Tilemaps

```js
this.map = new Flint.Tilemap({
  tileSize: 16,
  rows: [
    '..........',
    '..P...o...',
    '....====..',
    '##########',
  ],
  legend: {
    '#': { solid: true, color: '#553' },
    '=': { oneWay: true, draw(ctx, x, y, size, tx, ty, map) { /* custom */ } },
    '^': { hazard: true, sprite: spikesImage },   // any extra keys are yours to use
  },
  edges: { left: true, right: true, top: false, bottom: false }, // map edges act as walls?
});
const start = this.map.take('P')[0];       // find spawn markers and clear them
for (const c of this.map.take('o')) this.add(new Coin(c.x, c.y));
this.map.tilesIn(player).some(t => t.info?.hazard);
```

Set `body.dropThrough = true` to fall through one-way platforms.

### Camera

```js
this.camera.setBounds(0, 0, map.width, map.height).follow(player, { lerp: 7, offsetY: -8 });
this.camera.shake(4, 0.3);
this.camera.zoom = 2;
this.camera.screenToWorld(input.pointer.x, input.pointer.y);
```

### Input

Actions bind several keys together. The built-in actions are `left right up down jump action confirm cancel pause`.

```js
input.down('left'); input.pressed('jump'); input.released('jump');
input.axis('left', 'right');         // -1, 0 or 1
input.bind('dash', ['ShiftLeft', 'PadR']);
input.pressed('KeyQ');               // raw KeyboardEvent.code values work too
input.pointer                        // { x, y, down, pressed, released } in game coordinates
input.stick                          // gamepad left stick { x, y }
```

Gamepad buttons show up as `PadA PadB PadX PadY PadL PadR PadStart PadSelect PadUp/Down/Left/Right`. The touch buttons are `TouchLeft TouchRight TouchA TouchB`, and a mouse click or tap that misses the buttons is `Pointer`.

### Sprites and animation

```js
const sheet = Flint.SpriteSheet.fromPixelArt([
  ['.kk.', 'kyyk', 'kyyk', '.kk.'],   // frame 0, one character per pixel
  ['....', '.kk.', 'kyyk', '.kk.'],   // frame 1
], { k: '#222', y: '#fc0' });
// or: new Flint.SpriteSheet(game.assets.images.hero, 16, 16)

const anim = new Flint.Animator({ idle: { frames: [0, 1], fps: 4 }, pop: { frames: [1], loop: false } });
anim.play('idle'); anim.update(dt);
sheet.draw(ctx, anim.frame, x, y, { flipX: true, scale: 2, ox: 2, oy: 4, alpha: 0.5, rotation: 0.3 });
```

### Particles, tweens, timers

```js
this.particles.emit(x, y, { count: 20, speed: [20, 80], life: [0.3, 0.6], color: ['#fc0', '#f80'],
                             gravity: 200, spread: Math.PI, angle: -Math.PI / 2, blend: 'lighter' });
this.tweens.to(banner, { alpha: 1, y: 40 }, 0.5, { ease: 'outBack', delay: 0.2, onDone() {} });
this.timers.after(1.5, () => this.game.switch(new Next()));
this.timers.every(0.5, spawnEnemy, 10);
```

### Audio

Flint unlocks audio on the player's first key press or tap. You don't need any sound files:

```js
audio.sfx('jump');   // jump coin hit hurt explode blip select powerup land win lose
audio.tone({ freq: 'C5', to: 'G5', dur: 0.2, type: 'triangle' });
audio.noise({ dur: 0.4, freq: 2000, to: 100 });
audio.jingle(['C5', 'E5', 'G5', null, 'C6'], { step: 0.1 });
audio.toggleMute();   // remembered across visits
```

Loaded sounds work too (`await game.assets.sound('boom', 'boom.ogg')`, then `audio.play('boom')`), but browsers only allow `fetch` when the page is served over http(s), not opened from `file://`.

### Everything else

`Flint.clamp lerp approach damp wrap remap sign dist angleTo`, `Flint.rand randInt pick chance`, `new Flint.Random(seed)`, `Flint.Vec2`, `Flint.Ease.*`, `Flint.Collide.*`, `Flint.text(ctx, str, x, y, { size, color, align, shadow })`, `Flint.store.get/set` (a `localStorage` wrapper that never throws), `Flint.NOTE('A4')` → 440.

## Flint3D

[`flint3d.js`](flint3d.js) adds 3D. Load it after `flint.js`. It draws with WebGL and puts a 2D canvas on top, so `drawUI(ctx)` and Flint's text and touch buttons work just like in 2D. Input, audio, timers, tweens and storage are the same objects as in 2D Flint.

```html
<script src="flint.js"></script>
<script src="flint3d.js"></script>
<script>
const { Game3D, Scene3D, Geometry, mesh } = Flint3D;
class Spin extends Scene3D {
  enter() {
    this.cube = this.add(mesh(Geometry.box(1, 1, 1), { color: '#ffb347', emissive: '#402000' }));
    this.camera.position.set(0, 1.5, 4);
    this.camera.lookAt(0, 0, 0);
  }
  update(dt) { this.cube.rotation.y += dt; }
  drawUI(ctx) { Flint.text(ctx, 'hello 3D', 12, 12, { size: 16 }); }
}
new Game3D().start(new Spin());
</script>
```

| Part | What you get |
|---|---|
| `Game3D` | Full-window (or `parent`) WebGL canvas with a HUD canvas on top. Same `switch`/`push`/`pop` scenes as 2D, plus a debug overlay on <kbd>`</kbd> showing draw calls and triangles |
| `Scene3D` | `root`, `camera`, `env`, `particles`, `timers`, `tweens`. Override `enter`, `update(dt)`, `drawUI(ctx)`. `toScreen(point)` gives HUD coordinates for labels |
| `Geometry` | `box`, `plane` (with texture repeat), `quad`, `sphere`, `cylinder`, `cone`, `gem`, `flat()` for a low-poly look, and `merge()` to bake many pieces into one draw call |
| `Material` | `color`, `emissive` + `emissiveIntensity` (glow), `opacity`, `map` (a `Texture`), `unlit`, `doubleSided`, `fog` |
| `Texture` | `Texture.canvas(w, h, draw)` gives a texture you draw with the 2D canvas API. Redraw it any time, e.g. for animated screens |
| `Node` / `mesh()` | Scene graph with `position`, `rotation` (yaw, pitch, roll), `scale`, children, `onUpdate(dt)`, `find(name)` |
| `Camera3D` | `position`, `lookAt()`, `setYawPitch()` for first-person, `fov`, `shake()`, `project()` |
| Lighting | `env` has a sky/ground ambient, a sun, fog, and `env.lights`: point lights `{ position, color, intensity, range }`. The 4 nearest the camera are used |
| `Collide3D` | Box/box, sphere/sphere, sphere/box, and `slideXZ()` for walking around while sliding along walls |
| `Particles3D` | `emit(position, { count, speed, life, size, color, gravity, velocity })`. Bursts of glowing cubes |

Colors can be `'#f80'`, `'#ff8800'`, `0xff8800` or `[r, g, b]` from 0 to 1. Use arrays for colors you animate every frame.

## Using it in Node

`require('./flint/flint.js')` gives you everything except `Game`, which needs a browser. `require('./flint/flint3d.js')` works the same way for the 3D math, geometry and collision. That's how the tests run, and it's handy for level validators or other server-side checks.
