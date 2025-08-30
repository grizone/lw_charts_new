// purple-cloud.js
import { calculatePurpleCloudIndicator, smma } from './indicators.js';

// --- Настройки по умолчанию для индикатора ---
const DEFAULT_INDICATOR_OPTIONS = {
    atrPeriod: 10,
    factor: 3.0,
    x1: 21,
    alpha: 0.3,
    bpt: 0.1,
    spt: 0.1,
    ema100Enabled: true,
    ema50Enabled: false,
    ema20Enabled: false,
    smmaLength: 150
};

// --- Глобальные переменные для управления состоянием индикатора ---
let smmaSeries = null;
let lastProcessedDataHash = null;

/**
 * Вычисляет хэш данных свечей для определения, изменились ли они.
 * @param {Array} data - Массив данных свечей.
 * @returns {string} - Хэш данных.
 */
function hashCandleData(data) {
    if (!data || data.length === 0) return "";
    const samplePoints = [
        data[0]?.time, data[0]?.open, data[0]?.close,
        data[Math.floor(data.length / 2)]?.time, data[Math.floor(data.length / 2)]?.close,
        data[data.length - 1]?.time, data[data.length - 1]?.close,
        data.length
    ].join('|');
    let hash = 0;
    for (let i = 0; i < samplePoints.length; i++) {
        const char = samplePoints.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString();
}

/**
 * Обновляет индикатор Purple Cloud и SMMA на графике.
 */
function updatePurpleCloudIndicator(chart, candleSeries_unused, candleData) {
    if (!chart || !candleData || candleData.length === 0) {
        console.warn("updatePurpleCloudIndicator: Missing chart or data. Skipping update.");
        return;
    }
    
    if (typeof window.candleSeries === 'undefined' || window.candleSeries === null) {
        console.error("Global window.candleSeries is not defined or is null. Cannot set markers.");
        return;
    }
    const targetCandleSeries = window.candleSeries;
    
    const currentDataHash = hashCandleData(candleData);
    if (currentDataHash === lastProcessedDataHash) {
        console.log("updatePurpleCloudIndicator: Data has not changed. Skipping update.");
        return;
    }
    lastProcessedDataHash = currentDataHash;
    
    // Удаление предыдущих элементов
    if (smmaSeries) {
        try {
            chart.removeSeries(smmaSeries);
            console.log("Removed previous SMMA series");
        } catch (e) {
            console.warn("Error removing previous SMMA series:", e);
        }
        smmaSeries = null;
    }
    
    try {
        if (typeof targetCandleSeries.setMarkers === 'function') {
            targetCandleSeries.setMarkers([]);
            console.log("Cleared previous signal markers");
        } else {
            console.error("targetCandleSeries.setMarkers is not a function!", targetCandleSeries);
        }
    } catch (e) {
        console.warn("Error clearing previous signal markers:", e);
    }
    
    // Расчет индикатора
    let indicatorResult;
    try {
        indicatorResult = calculatePurpleCloudIndicator(candleData, DEFAULT_INDICATOR_OPTIONS);
        console.log(`Calculated Purple Cloud Indicator. Found ${indicatorResult.signals.length} signals.`);
    } catch (e) {
        console.error("Error calculating Purple Cloud Indicator:", e);
        return;
    }
    
    // Добавление SMMA(150) на график
    if (DEFAULT_INDICATOR_OPTIONS.smmaLength > 0) {
        try {
            //import { sma } from './indicators.js';
            const closePrices = candleData.map(d => d.close);
            const smmaData = smma(closePrices, DEFAULT_INDICATOR_OPTIONS.smmaLength);
            
            const smmaChartData = smmaData.map((value, index) => {
                if (isNaN(value)) {
                    return null;
                }
                return {
                    time: candleData[index].time,
                    value: value
                };
            }).filter(item => item !== null);

            smmaSeries = chart.addLineSeries({
                color: '#673AB7',
                lineWidth: 1,
                title: 'SMMA 150'
            });
            smmaSeries.setData(smmaChartData);
            console.log(`Added SMMA(${DEFAULT_INDICATOR_OPTIONS.smmaLength}) series with ${smmaChartData.length} points.`);
        } catch (e) {
            console.error(`Error adding SMMA(${DEFAULT_INDICATOR_OPTIONS.smmaLength}) series:`, e);
        }
    }
    
    // Добавление маркеров сигналов
    if (indicatorResult.signals && indicatorResult.signals.length > 0) {
        try {
            const markers = indicatorResult.signals.map(signal => {
                let position;
                if (signal.type === 'buy') {
                    position = 'belowBar';
                } else if (signal.type === 'sell') {
                    position = 'aboveBar';
                } else {
                    position = 'inBar';
                }
                
                const color = signal.type === 'buy' ? '#26a69a' : '#ef5350';

                let shape, text;
                if (signal.isStrong) {
                    shape = signal.type === 'buy' ? 'arrowUp' : 'arrowDown';
                    text = signal.type === 'buy' ? '🚀' : '☄️';
                } else {
                    shape = 'circle';
                    text = signal.type === 'buy' ? 'B' : 'S';
                }

                return {
                    time: signal.time,
                    position: position,
                    color: color,
                    shape: shape,
                    text: text
                };
            });
            
            if (typeof targetCandleSeries.setMarkers === 'function') {
                targetCandleSeries.setMarkers(markers);
                console.log(`Set ${markers.length} signal markers on candlestick series.`);
            } else {
                console.error("Cannot set markers: targetCandleSeries.setMarkers is not a function.", targetCandleSeries);
            }
        } catch (e) {
            console.error("Error setting signal markers:", e);
        }
    } else {
        console.log("No signals to display.");
    }

    console.log("updatePurpleCloudIndicator finished.");
}

// Экспорт функции
export { updatePurpleCloudIndicator };