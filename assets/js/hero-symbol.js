import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SYMBOL, pathToShape, rectShape } from './brand-shapes.js';

// Hero: the Marquis house-bulb symbol, extruded, assembling and switching on.
export function initHeroSymbol(canvas, { gsap, reduced }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0, 6.2);

  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(2, 3, 4);
  scene.add(key, new THREE.AmbientLight(0xdfe7f5, 0.35));

  const extrude = { depth: 0.34, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.03, bevelSegments: 6, curveSegments: 48 };
  const blueMat = new THREE.MeshPhysicalMaterial({ color: 0x1450a0, metalness: 0.15, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.18, envMapIntensity: 0.55 });
  const orangeMat = new THREE.MeshPhysicalMaterial({ color: 0xf29400, metalness: 0.1, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15, envMapIntensity: 0.5 });
  const baseMat = new THREE.MeshPhysicalMaterial({ color: 0x113c86, metalness: 0.5, roughness: 0.28, clearcoat: 0.6, envMapIntensity: 0.6 });

  const mk = (shape, mat) => {
    const g = new THREE.ExtrudeGeometry(shape, extrude);
    g.translate(0, 0, -extrude.depth / 2);
    return new THREE.Mesh(g, mat);
  };

  const symbol = new THREE.Group();
  const blue = mk(pathToShape(THREE, SYMBOL.blue), blueMat);
  const orange = mk(pathToShape(THREE, SYMBOL.orange), orangeMat);
  const bars = new THREE.Group();
  SYMBOL.bars.forEach((b) => bars.add(mk(rectShape(THREE, b), baseMat)));
  symbol.add(blue, orange, bars);
  symbol.position.y = 0.12;
  scene.add(symbol);

  // Current: a few sparks orbiting the symbol.
  const sparkCount = 26;
  const sparkGeo = new THREE.BufferGeometry();
  const sparkPos = new Float32Array(sparkCount * 3);
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  const sparks = new THREE.Points(
    sparkGeo,
    new THREE.PointsMaterial({ color: 0xf29400, size: 0.045, transparent: true, opacity: 0, depthWrite: false })
  );
  const sparkSeed = Array.from({ length: sparkCount }, (_, i) => ({ a: (i / sparkCount) * Math.PI * 2, r: 1.55 + Math.random() * 0.25, s: 0.25 + Math.random() * 0.2, z: (Math.random() - 0.5) * 0.8 }));
  scene.add(sparks);

  const state = { glow: 0, sparks: 0 };
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    camera.position.z = w / h < 0.9 ? 7.6 : 6.2;
  }
  resize();
  window.addEventListener('resize', resize);

  window.addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  function switchOn() {
    const tl = gsap.timeline();
    tl.to(state, { glow: 0.35, duration: 0.08 })
      .to(state, { glow: 0.05, duration: 0.07 })
      .to(state, { glow: 0.8, duration: 0.1 })
      .to(state, { glow: 0.25, duration: 0.08 })
      .to(state, { glow: 1, duration: 0.6, ease: 'expo.out' })
      .to(state, { sparks: 0.9, duration: 1.2, ease: 'power2.out' }, '<');
    return tl;
  }

  if (reduced) {
    state.glow = 1;
    state.sparks = 0.6;
  } else {
    blue.position.set(-1.6, 0.4, 0);
    blue.rotation.set(0, -0.8, -0.3);
    orange.position.set(1.6, 0.9, 0);
    orange.rotation.set(0, 0.8, 0.3);
    bars.position.set(0, -1.2, 0);
    bars.scale.setScalar(0.6);
    const tl = gsap.timeline({ delay: 0.25 });
    tl.to([blue.position, orange.position, bars.position], { x: 0, y: 0, z: 0, duration: 1.4, ease: 'expo.out', stagger: 0.08 })
      .to([blue.rotation, orange.rotation], { x: 0, y: 0, z: 0, duration: 1.4, ease: 'expo.out' }, 0)
      .to(bars.scale, { x: 1, y: 1, z: 1, duration: 1.2, ease: 'expo.out' }, 0.15)
      .add(switchOn(), 1.05);
  }

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);

  const clock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    if (!visible) return;
    const t = clock.getElapsedTime();
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    const sway = reduced ? 0 : Math.sin(t * 0.45) * 0.28;
    symbol.rotation.y = sway + mouse.x * 0.35;
    symbol.rotation.x = mouse.y * 0.18;
    symbol.position.y = 0.12 + (reduced ? 0 : Math.sin(t * 0.9) * 0.04);

    sparkSeed.forEach((s, i) => {
      const a = s.a + t * s.s;
      sparkPos[i * 3] = Math.cos(a) * s.r;
      sparkPos[i * 3 + 1] = Math.sin(a) * s.r * 0.92 + 0.05;
      sparkPos[i * 3 + 2] = s.z + Math.sin(a * 2) * 0.2;
    });
    sparkGeo.attributes.position.needsUpdate = true;
    sparks.material.opacity = state.sparks * (0.6 + Math.sin(t * 3) * 0.2);

    renderer.render(scene, camera);
  }
  tick();
}
