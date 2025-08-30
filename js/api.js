import { TIMEFRAME_MAP } from './config.js';
import { genData } from './utils.js';

export async function fetchAndPopulateSymbols() {
  const select = document.getElementById('symbolSelect');
  select.disabled = true;
  select.innerHTML = '<option value="">Загрузка...</option>';
  try {
    const [info, tickers] = await Promise.all([
      fetch('https://api.binance.com/api/v3/exchangeInfo').then(r => r.json()),
      fetch('https://api.binance.com/api/v3/ticker/24hr').then(r => r.json()),
    ]);
    const volumeMap = {};
    tickers.forEach(t => volumeMap[t.symbol] = parseFloat(t.quoteVolume) || 0);
    const symbols = info.symbols
      .filter(s => s.status === 'TRADING' && s.quoteAsset === 'USDT' && s.isSpotTradingAllowed)
      .map(s => s.symbol)
      .sort((a, b) => (volumeMap[b] || 0) - (volumeMap[a] || 0))
      .slice(0, 100);
    select.innerHTML = '';
    symbols.forEach(symbol => {
      const opt = document.createElement('option');
      opt.value = symbol;
      opt.textContent = symbol.replace('USDT', '');
      opt.title = `${symbol} - 24h Vol: ${(volumeMap[symbol] / 1e6).toFixed(2)}M USDT`;
      select.appendChild(opt);
    });
    const def = symbols.includes('BTCUSDT') ? 'BTCUSDT' : symbols[0];
    if (def) { select.value = def; await loadDataForSelectedSymbolAndTimeframe(); }
    select.disabled = false;
    select.addEventListener('change', () => loadDataForSelectedSymbolAndTimeframe());
  } catch (e) {
    console.error(e);
    select.innerHTML = '<option value="">Ошибка загрузки</option>';
    select.disabled = false;
    window.setData(genData());
  }
}

export async function loadDataForSelectedSymbolAndTimeframe(timeframe = null) {
  const symbol = document.getElementById('symbolSelect').value;
  const tfBadge = document.getElementById('res');
  const effectiveTf = timeframe || tfBadge.textContent;
  if (!symbol) return;
  document.getElementById('symbolSelect').disabled = true;
  document.querySelectorAll('.tab').forEach(t => t.style.pointerEvents = 'none');
  try {
    const interval = TIMEFRAME_MAP[effectiveTf];
    if (!interval) throw new Error(`Unsupported TF ${effectiveTf}`);
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=1000`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Binance error ${res.status}`);
    const raw = await res.json();
    const data = transformBinanceData(raw);
    if (!data.length) throw new Error('Empty data');
    window.setData(data);
    if (timeframe) tfBadge.textContent = timeframe;
  } catch (e) {
    console.error(e);
    window.setData(genData());
    if (timeframe) tfBadge.textContent = timeframe;
  } finally {
    document.getElementById('symbolSelect').disabled = false;
    document.querySelectorAll('.tab').forEach(t => t.style.pointerEvents = 'auto');
  }
}

export function transformBinanceData(binanceData) {
  const out = [];
  if (!Array.isArray(binanceData) || !binanceData.length) return out;
  for (const c of binanceData) {
    const time = Math.floor(c[0] / 1000) + (new Date().getTimezoneOffset() * -60);
    const o = parseFloat(c[1]), h = parseFloat(c[2]), l = parseFloat(c[3]), cl = parseFloat(c[4]), v = parseFloat(c[5]);
    if ([time, o, h, l, cl].every(Number.isFinite)) out.push({ time, open: o, high: h, low: l, close: cl, volume: v });
  }
  return out;
}