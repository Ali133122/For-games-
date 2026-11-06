/*!
 * Flint3D — a small WebGL 3D add-on for Flint.
 * Load flint.js first, then this file. Reuses Flint's input, audio, timers, tweens and storage.
 * No dependencies. Works from file://. The math, geometry and collision parts also run in Node.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./flint.js'));
  else root.Flint3D = factory(root.Flint);
})(typeof self !== 'undefined' ? self : this, function (Flint) {
  'use strict';
  if (!Flint) throw new Error('Load flint.js before flint3d.js');
  const { clamp, lerp, random } = Flint;
  const hasDOM = typeof window !== 'undefined' && typeof document !== 'undefined';

  // ───────────────────────────── Math ─────────────────────────────

  class Vec3 {
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
    clone() { return new Vec3(this.x, this.y, this.z); }
    add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
    sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
    scale(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
    dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
    cross(v) { return this.set(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x); }
    len() { return Math.hypot(this.x, this.y, this.z); }
    norm() { const l = this.len(); if (l > 0) this.scale(1 / l); return this; }
    dist(v) { return Math.hypot(v.x - this.x, v.y - this.y, v.z - this.z); }
    lerp(v, t) { this.x = lerp(this.x, v.x, t); this.y = lerp(this.y, v.y, t); this.z = lerp(this.z, v.z, t); return this; }
  }
  const setVec = (v, src) => {
    if (src === undefined || src === null) return v;
    if (typeof src === 'number') return v.set(src, src, src);
    if (Array.isArray(src)) return v.set(src[0], src[1], src[2]);
    return v.set(src.x, src.y, src.z);
  };

  /** 4×4 matrices as column-major Float32Arrays (what WebGL expects). */
  const M4 = {
    create() { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; },
    identity(out) { out.fill(0); out[0] = out[5] = out[10] = out[15] = 1; return out; },
    multiply(out, a, b) {
      const r = M4._tmp || (M4._tmp = new Float32Array(16));
      for (let c = 0; c < 4; c++) {
        const b0 = b[c * 4], b1 = b[c * 4 + 1], b2 = b[c * 4 + 2], b3 = b[c * 4 + 3];
        for (let i = 0; i < 4; i++) r[c * 4 + i] = b0 * a[i] + b1 * a[4 + i] + b2 * a[8 + i] + b3 * a[12 + i];
      }
      out.set(r);
      return out;
    },
    perspective(out, fovy, aspect, near, far) {
      const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
      out.fill(0);
      out[0] = f / aspect; out[5] = f; out[10] = (far + near) * nf; out[11] = -1; out[14] = 2 * far * near * nf;
      return out;
    },
    lookAt(out, eye, center, up) {
      let zx = eye.x - center.x, zy = eye.y - center.y, zz = eye.z - center.z;
      let l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l;
      let xx = up.y * zz - up.z * zy, xy = up.z * zx - up.x * zz, xz = up.x * zy - up.y * zx;
      l = Math.hypot(xx, xy, xz) || 1; xx /= l; xy /= l; xz /= l;
      const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
      out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0;
      out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0;
      out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0;
      out[12] = -(xx * eye.x + xy * eye.y + xz * eye.z);
      out[13] = -(yx * eye.x + yy * eye.y + yz * eye.z);
      out[14] = -(zx * eye.x + zy * eye.y + zz * eye.z);
      out[15] = 1;
      return out;
    },
    /** Translation, Euler rotation (applied Y, then X, then Z: yaw, pitch, roll) and scale. */
    compose(out, p, r, s) {
      const cy = Math.cos(r.y), sy = Math.sin(r.y), cx = Math.cos(r.x), sx = Math.sin(r.x), cz = Math.cos(r.z), sz = Math.sin(r.z);
      out[0] = (cy * cz + sy * sx * sz) * s.x; out[1] = cx * sz * s.x; out[2] = (-sy * cz + cy * sx * sz) * s.x; out[3] = 0;
      out[4] = (-cy * sz + sy * sx * cz) * s.y; out[5] = cx * cz * s.y; out[6] = (sy * sz + cy * sx * cz) * s.y; out[7] = 0;
      out[8] = sy * cx * s.z; out[9] = -sx * s.z; out[10] = cy * cx * s.z; out[11] = 0;
      out[12] = p.x; out[13] = p.y; out[14] = p.z; out[15] = 1;
      return out;
    },
    /** Inverse-transpose of the upper 3×3, for transforming normals. out is a 9-element array. */
    normalMatrix(out, a) {
      const a00 = a[0], a01 = a[1], a02 = a[2], a10 = a[4], a11 = a[5], a12 = a[6], a20 = a[8], a21 = a[9], a22 = a[10];
      const b01 = a22 * a11 - a12 * a21, b11 = -a22 * a10 + a12 * a20, b21 = a21 * a10 - a11 * a20;
      let det = a00 * b01 + a01 * b11 + a02 * b21;
      if (!det) { out.fill(0); out[0] = out[4] = out[8] = 1; return out; }
      det = 1 / det;
      // inverse (column-major), then transpose
      const i0 = b01 * det, i1 = (-a22 * a01 + a02 * a21) * det, i2 = (a12 * a01 - a02 * a11) * det;
      const i3 = b11 * det, i4 = (a22 * a00 - a02 * a20) * det, i5 = (-a12 * a00 + a02 * a10) * det;
      const i6 = b21 * det, i7 = (-a21 * a00 + a01 * a20) * det, i8 = (a11 * a00 - a01 * a10) * det;
      out[0] = i0; out[1] = i3; out[2] = i6;
      out[3] = i1; out[4] = i4; out[5] = i7;
      out[6] = i2; out[7] = i5; out[8] = i8;
      return out;
    },
    transformPoint(m, x, y, z) {
      const w = m[3] * x + m[7] * y + m[11] * z + m[15];
      return {
        x: (m[0] * x + m[4] * y + m[8] * z + m[12]) / w,
        y: (m[1] * x + m[5] * y + m[9] * z + m[13]) / w,
        z: (m[2] * x + m[6] * y + m[10] * z + m[14]) / w,
        w,
      };
    },
  };

  const colorCache = new Map();
  /** '#f80', '#ff8800', 0xff8800 or [r, g, b] (0–1) → [r, g, b] */
  function rgb(c) {
    if (Array.isArray(c)) return c;
    if (typeof c === 'number') return [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255];
    let v = colorCache.get(c);
    if (v) return v;
    let h = String(c).replace('#', '');
    if (h.length === 3) h = h.split('').map((x) => x + x).join('');
    const n = parseInt(h, 16) || 0;
    v = [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    colorCache.set(c, v);
    return v;
  }

  // ─────────────────────────── Geometry ───────────────────────────

  class Geometry {
    constructor(positions, normals, uvs, indices) {
      this.positions = positions instanceof Float32Array ? positions : new Float32Array(positions);
      this.normals = normals instanceof Float32Array ? normals : new Float32Array(normals);
      this.uvs = uvs ? (uvs instanceof Float32Array ? uvs : new Float32Array(uvs)) : new Float32Array((this.positions.length / 3) * 2);
      this.indices = indices instanceof Uint16Array ? indices : new Uint16Array(indices);
      if (this.positions.length / 3 > 65535) throw new Error('Geometry too large (max 65535 vertices)');
      this._gpu = null;
    }
    get vertexCount() { return this.positions.length / 3; }
    get triangles() { return this.indices.length / 3; }

    /** A w×h×d box centered on the origin. Each face gets the full texture. */
    static box(w = 1, h = 1, d = 1) {
      const hx = w / 2, hy = h / 2, hz = d / 2, P = [], N = [], U = [], I = [];
      const faces = [
        [[1, 0, 0], [0, 0, -1], [0, 1, 0]], [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
        [[0, 1, 0], [1, 0, 0], [0, 0, -1]], [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
        [[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[0, 0, -1], [-1, 0, 0], [0, 1, 0]],
      ];
      for (const [n, u, v] of faces) {
        const base = P.length / 3;
        for (const [a, b, tu, tv] of [[-1, -1, 0, 1], [1, -1, 1, 1], [1, 1, 1, 0], [-1, 1, 0, 0]]) {
          P.push((n[0] + u[0] * a + v[0] * b) * hx, (n[1] + u[1] * a + v[1] * b) * hy, (n[2] + u[2] * a + v[2] * b) * hz);
          N.push(n[0], n[1], n[2]); U.push(tu, tv);
        }
        I.push(base, base + 1, base + 2, base, base + 2, base + 3);
      }
      return new Geometry(P, N, U, I);
    }
    /** A flat w×d floor facing up (+Y). repeatU/V tile a repeating texture. */
    static plane(w = 1, d = 1, repeatU = 1, repeatV = 1) {
      const x = w / 2, z = d / 2;
      return new Geometry(
        [-x, 0, z, x, 0, z, x, 0, -z, -x, 0, -z], [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
        [0, repeatV, repeatU, repeatV, repeatU, 0, 0, 0], [0, 1, 2, 0, 2, 3]);
    }
    /** An upright w×h rectangle facing +Z, like a screen or sign. */
    static quad(w = 1, h = 1) {
      const x = w / 2, y = h / 2;
      return new Geometry([-x, -y, 0, x, -y, 0, x, y, 0, -x, y, 0], [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], [0, 1, 1, 1, 1, 0, 0, 0], [0, 1, 2, 0, 2, 3]);
    }
    static sphere(r = 0.5, widthSegments = 16, heightSegments = 12) {
      const P = [], N = [], U = [], I = [], grid = [];
      for (let iy = 0; iy <= heightSegments; iy++) {
        const row = [], v = iy / heightSegments;
        for (let ix = 0; ix <= widthSegments; ix++) {
          const u = ix / widthSegments;
          const x = -Math.cos(u * Math.PI * 2) * Math.sin(v * Math.PI), y = Math.cos(v * Math.PI), z = Math.sin(u * Math.PI * 2) * Math.sin(v * Math.PI);
          P.push(x * r, y * r, z * r); N.push(x, y, z); U.push(u, v);
          row.push(P.length / 3 - 1);
        }
        grid.push(row);
      }
      for (let iy = 0; iy < heightSegments; iy++)
        for (let ix = 0; ix < widthSegments; ix++) {
          const a = grid[iy][ix + 1], b = grid[iy][ix], c = grid[iy + 1][ix], d = grid[iy + 1][ix + 1];
          if (iy !== 0) I.push(a, b, d);
          if (iy !== heightSegments - 1) I.push(b, c, d);
        }
      return new Geometry(P, N, U, I);
    }
    /** Cylinder (or cone, with radiusTop 0) standing on the Y axis, centered on the origin. */
    static cylinder(radiusTop = 0.5, radiusBottom = 0.5, height = 1, segments = 16, caps = true) {
      const P = [], N = [], U = [], I = [], hh = height / 2, slope = (radiusBottom - radiusTop) / height;
      const rows = [];
      for (let y = 0; y <= 1; y++) {
        const row = [], r = y === 0 ? radiusTop : radiusBottom;
        for (let x = 0; x <= segments; x++) {
          const t = (x / segments) * Math.PI * 2, s = Math.sin(t), c = Math.cos(t);
          P.push(r * s, y === 0 ? hh : -hh, r * c);
          const l = Math.hypot(s, slope, c);
          N.push(s / l, slope / l, c / l); U.push(x / segments, y);
          row.push(P.length / 3 - 1);
        }
        rows.push(row);
      }
      for (let x = 0; x < segments; x++) {
        const a = rows[0][x], b = rows[1][x], c = rows[1][x + 1], d = rows[0][x + 1];
        I.push(a, b, d, b, c, d);
      }
      if (caps) for (const top of [true, false]) {
        const r = top ? radiusTop : radiusBottom;
        if (r <= 0) continue;
        const y = top ? hh : -hh, ny = top ? 1 : -1, center = P.length / 3;
        P.push(0, y, 0); N.push(0, ny, 0); U.push(0.5, 0.5);
        for (let x = 0; x <= segments; x++) {
          const t = (x / segments) * Math.PI * 2, s = Math.sin(t), c = Math.cos(t);
          P.push(r * s, y, r * c); N.push(0, ny, 0); U.push(0.5 + s * 0.5, 0.5 + c * 0.5 * ny);
        }
        for (let x = 0; x < segments; x++) {
          const i = center + 1 + x;
          if (top) I.push(i, i + 1, center); else I.push(i + 1, i, center);
        }
      }
      return new Geometry(P, N, U, I);
    }
    static cone(r = 0.5, height = 1, segments = 16) { return Geometry.cylinder(0, r, height, segments); }
    /** A faceted diamond (octahedron). */
    static gem(r = 0.5) { return Geometry.flat(Geometry.sphere(r, 4, 2)); }
    /** Low-poly look: split vertices so each triangle has its own flat normal. */
    static flat(g) {
      const P = [], N = [], U = [], I = [], p = g.positions, uv = g.uvs;
      for (let t = 0; t < g.indices.length; t += 3) {
        const ids = [g.indices[t], g.indices[t + 1], g.indices[t + 2]];
        const [a, b, c] = ids.map((i) => [p[i * 3], p[i * 3 + 1], p[i * 3 + 2]]);
        const e1 = new Vec3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), e2 = new Vec3(c[0] - a[0], c[1] - a[1], c[2] - a[2]);
        const n = e1.cross(e2).norm();
        ids.forEach((i, k) => { P.push(...[a, b, c][k]); N.push(n.x, n.y, n.z); U.push(uv[i * 2], uv[i * 2 + 1]); I.push(I.length); });
      }
      return new Geometry(P, N, U, I);
    }
    /**
     * Bake many pieces into one geometry (one draw call), e.g. a whole room of walls.
     * parts: [{ geometry, position, rotation, scale }]
     */
    static merge(parts) {
      const P = [], N = [], U = [], I = [], m = M4.create(), nm = new Float32Array(9);
      for (const part of parts) {
        const g = part.geometry, base = P.length / 3;
        M4.compose(m, setVec(new Vec3(), part.position || 0), setVec(new Vec3(), part.rotation || 0), setVec(new Vec3(1, 1, 1), part.scale === undefined ? 1 : part.scale));
        M4.normalMatrix(nm, m);
        for (let i = 0; i < g.vertexCount; i++) {
          const x = g.positions[i * 3], y = g.positions[i * 3 + 1], z = g.positions[i * 3 + 2];
          P.push(m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]);
          const a = g.normals[i * 3], b = g.normals[i * 3 + 1], c = g.normals[i * 3 + 2];
          const n = new Vec3(nm[0] * a + nm[3] * b + nm[6] * c, nm[1] * a + nm[4] * b + nm[7] * c, nm[2] * a + nm[5] * b + nm[8] * c).norm();
          N.push(n.x, n.y, n.z); U.push(g.uvs[i * 2], g.uvs[i * 2 + 1]);
        }
        for (const i of g.indices) I.push(base + i);
      }
      return new Geometry(P, N, U, I);
    }
  }

  // ─────────────────────── Textures & materials ───────────────────────

  class Texture {
    /** source: a canvas or loaded image. repeat needs power-of-two sizes. smooth false = pixelated. */
    constructor(source, { repeat = false, smooth = true } = {}) {
      this.source = source; this.repeat = repeat; this.smooth = smooth;
      this.needsUpdate = true; this._tex = null;
    }
    /** A texture you draw on with the 2D canvas API. Call redraw() (or set needsUpdate) after changes. */
    static canvas(w, h, draw, opts) {
      const c = Flint.makeCanvas(w, h), t = new Texture(c, opts);
      t.ctx = c.getContext('2d'); t.width = w; t.height = h;
      if (draw) draw(t.ctx, w, h);
      return t;
    }
    redraw(draw) { if (draw) draw(this.ctx, this.width, this.height); this.needsUpdate = true; return this; }
  }

  class Material {
    /**
     * color, emissive (glow color), emissiveIntensity, opacity, map (Texture),
     * unlit (ignore lights), doubleSided, fog (default true)
     */
    constructor(o = {}) {
      this.color = o.color === undefined ? '#ffffff' : o.color;
      this.emissive = o.emissive === undefined ? '#000000' : o.emissive;
      this.emissiveIntensity = o.emissiveIntensity === undefined ? 1 : o.emissiveIntensity;
      this.opacity = o.opacity === undefined ? 1 : o.opacity;
      this.map = o.map || null;
      this.unlit = !!o.unlit;
      this.doubleSided = !!o.doubleSided;
      this.fog = o.fog !== false;
    }
  }

  // ─────────────────────────── Scene graph ───────────────────────────

  class Node {
    /**
     * new Node({ geometry, material, position, rotation, scale, name, tags, onUpdate })
     * position/rotation/scale accept [x, y, z], {x, y, z} or (scale only) a number.
     * Nodes without geometry are groups.
     */
    constructor(o = {}) {
      this.position = setVec(new Vec3(), o.position);
      this.rotation = setVec(new Vec3(), o.rotation);
      this.scale = setVec(new Vec3(1, 1, 1), o.scale);
      this.geometry = o.geometry || null;
      this.material = o.material instanceof Material ? o.material : this.geometry || o.material ? new Material(o.material || {}) : null;
      this.children = []; this.parent = null;
      this.visible = o.visible !== false;
      this.name = o.name || '';
      this.tags = new Set(o.tags || []);
      this.onUpdate = o.onUpdate || null;
      this.world = M4.create(); this._local = M4.create();
      for (const k in o) if (!(k in this) && k !== 'tags') this[k] = o[k];
    }
    add(...nodes) {
      for (const n of nodes) { if (n.parent) n.parent.remove(n); n.parent = this; this.children.push(n); }
      return nodes[0];
    }
    remove(n) { const i = this.children.indexOf(n); if (i >= 0) { this.children.splice(i, 1); n.parent = null; } return n; }
    destroy() { if (this.parent) this.parent.remove(this); }
    traverse(fn) { fn(this); for (const c of this.children.slice()) c.traverse(fn); }
    find(name) { if (this.name === name) return this; for (const c of this.children) { const f = c.find(name); if (f) return f; } return null; }
    updateWorld(parentWorld) {
      M4.compose(this._local, this.position, this.rotation, this.scale);
      if (parentWorld) M4.multiply(this.world, parentWorld, this._local); else this.world.set(this._local);
      for (const c of this.children) c.updateWorld(this.world);
    }
    worldPosition(out = new Vec3()) { return out.set(this.world[12], this.world[13], this.world[14]); }
  }

  /** Shorthand: mesh(Geometry.box(), { color: '#f80' }, { position: [0, 1, 0] }) */
  const mesh = (geometry, material, props = {}) => new Node(Object.assign({}, props, { geometry, material: material instanceof Material ? material : new Material(material || {}) }));

  class Camera3D {
    constructor({ fov = 60, near = 0.1, far = 200 } = {}) {
      this.fov = fov; this.near = near; this.far = far;
      this.position = new Vec3(0, 2, 6); this.target = new Vec3(0, 0, 0); this.up = new Vec3(0, 1, 0);
      this.view = M4.create(); this.proj = M4.create(); this.viewProj = M4.create();
      this.aspect = 1;
      this._shakeT = 0; this._shakeDur = 0; this._shakeMag = 0; this._shake = new Vec3();
    }
    lookAt(x, y, z) { if (typeof x === 'object') this.target.copy(x); else this.target.set(x, y, z); return this; }
    /** First-person aiming. yaw 0 looks down -Z; positive yaw turns right. */
    setYawPitch(yaw, pitch) {
      const c = Math.cos(pitch);
      this.target.set(this.position.x + Math.sin(yaw) * c, this.position.y + Math.sin(pitch), this.position.z - Math.cos(yaw) * c);
      return this;
    }
    shake(intensity = 0.15, duration = 0.3) { this._shakeMag = intensity; this._shakeDur = this._shakeT = duration; return this; }
    update(dt) {
      if (this._shakeT > 0) {
        this._shakeT = Math.max(0, this._shakeT - dt);
        const a = this._shakeMag * (this._shakeT / this._shakeDur);
        this._shake.set(random.range(-a, a), random.range(-a, a), random.range(-a, a));
      } else this._shake.set(0, 0, 0);
    }
    updateMatrices(aspect) {
      this.aspect = aspect;
      const eye = this.position.clone().add(this._shake), at = this.target.clone().add(this._shake);
      M4.lookAt(this.view, eye, at, this.up);
      M4.perspective(this.proj, (this.fov * Math.PI) / 180, aspect, this.near, this.far);
      M4.multiply(this.viewProj, this.proj, this.view);
      return this;
    }
    /** World point → screen pixels. visible is false when it's behind the camera or off screen. */
    project(p, width, height) {
      this.updateMatrices(width / height);
      const r = M4.transformPoint(this.viewProj, p.x, p.y, p.z);
      return { x: ((r.x + 1) / 2) * width, y: ((1 - r.y) / 2) * height, depth: r.z, visible: r.w > 0 && Math.abs(r.x) <= 1 && Math.abs(r.y) <= 1 };
    }
  }

  // ─────────────────────────── Collision ───────────────────────────
  // Boxes are center-based: { x, y, z, w, h, d }. Spheres: { x, y, z, r }.

  const Collide3D = {
    boxes: (a, b) => Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h && Math.abs(a.z - b.z) * 2 < a.d + b.d,
    spheres: (a, b) => { const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z, r = a.r + b.r; return dx * dx + dy * dy + dz * dz < r * r; },
    sphereBox: (s, b) => {
      const dx = s.x - clamp(s.x, b.x - b.w / 2, b.x + b.w / 2);
      const dy = s.y - clamp(s.y, b.y - b.h / 2, b.y + b.h / 2);
      const dz = s.z - clamp(s.z, b.z - b.d / 2, b.z + b.d / 2);
      return dx * dx + dy * dy + dz * dz < s.r * s.r;
    },
    /**
     * Walk a circle (radius r) across the floor by (dx, dz), sliding along boxes
     * ({x, z, w, d}). Mutates and returns pos. Great for first-person movement.
     */
    slideXZ(pos, r, dx, dz, boxes) {
      const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / (r * 0.5)));
      for (let s = 0; s < steps; s++) {
        pos.x += dx / steps; pos.z += dz / steps;
        for (let pass = 0; pass < 2; pass++)
          for (const b of boxes) {
            const minX = b.x - b.w / 2, maxX = b.x + b.w / 2, minZ = b.z - b.d / 2, maxZ = b.z + b.d / 2;
            const cx = clamp(pos.x, minX, maxX), cz = clamp(pos.z, minZ, maxZ);
            const ox = pos.x - cx, oz = pos.z - cz, d2 = ox * ox + oz * oz;
            if (d2 >= r * r) continue;
            if (d2 > 1e-12) { const d = Math.sqrt(d2), push = (r - d) / d; pos.x += ox * push; pos.z += oz * push; }
            else {
              const l = pos.x - minX, rt = maxX - pos.x, t = pos.z - minZ, bt = maxZ - pos.z, m = Math.min(l, rt, t, bt);
              if (m === l) pos.x = minX - r; else if (m === rt) pos.x = maxX + r; else if (m === t) pos.z = minZ - r; else pos.z = maxZ + r;
            }
          }
      }
      return pos;
    },
  };

  // ─────────────────────────── Particles ───────────────────────────

  const UNIT_CUBE = Geometry.box(1, 1, 1);

  class Particles3D {
    constructor(max = 800) { this.list = []; this.max = max; this._m = M4.create(); }
    get count() { return this.list.length; }
    /** Burst of glowing cubes. Options like Flint's 2D particles: count, speed, life, size, color, gravity, drag, velocity {x,y,z} */
    emit(pos, o = {}) {
      const count = Math.round(Flint.range(o.count === undefined ? 16 : o.count)), base = o.velocity || { x: 0, y: 0, z: 0 };
      for (let i = 0; i < count && this.list.length < this.max; i++) {
        const u = random.range(-1, 1), th = random.range(0, Math.PI * 2), s = Math.sqrt(1 - u * u);
        const sp = Flint.range(o.speed === undefined ? [1, 4] : o.speed), life = Math.max(0.01, Flint.range(o.life === undefined ? [0.4, 0.9] : o.life));
        const color = Array.isArray(o.color) && typeof o.color[0] === 'string' ? random.pick(o.color) : o.color || '#ffffff';
        this.list.push({
          x: pos.x, y: pos.y, z: pos.z,
          vx: base.x + s * Math.cos(th) * sp, vy: base.y + u * sp, vz: base.z + s * Math.sin(th) * sp,
          life, max: life, size: Flint.range(o.size === undefined ? [0.06, 0.16] : o.size),
          gravity: o.gravity || 0, drag: o.drag || 0, spin: random.range(-6, 6), rot: random.range(0, 6),
          material: new Material({ color, unlit: true }),
        });
      }
    }
    update(dt) {
      const l = this.list;
      for (let i = l.length - 1; i >= 0; i--) {
        const p = l[i];
        p.life -= dt;
        if (p.life <= 0) { l[i] = l[l.length - 1]; l.pop(); continue; }
        p.vy -= p.gravity * dt;
        if (p.drag) { const f = Math.exp(-p.drag * dt); p.vx *= f; p.vy *= f; p.vz *= f; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.rot += p.spin * dt;
      }
    }
    _draw(renderer) {
      const pos = new Vec3(), rot = new Vec3(), sc = new Vec3();
      for (const p of this.list) {
        const s = p.size * (p.life / p.max);
        M4.compose(this._m, pos.set(p.x, p.y, p.z), rot.set(p.rot, p.rot * 0.7, 0), sc.set(s, s, s));
        renderer.draw(UNIT_CUBE, this._m, p.material);
      }
    }
    clear() { this.list.length = 0; }
  }

  // ─────────────────────────── Renderer ───────────────────────────

  const VERT = `
attribute vec3 aPos; attribute vec3 aNormal; attribute vec2 aUV;
uniform mat4 uModel; uniform mat4 uViewProj; uniform mat3 uNormalMat;
varying vec3 vWorld; varying vec3 vNormal; varying vec2 vUV;
void main() {
  vec4 w = uModel * vec4(aPos, 1.0);
  vWorld = w.xyz; vNormal = uNormalMat * aNormal; vUV = aUV;
  gl_Position = uViewProj * w;
}`;
  const FRAG = `
precision mediump float;
uniform vec3 uColor; uniform vec3 uEmissive; uniform float uOpacity; uniform float uUnlit;
uniform vec3 uSunDir; uniform vec3 uSunColor; uniform vec3 uSky; uniform vec3 uGround;
uniform vec3 uFogColor; uniform vec2 uFog; uniform float uUseFog; uniform vec3 uCamPos;
uniform int uPointCount; uniform vec3 uPointPos[4]; uniform vec3 uPointColor[4]; uniform float uPointRange[4];
uniform sampler2D uTex; uniform float uUseTex;
varying vec3 vWorld; varying vec3 vNormal; varying vec2 vUV;
void main() {
  vec4 base = vec4(uColor, 1.0);
  if (uUseTex > 0.5) base *= texture2D(uTex, vUV);
  vec3 col = base.rgb;
  if (uUnlit < 0.5) {
    vec3 n = normalize(vNormal);
    if (!gl_FrontFacing) n = -n;
    vec3 light = mix(uGround, uSky, n.y * 0.5 + 0.5);
    light += uSunColor * max(dot(n, -uSunDir), 0.0);
    for (int i = 0; i < 4; i++) {
      if (i >= uPointCount) break;
      vec3 d = uPointPos[i] - vWorld;
      float dist = length(d);
      float att = clamp(1.0 - dist / uPointRange[i], 0.0, 1.0);
      light += uPointColor[i] * att * att * max(dot(n, d / max(dist, 0.0001)), 0.0);
    }
    col *= light;
  }
  col += uEmissive;
  if (uUseFog > 0.5) {
    float f = clamp((length(vWorld - uCamPos) - uFog.x) / (uFog.y - uFog.x), 0.0, 1.0);
    col = mix(col, uFogColor, f);
  }
  gl_FragColor = vec4(col, base.a * uOpacity);
}`;

  class Renderer {
    constructor(gl) {
      this.gl = gl;
      const sh = (type, src) => {
        const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('Shader error: ' + gl.getShaderInfoLog(s));
        return s;
      };
      const p = gl.createProgram();
      gl.attachShader(p, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('Program error: ' + gl.getProgramInfoLog(p));
      this.program = p;
      this.attr = { pos: gl.getAttribLocation(p, 'aPos'), normal: gl.getAttribLocation(p, 'aNormal'), uv: gl.getAttribLocation(p, 'aUV') };
      this.u = {};
      for (const n of ['uModel', 'uViewProj', 'uNormalMat', 'uColor', 'uEmissive', 'uOpacity', 'uUnlit', 'uSunDir', 'uSunColor', 'uSky', 'uGround',
        'uFogColor', 'uFog', 'uUseFog', 'uCamPos', 'uPointCount', 'uPointPos', 'uPointColor', 'uPointRange', 'uTex', 'uUseTex']) this.u[n] = gl.getUniformLocation(p, n);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      this._nm = new Float32Array(9);
      this._bound = null;
      this._white = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this._white);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
      this.stats = { calls: 0, triangles: 0 };
    }
    _upload(g) {
      if (g._gpu) return g._gpu;
      const gl = this.gl, buf = (target, data) => { const b = gl.createBuffer(); gl.bindBuffer(target, b); gl.bufferData(target, data, gl.STATIC_DRAW); return b; };
      g._gpu = { pos: buf(gl.ARRAY_BUFFER, g.positions), normal: buf(gl.ARRAY_BUFFER, g.normals), uv: buf(gl.ARRAY_BUFFER, g.uvs), index: buf(gl.ELEMENT_ARRAY_BUFFER, g.indices), count: g.indices.length };
      return g._gpu;
    }
    _texture(t) {
      const gl = this.gl;
      if (!t._tex) t._tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t._tex);
      if (t.needsUpdate) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, t.source);
        const filter = t.smooth ? gl.LINEAR : gl.NEAREST;
        if (t.repeat) {
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, t.smooth ? gl.LINEAR_MIPMAP_LINEAR : gl.NEAREST_MIPMAP_LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        } else {
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
        t.needsUpdate = false;
      }
    }
    /** Draw one geometry with a world matrix and material. Used by render() and by particles. */
    draw(g, matrix, m) {
      const gl = this.gl, u = this.u, gpu = this._upload(g);
      if (this._bound !== gpu) {
        gl.bindBuffer(gl.ARRAY_BUFFER, gpu.pos); gl.vertexAttribPointer(this.attr.pos, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, gpu.normal); gl.vertexAttribPointer(this.attr.normal, 3, gl.FLOAT, false, 0, 0);
        if (this.attr.uv >= 0) { gl.bindBuffer(gl.ARRAY_BUFFER, gpu.uv); gl.vertexAttribPointer(this.attr.uv, 2, gl.FLOAT, false, 0, 0); }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gpu.index);
        this._bound = gpu;
      }
      gl.uniformMatrix4fv(u.uModel, false, matrix);
      gl.uniformMatrix3fv(u.uNormalMat, false, M4.normalMatrix(this._nm, matrix));
      gl.uniform3fv(u.uColor, rgb(m.color));
      const e = rgb(m.emissive), k = m.emissiveIntensity;
      gl.uniform3f(u.uEmissive, e[0] * k, e[1] * k, e[2] * k);
      gl.uniform1f(u.uOpacity, m.opacity);
      gl.uniform1f(u.uUnlit, m.unlit ? 1 : 0);
      gl.uniform1f(u.uUseFog, m.fog && this._fog ? 1 : 0);
      if (m.map) { this._texture(m.map); gl.uniform1f(u.uUseTex, 1); }
      else { gl.bindTexture(gl.TEXTURE_2D, this._white); gl.uniform1f(u.uUseTex, 0); }
      if (m.doubleSided) gl.disable(gl.CULL_FACE); else gl.enable(gl.CULL_FACE);
      gl.drawElements(gl.TRIANGLES, gpu.count, gl.UNSIGNED_SHORT, 0);
      this.stats.calls++; this.stats.triangles += gpu.count / 3;
    }
    render(root, camera, env, width, height, particles) {
      const gl = this.gl, u = this.u;
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      const bg = rgb(env.background);
      gl.clearColor(bg[0], bg[1], bg[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(this.program);
      gl.enableVertexAttribArray(this.attr.pos); gl.enableVertexAttribArray(this.attr.normal);
      if (this.attr.uv >= 0) gl.enableVertexAttribArray(this.attr.uv);
      this._bound = null; this.stats.calls = 0; this.stats.triangles = 0;

      camera.updateMatrices(width / height);
      root.updateWorld(null);
      gl.uniformMatrix4fv(u.uViewProj, false, camera.viewProj);
      const sd = new Vec3(...(env.sunDir || [-0.4, -1, -0.3])).norm(), sc = rgb(env.sunColor), si = env.sunIntensity === undefined ? 0.8 : env.sunIntensity;
      gl.uniform3f(u.uSunDir, sd.x, sd.y, sd.z);
      gl.uniform3f(u.uSunColor, sc[0] * si, sc[1] * si, sc[2] * si);
      gl.uniform3fv(u.uSky, rgb(env.sky)); gl.uniform3fv(u.uGround, rgb(env.ground));
      this._fog = !!env.fog;
      gl.uniform3fv(u.uFogColor, rgb(env.fogColor || env.background));
      gl.uniform2f(u.uFog, env.fog ? env.fog[0] : 0, env.fog ? env.fog[1] : 1);
      gl.uniform3f(u.uCamPos, camera.position.x, camera.position.y, camera.position.z);
      gl.uniform1i(u.uTex, 0);
      gl.activeTexture(gl.TEXTURE0);

      // the four point lights nearest the camera
      const cp = camera.position;
      const lights = (env.lights || []).filter((l) => l.intensity !== 0)
        .map((l) => ({ l, d: Math.hypot(l.position.x - cp.x, l.position.y - cp.y, l.position.z - cp.z) }))
        .sort((a, b) => a.d - b.d).slice(0, 4).map((o) => o.l);
      const lp = new Float32Array(12), lc = new Float32Array(12), lr = new Float32Array(4);
      lights.forEach((l, i) => {
        const c = rgb(l.color || '#ffffff'), k = l.intensity === undefined ? 1 : l.intensity;
        lp.set([l.position.x, l.position.y, l.position.z], i * 3); lc.set([c[0] * k, c[1] * k, c[2] * k], i * 3); lr[i] = l.range || 8;
      });
      gl.uniform1i(u.uPointCount, lights.length);
      gl.uniform3fv(u.uPointPos, lp); gl.uniform3fv(u.uPointColor, lc); gl.uniform1fv(u.uPointRange, lr);

      const opaque = [], clear = [];
      const walk = (n) => {
        if (!n.visible) return;
        if (n.geometry && n.material) (n.material.opacity < 1 ? clear : opaque).push(n);
        for (const c of n.children) walk(c);
      };
      walk(root);
      gl.disable(gl.BLEND); gl.depthMask(true);
      for (const n of opaque) this.draw(n.geometry, n.world, n.material);
      if (particles) particles._draw(this);
      if (clear.length) {
        const d = (n) => Math.hypot(n.world[12] - cp.x, n.world[13] - cp.y, n.world[14] - cp.z);
        clear.sort((a, b) => d(b) - d(a));
        gl.enable(gl.BLEND); gl.depthMask(false);
        for (const n of clear) this.draw(n.geometry, n.world, n.material);
        gl.depthMask(true); gl.disable(gl.BLEND);
      }
    }
  }

  // ─────────────────────────── Scenes ───────────────────────────

  /**
   * Like Flint.Scene, in 3D. Override enter/exit/resume/blur, update(dt) and drawUI(ctx).
   * You get: root (add nodes here), camera, env (lighting and fog), particles, timers, tweens, input, audio.
   */
  class Scene3D {
    _init(game) {
      this.game = game; this.input = game.input; this.audio = game.audio;
      this.root = new Node({ name: 'root' });
      this.camera = new Camera3D();
      this.env = {
        background: '#0b0a12', sky: '#8a93b8', ground: '#2e2838',
        sunDir: [-0.4, -1, -0.3], sunColor: '#ffffff', sunIntensity: 0.7,
        fog: [25, 90], fogColor: null, lights: [],
      };
      this.particles = new Particles3D();
      this.timers = new Flint.Timers(); this.tweens = new Flint.Tweens();
      this.time = 0;
    }
    get width() { return this.game.width; }
    get height() { return this.game.height; }
    add(...nodes) { return this.root.add(...nodes); }
    /** World point → UI coordinates for labels. */
    toScreen(p) { return this.camera.project(p, this.width, this.height); }
    enter() {} exit() {} resume() {} blur() {}
    update(dt) {}
    drawUI(ctx) {}
    _step(dt) {
      this.time += dt;
      this.update(dt);
      this.root.traverse((n) => { if (n.onUpdate) n.onUpdate.call(n, dt, n); });
      this.particles.update(dt);
      this.timers.update(dt);
      this.tweens.update(dt);
      this.camera.update(dt);
    }
  }

  /**
   * new Flint3D.Game3D({ parent, uiZoom, maxPixelRatio, touchButtons, debug })
   * A WebGL canvas with a 2D canvas on top for HUD text (drawUI) and Flint's touch buttons.
   */
  class Game3D {
    constructor(opts = {}) {
      if (!hasDOM) throw new Error('Game3D needs a browser');
      let parent = typeof opts.parent === 'string' ? document.querySelector(opts.parent) : opts.parent;
      if (!parent) {
        document.documentElement.style.height = '100%';
        Object.assign(document.body.style, { margin: '0', height: '100%', overflow: 'hidden', background: '#000' });
        parent = document.createElement('div');
        Object.assign(parent.style, { position: 'fixed', inset: '0' });
        document.body.appendChild(parent);
      } else if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
      this.container = parent;
      const mk = () => {
        const c = document.createElement('canvas');
        Object.assign(c.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block', touchAction: 'none', userSelect: 'none', webkitUserSelect: 'none', outline: 'none' });
        parent.appendChild(c);
        return c;
      };
      this.glCanvas = mk();
      this.canvas = mk(); // UI canvas, receives input
      this.gl = this.glCanvas.getContext('webgl', { antialias: true, alpha: false }) || this.glCanvas.getContext('experimental-webgl');
      if (!this.gl) throw new Error('WebGL is not available in this browser');
      this.renderer = new Renderer(this.gl);
      this.ui = this.canvas.getContext('2d');
      this.zoom = opts.uiZoom || 1;
      this.maxPixelRatio = opts.maxPixelRatio || 2;
      this.scenes = []; this.transition = null;
      this.time = 0; this.frame = 0; this.fps = 60;
      this.running = false; this.paused = false;
      this.debug = !!opts.debug;
      this.debugKey = opts.debugKey === undefined ? 'Backquote' : opts.debugKey;
      this.audio = new Flint.AudioEngine();
      this.input = new Flint.Input(this, opts);
      this._last = 0; this._blurred = false;
      this._loop = this._loop.bind(this);
      this.resize();
      if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => this.resize()).observe(parent);
      else addEventListener('resize', () => this.resize());
      const lost = () => { this._last = 0; if (!this._blurred) { this._blurred = true; if (this.scene) this.scene.blur(); } };
      document.addEventListener('visibilitychange', () => { if (document.hidden) lost(); else this._blurred = false; });
      addEventListener('blur', lost);
      addEventListener('focus', () => { this._blurred = false; });
    }
    get scene() { return this.scenes[this.scenes.length - 1] || null; }
    resize() {
      const r = this.container.getBoundingClientRect();
      const cw = Math.max(1, r.width), ch = Math.max(1, r.height);
      this.dpr = Math.min(window.devicePixelRatio || 1, this.maxPixelRatio);
      for (const c of [this.glCanvas, this.canvas]) { c.width = Math.round(cw * this.dpr); c.height = Math.round(ch * this.dpr); }
      this.width = cw / this.zoom; this.height = ch / this.zoom; this.scale = this.dpr * this.zoom;
      if (this.running) this._render();
    }
    toLogical(clientX, clientY) {
      const r = this.canvas.getBoundingClientRect();
      return { x: (clientX - r.left) / this.zoom, y: (clientY - r.top) / this.zoom };
    }
    start(scene) {
      if (scene) this._enter(scene);
      if (!this.running) { this.running = true; this._last = 0; requestAnimationFrame(this._loop); }
      return this;
    }
    stop() { this.running = false; }
    _enter(scene) { scene._init(this); this.scenes.push(scene); scene.enter(); }
    switch(scene, { fade = 0, color = '#000' } = {}) {
      if (this.transition && !this.transition.fired) return false;
      const go = () => { while (this.scenes.length) this.scenes.pop().exit(); this._enter(scene); };
      if (fade > 0) this.transition = { t: 0, dur: fade, color, action: go, fired: false }; else go();
      return true;
    }
    push(scene) { this._enter(scene); return scene; }
    pop() { const s = this.scenes.pop(); if (s) s.exit(); if (this.scene) this.scene.resume(); return s; }
    _loop(now) {
      if (!this.running) return;
      requestAnimationFrame(this._loop);
      now /= 1000;
      if (!this._last) this._last = now - 1 / 60;
      const dt = clamp(now - this._last, 0, 1 / 20);
      this._last = now;
      if (dt > 0) this.fps = lerp(this.fps, 1 / Math.max(dt, 1e-4), 0.05);
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
      this._render();
    }
    _render() {
      let base = this.scenes.length - 1;
      while (base > 0 && this.scenes[base].transparent) base--;
      const bs = this.scenes[Math.max(0, base)];
      if (bs) this.renderer.render(bs.root, bs.camera, bs.env, this.width, this.height, bs.particles);
      const ctx = this.ui;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
      for (let i = Math.max(0, base); i < this.scenes.length; i++) { ctx.save(); this.scenes[i].drawUI(ctx); ctx.restore(); }
      this.input.drawTouch(ctx);
      const tr = this.transition;
      if (tr) {
        const h = tr.dur / 2;
        ctx.globalAlpha = clamp(tr.t < h ? tr.t / h : 1 - (tr.t - h) / h, 0, 1);
        ctx.fillStyle = tr.color; ctx.fillRect(0, 0, this.width, this.height); ctx.globalAlpha = 1;
      }
      if (this.debug && bs) {
        const st = this.renderer.stats;
        const lines = [`${Math.round(this.fps)} fps  ${this.width | 0}×${this.height | 0} @${this.scale.toFixed(2)}`,
          `${bs.constructor.name}  draw calls ${st.calls}  triangles ${st.triangles}  particles ${bs.particles.count}`,
          `camera ${['x', 'y', 'z'].map((k) => bs.camera.position[k].toFixed(1)).join(', ')}`];
        ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(4, 4, 330, lines.length * 14 + 8);
        lines.forEach((l, i) => Flint.text(ctx, l, 10, 9 + i * 14, { size: 11, color: '#7f7' }));
      }
    }
  }

  return { VERSION: '1.0.0', Vec3, M4, rgb, Geometry, Texture, Material, Node, mesh, Camera3D, Collide3D, Particles3D, Renderer, Scene3D, Game3D };
});
