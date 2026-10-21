// Marquis symbol traced from logos/Ativo 1@4x.png, in the logo's own pixel space.
// Shared by the 3D scenes and kept in sync with the inline SVG favicon.
export const SYMBOL = {
  center: [990, 410],
  blue:
    'M888 76 L1073 453 L985 455 L1057 622 L845 393 L935 391 L873 283 C822 330 800 380 808 430 C812 480 840 520 868 565 C892 605 908 640 908 682 L785 682 C762 682 746 662 746 640 L746 352 L668 352 C640 352 628 320 650 298 Z',
  orange:
    'M905 60 L948 20 C965 3 990 -4 1012 6 L1025 15 L1325 293 C1350 318 1340 352 1310 352 L1235 353 L1235 640 C1235 662 1215 682 1195 682 L1073 683 C1073 640 1095 600 1120 562 C1150 515 1172 475 1173 420 C1172 320 1095 245 995 240 Z',
  bars: [
    [906, 697, 168, 31],
    [906, 742, 168, 32],
    [943, 789, 94, 31],
  ],
};

// Minimal M/L/C/Z path parser into a THREE.Shape (y flipped, centered, scaled).
export function pathToShape(THREE, d, scale = 1 / 300) {
  const [cx, cy] = SYMBOL.center;
  const shape = new THREE.Shape();
  const tokens = d.match(/[MLCZ]|-?\d+(\.\d+)?/g);
  const X = (v) => (v - cx) * scale;
  const Y = (v) => -(v - cy) * scale;
  let i = 0;
  let cmd = null;
  while (i < tokens.length) {
    const t = tokens[i];
    if (/[MLCZ]/.test(t)) {
      cmd = t;
      i++;
      if (cmd === 'Z') shape.closePath();
      continue;
    }
    if (cmd === 'M') {
      shape.moveTo(X(+tokens[i]), Y(+tokens[i + 1]));
      i += 2;
    } else if (cmd === 'L') {
      shape.lineTo(X(+tokens[i]), Y(+tokens[i + 1]));
      i += 2;
    } else if (cmd === 'C') {
      shape.bezierCurveTo(
        X(+tokens[i]), Y(+tokens[i + 1]),
        X(+tokens[i + 2]), Y(+tokens[i + 3]),
        X(+tokens[i + 4]), Y(+tokens[i + 5])
      );
      i += 6;
    } else {
      i++;
    }
  }
  return shape;
}

export function rectShape(THREE, [x, y, w, h], scale = 1 / 300) {
  const [cx, cy] = SYMBOL.center;
  const s = new THREE.Shape();
  const rr = 6 * scale;
  const L = (x - cx) * scale, R = (x + w - cx) * scale;
  const T = -(y - cy) * scale, B = -(y + h - cy) * scale;
  s.moveTo(L + rr, B);
  s.lineTo(R - rr, B);
  s.quadraticCurveTo(R, B, R, B + rr);
  s.lineTo(R, T - rr);
  s.quadraticCurveTo(R, T, R - rr, T);
  s.lineTo(L + rr, T);
  s.quadraticCurveTo(L, T, L, T - rr);
  s.lineTo(L, B + rr);
  s.quadraticCurveTo(L, B, L + rr, B);
  return s;
}

// Soft radial sprite texture used for glows.
export function glowTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(255,246,222,1)');
  grd.addColorStop(0.3, 'rgba(255,200,110,0.6)');
  grd.addColorStop(1, 'rgba(242,148,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
