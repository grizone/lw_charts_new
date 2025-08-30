// js/smartFilters.js
import { atr } from './indicators.js';
import { requestMTF } from './mtfWorker.js';

/**
 * Возвращает объект { allowLong, allowShort, flatMarket, riskHour, htfEMA, strongCandle }
 * Всё рассчитывается на последнем баре.
 */
export async function applySmartFilters(candles, cfg) {
  const highs  = candles.map(c => c.high);
  const lows   = candles.map(c => c.low);
  const closes = candles.map(c => c.close);

  const last = candles.length - 1;
  const atr14 = atr(highs, lows, closes, 14)[last];
  const price = closes[last];

  // 1.1 Skip-Flat
  const flatMarket = atr14 / price < cfg.flatAtrTh;

  // 1.2 Session Hard Block (UTC)
  const utcHour = new Date().getUTCHours();
  const riskHour = utcHour >= cfg.sessionStart && utcHour <= cfg.sessionEnd;

  // 1.3 HTF 200-EMA (1d) – асинхронно
  const htfEMA = await requestMTF(cfg.htfTimeframe, 'ema', closes, 200);

  const trendUp   = price > htfEMA;
  const trendDown = price < htfEMA;

  // 1.4 Strong-candle filter
  const candleRange = highs[last] - lows[last];
  const minRange    = atr14 * cfg.minCandleRangeMult;

  const bullishEngulf =
    closes[last] > candles[last].open &&
    candles[last - 1]?.close < candles[last - 1]?.open &&
    closes[last] > candles[last - 1]?.open;

  const bearishEngulf =
    closes[last] < candles[last].open &&
    candles[last - 1]?.close > candles[last - 1]?.open &&
    closes[last] < candles[last - 1]?.open;

  const insideBar =
    highs[last] <= highs[last - 1] && lows[last] >= lows[last - 1];

  const strongCandle =
    !insideBar && candleRange >= minRange &&
    (bullishEngulf || bearishEngulf);

  return {
    allowLong:  !flatMarket && !riskHour && trendUp   && strongCandle,
    allowShort: !flatMarket && !riskHour && trendDown && strongCandle,
    flatMarket,
    riskHour,
    htfEMA,
    strongCandle
  };
}