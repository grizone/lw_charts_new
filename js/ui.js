import { css, rgba, fmt } from './utils.js';

export function bindUIEvents(chart, candleSeries, volumeSeries) {
  // Full-screen
  document.getElementById('fsBtn').addEventListener('click', () => {
    !document.fullscreenElement
      ? document.documentElement.requestFullscreen?.()
      : document.exitFullscreen?.();
  });

  // Theme
  document.getElementById('themeToggle').addEventListener('click', () => {
    const light = document.body.classList.toggle('light');
    const root = document.documentElement.style;
    if (light) {
      root.setProperty('--bg-1', '#ffffff');
      root.setProperty('--panel', '#f6f8fa');
      root.setProperty('--text-1', '#111827');
      root.setProperty('--grid', '#e5e7eb');
      root.setProperty('--border', '#e5e7eb');
    } else {
      root.removeProperty('--bg-1'); root.removeProperty('--panel'); root.removeProperty('--text-1');
      root.removeProperty('--grid'); root.removeProperty('--border');
    }
    chart.applyOptions({
      layout: { background: { color: css('--bg-1') }, textColor: css('--text-1') },
      grid: { vertLines: { color: css('--grid') }, horzLines: { color: css('--grid') } },
      rightPriceScale: { borderColor: css('--border') },
      timeScale: { borderColor: css('--border') },
    });
  });

  // Scale toggle
  document.getElementById('scaleToggle').addEventListener('click', () => {
    const opts = chart.options().rightPriceScale;
    const newMode = opts.mode === 1 ? 0 : 1;
    chart.applyOptions({ rightPriceScale: { mode: newMode } });
    document.getElementById('scaleToggle').textContent = newMode === 1 ? 'Лог' : 'Лин';
  });

  // Tabs
  document.querySelectorAll('.tab').forEach(t =>
    t.addEventListener('click', async () => {
      const tf = t.dataset.res;
      document.querySelector('.tab.active')?.classList.remove('active');
      t.classList.add('active');
      document.getElementById('res').textContent = tf;
      const { loadDataForSelectedSymbolAndTimeframe } = await import('./api.js');
      loadDataForSelectedSymbolAndTimeframe(tf);
    })
  );

  // Clock
  setInterval(() => {
    document.getElementById('server').textContent =
      new Date().toLocaleTimeString('ru-RU', { hour12: false });
  }, 1000);

  // Crosshair
  const ohlc = document.getElementById('ohlc');
  const tooltip = document.getElementById('tooltip');
  const pos = document.getElementById('pos');
  chart.subscribeCrosshairMove(p => {
    if (!p.point || !p.time ||
        p.point.x < 0 || p.point.x > document.getElementById('chart').clientWidth ||
        p.point.y < 0 || p.point.y > document.getElementById('chart').clientHeight) {
      tooltip.style.display = 'none'; pos.textContent = '—'; return;
    }
    const c = p.seriesData.get(candleSeries);
    if (!c) return;
    const tstr = new Date(p.time * 1000).toLocaleString('ru-RU');
    ohlc.innerHTML =
      `O ${fmt(c.open)} H ${fmt(c.high)} L ${fmt(c.low)} C <b style="color:${c.close >= c.open ? css('--up') : css('--down')}">${fmt(c.close)}</b>`;
    tooltip.innerHTML =
      `<b>${tstr}</b><br>O ${fmt(c.open)}&nbsp;&nbsp;H ${fmt(c.high)}&nbsp;&nbsp;L ${fmt(c.low)}&nbsp;&nbsp;C <b style="color:${c.close >= c.open ? css('--up') : css('--down')}">${fmt(c.close)}</b>`;
    tooltip.style.display = 'block';
    pos.textContent = `${fmt(c.close)} @ ${tstr}`;
  });
}