// js/pyramiding.js
// Линии TP/SL + пирамидинг (P2)
// Ищи «// ►» для быстрого ON/OFF

import { atr } from './indicators.js';

// ===================================================================
// 0. Глобальное хранилище состояния сделки
// ===================================================================
let tradeState = {
  direction: 0,          // 1 long, -1 short, 0 none
  entry: null,           // цена входа
  sl: null,              // стоп-лосс
  tp1: null, tp2: null, tp3: null,
  tp1Hit: false, tp2Hit: false,
  pyramidEntries: 0,     // сколько добавили
  series: { sl: null, tp1: null, tp2: null, tp3: null } // ссылки на LineSeries
};

// ===================================================================
// 1. Создать / удалить линии
// ===================================================================
function createLines(chart, cfg) {
  // ► Убрать рисование линий – закомментируй весь блок
  const lineOpt = { priceLineVisible: true, lastValueVisible: true, lineWidth: 1 };
  tradeState.series.sl = chart.addLineSeries({ color: '#ff4444', ...lineOpt });
  tradeState.series.tp1 = chart.addLineSeries({ color: '#00ff00', ...lineOpt });
  tradeState.series.tp2 = chart.addLineSeries({ color: '#00ff00', ...lineOpt });
  tradeState.series.tp3 = chart.addLineSeries({ color: '#00ff00', ...lineOpt });
}

function removeLines() {
  Object.values(tradeState.series).forEach(s => s?.remove());
  tradeState.series = { sl: null, tp1: null, tp2: null, tp3: null };
}

// ===================================================================
// 2. Открыть сделку или добавить пирамиду
// ===================================================================
export function openTrade(chart, candles, cfg, isLong) {
  // ► Чтобы отключить пирамидинг – раскомментируй return ниже
  // return;

  const last = candles.length - 1;
  const price = candles[last].close;
  const atr14 = atr(
    candles.map(c => c.high),
    candles.map(c => c.low),
    candles.map(c => c.close),
    14
  )[last];

  // если ещё нет линий – создаём
  if (!tradeState.series.sl) createLines(chart, cfg);

  // первый вход
  if (tradeState.direction === 0) {
    tradeState.direction = isLong ? 1 : -1;
    tradeState.entry = price;
    tradeState.pyramidEntries = 1;
  } else if (
    tradeState.pyramidEntries < cfg.pyramidMaxEntries &&
    ((isLong && price > tradeState.entry) || (!isLong && price < tradeState.entry))
  ) {
    // пирамида
    tradeState.pyramidEntries++;
    // средневзвешенная цена
    tradeState.entry =
      (tradeState.entry * (tradeState.pyramidEntries - 1) + price) /
      tradeState.pyramidEntries;
  } else {
    return; // условия не выполнены
  }

  // расчёт уровней
  const mult = isLong ? 1 : -1;
  tradeState.sl = tradeState.entry - mult * atr14 * cfg.atrStopMult;
  tradeState.tp1 = tradeState.entry + mult * atr14 * cfg.tp1Mult;
  tradeState.tp2 = tradeState.entry + mult * atr14 * cfg.tp2Mult;
  tradeState.tp3 = tradeState.entry + mult * atr14 * cfg.tp3Mult;

  // обновляем линии
  const t = candles[last].time;
  [
    { s: tradeState.series.sl, val: tradeState.sl },
    { s: tradeState.series.tp1, val: tradeState.tp1 },
    { s: tradeState.series.tp2, val: tradeState.tp2 },
    { s: tradeState.series.tp3, val: tradeState.tp3 }
  ].forEach(({ s, val }) => s.setData([{ time: t, value: val }]));

  // ► Хочешь показывать лейблы TP/SL – включи ниже
  // showLabels(chart, t, cfg);
}

// ===================================================================
// 3. Обработка движения цены (move to BE, трейлинг, TP-hit)
// ===================================================================
export function onNewBar(chart, candles, cfg) {
  if (tradeState.direction === 0) return;

  const last = candles.length - 1;
  const high = candles[last].high;
  const low  = candles[last].low;
  const t    = candles[last].time;

  // TP1 hit -> move SL to BE
  if (!tradeState.tp1Hit && cfg.moveToBEafterTP1) {
    const hit = tradeState.direction === 1 ? high >= tradeState.tp1 : low <= tradeState.tp1;
    if (hit) {
      tradeState.tp1Hit = true;
      tradeState.sl = tradeState.entry;
      tradeState.series.sl.setData([{ time: t, value: tradeState.sl }]);
    }
  }

  // TP2 hit – можно включить динамический TP3
  if (!tradeState.tp2Hit) {
    const hit = tradeState.direction === 1 ? high >= tradeState.tp2 : low <= tradeState.tp2;
    if (hit) tradeState.tp2Hit = true;
  }

  // TP3 hit – закрываем
  const tp3Hit = tradeState.direction === 1 ? high >= tradeState.tp3 : low <= tradeState.tp3;
  const slHit  = tradeState.direction === 1 ? low  <= tradeState.sl  : high >= tradeState.sl;

  if (tp3Hit || slHit) {
    closeTrade(chart);
  }
}

// ===================================================================
// 4. Закрыть сделку и убрать линии
// ===================================================================
export function closeTrade(chart) {
  // ► Чтобы линии оставались – закомментируй removeLines()
  removeLines();
  tradeState = {
    direction: 0, tp1Hit: false, tp2Hit: false, pyramidEntries: 0
  };
}