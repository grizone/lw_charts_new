// Утилиты
export function css(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
export function rgba(hex, a) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const n = parseInt(c, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}
export function fmt(n) { return (+n).toFixed(4); }

export function genData() {
  const data = [];
  const now = Math.floor(Date.now() / 1000);
  let t = now - 3600 * 300;
  let c = 30000;
  for (let i = 0; i < 300; i++) {
    const o = c;
    c = o * (1 + (Math.random() - 0.5) * 0.02);
    const h = Math.max(o, c) * (1 + Math.random() * 0.01);
    const l = Math.min(o, c) * (1 - Math.random() * 0.01);
    const volume = Math.floor(Math.random() * 500 + 100);
    data.push({ time: t, open: o, high: h, low: l, close: c, volume });
    t += 3600;
  }
  return data;
}

export function autoFullscreen() {
  if (!screen.orientation) return;
  screen.orientation.addEventListener('change', () => {
    const angle = screen.orientation.angle;
    angle === 90 || angle === 270
      ? document.documentElement.requestFullscreen?.()
      : document.exitFullscreen?.();
  });
}

export function toggleTimeframeControl() {
  const isPortrait = window.innerWidth <= 768 && screen.orientation.angle % 180 === 0;
  document.getElementById('timeframeSelect').style.display = isPortrait ? 'block' : 'none';
  document.querySelector('.tabs').style.display = isPortrait ? 'none' : 'flex';
}