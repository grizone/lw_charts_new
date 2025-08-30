// js/init.js
// ► Если не нужен воркер – закомментируй две строки ниже
import { requestMTF } from './mtfWorker.js';
window.requestMTF = requestMTF; // делаем глобально, если нужно

import { CHART_OPTIONS, CANDLE_OPTIONS, VOLUME_OPTIONS } from './config.js';
import { autoFullscreen, toggleTimeframeControl } from './utils.js';
import { fetchAndPopulateSymbols, loadDataForSelectedSymbolAndTimeframe } from './api.js';
import { bindUIEvents } from './ui.js';

// 👇 ДОДАЙТЕ ЦІ ДВА РЯДКИ
import { updatePurpleCloudIndicator } from './purple-cloud.js';
window.updatePurpleCloudIndicator = updatePurpleCloudIndicator; // робимо функцію глобальною

//  ↓↓↓ новые модули
import { configEnh } from './configEnh.js';
import { calcMultiIndicator } from './multiIndicator.js';
import { applySmartFilters }   from './smartFilters.js';
import { renderDashboard }     from './dashboard.js';
// ↑↑↑ /новые модули

// глобальные ссылки, которые используют остальные модули
window.chart         = null;
window.candleSeries  = null;
window.volumeSeries  = null;

// кэш последних расчётов для dashboard / фильтров
window.lastMiResult   = null;
window.lastFilterResult = null;

// единая точка ввода данных
window.setData = data => {
  if (!data?.length) return;

  // свечи и объёмы
  window.candleSeries.setData(data);
  window.volumeSeries.setData(
    data.map(b => ({
      time: b.time,
      value: b.volume,
      color: b.close >= b.open
        ? 'rgba(38,166,154,.35)'
        : 'rgba(239,83,80,.35)'
    }))
  );
  window.chart.timeScale().fitContent();

  // P1-расчёты
  window.lastMiResult   = calcMultiIndicator(data, configEnh);
  window.lastFilterResult = applySmartFilters(data, configEnh);

  // обновляем Purple-Cloud (если подключён)
  if (typeof updatePurpleCloudIndicator === 'function') {
    updatePurpleCloudIndicator(window.chart, window.candleSeries, data);
  }

  // обновляем дашборд
  renderDashboard(data, configEnh);
};

// инициализация после DOM
document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('chart');
  window.chart = LightweightCharts.createChart(el, CHART_OPTIONS);

  window.candleSeries = window.chart.addCandlestickSeries(CANDLE_OPTIONS);
  window.volumeSeries = window.chart.addHistogramSeries(VOLUME_OPTIONS);
  window.volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.6, bottom: 0 } });

  bindUIEvents(window.chart, window.candleSeries, window.volumeSeries);
  autoFullscreen();
  toggleTimeframeControl();
  fetchAndPopulateSymbols();
});