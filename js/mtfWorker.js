// js/mtfWorker.js
// ► Хочешь отключить воркер – закомментируй строку «worker = new Worker(...)»

let worker = null;
let fallbackMode = false; // используем requestIdleCallback вместо воркера

// ===================================================================
// 0. Запуск воркера (если браузер поддерживает)
// ===================================================================
try {
  worker = new Worker('./workers/mtf.worker.js');
} catch (e) {
  console.warn('WebWorker not supported → fallback to requestIdleCallback');
  fallbackMode = true;
}

// ===================================================================
// 1. Публичная функция
// ===================================================================
export function requestMTF(tf, type, closes, period) {
  const symbol = document.getElementById('symbolSelect').value;
  const id = `${symbol}_${tf}_${type}_${period}_${Date.now()}`;

  return new Promise((resolve) => {
    if (worker && !fallbackMode) {
      // воркер
      worker.postMessage({ id, symbol, tf, type, period, closes });
      const handler = ({ data }) => {
        if (data.id === id) {
          worker.removeEventListener('message', handler);
          resolve(data.value);
        }
      };
      worker.addEventListener('message', handler);
    } else {
      // fallback через requestIdleCallback
      requestIdleCallback(() => resolve(fallbackRequest(tf, type, closes, period)));
    }
  });
}

// ===================================================================
// 2. Fallback-запрос без воркера (блокирует UI минимально)
// ===================================================================
async function fallbackRequest(tf, type, closes, period) {
  const CACHE_TTL = 60_000;
  const symbol = document.getElementById('symbolSelect').value;
  const cacheKey = `fallback_${symbol}_${tf}_${type}_${period}`;
  const cached = JSON.parse(localStorage.getItem(cacheKey) || '{}');

  if (cached.value !== undefined && Date.now() - cached.ts < CACHE_TTL) {
    return cached.value;
  }

  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${tf}&limit=${period + 1}`;
  const res = await fetch(url);
  if (!res.ok) return NaN;
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

  localStorage.setItem(cacheKey, JSON.stringify({ value, ts: Date.now() }));
  return value;
}

// быстрая EMA (дубль для fallback)
function ema(src, len) {
  const k = 2 / (len + 1);
  const out = [src[0]];
  for (let i = 1; i < src.length; i++) out.push(src[i] * k + out[i - 1] * (1 - k));
  return out;
}