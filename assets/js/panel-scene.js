import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { glowTexture } from './brand-shapes.js';

// Why Choose Us: a residential load center that opens in four layers as you scroll.
// 1 door swings open, 2 dead front lifts away and breakers pull out,
// 3 bus bars and stabs glow, 4 breakers seat back, handles click ON, current runs.
export function initPanelScene(canvas, { reduced }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  const lookAt = new THREE.Vector3(0, 0, 0);

  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(-3, 4, 5);
  const rim = new THREE.DirectionalLight(0xc9d8ff, 0.7);
  rim.position.set(4, 1, -3);
  scene.add(key, rim, new THREE.AmbientLight(0xe8eef8, 0.35));

  const M = (o) => new THREE.MeshStandardMaterial(o);
  const steel = M({ color: 0xc9d0db, metalness: 0.55, roughness: 0.4, envMapIntensity: 0.8 });
  const steelDark = M({ color: 0x8c99ad, metalness: 0.6, roughness: 0.48 });
  const pan = M({ color: 0x5d6b82, metalness: 0.5, roughness: 0.55 });
  const cover = M({ color: 0xeef1f6, metalness: 0.2, roughness: 0.36 });
  const breakerMat = M({ color: 0x1a2030, metalness: 0.05, roughness: 0.6 });
  const handleMat = M({ color: 0x2f3a52, metalness: 0.05, roughness: 0.45 });
  const handleOn = M({ color: 0x2f3a52, metalness: 0.05, roughness: 0.45, emissive: 0xf29400, emissiveIntensity: 0 });
  const labelMat = M({ color: 0xf4f6fa, roughness: 0.7 });
  const copper = M({ color: 0xc27a3a, metalness: 1, roughness: 0.26, emissive: 0xf29400, emissiveIntensity: 0 });
  const silver = M({ color: 0xd9dee6, metalness: 1, roughness: 0.22 });
  const navy = M({ color: 0x0e2460, metalness: 0.2, roughness: 0.4 });

  const ampMats = {};
  const ampMat = (txt) => {
    if (ampMats[txt]) return ampMats[txt];
    const cv = document.createElement('canvas');
    cv.width = 128; cv.height = 96;
    const g = cv.getContext('2d');
    g.fillStyle = '#F4F6FA'; g.fillRect(0, 0, 128, 96);
    g.fillStyle = '#0B1530'; g.font = 'bold 64px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(txt, 64, 52);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return (ampMats[txt] = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 }));
  };
  const rbox = (w, h, d, mat, r = 0.02) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)), mat);
  const at = (m, x, y, z) => (m.position.set(x, y, z), m);
  const W = 1.5, H = 2.5, D = 0.42;

  const panel = new THREE.Group();
  scene.add(panel);

  // Enclosure (layer 0)
  const enclosure = new THREE.Group();
  enclosure.add(at(rbox(W, H, 0.05, steel, 0.02), 0, 0, -D / 2));
  enclosure.add(at(rbox(0.05, H, D, steel, 0.02), -W / 2, 0, 0), at(rbox(0.05, H, D, steel, 0.02), W / 2, 0, 0));
  enclosure.add(at(rbox(W, 0.05, D, steel, 0.02), 0, H / 2, 0), at(rbox(W, 0.05, D, steel, 0.02), 0, -H / 2, 0));
  enclosure.add(at(rbox(W - 0.18, H - 0.22, 0.02, pan, 0.01), 0, 0, -D / 2 + 0.04));
  // knockouts: concentric rings on the top and side walls
  const ring = (r) => new THREE.Mesh(new THREE.TorusGeometry(r, 0.008, 8, 40), steelDark);
  [-0.45, -0.15, 0.15, 0.45].forEach((x) => {
    [0.07, 0.045].forEach((r) => {
      const k = ring(r);
      k.rotation.x = Math.PI / 2;
      enclosure.add(at(k, x, H / 2 + 0.028, 0));
    });
  });
  [0.7, 0.2, -0.3, -0.8].forEach((y) => {
    const k = ring(0.05);
    k.rotation.y = Math.PI / 2;
    enclosure.add(at(k, W / 2 + 0.028, y, 0));
  });
  panel.add(enclosure);

  // Bus bars with stabs (layer 3)
  const bus = new THREE.Group();
  [-0.06, 0.06].forEach((x) => bus.add(at(rbox(0.07, 1.66, 0.04, copper, 0.012), x, -0.1, -D / 2 + 0.09)));
  for (let i = 0; i < 8; i++) {
    const y = 0.58 - i * 0.18;
    bus.add(at(rbox(0.3, 0.035, 0.03, copper, 0.01), 0, y, -D / 2 + 0.12));
    [-1, 1].forEach((s) => bus.add(at(rbox(0.05, 0.07, 0.09, copper, 0.012), s * 0.13, y, -D / 2 + 0.16)));
  }
  const neutrals = new THREE.Group();
  [-0.6, 0.6].forEach((x) => {
    neutrals.add(at(rbox(0.06, 1.3, 0.05, silver, 0.012), x, -0.2, -D / 2 + 0.1));
    for (let i = 0; i < 9; i++) {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.03, 12), silver);
      s.rotation.x = Math.PI / 2;
      neutrals.add(at(s, x, 0.38 - i * 0.14, -D / 2 + 0.14));
    }
  });
  panel.add(bus, neutrals);

  // Breakers with flip handles (layer 2 and 4)
  const breakers = [];
  function makeBreaker(w, h, poles = 1, amps = '20', side = 1) {
    const g = new THREE.Group();
    g.add(rbox(w, h, 0.16, breakerMat, 0.02));
    g.add(at(new THREE.Mesh(new THREE.PlaneGeometry(w * 0.32, h * 0.5), ampMat(amps)), poles > 1 ? w * 0.36 : side * w * 0.24, 0, 0.082));
    const pivot = new THREE.Group();
    pivot.position.set(poles > 1 ? -w * 0.08 : -side * w * 0.16, 0, 0.08);
    pivot.add(at(rbox(poles > 1 ? w * 0.6 : 0.07, 0.05, 0.08, handleOn, 0.015), 0, 0, 0.035));
    g.add(pivot);
    g.userData.handle = pivot;
    return g;
  }
  const main = makeBreaker(0.6, 0.3, 2, '100');
  main.position.set(0, 0.9, -D / 2 + 0.2);
  main.userData = { ...main.userData, base: main.position.clone(), out: new THREE.Vector3(0, 1.1, 1.0), delay: 0 };
  panel.add(main);
  breakers.push(main);
  for (let i = 0; i < 8; i++) {
    [-1, 1].forEach((side) => {
      const g = makeBreaker(0.34, 0.15, 1, ['20', '15', '20', '30', '15', '20', '15', '20'][(i + (side > 0 ? 3 : 0)) % 8], side);
      g.position.set(side * 0.19, 0.58 - i * 0.18, -D / 2 + 0.19);
      g.userData = {
        ...g.userData,
        base: g.position.clone(),
        out: new THREE.Vector3(side * (0.36 + (i % 2) * 0.08), 0.64 - i * 0.21, 0.6 + (i % 3) * 0.14),
        delay: (i * 2 + (side > 0 ? 1 : 0)) * 0.003,
      };
      panel.add(g);
      breakers.push(g);
    });
  }

  // Branch wires from breaker terminals out through the top knockouts (layer 4 current)
  const wireColors = [0x1b1f29, 0xb3261e, 0x1b1f29, 0xf4f6fa, 0x1b1f29, 0xb3261e, 0x1b1f29, 0xf4f6fa];
  const curves = [];
  for (let i = 0; i < 8; i++) {
    const side = i % 2 ? 1 : -1;
    const y0 = 0.58 - i * 0.18;
    const ko = [-0.45, -0.15, 0.15, 0.45][i % 4];
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.37, y0, -D / 2 + 0.2),
      new THREE.Vector3(side * 0.53, y0 + 0.05, -D / 2 + 0.16),
      new THREE.Vector3(side * 0.57, 0.95, -D / 2 + 0.14),
      new THREE.Vector3(ko, H / 2 - 0.06, -0.02),
      new THREE.Vector3(ko + side * 0.05, H / 2 + 0.6, 0.05),
    ]);
    curves.push(curve);
    panel.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.017, 10, false), M({ color: wireColors[i], roughness: 0.5, metalness: 0.05 })));
  }

  // Travelling current: bright cores with soft glow sprites
  const glowMap = glowTexture(THREE);
  const pulses = [];
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xffd28a, transparent: true, opacity: 0 });
  curves.forEach((curve, i) => {
    for (let k = 0; k < 3; k++) {
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 12), coreMat);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap, color: 0xffa424, transparent: true, depthWrite: false, opacity: 0, blending: THREE.AdditiveBlending }));
      halo.scale.set(0.22, 0.22, 1);
      core.add(halo);
      core.userData = { curve, offset: k / 3 + i * 0.09, halo };
      panel.add(core);
      pulses.push(core);
    }
  });

  // Dead front: breaker window, knockout tabs, corner screws (layer 2)
  const front = new THREE.Group();
  const outline = new THREE.Shape();
  const fw = W / 2 + 0.04, fh = H / 2 + 0.04, r = 0.05;
  outline.moveTo(-fw + r, -fh);
  outline.lineTo(fw - r, -fh); outline.quadraticCurveTo(fw, -fh, fw, -fh + r);
  outline.lineTo(fw, fh - r); outline.quadraticCurveTo(fw, fh, fw - r, fh);
  outline.lineTo(-fw + r, fh); outline.quadraticCurveTo(-fw, fh, -fw, fh - r);
  outline.lineTo(-fw, -fh + r); outline.quadraticCurveTo(-fw, -fh, -fw + r, -fh);
  const hole = new THREE.Path();
  hole.moveTo(-0.42, -0.85); hole.lineTo(0.42, -0.85); hole.lineTo(0.42, 1.1); hole.lineTo(-0.42, 1.1); hole.closePath();
  outline.holes.push(hole);
  front.add(new THREE.Mesh(new THREE.ExtrudeGeometry(outline, { depth: 0.03, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3, curveSegments: 8 }), cover));
  [[-fw + 0.08, fh - 0.08], [fw - 0.08, fh - 0.08], [-fw + 0.08, -fh + 0.08], [fw - 0.08, -fh + 0.08]].forEach(([x, y]) => {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.015, 16), silver);
    s.rotation.x = Math.PI / 2;
    front.add(at(s, x, y, 0.045));
  });
  for (let i = 0; i < 8; i++) [-0.5, 0.5].forEach((x) => front.add(at(rbox(0.1, 0.12, 0.008, steelDark, 0.004), x, 0.58 - i * 0.18, 0.042)));
  front.add(at(rbox(0.5, 0.09, 0.015, navy, 0.01), 0, -1.03, 0.045));

  // Door with a circuit directory printed inside
  const dir = document.createElement('canvas');
  dir.width = 256; dir.height = 512;
  const g2 = dir.getContext('2d');
  g2.fillStyle = '#F7F8FB'; g2.fillRect(0, 0, 256, 512);
  g2.fillStyle = '#0E2460'; g2.fillRect(0, 0, 256, 54);
  g2.fillStyle = '#FFFFFF'; g2.font = 'bold 20px sans-serif'; g2.fillText('CIRCUIT DIRECTORY', 22, 35);
  const rooms = ['Kitchen', 'Kitchen GFCI', 'Dishwasher', 'Microwave', 'Living Room', 'Bedroom 1', 'Bedroom 2', 'Bath GFCI', 'Laundry', 'Dryer', 'HVAC', 'Water Heater', 'Garage', 'Outdoor', 'Hall Lights', 'Basement'];
  g2.font = '15px sans-serif';
  rooms.forEach((n, i) => {
    const y = 80 + i * 26;
    g2.strokeStyle = '#DCE3EE'; g2.beginPath(); g2.moveTo(16, y + 8); g2.lineTo(240, y + 8); g2.stroke();
    g2.fillStyle = '#47567A'; g2.fillText(String(i + 1).padStart(2, '0'), 18, y);
    g2.fillStyle = '#0B1530'; g2.fillText(n, 52, y);
  });
  const dirTex = new THREE.CanvasTexture(dir);
  dirTex.colorSpace = THREE.SRGBColorSpace;

  const doorPivot = new THREE.Group();
  doorPivot.position.set(-0.5, 0.125, 0.06);
  doorPivot.add(at(rbox(1.0, 2.05, 0.03, cover, 0.014), 0.5, 0, 0));
  const directory = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 1.24), new THREE.MeshStandardMaterial({ map: dirTex, roughness: 0.8 }));
  directory.rotation.y = Math.PI;
  doorPivot.add(at(directory, 0.5, 0.1, -0.018));
  doorPivot.add(at(rbox(0.05, 0.22, 0.04, steelDark, 0.015), 0.92, 0, 0.03));
  front.add(doorPivot);
  front.position.z = D / 2;
  panel.add(front);

  let target = reduced ? 1 : 0;
  let current = target;
  const seg = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const back = (t) => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const tmp = new THREE.Vector3();
  let s4 = 0;

  function apply(p) {
    const s1 = ease(seg(p, 0.03, 0.22));
    const s2 = ease(seg(p, 0.27, 0.48));
    const s3 = ease(seg(p, 0.5, 0.6));
    s4 = seg(p, 0.7, 0.86);

    doorPivot.rotation.y = -1.9 * s1;
    front.position.set(-1.12 * s2, -0.05 * s2, D / 2 + 0.75 * s2);
    front.rotation.y = 0.85 * s2;

    breakers.forEach((b) => {
      const { base, out, delay, handle } = b.userData;
      const pull = ease(seg(p, 0.29 + delay, 0.52));
      const seat = back(seg(p, 0.62 + delay, 0.68 + delay));
      const k = pull * (1 - Math.min(1, seat));
      tmp.set(out.x, out.y, base.z + out.z);
      b.position.lerpVectors(base, tmp, k);
      const flip = seg(p, 0.66 + delay, 0.7 + delay);
      handle.rotation.x = -0.45 + 0.9 * back(flip);
    });
    handleOn.emissiveIntensity = 0.35 * s4;

    bus.position.z = 0.3 * s3 * (1 - s4 * 0.7);
    neutrals.position.z = 0.16 * s3 * (1 - s4 * 0.7);
    copper.emissiveIntensity = 0.45 * s3 + 0.2 * s4;

    coreMat.opacity = Math.min(1, s4 * 1.4);
    pulses.forEach((c) => (c.userData.halo.material.opacity = Math.min(1, s4 * 1.4) * 0.9));

    panel.position.x = 0.32 * s2;
    panel.rotation.y = -0.5 + 0.72 * p;
    panel.rotation.x = 0.1 + 0.06 * Math.sin(p * Math.PI);
    // camera dolly: pulls back for the explode, leans in on the bus, settles on the live panel
    camera.position.set(-0.4 * s3 * (1 - s4), 0.15 + 0.3 * s3 * (1 - s4), 8.6 + 0.9 * s2 - 0.7 * s3 + 0.4 * s4);
    lookAt.set(0.3 * s2, -0.05 + 0.15 * s3 * (1 - s4), 0);
    camera.lookAt(lookAt);
  }

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 42 : 30;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  let visible = false;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: '100px' }).observe(canvas);

  const clock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    if (!visible) return;
    const t = clock.getElapsedTime();
    current += (target - current) * 0.09;
    apply(current);
    if (!reduced) panel.position.y = -0.1 + Math.sin(t * 0.8) * 0.03;
    if (s4 > 0) pulses.forEach((c) => c.position.copy(c.userData.curve.getPointAt((t * 0.32 + c.userData.offset) % 1)));
    renderer.render(scene, camera);
  }
  apply(current);
  renderer.render(scene, camera);
  tick();

  return {
    setProgress(p) {
      if (!reduced) target = p;
    },
  };
}
