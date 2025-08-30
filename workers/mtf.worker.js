// workers/mtf.worker.js
// ► Если не хочешь воркер – просто не регистрируй его (см. init.js)

// в воркере нет доступа к DOM, только self + fetch
const CACHE_TTL = 60_000;

self.onmessage = async ({ data }) => {
  const { id, symbol, tf, type, period, closes } = data;
  const cacheKey = `worker_${symbol}_${tf}_${type}_${period}`;
  const cached = JSON.parse(self.localStorage?.getItem(cacheKey) || '{}');

  // свежий кэш – отдаём сразу
  if (cached.value !== undefined && Date.now() - cached.ts < CACHE_TTL) {
    self.postMessage({ id, value: cached.value });
    return;
  }

  // иначе – запрос
  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${tf}&limit=${period + 1}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.statusText);
    const raw = await res.json();
    const src = raw.map(c => +c[4]);

    let value;
    switch (type) {
      case 'ema':
        value = ema(src, period)[period];
        break;
      case 'sma':
        value = src.slice(-period).reduce((a, b) => a + b, 0) / period;
        break;
      case 'close':
      default:
        value = src[src.length - 1];
    }

    // пишем кэш внутри воркера (если доступен localStorage)
    if (self.localStorage) {
      self.localStorage.setItem(cacheKey, JSON.stringify({ value, ts: Date.now() }));
    }
    self.postMessage({ id, value });
  } catch (e) {
    self.postMessage({ id, value: NaN, error: e.message });
  }
};

// быстрая EMA
function ema(src, len) {
  const k = 2 / (len + 1);
  const out = [src[0]];
  for (let i = 1; i < src.length; i++) {
    out.push(src[i] * k + out[i - 1] * (1 - k));
  }
  return out;
}
