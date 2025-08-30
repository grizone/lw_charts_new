// js/dashboard.js
// Расширенный дашборд с JSON-настройками и модальным окном
// Ищи «// ►» чтобы отключить нужный блок

import { configEnh as defaultCfg } from './configEnh.js';

// ===================================================================
// 0. Глобальные ссылки
// ===================================================================
let modal;            // DOM-модальное окно
let cfg = { ...defaultCfg }; // текущий конфиг (читаем/пишем в localStorage)

// ===================================================================
// 1. Загрузка / сохранение конфига
// ===================================================================
const STORAGE_KEY = 'alexGraphCfg';

// ► Чтобы отключить сохранение – закомментируй две строки ниже
cfg = { ...defaultCfg, ...(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')) };

export function saveConfig() {
  // ► Отключить сохранение – закомментируй строку ниже
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

// ===================================================================
// 2. Создание DOM-модального окна
// ===================================================================
function createModal() {
  // ► Убрать модальное окно – закомментируй весь метод
  modal = document.createElement('div');
  modal.id = 'dashboardModal';
  modal.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-body">
        <button class="close-btn">&times;</button>
        <h3>⚙️ Настройки</h3>
        <form id="cfgForm">
          <label>RSI Period <input name="rsiPeriod" type="number" value="${cfg.rsiPeriod}"></label>
          <label>ATR Stop Multiplier <input name="atrStopMult" type="number" step="0.1" value="${cfg.atrStopMult}"></label>
          <label>Pyramid Max Entries <input name="pyramidMaxEntries" type="number" value="${cfg.pyramidMaxEntries}"></label>
          <!-- ► Добавь/удали любые поля здесь -->
        </form>
        <button id="saveBtn">Сохранить</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // события
  modal.querySelector('.close-btn').onclick = () => modal.style.display = 'none';
  modal.querySelector('#saveBtn').onclick = () => {
    const fd = new FormData(modal.querySelector('#cfgForm'));
    for (const [k, v] of fd.entries()) cfg[k] = isNaN(v) ? v : +v;
    saveConfig();
    modal.style.display = 'none';
    location.reload(); // перезагружаем, чтобы новые настройки применились
  };
  modal.onclick = e => { if (e.target === modal) modal.style.display = 'none'; };
}

// ===================================================================
// 3. Кнопка «⚙️» в дашборде для вызова модалки
// ===================================================================
function addSettingsBtn(container) {
  // ► Отключить кнопку – закомментируй строку ниже
  const btn = document.createElement('button');
  btn.textContent = '⚙️';
  btn.title = 'Настройки';
  btn.style.cssText = 'margin-left:6px;background:transparent;border:none;color:#fff;cursor:pointer';
  btn.onclick = () => modal.style.display = 'flex';
  container.appendChild(btn);
}

// ===================================================================
// 4. Расширенное отображение дашборда
// ===================================================================
export function renderDashboard(data, cfgObj = cfg) {
  // ► Чтобы полностью отключить дашборд – раскомментируй return
  // return;

  // контейнер (создаём один раз)
  let el = document.getElementById('dashboard');
  if (!el) {
    el = document.createElement('div');
    el.id = 'dashboard';
    el.style.cssText = `
      position:absolute;top:8px;right:8px;
      background:rgba(0,0,0,.8);color:#fff;
      font-size:12px;padding:6px 8px;border-radius:4px;z-index:10;
      max-width:160px;line-height:1.4;
    `;
    document.querySelector('.main').appendChild(el);
    createModal();
    addSettingsBtn(el);
  }

  // берём актуальные данные из глобального кэша
  const { longScore = 0, shortScore = 0, dynScoreTh = 2 } = window.lastMiResult || {};
  const { allowLong = false, allowShort = false, flatMarket = false, htfEMA = NaN } = window.lastFilterResult || {};

  const scorePct = Math.round((Math.max(longScore, shortScore) / dynScoreTh) * 100);
  const nextSignal =
    allowLong && longScore >= dynScoreTh ? 'LONG' :
    allowShort && shortScore >= dynScoreTh ? 'SHORT' : 'WAIT';

  // ► Можно убрать любую строку, закомментировав её в шаблоне
  el.innerHTML = `
    <div><b>Score</b> ${scorePct}%</div>
    <div><b>Flat</b> ${flatMarket ? 'YES' : 'NO'}</div>
    <div><b>HTF 200EMA</b> ${htfEMA ? htfEMA.toFixed(2) : '—'}</div>
    <div><b>Next</b> ${nextSignal}</div>
  `;
}