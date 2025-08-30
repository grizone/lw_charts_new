// js/multiIndicator.js
import { sma, ema, atr } from './indicators.js';

/**
 * Утилита: точный RSI (Wilder)
 */
function calcRSI(src, len = 14) {
  const out = Array(src.length).fill(NaN);
  let gain = 0, loss = 0;

  for (let i = 1; i <= len; i++) {
    const diff = src[i] - src[i - 1];
    gain += Math.max(diff, 0);
    loss += Math.max(-diff, 0);
  }
  let avgGain = gain / len;
  let avgLoss = loss / len;

  if (avgLoss === 0) out[len] = 100;
  else out[len] = 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = len + 1; i < src.length; i++) {
    const diff = src[i] - src[i - 1];
    avgGain = (avgGain * (len - 1) + Math.max(diff, 0)) / len;
    avgLoss = (avgLoss * (len - 1) + Math.max(-diff, 0)) / len;
    if (avgLoss === 0) out[i] = 100;
    else out[i] = 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

/**
 * Утилита: MACD (fast, slow, signal)
 * Возвращает [macdLine, signalLine]
 */
function calcMACD(src, fast = 12, slow = 26, signal = 9) {
  const emaFast = ema(src, fast);
  const emaSlow = ema(src, slow);
  const macd = emaFast.map((v, i) => v - emaSlow[i]);
  const signalLine = ema(macd, signal);
  return [macd, signalLine];
}

/**
 * Утилита: ADX (14)
 */
function calcADX(high, low, close, len = 14) {
  const tr = [];
  const dmP = [];
  const dmM = [];

  for (let i = 1; i < high.length; i++) {
    const tr1 = high[i] - low[i];
    const tr2 = Math.abs(high[i] - close[i - 1]);
    const tr3 = Math.abs(low[i] - close[i - 1]);
    tr.push(Math.max(tr1, tr2, tr3));

    const moveUp = high[i] - high[i - 1];
    const moveDn = low[i - 1] - low[i];
    dmP.push(moveUp > moveDn && moveUp > 0 ? moveUp : 0);
    dmM.push(moveDn > moveUp && moveDn > 0 ? moveDn : 0);
  }

  const atr14 = sma(tr, len);
  const diP = sma(dmP, len).map((v, i) => (100 * v) / atr14[i]);
  const diM = sma(dmM, len).map((v, i) => (100 * v) / atr14[i]);
  const dx = diP.map((v, i) => Math.abs(v - diM[i]) / (v + diM[i]) * 100);
  return sma(dx, len);
}

/**
 * Утилита: OBV
 */
function calcOBV(close, volume) {
  let obv = 0;
  return close.map((c, i) => {
    if (i === 0) return 0;
    if (c > close[i - 1]) obv += volume[i];
    else if (c < close[i - 1]) obv -= volume[i];
    return obv;
  });
}

/**
 * Главная функция
 * @param {Array} candles [{time, open, high, low, close, volume}]
 * @param {Object} cfg    параметры из configEnh
 * @returns {Object} {longScore, shortScore, dynScoreTh, rsi, macdLine, signalLine, adx, obv}
 */
function calcMultiIndicator(candles, cfg) {
  const closes = candles.map(c => c.close);
  const highs  = candles.map(c => c.high);
  const lows   = candles.map(c => c.low);
  const vols   = candles.map(c => c.volume);

  const rsi = calcRSI(closes, cfg.rsiPeriod);
  const [macdLine, signalLine] = calcMACD(closes, cfg.macdFast, cfg.macdSlow, cfg.macdSig);
  const adx = calcADX(highs, lows, closes, cfg.adxPeriod);

  const emaFast = ema(closes, cfg.emaFast);
  const emaSlow = ema(closes, cfg.emaSlow);

  const obv = calcOBV(closes, vols);

  const last = candles.length - 1;
  const atr14 = atr(highs, lows, closes, 14)[last];
  const atrPct = atr14 / closes[last];
  const dynScoreTh = cfg.baseScoreTh * (1 + Math.min(atrPct / 3, 0.8));

  // Веса Pine-скрипта
  const rsiW = 1.3, macdW = 1.2, adxW = 1.0, emaW = 1.0, obvW = 1.0;
  const totalW = rsiW + macdW + adxW + emaW + obvW;

  const longScore = [
    rsi[last] > 52,
    macdLine[last] > signalLine[last],
    adx[last] > 20 && adx[last] > 0,
    emaFast[last] > emaSlow[last],
    obv[last] > (cfg.obvTh || 0)
  ].reduce((s, v, i) => s + (v ? [rsiW, macdW, adxW, emaW, obvW][i] : 0), 0);

  const shortScore = [
    rsi[last] < 48,
    macdLine[last] < signalLine[last],
    adx[last] > 20 && adx[last] < 0,
    emaFast[last] < emaSlow[last],
    obv[last] < -(cfg.obvTh || 0)
  ].reduce((s, v, i) => s + (v ? [rsiW, macdW, adxW, emaW, obvW][i] : 0), 0);

  return { longScore, shortScore, dynScoreTh, rsi, macdLine, signalLine, adx, obv };
}

// Экспорт функции
export { calcMultiIndicator };