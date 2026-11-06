/*!
 * Flint — a tiny 2D game engine for the browser.
 * One file, no dependencies. Load it with a plain <script> tag (works from file://)
 * or require() it in Node for the non-DOM parts (math, collision, tilemaps, tweens...).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Flint = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const VERSION = '1.0.0';
  const hasDOM = typeof window !== 'undefined' && typeof document !== 'undefined';

  // ───────────────────────────── Math ─────────────────────────────

  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const invLerp = (a, b, v) => (a === b ? 0 : (v - a) / (b - a));
  const remap = (v, a1, b1, a2, b2) => lerp(a2, b2, invLerp(a1, b1, v));
  const approach = (v, target, step) => (v < target ? Math.min(v + step, target) : Math.max(v - step, target));
  /** Frame-rate independent smoothing toward b. Higher lambda = faster. */
  const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
  const wrap = (v, lo, hi) => { const r = hi - lo; return lo + ((((v - lo) % r) + r) % r); };
  const sign = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);
  const angleTo = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1);
  const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

  class Vec2 {
    constructor(x = 0, y = 0) { this.x = x; this.y = y; }
    static fromAngle(a, len = 1) { return new Vec2(Math.cos(a) * len, Math.sin(a) * len); }
    set(x, y) { this.x = x; this.y = y; return this; }
    copy(v) { this.x = v.x; this.y = v.y; return this; }
    clone() { return new Vec2(this.x, this.y); }
    add(v) { this.x += v.x; this.y += v.y; return this; }
    sub(v) { this.x -= v.x; this.y -= v.y; return this; }
    scale(s) { this.x *= s; this.y *= s; return this; }
    dot(v) { return this.x * v.x + this.y * v.y; }
    len() { return Math.hypot(this.x, this.y); }
    lenSq() { return this.x * this.x + this.y * this.y; }
    norm() { const l = this.len(); if (l > 0) { this.x /= l; this.y /= l; } return this; }
    dist(v) { return Math.hypot(v.x - this.x, v.y - this.y); }
    angle() { return Math.atan2(this.y, this.x); }
    rotate(a) { const c = Math.cos(a), s = Math.sin(a); return this.set(this.x * c - this.y * s, this.x * s + this.y * c); }
    lerp(v, t) { this.x = lerp(this.x, v.x, t); this.y = lerp(this.y, v.y, t); return this; }
    limit(max) { const l = this.len(); if (l > max) this.scale(max / l); return this; }
    equals(v, eps = 1e-9) { return Math.abs(this.x - v.x) <= eps && Math.abs(this.y - v.y) <= eps; }
  }

  /** Seedable PRNG (mulberry32). */
  class Random {
    constructor(seed = Date.now()) { this.seed(seed); }
    seed(s) { this._s = (s >>> 0) || 1; return this; }
    next() {
      let t = (this._s = (this._s + 0x6d2b79f5) >>> 0);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    range(a, b) { return a + (b - a) * this.next(); }
    int(a, b) { return Math.floor(this.range(a, b + 1)); }
    pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
    chance(p) { return this.next() < p; }
    sign() { return this.next() < 0.5 ? -1 : 1; }
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(this.next() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
      return arr;
    }
  }
  const random = new Random();
  /** A number, or a random value inside a [min, max] pair. */
  const range = (v) => (Array.isArray(v) ? random.range(v[0], v[1]) : v);

  const Ease = {
    linear: (t) => t,
    inQuad: (t) => t * t,
    outQuad: (t) => t * (2 - t),
    inOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    inCubic: (t) => t * t * t,
    outCubic: (t) => (--t) * t * t + 1,
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
    inSine: (t) => 1 - Math.cos((t * Math.PI) / 2),
    outSine: (t) => Math.sin((t * Math.PI) / 2),
    inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    outElastic: (t) => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
    outBounce: (t) => {
      const n = 7.5625, d = 2.75;
      if (t < 1 / d) return n * t * t;
      if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
      if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
      return n * (t -= 2.625 / d) * t + 0.984375;
    },
  };

  // ─────────────────────────── Collision ───────────────────────────
  // Rects are {x, y, w, h} (top-left origin). Circles are {x, y, r} (center).

  const Collide = {
    rects: (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y,
    point: (px, py, r) => px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h,
    circles: (a, b) => { const dx = a.x - b.x, dy = a.y - b.y, r = a.r + b.r; return dx * dx + dy * dy < r * r; },
    rectCircle: (r, c) => {
      const dx = c.x - clamp(c.x, r.x, r.x + r.w), dy = c.y - clamp(c.y, r.y, r.y + r.h);
      return dx * dx + dy * dy < c.r * c.r;
    },
    /** Smallest {x, y} push that moves rect a out of rect b, or null if they don't overlap. */
    resolve: (a, b) => {
      if (!Collide.rects(a, b)) return null;
      const left = b.x + b.w - a.x, right = a.x + a.w - b.x, up = a.y + a.h - b.y, down = b.y + b.h - a.y;
      const mx = left < right ? left : -right, my = down < up ? down : -up;
      return Math.abs(mx) < Math.abs(my) ? { x: mx, y: 0 } : { x: 0, y: my };
    },
    /** A rect shrunk by dx on the left/right and dy on the top/bottom. */
    inset: (r, dx, dy = dx) => ({ x: r.x + dx, y: r.y + dy, w: Math.max(0, r.w - dx * 2), h: Math.max(0, r.h - dy * 2) }),
  };

  // ─────────────────────────── Tilemap ───────────────────────────

  /**
   * A grid of characters. `legend` maps a character to tile info, e.g.
   *   { '#': { solid: true, color: '#553' }, '=': { oneWay: true, draw(ctx, x, y, size) {...} } }
   * Characters not in the legend are empty.
   */
  class Tilemap {
    constructor({ rows, tileSize = 16, legend = {}, edges } = {}) {
      if (!rows || !rows.length) throw new Error('Tilemap needs rows');
      this.tileSize = tileSize;
      this.legend = legend;
      this.cols = Math.max(...rows.map((r) => r.length));
      this.rowsCount = rows.length;
      this.grid = rows.map((r) => r.padEnd(this.cols, ' ').split(''));
      const e = edges === undefined ? { left: true, right: true, top: false, bottom: false }
        : typeof edges === 'boolean' ? { left: edges, right: edges, top: edges, bottom: edges } : edges;
      this.edges = Object.assign({ left: false, right: false, top: false, bottom: false }, e);
    }
    get width() { return this.cols * this.tileSize; }
    get height() { return this.rowsCount * this.tileSize; }
    inBounds(tx, ty) { return tx >= 0 && ty >= 0 && tx < this.cols && ty < this.rowsCount; }
    get(tx, ty) { return this.inBounds(tx, ty) ? this.grid[ty][tx] : null; }
    set(tx, ty, ch) { if (this.inBounds(tx, ty)) this.grid[ty][tx] = ch; }
    info(tx, ty) { const ch = this.get(tx, ty); return ch === null ? null : this.legend[ch] || null; }
    isSolid(tx, ty) {
      if (tx < 0) return this.edges.left;
      if (tx >= this.cols) return this.edges.right;
      if (ty < 0) return this.edges.top;
      if (ty >= this.rowsCount) return this.edges.bottom;
      const i = this.legend[this.grid[ty][tx]];
      return !!(i && i.solid);
    }
    isOneWay(tx, ty) { const i = this.info(tx, ty); return !!(i && i.oneWay); }
    toTile(px, py) { return { tx: Math.floor(px / this.tileSize), ty: Math.floor(py / this.tileSize) }; }
    solidAt(px, py) { const t = this.toTile(px, py); return this.isSolid(t.tx, t.ty); }
    /** Every position of a character, as tile and pixel coordinates. */
    find(ch) {
      const out = [], s = this.tileSize;
      for (let ty = 0; ty < this.rowsCount; ty++)
        for (let tx = 0; tx < this.cols; tx++)
          if (this.grid[ty][tx] === ch) out.push({ tx, ty, x: tx * s, y: ty * s });
      return out;
    }
    /** Like find(), but also clears those tiles. Handy for spawn markers. */
    take(ch, replacement = ' ') {
      const found = this.find(ch);
      for (const f of found) this.grid[f.ty][f.tx] = replacement;
      return found;
    }
    /** All in-bounds tiles a rect touches: [{tx, ty, ch, info}]. */
    tilesIn(r) {
      const s = this.tileSize, out = [];
      const x0 = Math.max(0, Math.floor(r.x / s)), x1 = Math.min(this.cols - 1, Math.floor((r.x + r.w - 1e-6) / s));
      const y0 = Math.max(0, Math.floor(r.y / s)), y1 = Math.min(this.rowsCount - 1, Math.floor((r.y + r.h - 1e-6) / s));
      for (let ty = y0; ty <= y1; ty++)
        for (let tx = x0; tx <= x1; tx++) {
          const ch = this.grid[ty][tx];
          out.push({ tx, ty, ch, info: this.legend[ch] || null });
        }
      return out;
    }
    draw(ctx, camera) {
      const s = this.tileSize;
      const v = camera ? camera.view() : { x: 0, y: 0, w: this.width, h: this.height };
      const x0 = Math.max(0, Math.floor(v.x / s)), x1 = Math.min(this.cols - 1, Math.floor((v.x + v.w) / s));
      const y0 = Math.max(0, Math.floor(v.y / s)), y1 = Math.min(this.rowsCount - 1, Math.floor((v.y + v.h) / s));
      for (let ty = y0; ty <= y1; ty++) {
        const row = this.grid[ty];
        for (let tx = x0; tx <= x1; tx++) {
          const i = this.legend[row[tx]];
          if (!i) continue;
          const x = tx * s, y = ty * s;
          if (i.draw) i.draw(ctx, x, y, s, tx, ty, this);
          else if (i.sprite) ctx.drawImage(i.sprite, x, y, s, s);
          else if (i.sheet) i.sheet.draw(ctx, i.frame || 0, x, y);
          else if (i.color) { ctx.fillStyle = i.color; ctx.fillRect(x, y, s, s); }
        }
      }
    }
  }

  // ─────────────────────────── Physics ───────────────────────────

  const EPS = 1e-6;
  function moveAxis(body, amount, horizontal, map, hits) {
    const s = map.tileSize, maxStep = s * 0.5;
    let remaining = amount;
    while (remaining !== 0) {
      const step = Math.abs(remaining) > maxStep ? Math.sign(remaining) * maxStep : remaining;
      remaining -= step;
      if (Math.abs(remaining) < EPS) remaining = 0;
      if (horizontal) {
        body.x += step;
        const tx = Math.floor((step > 0 ? body.x + body.w - EPS : body.x) / s);
        const y0 = Math.floor(body.y / s), y1 = Math.floor((body.y + body.h - EPS) / s);
        for (let ty = y0; ty <= y1; ty++) {
          if (!map.isSolid(tx, ty)) continue;
          if (step > 0) { body.x = tx * s - body.w; hits.right = true; } else { body.x = (tx + 1) * s; hits.left = true; }
          return;
        }
      } else {
        const prevBottom = body.y + body.h;
        body.y += step;
        const ty = Math.floor((step > 0 ? body.y + body.h - EPS : body.y) / s);
        const x0 = Math.floor(body.x / s), x1 = Math.floor((body.x + body.w - EPS) / s);
        for (let tx = x0; tx <= x1; tx++) {
          const solid = map.isSolid(tx, ty);
          const platform = !solid && step > 0 && !body.dropThrough && map.isOneWay(tx, ty) && prevBottom <= ty * s + EPS;
          if (!solid && !platform) continue;
          if (step > 0) { body.y = ty * s - body.h; hits.bottom = true; } else { body.y = (ty + 1) * s; hits.top = true; }
          return;
        }
      }
    }
  }

  const Physics = {
    /**
     * Move a {x, y, w, h} body by (dx, dy) against a tilemap's solid and one-way tiles.
     * Moves X then Y and sub-steps so fast bodies don't tunnel. Returns which sides hit.
     * Set body.dropThrough = true to fall through one-way platforms.
     */
    move(body, dx, dy, map) {
      const hits = { left: false, right: false, top: false, bottom: false };
      if (!map) { body.x += dx; body.y += dy; return hits; }
      if (dx) moveAxis(body, dx, true, map, hits);
      if (dy) moveAxis(body, dy, false, map, hits);
      return hits;
    },
    /** True if the body is standing on something (solid tile or one-way platform) right below it. */
    grounded(body, map) {
      const probe = { x: body.x, y: body.y, w: body.w, h: body.h, dropThrough: body.dropThrough };
      return Physics.move(probe, 0, 1, map).bottom;
    },
  };

  // ─────────────────────────── Entities ───────────────────────────

  class Entity {
    constructor(props = {}) {
      this.x = 0; this.y = 0; this.w = 16; this.h = 16;
      this.vx = 0; this.vy = 0;
      this.z = 0;
      this.visible = true;
      this.alive = true;
      this.tags = new Set();
      this.scene = null;
      this.onGround = false;
      const { tags, ...rest } = props;
      Object.assign(this, rest);
      if (tags) for (const t of tags) this.tags.add(t);
    }
    get game() { return this.scene && this.scene.game; }
    get cx() { return this.x + this.w / 2; }
    get cy() { return this.y + this.h / 2; }
    get left() { return this.x; }
    get right() { return this.x + this.w; }
    get top() { return this.y; }
    get bottom() { return this.y + this.h; }
    is(tag) { return this.tags.has(tag); }
    tag(...t) { for (const x of t) this.tags.add(x); return this; }
    overlaps(o) { return Collide.rects(this, o); }
    /** Apply velocity for dt seconds against the scene's tilemap (or `map`). Zeroes velocity on hit sides. */
    move(dt, map = this.scene && this.scene.map) {
      const hit = Physics.move(this, this.vx * dt, this.vy * dt, map);
      if ((hit.left && this.vx < 0) || (hit.right && this.vx > 0)) this.vx = 0;
      if ((hit.top && this.vy < 0) || (hit.bottom && this.vy > 0)) this.vy = 0;
      this.onGround = hit.bottom || (this.vy >= 0 && map ? Physics.grounded(this, map) : false);
      this.hit = hit;
      return hit;
    }
    /** Skip render interpolation for this frame (call after teleporting). */
    snap() { this._px = this.x; this._py = this.y; return this; }
    destroy() { this.alive = false; }
    update(dt) {}
    draw(ctx) {}
  }

  class World {
    constructor(scene = null) { this.scene = scene; this.entities = []; }
    add(e) {
      e.scene = this.scene; e.alive = true; e.snap();
      this.entities.push(e);
      if (e.onAdd) e.onAdd();
      return e;
    }
    remove(e) { e.alive = false; }
    clear() { for (const e of this.entities) e.alive = false; this._cull(); }
    get count() { return this.entities.length; }
    query(tag) { return this.entities.filter((e) => e.alive && e.tags.has(tag)); }
    first(tag) { return this.entities.find((e) => e.alive && e.tags.has(tag)) || null; }
    find(pred) { return this.entities.find((e) => e.alive && pred(e)) || null; }
    each(fn) { for (const e of this.entities) if (e.alive) fn(e); }
    /** Live entities with `tag` overlapping rect `r` (excluding r itself). */
    overlapping(r, tag) {
      return this.entities.filter((e) => e.alive && e !== r && (!tag || e.tags.has(tag)) && Collide.rects(r, e));
    }
    _savePrev() { for (const e of this.entities) { e._px = e.x; e._py = e.y; } }
    update(dt) {
      const n = this.entities.length; // entities added this tick start updating next tick
      for (let i = 0; i < n; i++) { const e = this.entities[i]; if (e.alive) e.update(dt); }
      this._cull();
    }
    _cull() {
      let j = 0;
      for (let i = 0; i < this.entities.length; i++) {
        const e = this.entities[i];
        if (e.alive) this.entities[j++] = e;
        else if (e.onRemove) e.onRemove();
      }
      this.entities.length = j;
    }
    _sorted() { return this.entities.slice().sort((a, b) => a.z - b.z); }
    draw(ctx, alpha = 1) {
      for (const e of this._sorted()) {
        if (!e.visible || !e.alive) continue;
        const x = e.x, y = e.y;
        if (alpha < 1 && e._px !== undefined && Math.abs(x - e._px) + Math.abs(y - e._py) < 64) {
          e.x = lerp(e._px, x, alpha); e.y = lerp(e._py, y, alpha);
        }
        e.draw(ctx);
        e.x = x; e.y = y;
      }
    }
    drawDebug(ctx, lineWidth = 1) {
      ctx.save();
      ctx.lineWidth = lineWidth;
      for (const e of this.entities) {
        ctx.strokeStyle = e.onGround ? '#3f6' : '#f3c';
        ctx.strokeRect(e.x, e.y, e.w, e.h);
      }
      ctx.restore();
    }
  }

  // ─────────────────────────── Camera ───────────────────────────

  class Camera {
    constructor(game) {
      this.game = game;
      this.x = 0; this.y = 0; this._px = 0; this._py = 0;
      this.zoom = 1;
      this.target = null; this.lerp = 8;
      this.offsetX = 0; this.offsetY = 0;
      this.bounds = null;
      this._shakeT = 0; this._shakeDur = 0; this._shakeMag = 0; this._sx = 0; this._sy = 0;
      this._rx = 0; this._ry = 0;
    }
    get w() { return this.game.width / this.zoom; }
    get h() { return this.game.height / this.zoom; }
    /** Follow an entity (or anything with x, y and optional w, h). lerp 0 = rigid. */
    follow(target, { lerp: l = 8, snap = true, offsetX = 0, offsetY = 0 } = {}) {
      this.target = target; this.lerp = l; this.offsetX = offsetX; this.offsetY = offsetY;
      if (snap && target) this.center(this._targetX(), this._targetY(), true);
      return this;
    }
    /** Keep the camera inside a rect, e.g. camera.setBounds(0, 0, map.width, map.height). */
    setBounds(x, y, w, h) { this.bounds = { x, y, w, h }; this._clamp(); return this; }
    center(x, y, snap = false) {
      this.x = x - this.w / 2; this.y = y - this.h / 2; this._clamp();
      if (snap) { this._px = this.x; this._py = this.y; }
      return this;
    }
    shake(intensity = 4, duration = 0.3) {
      if (intensity >= this._shakeMag * (this._shakeT / (this._shakeDur || 1))) {
        this._shakeMag = intensity; this._shakeDur = duration; this._shakeT = duration;
      }
      return this;
    }
    _targetX() { const t = this.target; return t.x + (t.w || 0) / 2 + this.offsetX; }
    _targetY() { const t = this.target; return t.y + (t.h || 0) / 2 + this.offsetY; }
    _clamp() {
      const b = this.bounds; if (!b) return;
      this.x = b.w <= this.w ? b.x + (b.w - this.w) / 2 : clamp(this.x, b.x, b.x + b.w - this.w);
      this.y = b.h <= this.h ? b.y + (b.h - this.h) / 2 : clamp(this.y, b.y, b.y + b.h - this.h);
    }
    _savePrev() { this._px = this.x; this._py = this.y; }
    update(dt) {
      if (this.target) {
        const tx = this._targetX() - this.w / 2, ty = this._targetY() - this.h / 2;
        if (this.lerp > 0) { this.x = damp(this.x, tx, this.lerp, dt); this.y = damp(this.y, ty, this.lerp, dt); }
        else { this.x = tx; this.y = ty; }
      }
      this._clamp();
      if (this._shakeT > 0) {
        this._shakeT = Math.max(0, this._shakeT - dt);
        const a = this._shakeMag * (this._shakeT / this._shakeDur);
        this._sx = random.range(-a, a); this._sy = random.range(-a, a);
      } else { this._sx = this._sy = 0; this._shakeMag = 0; }
    }
    apply(ctx, alpha = 1) {
      const s = (this.game.scale || 1) * this.zoom;
      const x = lerp(this._px, this.x, alpha) + this._sx, y = lerp(this._py, this.y, alpha) + this._sy;
      // snap to whole device pixels so tiles stay crisp
      this._rx = Math.round(x * s) / s; this._ry = Math.round(y * s) / s;
      ctx.scale(this.zoom, this.zoom);
      ctx.translate(-this._rx, -this._ry);
    }
    /** The rect of the world currently on screen. */
    view() { return { x: this._rx, y: this._ry, w: this.w, h: this.h }; }
    screenToWorld(sx, sy) { return { x: sx / this.zoom + this._rx, y: sy / this.zoom + this._ry }; }
    worldToScreen(wx, wy) { return { x: (wx - this._rx) * this.zoom, y: (wy - this._ry) * this.zoom }; }
    sees(r, margin = 0) { const v = this.view(); return Collide.rects({ x: v.x - margin, y: v.y - margin, w: v.w + margin * 2, h: v.h + margin * 2 }, r); }
  }

  // ─────────────────────── Timers & Tweens ───────────────────────

  class Timers {
    constructor() { this.list = []; }
    after(seconds, fn) { return this._add(seconds, fn, 1); }
    every(seconds, fn, times = Infinity) { return this._add(seconds, fn, times); }
    _add(interval, fn, times) {
      const t = { interval: Math.max(0, interval), left: Math.max(0, interval), fn, times, cancelled: false, cancel() { this.cancelled = true; } };
      this.list.push(t);
      return t;
    }
    update(dt) {
      for (let i = 0; i < this.list.length; i++) {
        const t = this.list[i];
        if (t.cancelled) continue;
        t.left -= dt;
        let guard = 0;
        while (t.left <= 0 && t.times > 0 && !t.cancelled && guard++ < 100) {
          t.times--;
          t.fn();
          t.left += t.interval > 0 ? t.interval : Infinity;
        }
      }
      this.list = this.list.filter((t) => !t.cancelled && t.times > 0);
    }
    clear() { this.list.length = 0; }
  }

  class Tweens {
    constructor() { this.list = []; }
    /** Animate numeric props of target. opts: ease, delay, repeat, yoyo, onUpdate, onDone. */
    to(target, props, duration = 0.3, opts = {}) {
      const tw = {
        target, props: Object.assign({}, props), from: null,
        duration: Math.max(1e-6, duration), t: -(opts.delay || 0),
        ease: typeof opts.ease === 'function' ? opts.ease : Ease[opts.ease || 'outQuad'] || Ease.linear,
        repeat: opts.repeat || 0, yoyo: !!opts.yoyo,
        onUpdate: opts.onUpdate, onDone: opts.onDone,
        done: false, cancelled: false, cancel() { this.cancelled = true; },
      };
      this.list.push(tw);
      return tw;
    }
    update(dt) {
      for (let i = 0; i < this.list.length; i++) {
        const tw = this.list[i];
        if (tw.cancelled || tw.done) continue;
        tw.t += dt;
        if (tw.t < 0) continue;
        if (!tw.from) { tw.from = {}; for (const k in tw.props) tw.from[k] = tw.target[k]; }
        const p = Math.min(1, tw.t / tw.duration), e = tw.ease(p);
        for (const k in tw.props) tw.target[k] = tw.from[k] + (tw.props[k] - tw.from[k]) * e;
        if (tw.onUpdate) tw.onUpdate(p);
        if (p >= 1) {
          if (tw.repeat > 0) {
            tw.repeat--; tw.t -= tw.duration;
            if (tw.yoyo) { const f = tw.from; tw.from = tw.props; tw.props = f; }
          } else { tw.done = true; if (tw.onDone) tw.onDone(); }
        }
      }
      this.list = this.list.filter((t) => !t.done && !t.cancelled);
    }
    cancelAll(target) { for (const t of this.list) if (!target || t.target === target) t.cancelled = true; }
    clear() { this.list.length = 0; }
  }

  // ─────────────────────────── Particles ───────────────────────────

  class Particles {
    constructor(max = 3000) { this.list = []; this.max = max; }
    get count() { return this.list.length; }
    /**
     * Emit a burst. Any numeric option can be a [min, max] range.
     * count, speed, angle, spread, life, size, color (string or array), gravity, drag,
     * radius (spawn area), fade, shrink, shape ('square' | 'circle'), blend ('lighter' for glow)
     */
    emit(x, y, o = {}) {
      const count = Math.round(range(o.count === undefined ? 12 : o.count));
      for (let i = 0; i < count && this.list.length < this.max; i++) {
        const a = range(o.angle || 0) + (random.next() - 0.5) * (o.spread === undefined ? Math.PI * 2 : o.spread);
        const sp = range(o.speed === undefined ? [20, 80] : o.speed);
        const life = Math.max(0.01, range(o.life === undefined ? [0.3, 0.7] : o.life));
        const rad = o.radius ? random.next() * range(o.radius) : 0, ra = random.next() * Math.PI * 2;
        this.list.push({
          x: x + Math.cos(ra) * rad, y: y + Math.sin(ra) * rad,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life, max: life, size: range(o.size === undefined ? [1, 3] : o.size),
          color: Array.isArray(o.color) ? random.pick(o.color) : o.color || '#fff',
          gravity: o.gravity || 0, drag: o.drag || 0,
          fade: o.fade !== false, shrink: o.shrink !== false,
          shape: o.shape || 'square', blend: o.blend || 'source-over',
        });
      }
    }
    update(dt) {
      const l = this.list;
      for (let i = l.length - 1; i >= 0; i--) {
        const p = l[i];
        p.life -= dt;
        if (p.life <= 0) { l[i] = l[l.length - 1]; l.pop(); continue; }
        p.vy += p.gravity * dt;
        if (p.drag) { const f = Math.exp(-p.drag * dt); p.vx *= f; p.vy *= f; }
        p.x += p.vx * dt; p.y += p.vy * dt;
      }
    }
    draw(ctx) {
      if (!this.list.length) return;
      ctx.save();
      const base = ctx.globalAlpha;
      for (const p of this.list) {
        const k = p.life / p.max, s = p.shrink ? p.size * k : p.size;
        ctx.globalAlpha = base * (p.fade ? k : 1);
        ctx.globalCompositeOperation = p.blend;
        ctx.fillStyle = p.color;
        if (p.shape === 'circle') { ctx.beginPath(); ctx.arc(p.x, p.y, s / 2, 0, Math.PI * 2); ctx.fill(); }
        else ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      }
      ctx.restore();
    }
    clear() { this.list.length = 0; }
  }

  // ─────────────────────────── Graphics ───────────────────────────

  function makeCanvas(w, h) {
    if (hasDOM) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
    if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
    return null;
  }

  /**
   * Turn text art into an image. Each character is one pixel; palette maps characters to colors.
   * Characters missing from the palette (like '.' or ' ') are transparent.
   */
  function pixelArt(rows, palette, scale = 1) {
    const h = rows.length, w = Math.max(...rows.map((r) => r.length));
    const c = makeCanvas(w * scale, h * scale);
    if (!c) return null;
    const g = c.getContext('2d');
    for (let y = 0; y < h; y++)
      for (let x = 0; x < rows[y].length; x++) {
        const col = palette[rows[y][x]];
        if (!col) continue;
        g.fillStyle = col;
        g.fillRect(x * scale, y * scale, scale, scale);
      }
    return c;
  }

  class SpriteSheet {
    constructor(image, frameWidth, frameHeight, { margin = 0, spacing = 0 } = {}) {
      this.image = image; this.fw = frameWidth; this.fh = frameHeight;
      this.margin = margin; this.spacing = spacing;
      this.cols = Math.max(1, Math.floor((image.width - margin * 2 + spacing) / (frameWidth + spacing)));
      this.rows = Math.max(1, Math.floor((image.height - margin * 2 + spacing) / (frameHeight + spacing)));
    }
    get frames() { return this.cols * this.rows; }
    /** Build a horizontal strip from several pixel-art frames that share a palette. */
    static fromPixelArt(frames, palette, scale = 1) {
      const fh = Math.max(...frames.map((f) => f.length)), fw = Math.max(...frames.map((f) => Math.max(...f.map((r) => r.length))));
      const strip = makeCanvas(fw * scale * frames.length, fh * scale);
      const g = strip.getContext('2d');
      frames.forEach((f, i) => g.drawImage(pixelArt(f, palette, scale), i * fw * scale, 0));
      return new SpriteSheet(strip, fw * scale, fh * scale);
    }
    /**
     * Draw a frame so that its point (ox, oy) lands on (x, y).
     * opts: flipX, flipY (mirror around the frame center), scale, scaleX, scaleY, rotation, alpha, ox, oy
     */
    draw(ctx, frame, x, y, o = {}) {
      const f = ((frame % this.frames) + this.frames) % this.frames;
      const sx = this.margin + (f % this.cols) * (this.fw + this.spacing);
      const sy = this.margin + Math.floor(f / this.cols) * (this.fh + this.spacing);
      const sc = o.scale || 1;
      ctx.save();
      if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
      ctx.translate(x, y);
      if (o.rotation) ctx.rotate(o.rotation);
      ctx.scale(sc * (o.scaleX === undefined ? 1 : o.scaleX), sc * (o.scaleY === undefined ? 1 : o.scaleY));
      ctx.translate(-(o.ox || 0), -(o.oy || 0));
      if (o.flipX || o.flipY) {
        ctx.translate(o.flipX ? this.fw : 0, o.flipY ? this.fh : 0);
        ctx.scale(o.flipX ? -1 : 1, o.flipY ? -1 : 1);
      }
      ctx.drawImage(this.image, sx, sy, this.fw, this.fh, 0, 0, this.fw, this.fh);
      ctx.restore();
    }
  }

  /** Plays named frame sequences: new Animator({ idle: { frames: [0, 1], fps: 4 }, die: { frames: [5, 6], loop: false } }) */
  class Animator {
    constructor(anims, initial) {
      this.anims = anims; this.name = null; this.time = 0; this.index = 0; this.done = false;
      this.play(initial || Object.keys(anims)[0]);
    }
    get current() { return this.anims[this.name]; }
    get frame() { const a = this.current; return a ? a.frames[this.index] : 0; }
    play(name, restart = false) {
      if (!this.anims[name]) throw new Error('Unknown animation: ' + name);
      if (name === this.name && !restart) return this;
      this.name = name; this.time = 0; this.index = 0; this.done = false;
      return this;
    }
    update(dt) {
      const a = this.current;
      if (!a || this.done) return;
      this.time += dt;
      const n = a.frames.length;
      let i = Math.floor(this.time * (a.fps || 8));
      if (a.loop === false) {
        if (i >= n) { i = n - 1; this.done = true; if (a.onEnd) a.onEnd(); }
      } else i %= n;
      this.index = i;
    }
  }

  /** Draw a line of text. opts: size, color, align, baseline, font, weight, shadow, alpha */
  function text(ctx, str, x, y, o = {}) {
    ctx.save();
    ctx.font = `${o.weight || ''} ${o.size || 8}px ${o.font || 'ui-monospace, Menlo, Consolas, monospace'}`;
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.baseline || 'top';
    if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    str = String(str);
    if (o.shadow) { ctx.fillStyle = o.shadow; const d = o.shadowOffset === undefined ? 1 : o.shadowOffset; ctx.fillText(str, x + d, y + d); }
    ctx.fillStyle = o.color || '#fff';
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  // ─────────────────────────── Storage ───────────────────────────

  const store = {
    get(key, fallback = null) {
      try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; } },
    remove(key) { try { localStorage.removeItem(key); } catch (e) { /* ignore */ } },
  };

  // ─────────────────────────── Audio ───────────────────────────

  const NOTE = (name) => {
    // 'A4', 'C#5', 'Eb3' → Hz
    const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
    if (!m) return 0;
    const semis = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return 440 * Math.pow(2, (semis + (parseInt(m[3], 10) - 4) * 12) / 12);
  };

  class AudioEngine {
    constructor() {
      this.ctx = null; this.master = null; this.buffers = {};
      this.muted = store.get('flint:muted', false);
      this.volume = store.get('flint:volume', 0.6);
      this._noise = null;
    }
    _ensure() {
      if (this.ctx) return this.ctx;
      const AC = hasDOM && (window.AudioContext || window.webkitAudioContext);
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : this.volume;
      this.master.connect(this.ctx.destination);
      return this.ctx;
    }
    /** Browsers only allow sound after a user gesture; Input calls this on the first key or tap. */
    unlock() { const c = this._ensure(); if (c && c.state === 'suspended') c.resume().catch(() => {}); }
    get ready() { return !!(this.ctx && this.ctx.state === 'running' && !this.muted); }
    setMuted(m) {
      this.muted = !!m; store.set('flint:muted', this.muted);
      if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.02);
      return this.muted;
    }
    toggleMute() { return this.setMuted(!this.muted); }
    setVolume(v) {
      this.volume = clamp(v, 0, 1); store.set('flint:volume', this.volume);
      if (this.master && !this.muted) this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02);
    }
    /** A synthesized blip. freq can be a number or a note name like 'C5'; `to` slides the pitch. */
    tone({ freq = 440, to = 0, dur = 0.15, type = 'square', vol = 0.25, attack = 0.005, delay = 0 } = {}) {
      if (!this.ready) return;
      const c = this.ctx, t = c.currentTime + delay;
      const f0 = typeof freq === 'string' ? NOTE(freq) : freq, f1 = typeof to === 'string' ? NOTE(to) : to;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, t);
      if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
      const a = Math.min(attack, dur * 0.5);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + dur + 0.05);
    }
    /** Filtered white noise: explosions, hits, wind. */
    noise({ dur = 0.2, vol = 0.25, freq = 1500, to = 0, filter = 'lowpass', delay = 0 } = {}) {
      if (!this.ready) return;
      const c = this.ctx, t = c.currentTime + delay;
      if (!this._noise) {
        this._noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
        const d = this._noise.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      src.buffer = this._noise; src.loop = true;
      f.type = filter; f.frequency.setValueAtTime(freq, t);
      if (to) f.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(this.master);
      src.start(t); src.stop(t + dur + 0.05);
    }
    /** Play notes one after another: jingle(['C5', 'E5', 'G5'], { step: 0.08 }). Use null for a rest. */
    jingle(notes, { step = 0.1, type = 'square', vol = 0.2, length = 0.9 } = {}) {
      notes.forEach((n, i) => { if (n) this.tone({ freq: n, dur: step * length * 1.6, type, vol, delay: i * step }); });
    }
    /** Play a loaded sound (see Assets.sound). */
    play(name, { vol = 1, rate = 1, loop = false } = {}) {
      const buf = this.buffers[name];
      if (!buf || !this.ready) return null;
      const src = this.ctx.createBufferSource(), g = this.ctx.createGain();
      src.buffer = buf; src.playbackRate.value = rate; src.loop = loop;
      g.gain.value = vol;
      src.connect(g); g.connect(this.master);
      src.start();
      return src;
    }
    /** Built-in sound effects: jump, coin, hit, hurt, explode, blip, select, powerup, land, win, lose. */
    sfx(name) {
      switch (name) {
        case 'jump': return this.tone({ freq: 220, to: 520, dur: 0.14, type: 'square', vol: 0.12 });
        case 'coin': this.tone({ freq: 'B5', dur: 0.06, vol: 0.12 }); return this.tone({ freq: 'E6', dur: 0.18, vol: 0.12, delay: 0.06 });
        case 'hit': return this.noise({ dur: 0.12, vol: 0.3, freq: 2400, to: 400 });
        case 'hurt': this.tone({ freq: 300, to: 90, dur: 0.3, type: 'sawtooth', vol: 0.15 }); return this.noise({ dur: 0.15, vol: 0.15 });
        case 'explode': return this.noise({ dur: 0.6, vol: 0.4, freq: 1800, to: 60 });
        case 'blip': return this.tone({ freq: 660, dur: 0.05, vol: 0.1 });
        case 'select': return this.tone({ freq: 440, to: 880, dur: 0.1, type: 'triangle', vol: 0.18 });
        case 'powerup': return this.jingle(['C5', 'E5', 'G5', 'C6'], { step: 0.06, vol: 0.12 });
        case 'land': return this.noise({ dur: 0.06, vol: 0.12, freq: 600 });
        case 'win': return this.jingle(['G4', 'C5', 'E5', 'G5', null, 'E5', 'G5'], { step: 0.1, vol: 0.13, type: 'triangle' });
        case 'lose': return this.jingle(['G4', 'F#4', 'F4', 'E4'], { step: 0.18, vol: 0.13, type: 'triangle' });
        default: return this.play(name);
      }
    }
  }

  // ─────────────────────────── Assets ───────────────────────────

  class Assets {
    constructor(audio) { this.audio = audio; this.images = {}; this.data = {}; }
    get sounds() { return this.audio.buffers; }
    image(name, url) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => { this.images[name] = img; resolve(img); };
        img.onerror = () => reject(new Error('Could not load image: ' + url));
        img.src = url;
      });
    }
    /** Needs to be served over http(s); browsers block fetch() from file://. */
    async sound(name, url) {
      const c = this.audio._ensure();
      if (!c) return null;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Could not load sound: ' + url);
      const data = await res.arrayBuffer();
      const buf = await new Promise((ok, fail) => c.decodeAudioData(data, ok, fail));
      this.audio.buffers[name] = buf;
      return buf;
    }
    async json(name, url) {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Could not load JSON: ' + url);
      return (this.data[name] = await res.json());
    }
    /** Load many at once: load({ images: { hero: 'hero.png' }, sounds: {...}, json: {...} }, p => ...) */
    async load(manifest = {}, onProgress) {
      const jobs = [];
      for (const [n, u] of Object.entries(manifest.images || {})) jobs.push(() => this.image(n, u));
      for (const [n, u] of Object.entries(manifest.sounds || {})) jobs.push(() => this.sound(n, u));
      for (const [n, u] of Object.entries(manifest.json || {})) jobs.push(() => this.json(n, u));
      let done = 0;
      if (onProgress) onProgress(jobs.length ? 0 : 1);
      await Promise.all(jobs.map((j) => j().then((v) => { done++; if (onProgress) onProgress(done / jobs.length); return v; })));
      return this;
    }
  }

  // ─────────────────────────── Input ───────────────────────────

  const DEFAULT_BINDINGS = {
    left: ['ArrowLeft', 'KeyA', 'PadLeft', 'TouchLeft'],
    right: ['ArrowRight', 'KeyD', 'PadRight', 'TouchRight'],
    up: ['ArrowUp', 'KeyW', 'PadUp'],
    down: ['ArrowDown', 'KeyS', 'PadDown'],
    jump: ['Space', 'KeyZ', 'KeyK', 'PadA', 'TouchA'],
    action: ['KeyX', 'KeyJ', 'ShiftLeft', 'PadX', 'TouchB'],
    confirm: ['Enter', 'Space', 'PadA', 'PadStart', 'Pointer'],
    cancel: ['Escape', 'Backspace', 'PadB'],
    pause: ['Escape', 'KeyP', 'PadStart'],
  };

  const TOUCH_BUTTONS = {
    left: { code: 'TouchLeft', label: '◀' },
    right: { code: 'TouchRight', label: '▶' },
    a: { code: 'TouchA', label: 'A' },
    b: { code: 'TouchB', label: 'B' },
  };

  class Input {
    constructor(game, opts = {}) {
      this.game = game;
      this.held = new Set(); this._pressed = new Set(); this._released = new Set();
      this.bindings = {};
      for (const k in DEFAULT_BINDINGS) this.bindings[k] = DEFAULT_BINDINGS[k].slice();
      this.pointer = { x: 0, y: 0, down: false, pressed: false, released: false, id: null, type: 'mouse' };
      this.stick = { x: 0, y: 0 };
      this.gamepad = null;
      this.touchActive = false;
      this.touchLayout = opts.touchButtons || ['left', 'right', 'a', 'b'];
      this._virtual = {};
      this._touches = new Map();
      if (hasDOM && game && game.canvas) this._attach(game.canvas);
    }

    // ---- queries (action names or raw codes like 'KeyQ') ----
    _test(set, name) {
      const codes = this.bindings[name];
      if (codes) { for (const c of codes) if (set.has(c)) return true; return false; }
      return set.has(name);
    }
    down(name) { return this._test(this.held, name); }
    pressed(name) { return this._test(this._pressed, name); }
    released(name) { return this._test(this._released, name); }
    anyPressed() { return this._pressed.size > 0; }
    /** -1, 0 or 1 from two actions, e.g. axis('left', 'right'). */
    axis(neg, pos) { return (this.down(pos) ? 1 : 0) - (this.down(neg) ? 1 : 0); }
    bind(action, codes) { this.bindings[action] = Array.isArray(codes) ? codes.slice() : [codes]; return this; }

    // ---- low level (also used by tests and for synthetic input) ----
    _press(code) { if (!this.held.has(code)) { this.held.add(code); this._pressed.add(code); } }
    _release(code) { if (this.held.has(code)) { this.held.delete(code); this._released.add(code); } }
    _syncVirtual(group, now) {
      const prev = this._virtual[group] || new Set();
      for (const c of now) if (!prev.has(c)) this._press(c);
      for (const c of prev) if (!now.has(c)) this._release(c);
      this._virtual[group] = now;
    }
    /** Called by the game before every fixed update. */
    _poll() {
      if (!hasDOM || !navigator.getGamepads) return;
      let pad = null;
      try { for (const p of navigator.getGamepads()) if (p && p.connected) { pad = p; break; } } catch (e) { return; }
      const now = new Set();
      if (pad) {
        const b = (i) => pad.buttons[i] && pad.buttons[i].pressed;
        const ax = pad.axes[0] || 0, ay = pad.axes[1] || 0, dz = 0.4;
        if (ax < -dz || b(14)) now.add('PadLeft');
        if (ax > dz || b(15)) now.add('PadRight');
        if (ay < -dz || b(12)) now.add('PadUp');
        if (ay > dz || b(13)) now.add('PadDown');
        const names = ['PadA', 'PadB', 'PadX', 'PadY', 'PadL', 'PadR', 'PadL2', 'PadR2', 'PadSelect', 'PadStart'];
        names.forEach((n, i) => { if (b(i)) now.add(n); });
        this.stick.x = Math.abs(ax) > 0.15 ? ax : 0; this.stick.y = Math.abs(ay) > 0.15 ? ay : 0;
        this.gamepad = pad.id;
      } else { this.stick.x = this.stick.y = 0; this.gamepad = null; }
      this._syncVirtual('pad', now);
    }
    /** Called by the game after every fixed update. */
    _endStep() {
      this._pressed.clear(); this._released.clear();
      this.pointer.pressed = false; this.pointer.released = false;
    }

    // ---- touch buttons ----
    get touchVisible() {
      const s = this.game && this.game.scene;
      return this.touchActive && this.touchLayout.length > 0 && !(s && s.showTouch === false);
    }
    touchButtons() {
      const W = this.game.width, H = this.game.height, r = Math.round(Math.min(W, H) * 0.11), m = 10;
      const pos = {
        left: { x: m + r, y: H - m - r }, right: { x: m + r * 3 + 8, y: H - m - r },
        a: { x: W - m - r, y: H - m - r }, b: { x: W - m - r * 3 - 8, y: H - m - r },
      };
      return this.touchLayout.map((k) => Object.assign({ r }, TOUCH_BUTTONS[k], pos[k]));
    }
    _buttonAt(p) {
      if (!this.touchVisible) return null;
      for (const b of this.touchButtons()) if (Math.hypot(p.x - b.x, p.y - b.y) < b.r * 1.35) return b;
      return null;
    }
    _syncTouch() {
      const now = new Set();
      for (const t of this._touches.values()) { const b = this._buttonAt(t); if (b) now.add(b.code); }
      this._syncVirtual('touch', now);
    }
    drawTouch(ctx) {
      if (!this.touchVisible) return;
      ctx.save();
      for (const b of this.touchButtons()) {
        const on = this.held.has(b.code);
        ctx.globalAlpha = on ? 0.45 : 0.18;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = on ? 0.9 : 0.5;
        text(ctx, b.label, b.x, b.y + 1, { size: Math.round(b.r * 0.8), align: 'center', baseline: 'middle', color: '#000' });
      }
      ctx.restore();
    }

    // ---- DOM ----
    _attach(canvas) {
      const isTyping = (e) => { const t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable); };
      const bound = (code) => { for (const k in this.bindings) if (this.bindings[k].includes(code)) return true; return false; };
      addEventListener('keydown', (e) => {
        if (isTyping(e)) return;
        if (this.game.audio) this.game.audio.unlock();
        if (bound(e.code) && !e.ctrlKey && !e.metaKey && !e.altKey) e.preventDefault();
        if (!e.repeat) this._press(e.code);
      });
      addEventListener('keyup', (e) => this._release(e.code));
      addEventListener('blur', () => { for (const c of [...this.held]) this._release(c); this._touches.clear(); this._virtual = {}; });

      const update = (e) => { const p = this.game.toLogical(e.clientX, e.clientY); this.pointer.x = p.x; this.pointer.y = p.y; return p; };
      canvas.addEventListener('pointerdown', (e) => {
        if (this.game.audio) this.game.audio.unlock();
        const p = this.game.toLogical(e.clientX, e.clientY);
        if (e.pointerType === 'touch') {
          this.touchActive = true;
          this._touches.set(e.pointerId, p);
          if (this._buttonAt(p)) { this._syncTouch(); e.preventDefault(); return; }
        }
        if (this.pointer.down) return; // already tracking a primary pointer
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        update(e);
        Object.assign(this.pointer, { down: true, pressed: true, id: e.pointerId, type: e.pointerType || 'mouse', button: e.button });
        this._press('Pointer');
        e.preventDefault();
      });
      const move = (e) => {
        if (this._touches.has(e.pointerId)) { this._touches.set(e.pointerId, this.game.toLogical(e.clientX, e.clientY)); this._syncTouch(); }
        if (this.pointer.id === e.pointerId || (!this.pointer.down && e.pointerType === 'mouse')) update(e);
      };
      const up = (e) => {
        if (this._touches.delete(e.pointerId)) this._syncTouch();
        if (this.pointer.down && this.pointer.id === e.pointerId) {
          update(e);
          Object.assign(this.pointer, { down: false, released: true, id: null });
          this._release('Pointer');
        }
      };
      addEventListener('pointermove', move);
      addEventListener('pointerup', up);
      addEventListener('pointercancel', up);
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
  }

  // ─────────────────────────── Scenes ───────────────────────────

  /**
   * Subclass and override any of:
   *   enter() exit() resume() blur()       lifecycle
   *   update(dt)                           game logic (runs at a fixed rate)
   *   drawBackground(ctx)  drawWorld(ctx)  drawUI(ctx)
   * Each scene gets: game, input, audio, world, camera, timers, tweens, particles, and optional map.
   * Set `transparent = true` to draw the scene below it (pause menus), `showTouch = false` to hide touch buttons.
   */
  class Scene {
    _init(game) {
      this.game = game; this.input = game.input; this.audio = game.audio;
      this.world = new World(this);
      this.camera = new Camera(game);
      this.timers = new Timers();
      this.tweens = new Tweens();
      this.particles = new Particles();
      this.map = this.map || null;
      this.time = 0;
    }
    get width() { return this.game.width; }
    get height() { return this.game.height; }
    add(e) { return this.world.add(e); }
    enter() {} exit() {} resume() {} blur() {}
    update(dt) {}
    drawBackground(ctx) {}
    drawWorld(ctx) {}
    drawUI(ctx) {}
    _step(dt) {
      this.time += dt;
      this.world._savePrev();
      this.camera._savePrev();
      this.update(dt);
      this.world.update(dt);
      this.particles.update(dt);
      this.timers.update(dt);
      this.tweens.update(dt);
      this.camera.update(dt);
    }
    _render(ctx, alpha) {
      if (this.background) { ctx.fillStyle = this.background; ctx.fillRect(0, 0, this.width, this.height); }
      this.drawBackground(ctx);
      ctx.save();
      this.camera.apply(ctx, alpha);
      if (this.map) this.map.draw(ctx, this.camera);
      this.world.draw(ctx, alpha);
      this.particles.draw(ctx);
      this.drawWorld(ctx);
      if (this.game.debug) this.world.drawDebug(ctx, 1 / (this.game.scale * this.camera.zoom));
      ctx.restore();
      this.drawUI(ctx);
    }
  }

  // ─────────────────────────── Game ───────────────────────────

  /**
   * new Flint.Game({
   *   canvas,           // element or selector; created and added to `parent` (default body) if omitted
   *   width, height,    // fixed logical resolution, scaled to fit with letterboxing. Omit to fill the window.
   *   zoom,             // fill mode only: logical pixels per CSS pixel divisor (2 = everything twice as big)
   *   pixelArt,         // crisp nearest-neighbour scaling (and integer scaling unless integerScale: false)
   *   background, letterbox, tickRate (default 60), interpolate (default true), debug, touchButtons
   * })
   */
  class Game {
    constructor(opts = {}) {
      if (!hasDOM) throw new Error('Flint.Game needs a browser');
      let canvas = typeof opts.canvas === 'string' ? document.querySelector(opts.canvas) : opts.canvas;
      if (!canvas) {
        canvas = document.createElement('canvas');
        const parent = typeof opts.parent === 'string' ? document.querySelector(opts.parent) : opts.parent || document.body;
        if (parent === document.body) {
          document.documentElement.style.height = '100%';
          Object.assign(document.body.style, { margin: '0', height: '100%', overflow: 'hidden', background: opts.letterbox || '#000' });
        }
        parent.appendChild(canvas);
      }
      Object.assign(canvas.style, { display: 'block', width: '100%', height: '100%', touchAction: 'none', userSelect: 'none', webkitUserSelect: 'none', outline: 'none' });
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.fixedSize = !!(opts.width && opts.height);
      this.width = opts.width || 0; this.height = opts.height || 0;
      this.zoom = opts.zoom || 1;
      this.pixelArt = !!opts.pixelArt;
      this.integerScale = opts.integerScale === undefined ? this.pixelArt : !!opts.integerScale;
      this.background = opts.background === undefined ? '#000' : opts.background;
      this.letterbox = opts.letterbox || '#000';
      this.step = 1 / (opts.tickRate || 60);
      this.interpolate = opts.interpolate !== false;
      this.debug = !!opts.debug;
      this.debugKey = opts.debugKey === undefined ? 'Backquote' : opts.debugKey;
      this.scenes = []; this.transition = null;
      this.time = 0; this.frame = 0; this.fps = 60;
      this.running = false; this.paused = false;
      this.scale = 1; this.offsetX = 0; this.offsetY = 0; this.dpr = 1;
      this.audio = new AudioEngine();
      this.assets = new Assets(this.audio);
      this.input = new Input(this, opts);
      this._acc = 0; this._last = 0; this._blurred = false;
      this._loop = this._loop.bind(this);
      this.resize();
      if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => this.resize()).observe(canvas);
      else addEventListener('resize', () => this.resize());
      const lost = () => { this._last = 0; if (!this._blurred) { this._blurred = true; const s = this.scene; if (s) s.blur(); } };
      document.addEventListener('visibilitychange', () => { if (document.hidden) lost(); else this._blurred = false; });
      addEventListener('blur', lost);
      addEventListener('focus', () => { this._blurred = false; });
    }

    get scene() { return this.scenes[this.scenes.length - 1] || null; }

    resize() {
      const r = this.canvas.getBoundingClientRect();
      const cw = Math.max(1, r.width), ch = Math.max(1, r.height);
      this.dpr = window.devicePixelRatio || 1;
      this.canvas.width = Math.round(cw * this.dpr);
      this.canvas.height = Math.round(ch * this.dpr);
      if (!this.fixedSize) {
        this.width = cw / this.zoom; this.height = ch / this.zoom;
        this.scale = this.dpr * this.zoom; this.offsetX = this.offsetY = 0;
      } else {
        let s = Math.min(this.canvas.width / this.width, this.canvas.height / this.height);
        if (this.integerScale && s >= 1) s = Math.floor(s);
        this.scale = s;
        this.offsetX = Math.floor((this.canvas.width - this.width * s) / 2);
        this.offsetY = Math.floor((this.canvas.height - this.height * s) / 2);
      }
      if (this.running) this._render(1);
    }

    /** Convert a mouse/touch clientX/Y into logical game coordinates. */
    toLogical(clientX, clientY) {
      const r = this.canvas.getBoundingClientRect();
      return {
        x: ((clientX - r.left) * this.dpr - this.offsetX) / this.scale,
        y: ((clientY - r.top) * this.dpr - this.offsetY) / this.scale,
      };
    }

    start(scene) {
      if (scene) this._enter(scene);
      if (!this.running) { this.running = true; this._last = 0; requestAnimationFrame(this._loop); }
      return this;
    }
    stop() { this.running = false; }

    _enter(scene) { scene._init(this); this.scenes.push(scene); scene.enter(); }

    /** Replace every scene with a new one. opts: fade (seconds), color. */
    switch(scene, { fade = 0, color = '#000' } = {}) {
      if (this.transition && !this.transition.fired) return false;
      const go = () => { while (this.scenes.length) this.scenes.pop().exit(); this._enter(scene); };
      if (fade > 0) this.transition = { t: 0, dur: fade, color, action: go, fired: false };
      else go();
      return true;
    }
    /** Put a scene on top (e.g. a pause menu). Scenes below stop updating. */
    push(scene) { this._enter(scene); return scene; }
    pop() {
      const s = this.scenes.pop();
      if (s) s.exit();
      if (this.scene) this.scene.resume();
      return s;
    }

    _loop(now) {
      if (!this.running) return;
      requestAnimationFrame(this._loop);
      now /= 1000;
      if (!this._last) this._last = now - this.step;
      const dt = Math.min(Math.max(0, now - this._last), 0.25);
      this._last = now;
      if (dt > 0) this.fps = lerp(this.fps, 1 / dt, 0.05);
      this._acc += dt;
      let steps = 0;
      while (this._acc >= this.step && steps < 8) { this._tick(this.step); this._acc -= this.step; steps++; }
      if (steps === 8) this._acc = 0;
      this._render(this.interpolate ? clamp(this._acc / this.step, 0, 1) : 1);
    }

    _tick(dt) {
      this.input._poll();
      if (this.debugKey && this.input.pressed(this.debugKey)) this.debug = !this.debug;
      const tr = this.transition;
      if (tr) {
        tr.t += dt;
        if (!tr.fired && tr.t >= tr.dur / 2) { tr.fired = true; tr.action(); }
        if (tr.t >= tr.dur) this.transition = null;
      }
      const s = this.scene;
      if (s && !this.paused && !(tr && !tr.fired)) s._step(dt);
      this.time += dt; this.frame++;
      this.input._endStep();
    }

    _render(alpha) {
      const ctx = this.ctx;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = this.letterbox;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY);
      ctx.imageSmoothingEnabled = !this.pixelArt;
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, this.width, this.height); ctx.clip();
      if (this.background) { ctx.fillStyle = this.background; ctx.fillRect(0, 0, this.width, this.height); }
      let base = this.scenes.length - 1;
      while (base > 0 && this.scenes[base].transparent) base--;
      for (let i = Math.max(0, base); i < this.scenes.length; i++) {
        ctx.save();
        this.scenes[i]._render(ctx, i === this.scenes.length - 1 ? alpha : 1);
        ctx.restore();
      }
      this.input.drawTouch(ctx);
      const tr = this.transition;
      if (tr) {
        const h = tr.dur / 2;
        ctx.globalAlpha = clamp(tr.t < h ? tr.t / h : 1 - (tr.t - h) / h, 0, 1);
        ctx.fillStyle = tr.color;
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.globalAlpha = 1;
      }
      if (this.debug) this._drawDebug(ctx);
      ctx.restore();
    }

    _drawDebug(ctx) {
      const s = this.scene;
      const lines = [
        `${Math.round(this.fps)} fps  ${this.width | 0}×${this.height | 0} @${this.scale.toFixed(2)}`,
        s ? `${s.constructor.name}  entities ${s.world.count}  particles ${s.particles.count}` : 'no scene',
        s ? `camera ${s.camera.x.toFixed(1)}, ${s.camera.y.toFixed(1)}  scenes ${this.scenes.length}` : '',
        `keys ${[...this.input.held].join(' ')}`,
      ];
      ctx.fillStyle = 'rgba(0,0,0,.6)';
      ctx.fillRect(2, 2, Math.min(this.width - 4, 200), lines.length * 8 + 4);
      lines.forEach((l, i) => text(ctx, l, 4, 4 + i * 8, { size: 6, color: '#7f7' }));
    }
  }

  return {
    VERSION,
    // math
    clamp, lerp, invLerp, remap, approach, damp, wrap, sign, angleTo, dist, Vec2, Random, random, range, Ease,
    rand: (a, b) => random.range(a, b), randInt: (a, b) => random.int(a, b), pick: (a) => random.pick(a), chance: (p) => random.chance(p),
    // world
    Collide, Tilemap, Physics, Entity, World, Camera, Timers, Tweens, Particles,
    // graphics, audio, io
    pixelArt, makeCanvas, SpriteSheet, Animator, text, NOTE, AudioEngine, Assets, Input, store,
    // core
    Scene, Game,
  };
});
