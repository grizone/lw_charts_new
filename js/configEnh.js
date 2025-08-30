// js/configEnh.js
export const configEnh = {
  // Multi-Indicator
  rsiPeriod: 14,
  macdFast: 12,
  macdSlow: 26,
  macdSig: 9,
  adxPeriod: 10,
  emaFast: 7,
  emaSlow: 15,
  obvTh: 0,
  baseScoreTh: 2.0,

  // Smart Filters
  flatAtrTh: 0.005,        // 0.5 %
  sessionStart: 2,         // 02 UTC
  sessionEnd: 6,           // 06 UTC
  htfTimeframe: '1d',
  minCandleRangeMult: 0.5, // * ATR

  // Pyramiding / TP-SL
  pyramidMaxEntries: 3,
  atrStopMult: 1.3,
  tp1Mult: 1.5,
  tp2Mult: 3.0,
  tp3Mult: 5.0,
  moveToBEafterTP1: true,
  useDynamicTP3: false,

  // Dashboard
  dashboardPos: 'top-right',
  dashboardTextSize: 'normal',
  showNextSignalWidget: true,

  // MTF
  mtfFrames: ['15m', '1h', '4h', '1d'],
  mtfCacheTTL: 60_000
};