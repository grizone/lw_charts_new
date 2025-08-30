// Глобальные константы
export const TZ_OFFSET = new Date().getTimezoneOffset() * -60; // секунды

export const CHART_OPTIONS = {
  autoSize: true,
  layout: {
    background: { type: 'solid', color: getComputedStyle(document.documentElement).getPropertyValue('--bg-1').trim() },
    textColor: getComputedStyle(document.documentElement).getPropertyValue('--text-1').trim(),
    fontSize: 10,
    fontFamily: getComputedStyle(document.body).fontFamily,
  },
  grid: {
    vertLines: { color: getComputedStyle(document.documentElement).getPropertyValue('--grid').trim() },
    horzLines: { color: getComputedStyle(document.documentElement).getPropertyValue('--grid').trim() },
  },
  rightPriceScale: {
    borderVisible: true,
    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border').trim(),
    scaleMargins: { top: 0.15, bottom: 0.10 },
    mode: 1,
  },
  timeScale: {
    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border').trim(),
    rightOffset: 8,
    barSpacing: 8,
    fixLeftEdge: false,
    lockVisibleTimeRangeOnResize: true,
    timeVisible: true,
    secondsVisible: false,
  },
  crosshair: {
    mode: 1,
    vertLine: { color: '#758696', width: 1, style: 3, labelBackgroundColor: '#263241' },
    horzLine: { color: '#758696', width: 1, style: 3, labelBackgroundColor: '#263241' },
  }
};

export const CANDLE_OPTIONS = {
  upColor: getComputedStyle(document.documentElement).getPropertyValue('--up').trim(),
  borderUpColor: getComputedStyle(document.documentElement).getPropertyValue('--up').trim(),
  wickUpColor: getComputedStyle(document.documentElement).getPropertyValue('--up').trim(),
  downColor: getComputedStyle(document.documentElement).getPropertyValue('--down').trim(),
  borderDownColor: getComputedStyle(document.documentElement).getPropertyValue('--down').trim(),
  wickDownColor: getComputedStyle(document.documentElement).getPropertyValue('--down').trim(),
  priceLineVisible: true,
  lastValueVisible: true,
};

export const VOLUME_OPTIONS = {
  priceScaleId: '',
  priceFormat: { type: 'volume' },
  color: 'rgba(118,130,153,.4)',
  scaleMargins: { top: 0.6, bottom: 0 },
  priceLineVisible: false,
};

export const TIMEFRAME_MAP = {
  '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
  '1h': '1h', '4h': '4h',
  '1D': '1d', '1W': '1w', '1M': '1M',
  'All': '1M',
};