// Run with: node --test flint/test/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../flint3d.js');
const { M4, Vec3, Geometry, Node, Camera3D, Collide3D, Particles3D } = T;

const near = (a, b, eps = 1e-5) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b}`);

test('compose applies scale, then rotation, then translation', () => {
  const m = M4.compose(M4.create(), new Vec3(1, 2, 3), new Vec3(0, Math.PI / 2, 0), new Vec3(2, 2, 2));
  const p = M4.transformPoint(m, 0, 0, -1);
  near(p.x, 1 - 2); near(p.y, 2); near(p.z, 3);
});

test('multiply composes transforms in order', () => {
  const a = M4.compose(M4.create(), new Vec3(5, 0, 0), new Vec3(), new Vec3(1, 1, 1));
  const b = M4.compose(M4.create(), new Vec3(), new Vec3(), new Vec3(3, 3, 3));
  const p = M4.transformPoint(M4.multiply(M4.create(), a, b), 1, 0, 0);
  near(p.x, 8);
});

test('normal matrix keeps normals perpendicular under non-uniform scale', () => {
  const m = M4.compose(M4.create(), new Vec3(), new Vec3(0.3, 0.7, 0.2), new Vec3(4, 1, 0.5));
  const nm = M4.normalMatrix(new Float32Array(9), m);
  // a surface spanned by local X and Z with normal +Y
  const tx = M4.transformPoint(m, 1, 0, 0), tz = M4.transformPoint(m, 0, 0, 1), o = M4.transformPoint(m, 0, 0, 0);
  const n = new Vec3(nm[3], nm[4], nm[5]); // normal matrix * (0,1,0)
  near(n.dot(new Vec3(tx.x - o.x, tx.y - o.y, tx.z - o.z)), 0);
  near(n.dot(new Vec3(tz.x - o.x, tz.y - o.y, tz.z - o.z)), 0);
});

test('camera projects the look-at point to the screen center', () => {
  const cam = new Camera3D();
  cam.position.set(3, 4, 5);
  cam.lookAt(0, 1, 0);
  const s = cam.project({ x: 0, y: 1, z: 0 }, 800, 600);
  near(s.x, 400, 1e-3); near(s.y, 300, 1e-3);
  assert.ok(s.visible);
  assert.ok(!cam.project({ x: 6, y: 7, z: 10 }, 800, 600).visible, 'behind the camera');
  cam.position.set(0, 0, 0);
  cam.setYawPitch(Math.PI / 2, 0);
  near(cam.target.x, 1); near(cam.target.z, 0);
});

// Every triangle should wind counter-clockwise when seen from outside, so face culling keeps it.
function checkWinding(name, g) {
  for (let t = 0; t < g.indices.length; t += 3) {
    const [a, b, c] = [0, 1, 2].map((k) => g.indices[t + k]);
    const P = (i) => new Vec3(g.positions[i * 3], g.positions[i * 3 + 1], g.positions[i * 3 + 2]);
    const e1 = P(b).sub(P(a)), e2 = P(c).sub(P(a));
    const face = e1.cross(e2);
    if (face.len() < 1e-9) continue; // degenerate pole triangles
    const n = new Vec3(g.normals[a * 3], g.normals[a * 3 + 1], g.normals[a * 3 + 2]);
    assert.ok(face.dot(n) > 0, `${name}: triangle ${t / 3} faces inward`);
  }
}

test('geometry winds outward and stays in range', () => {
  const shapes = {
    box: Geometry.box(1, 2, 3), plane: Geometry.plane(4, 4), quad: Geometry.quad(2, 1),
    sphere: Geometry.sphere(1, 12, 8), cylinder: Geometry.cylinder(0.5, 1, 2, 10), cone: Geometry.cone(1, 2, 8), gem: Geometry.gem(1),
  };
  for (const [name, g] of Object.entries(shapes)) {
    checkWinding(name, g);
    for (const i of g.indices) assert.ok(i < g.vertexCount, `${name} index in range`);
    assert.equal(g.uvs.length / 2, g.vertexCount);
  }
  assert.equal(Geometry.box().triangles, 12);
  assert.equal(Geometry.gem().triangles, 8);
});

test('merge bakes transforms into one geometry', () => {
  const g = Geometry.merge([
    { geometry: Geometry.box(1, 1, 1), position: [10, 0, 0] },
    { geometry: Geometry.box(1, 1, 1), position: [-10, 0, 0], rotation: [0, 1, 0], scale: 2 },
  ]);
  assert.equal(g.triangles, 24);
  checkWinding('merged', g);
  let maxX = -Infinity;
  for (let i = 0; i < g.vertexCount; i++) maxX = Math.max(maxX, g.positions[i * 3]);
  near(maxX, 10.5);
});

test('scene graph: children inherit parent transforms', () => {
  const parent = new Node({ position: [10, 0, 0], rotation: [0, Math.PI, 0] });
  const child = parent.add(new Node({ position: [0, 0, 2], name: 'kid' }));
  parent.updateWorld(null);
  const p = child.worldPosition();
  near(p.x, 10); near(p.z, -2);
  assert.equal(parent.find('kid'), child);
  child.destroy();
  assert.equal(parent.children.length, 0);
});

test('Node accepts numbers, arrays and objects; mesh nodes get a material', () => {
  const n = new Node({ scale: 2, position: { x: 1, y: 2, z: 3 }, geometry: Geometry.box(), material: { color: '#f00' }, speed: 4 });
  assert.equal(n.scale.y, 2);
  assert.equal(n.position.z, 3);
  assert.equal(n.material.color, '#f00');
  assert.equal(n.speed, 4, 'custom props are kept');
  assert.equal(new Node().material, null);
});

test('rgb parses colors', () => {
  assert.deepEqual(T.rgb('#ff0000'), [1, 0, 0]);
  assert.deepEqual(T.rgb('#0f0'), [0, 1, 0]);
  assert.deepEqual(T.rgb(0x0000ff), [0, 0, 1]);
});

test('Collide3D', () => {
  assert.ok(Collide3D.boxes({ x: 0, y: 0, z: 0, w: 2, h: 2, d: 2 }, { x: 1.5, y: 0, z: 0, w: 2, h: 2, d: 2 }));
  assert.ok(!Collide3D.boxes({ x: 0, y: 0, z: 0, w: 2, h: 2, d: 2 }, { x: 2, y: 0, z: 0, w: 2, h: 2, d: 2 }));
  assert.ok(Collide3D.sphereBox({ x: 1.3, y: 0, z: 0, r: 0.5 }, { x: 0, y: 0, z: 0, w: 2, h: 2, d: 2 }));
  assert.ok(Collide3D.spheres({ x: 0, y: 0, z: 0, r: 1 }, { x: 1.5, y: 0, z: 0, r: 1 }));
});

test('slideXZ stops at walls and slides along them', () => {
  const wall = [{ x: 0, z: -5, w: 20, d: 1 }];
  const pos = { x: 0, z: 0 };
  Collide3D.slideXZ(pos, 0.4, 0, -20, wall);
  near(pos.z, -4.5 + 0.4, 1e-6);
  Collide3D.slideXZ(pos, 0.4, 3, -1, wall);
  near(pos.x, 3, 1e-6);
  near(pos.z, -4.1, 1e-6);
});

test('Particles3D emit and expire', () => {
  const p = new Particles3D(10);
  p.emit({ x: 0, y: 0, z: 0 }, { count: 50, life: 0.2 });
  assert.equal(p.count, 10);
  p.update(0.3);
  assert.equal(p.count, 0);
});
