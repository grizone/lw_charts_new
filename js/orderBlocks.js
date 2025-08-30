// js/orderBlocks.js
// Order Blocks & Liquidity Grabs (P2)
// Ищи «// ►» чтобы отключить нужный блок

import { atr } from './indicators.js';

// ===================================================================
// 0. Настройки по умолчанию (берём из configEnh)
// ===================================================================
const cfg = window.configEnh ?? {}; // fallback, если ещё не импортировали

// ===================================================================
// 1. Order-Block линии
// ===================================================================
const bullishOB = []; // сохраняем последние 5 линий
const bearishOB = [];

/**
 * Проверка: является ли свеча bullish order-block
 * Возвращает {top, bottom} или null
 */
function scanBullishOB(candles, atr14) {
  // ► Хочешь отключить OB – возвращай сразу null
  const lookback = 3;
  if (candles.length < lookback + 1) return null;

  const slice = candles.slice(-lookback - 1, -1); // последние 3 свечи до текущей
  const h = Math.max(...slice.map(c => c.high));
  const l = Math.min(...slice.map(c => c.low));
  const range = h - l;

  // условие консолидации
  if (range > atr14 * 0.5) return null;

  // сильный импульс вверх
  const last = candles[candles.length - 1];
  const impulse = last.close - last.open;
  if (impulse <= atr14 * 2) return null;

  return { top: h, bottom: l };
}

function scanBearishOB(candles, atr14) {
  // ► Отключить – вернуть null
  const lookback = 3;
  if (candles.length < lookback + 1) return null;

  const slice = candles.slice(-lookback - 1, -1);
  const h = Math.max(...slice.map(c => c.high));
  const l = Math.min(...slice.map(c => c.low));
  const range = h - l;
  if (range > atr14 * 0.5) return null;

  const last = candles[candles.length - 1];
  const impulse = last.open - last.close;
  if (impulse <= atr14 * 2) return null;

  return { top: h, bottom: l };
}

// ===================================================================
// 2. Liquidity Grab
// ===================================================================
function scanLiquidityGrab(candles, atr14) {
  // ► Отключить – вернуть null
  const lookback = 20;
  if (candles.length < lookback + 2) return null;

  const recentHigh = Math.max(...candles.slice(-lookback - 1, -1).map(c => c.high));
  const recentLow  = Math.min(...candles.slice(-lookback - 1, -1).map(c => c.low));
  const last = candles[candles.length - 1];

  // bullish grab: пробой low + закрытие выше
  if (last.low < recentLow && last.close > recentLow + atr14 * 1.5) {
    return { dir: 'bull', price: last.low };
  }
  // bearish grab: пробой high + закрытие ниже
  if (last.high > recentHigh && last.close < recentHigh - atr14 * 1.5) {
    return { dir: 'bear', price: last.high };
  }
  return null;
}

// ===================================================================
// 3. Обновление на каждом баре
// ===================================================================
export function updateOrderBlocks(chart, candles, cfg = cfg) {
  const last = candles[candles.length - 1];
  const atr14 = atr(
    candles.map(c => c.high),
    candles.map(c => c.low),
    candles.map(c => c.close),
    14
  )[candles.length - 1];

  // ► Order Blocks
  const bull = scanBullishOB(candles, atr14);
  if (bull) {
    const line = chart.addLineSeries({ color: 'rgba(0,255,0,.6)', lineWidth: 2 });
    line.setData([
      { time: last.time - 3 * 60, value: bull.top },   // фикс. смещение 3 свечи
      { time: last.time + cfg.obLookback * 60, value: bull.top }
    ]);
    bullishOB.push(line);
    if (bullishOB.length > 5) bullishOB.shift().remove();
  }

  const bear = scanBearishOB(candles, atr14);
  if (bear) {
    const line = chart.addLineSeries({ color: 'rgba(255,0,0,.6)', lineWidth: 2 });
    line.setData([
      { time: last.time - 3 * 60, value: bear.bottom },
      { time: last.time + cfg.obLookback * 60, value: bear.bottom }
    ]);
    bearishOB.push(line);
    if (bearishOB.length > 5) bearishOB.shift().remove();
  }

  // ► Liquidity Grabs
  const grab = scanLiquidityGrab(candles, atr14);
  if (grab) {
    chart.createMultipointShape(
      [
        { time: last.time, price: grab.price }
      ],
      {
        shape: 'arrow_up',
        overrides: { color: grab.dir === 'bull' ? '#00ff00' : '#ff0000' }
      }
    );
  }
}