// Run with: node --test flint/test
const test = require('node:test');
const assert = require('node:assert/strict');
const F = require('../flint.js');

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b}`);

test('math helpers', () => {
  assert.equal(F.clamp(5, 0, 3), 3);
  assert.equal(F.clamp(-1, 0, 3), 0);
  assert.equal(F.lerp(0, 10, 0.25), 2.5);
  assert.equal(F.approach(0, 10, 3), 3);
  assert.equal(F.approach(9, 10, 3), 10);
  assert.equal(F.approach(0, -10, 3), -3);
  assert.equal(F.wrap(-1, 0, 4), 3);
  assert.equal(F.wrap(9, 0, 4), 1);
  near(F.remap(5, 0, 10, 100, 200), 150);
  near(F.damp(0, 10, 1000, 1), 10);
});

test('Vec2', () => {
  const v = new F.Vec2(3, 4);
  assert.equal(v.len(), 5);
  v.norm();
  near(v.x, 0.6); near(v.y, 0.8);
  const r = new F.Vec2(1, 0).rotate(Math.PI / 2);
  near(r.x, 0); near(r.y, 1);
  assert.ok(new F.Vec2(10, 0).limit(2).equals(new F.Vec2(2, 0)));
});

test('Random is deterministic per seed', () => {
  const a = new F.Random(42), b = new F.Random(42);
  for (let i = 0; i < 50; i++) assert.equal(a.next(), b.next());
  const r = new F.Random(7);
  for (let i = 0; i < 1000; i++) {
    const n = r.int(1, 6);
    assert.ok(n >= 1 && n <= 6 && Number.isInteger(n));
  }
});

test('easings start at 0 and end at 1', () => {
  for (const [name, fn] of Object.entries(F.Ease)) {
    near(fn(0), 0, 1e-9, name);
    near(fn(1), 1, 1e-9, name);
  }
});

test('Collide', () => {
  const a = { x: 0, y: 0, w: 10, h: 10 };
  assert.ok(F.Collide.rects(a, { x: 9, y: 9, w: 5, h: 5 }));
  assert.ok(!F.Collide.rects(a, { x: 10, y: 0, w: 5, h: 5 }), 'touching edges do not overlap');
  assert.ok(F.Collide.circles({ x: 0, y: 0, r: 2 }, { x: 3, y: 0, r: 2 }));
  assert.ok(F.Collide.rectCircle(a, { x: 12, y: 5, r: 3 }));
  assert.ok(!F.Collide.rectCircle(a, { x: 14, y: 14, r: 3 }));
  assert.deepEqual(F.Collide.resolve(a, { x: 8, y: 0, w: 10, h: 10 }), { x: -2, y: 0 });
  assert.equal(F.Collide.resolve(a, { x: 20, y: 0, w: 1, h: 1 }), null);
});

const map = () => new F.Tilemap({
  tileSize: 10,
  rows: [
    '..........',
    '..........',
    '....==....',
    '..........',
    '#........#',
    '##########',
  ],
  legend: { '#': { solid: true }, '=': { oneWay: true } },
});

test('Tilemap queries', () => {
  const m = map();
  assert.equal(m.width, 100);
  assert.equal(m.height, 60);
  assert.ok(m.isSolid(0, 5));
  assert.ok(!m.isSolid(1, 1));
  assert.ok(m.isSolid(-1, 0), 'left edge is a wall by default');
  assert.ok(!m.isSolid(0, 99), 'bottom edge is open by default');
  assert.ok(m.solidAt(5, 55));
  const t = new F.Tilemap({ rows: ['.P..', '..P.'], tileSize: 8 });
  assert.deepEqual(t.take('P').map((p) => [p.tx, p.ty, p.x, p.y]), [[1, 0, 8, 0], [2, 1, 16, 8]]);
  assert.equal(t.get(1, 0), ' ');
  assert.equal(m.tilesIn({ x: 5, y: 45, w: 10, h: 10 }).length, 4);
});

test('Physics: falling body lands on the floor', () => {
  const m = map();
  const b = { x: 30, y: 0, w: 8, h: 8 };
  const hit = F.Physics.move(b, 0, 200, m);
  assert.ok(hit.bottom);
  assert.equal(b.y, 42); // floor top is y=50
  assert.ok(F.Physics.grounded(b, m));
});

test('Physics: walls stop horizontal motion without tunneling', () => {
  const m = map();
  const b = { x: 20, y: 40, w: 8, h: 8 };
  const hit = F.Physics.move(b, 500, 0, m);
  assert.ok(hit.right);
  assert.equal(b.x, 82); // wall at x=90
  F.Physics.move(b, -500, 0, m);
  assert.equal(b.x, 10);
});

test('Physics: one-way platforms hold from above, pass from below', () => {
  const m = map();
  const above = { x: 42, y: 5, w: 8, h: 8 };
  assert.ok(F.Physics.move(above, 0, 30, m).bottom);
  assert.equal(above.y, 12); // platform top is y=20
  const below = { x: 42, y: 32, w: 8, h: 8 };
  const up = F.Physics.move(below, 0, -25, m);
  assert.ok(!up.top);
  assert.equal(below.y, 7);
  const drop = { x: 42, y: 12, w: 8, h: 8, dropThrough: true };
  F.Physics.move(drop, 0, 10, m);
  assert.equal(drop.y, 22);
});

test('Entity.move zeroes velocity and sets onGround', () => {
  const m = map();
  const e = new F.Entity({ x: 30, y: 30, w: 8, h: 8, vy: 600, vx: 0, tags: ['player'] });
  e.move(1 / 10, m);
  assert.equal(e.vy, 0);
  assert.ok(e.onGround);
  assert.ok(e.is('player'));
});

test('World add, query, removal and z-order', () => {
  const w = new F.World();
  const order = [];
  const mk = (z, tag) => w.add(new F.Entity({ z, tags: [tag], draw() { order.push(z); } }));
  const a = mk(2, 'enemy'), b = mk(1, 'enemy'), c = mk(0, 'coin');
  assert.equal(w.query('enemy').length, 2);
  assert.equal(w.first('coin'), c);
  w.draw({});
  assert.deepEqual(order, [0, 1, 2]);
  a.destroy();
  w.update(0.016);
  assert.equal(w.count, 2);
  assert.deepEqual(w.overlapping({ x: 0, y: 0, w: 1, h: 1 }, 'enemy'), [b]);
});

test('World draw interpolates between ticks', () => {
  const w = new F.World();
  let seen;
  const e = w.add(new F.Entity({ x: 0, draw() { seen = this.x; } }));
  w._savePrev();
  e.x = 10;
  w.draw({}, 0.5);
  assert.equal(seen, 5);
  assert.equal(e.x, 10, 'real position restored after draw');
});

test('Camera follows target within bounds', () => {
  const game = { width: 100, height: 50, scale: 1 };
  const cam = new F.Camera(game);
  const target = { x: 500, y: 20, w: 10, h: 10 };
  cam.follow(target).setBounds(0, 0, 300, 50);
  assert.equal(cam.x, 200);
  assert.equal(cam.y, 0);
  target.x = 0;
  for (let i = 0; i < 600; i++) cam.update(1 / 60);
  assert.equal(cam.x, 0);
  const ctx = { scale() {}, translate() {} };
  cam.apply(ctx);
  assert.deepEqual(cam.screenToWorld(10, 10), { x: 10, y: 10 });
});

test('Timers fire after and every', () => {
  const t = new F.Timers();
  let once = 0, many = 0;
  t.after(0.5, () => once++);
  const h = t.every(0.1, () => many++);
  for (let i = 0; i < 10; i++) t.update(0.1);
  assert.equal(once, 1);
  assert.equal(many, 10);
  h.cancel();
  t.update(1);
  assert.equal(many, 10);
  let limited = 0;
  t.every(0.1, () => limited++, 3);
  t.update(1);
  assert.equal(limited, 3);
});

test('Tweens animate, delay, yoyo and finish', () => {
  const tw = new F.Tweens();
  const o = { x: 0, y: 5 };
  let done = false;
  tw.to(o, { x: 10 }, 1, { ease: 'linear', delay: 0.5, onDone: () => (done = true) });
  tw.update(0.5);
  assert.equal(o.x, 0);
  tw.update(0.5);
  near(o.x, 5);
  tw.update(0.5);
  assert.equal(o.x, 10);
  assert.ok(done);
  assert.equal(tw.list.length, 0);
  tw.to(o, { y: 15 }, 1, { ease: 'linear', yoyo: true, repeat: 1 });
  tw.update(1);
  assert.equal(o.y, 15);
  tw.update(1);
  assert.equal(o.y, 5);
});

test('Animator loops and stops', () => {
  let ended = 0;
  const a = new F.Animator({ run: { frames: [3, 4, 5], fps: 10 }, die: { frames: [8, 9], fps: 10, loop: false, onEnd: () => ended++ } });
  assert.equal(a.frame, 3);
  a.update(0.15);
  assert.equal(a.frame, 4);
  a.update(0.2);
  assert.equal(a.frame, 3);
  a.play('die');
  a.update(0.5);
  assert.equal(a.frame, 9);
  assert.ok(a.done);
  a.update(1);
  assert.equal(ended, 1);
});

test('Particles emit and expire', () => {
  const p = new F.Particles(50);
  p.emit(0, 0, { count: 100, life: 0.5 });
  assert.equal(p.count, 50, 'capped at max');
  p.update(0.25);
  assert.equal(p.count, 50);
  p.update(0.3);
  assert.equal(p.count, 0);
});

test('Input actions and per-step pressed state', () => {
  const input = new F.Input(null);
  input._press('ArrowLeft');
  assert.ok(input.down('left'));
  assert.ok(input.pressed('left'));
  assert.equal(input.axis('left', 'right'), -1);
  input._endStep();
  assert.ok(input.down('left'));
  assert.ok(!input.pressed('left'));
  input._release('ArrowLeft');
  assert.ok(input.released('left'));
  input.bind('fire', 'KeyF');
  input._press('KeyF');
  assert.ok(input.pressed('fire'));
  assert.ok(input.pressed('KeyF'), 'raw codes work too');
  input._syncVirtual('pad', new Set(['PadA']));
  assert.ok(input.down('jump'));
  input._syncVirtual('pad', new Set());
  assert.ok(input.released('jump'));
});

test('NOTE converts note names to Hz', () => {
  near(F.NOTE('A4'), 440);
  near(F.NOTE('A5'), 880);
  near(F.NOTE('C4'), 261.6256, 1e-3);
  near(F.NOTE('C#4'), 277.1826, 1e-3);
});
