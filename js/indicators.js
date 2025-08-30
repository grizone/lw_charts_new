// indicators.js

// --- Вспомогательные функции ---

/**
 * Рассчитывает Simple Moving Average (SMA).
 * @param {number[]} data - Массив значений.
 * @param {number} period - Период SMA.
 * @returns {number[]} - Массив значений SMA. Первые period-1 значений будут NaN.
 */
function sma(data, period) {
    const result = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            result.push(NaN);
            continue;
        }
        const slice = data.slice(i - period + 1, i + 1);
        const sum = slice.reduce((a, b) => a + b, 0);
        result.push(sum / period);
    }
    return result;
}

/**
 * Рассчитывает Volume Weighted Moving Average (VWMA).
 * @param {number[]} values - Массив значений (например, цены).
 * @param {number[]} volumes - Массив объемов.
 * @param {number} period - Период VWMA.
 * @returns {number[]} - Массив значений VWMA. Первые period-1 значений будут NaN.
 */
function vwma(values, volumes, period) {
    const result = [];
    for (let i = 0; i < values.length; i++) {
        if (i < period - 1) {
            result.push(NaN);
            continue;
        }
        let sumValues = 0;
        let sumVolumes = 0;
        for (let j = 0; j < period; j++) {
            const idx = i - period + 1 + j;
            sumValues += values[idx] * volumes[idx];
            sumVolumes += volumes[idx];
        }
        result.push(sumVolumes !== 0 ? sumValues / sumVolumes : NaN);
    }
    return result;
}

/**
 * Рассчитывает Exponential Moving Average (EMA).
 * @param {number[]} data - Массив значений.
 * @param {number} period - Период EMA.
 * @returns {number[]} - Массив значений EMA. Первые period-1 значений будут NaN.
 */
function ema(data, period) {
    const result = [];
    const k = 2 / (period + 1);
    // Первое значение SMA
    let sum = 0;
    for (let i = 0; i < Math.min(period, data.length); i++) {
        sum += data[i];
    }
    if (data.length >= period) {
        result.push(sum / period);
    }
    // EMA для остальных значений
    for (let i = period; i < data.length; i++) {
        const emaValue = data[i] * k + result[result.length - 1] * (1 - k);
        result.push(emaValue);
    }
    // Заполняем начальные значения NaN
    while (result.length < data.length) {
        result.unshift(NaN);
    }
    return result;
}

/**
 * Рассчитывает Average True Range (ATR).
 * @param {number[]} high - Массив максимальных цен.
 * @param {number[]} low - Массив минимальных цен.
 * @param {number[]} close - Массив цен закрытия.
 * @param {number} period - Период ATR.
 * @returns {number[]} - Массив значений ATR. Первые period значений будут NaN.
 */
function atr(high, low, close, period) {
    const tr = [];
    for (let i = 0; i < high.length; i++) {
        if (i === 0) {
            tr.push(high[i] - low[i]);
        } else {
            const tr1 = high[i] - low[i];
            const tr2 = Math.abs(high[i] - close[i - 1]);
            const tr3 = Math.abs(low[i] - close[i - 1]);
            tr.push(Math.max(tr1, tr2, tr3));
        }
    }
    // SMA для ATR
    return sma(tr, period);
}

/**
 * Рассчитывает Smoothed Moving Average (SMMA).
 * @param {number[]} data - Массив значений (например, цены закрытия).
 * @param {number} period - Период SMMA.
 * @returns {number[]} - Массив значений SMMA. Первые period-1 значений будут NaN.
 */
function smma(data, period) {
    const result = [];
    if (!data || data.length === 0 || period <= 0) {
        console.warn("smma: Invalid input data or period");
        return result;
    }

    // Первое значение SMMA - это SMA
    let sum = 0;
    for (let i = 0; i < Math.min(period, data.length); i++) {
        sum += data[i];
    }
    if (data.length >= period) {
        result.push(sum / period);
    } else {
        result.push(NaN);
    }

    // SMMA для остальных значений
    for (let i = period; i < data.length; i++) {
        const smmaValue = (result[result.length - 1] * (period - 1) + data[i]) / period;
        result.push(smmaValue);
    }

    // Заполняем начальные значения NaN, если данных было меньше, чем period
    while (result.length < data.length) {
        result.unshift(NaN);
    }

    return result;
}

// --- Основная функция расчета индикатора ---

/**
 * Рассчитывает индикатор Purple Cloud [MMD] и SMMA.
 * @param {Array} data - Массив данных свечей в формате { time, open, high, low, close, volume }.
 * @param {Object} options - Объект с настройками индикатора.
 * @param {number} options.atrPeriod - Период ATR для Supertrend.
 * @param {number} options.factor - Фактор Supertrend.
 * @param {number} options.x1 - Основной период индикатора.
 * @param {number} options.alpha - Альфа-параметр.
 * @param {number} options.bpt - Порог покупки (Buying Pressure Threshold %).
 * @param {number} options.spt - Порог продажи (Selling Pressure Threshold %).
 * @param {number} options.smmaLength - Период SMMA (по умолчанию 150).
 * @returns {Object} - Объект с сигналами и данными SMMA.
 */
function calculatePurpleCloudIndicator(data, options = {}) {
    const {
        atrPeriod = 10,
        factor = 3.0,
        x1 = 14,
        alpha = 0.7,
        bpt = 1.4,
        spt = 1.4,
        smmaLength = 150 // Новый параметр для SMMA
    } = options;

    if (data.length === 0) return { signals: [], smma: [] };

    // Извлекаем данные
    const high = data.map(d => d.high);
    const low = data.map(d => d.low);
    const close = data.map(d => d.close);
    const volume = data.map(d => d.volume || 1);
    const time = data.map(d => d.time);

    // --- Расчет Supertrend ---
    function calculateSupertrend(high, low, close, atrPeriod, factor) {
        const atrValues = atr(high, low, close, atrPeriod);
        const supertrend = [];
        const direction = [];
        let prevSupertrend = 0;
        let prevDirection = 1; // 1 = вверх, -1 = вниз
        for (let i = 0; i < close.length; i++) {
            if (i < atrPeriod) {
                supertrend.push(NaN);
                direction.push(0);
                continue;
            }
            const hl2 = (high[i] + low[i]) / 2;
            const atrValue = atrValues[i] || 0;
            // Базовые линии
            const upperBand = hl2 + (factor * atrValue);
            const lowerBand = hl2 - (factor * atrValue);
            // Основные линии Supertrend
            const finalUpperBand = (upperBand < prevSupertrend || close[i - 1] > prevSupertrend) ? upperBand : prevSupertrend;
            const finalLowerBand = (lowerBand > prevSupertrend || close[i - 1] < prevSupertrend) ? lowerBand : prevSupertrend;
            // Направление
            let currentDirection = prevDirection;
            if (prevDirection === 1 && close[i] < finalUpperBand) {
                currentDirection = -1;
            } else if (prevDirection === -1 && close[i] > finalLowerBand) {
                currentDirection = 1;
            }
            // Финальное значение Supertrend
            const currentSupertrend = currentDirection === 1 ? finalLowerBand : finalUpperBand;
            supertrend.push(currentSupertrend);
            direction.push(currentDirection);
            prevSupertrend = currentSupertrend;
            prevDirection = currentDirection;
        }
        return { supertrend, direction };
    }

    const { supertrend, direction } = calculateSupertrend(high, low, close, atrPeriod, factor);

    // --- Расчет компонентов Purple Cloud ---
    const atrValues = atr(high, low, close, x1);
    const x2 = atrValues.map(val => val * alpha);
    const xh = close.map((c, i) => c + (x2[i] || 0));
    const xl = close.map((c, i) => c - (x2[i] || 0));

    const hl2 = high.map((h, i) => (h + low[i]) / 2);
    const hl2Volume = hl2.map((val, i) => val * volume[i]);
    const ceilX1_4 = Math.ceil(x1 / 4);
    const ceilX1_2 = Math.ceil(x1 / 2);

    const a1 = [];
    const a2 = [];
    const a4 = [];

    for (let i = 0; i < close.length; i++) {
        if (i < ceilX1_4 - 1 || i < ceilX1_2 - 1) {
            a1.push(NaN);
            a2.push(NaN);
            a4.push(NaN);
            continue;
        }
        // a1 calculation
        const vwma1 = vwma(hl2Volume.slice(0, i + 1), volume.slice(0, i + 1), ceilX1_4);
        const vwmaVol1 = vwma(volume.slice(0, i + 1), volume.slice(0, i + 1), ceilX1_4);
        const a1Val = vwmaVol1[vwmaVol1.length - 1] !== 0 ? vwma1[vwma1.length - 1] / vwmaVol1[vwmaVol1.length - 1] : NaN;
        a1.push(a1Val);
        // a2 calculation
        const vwma2 = vwma(hl2Volume.slice(0, i + 1), volume.slice(0, i + 1), ceilX1_2);
        const vwmaVol2 = vwma(volume.slice(0, i + 1), volume.slice(0, i + 1), ceilX1_2);
        const a2Val = vwmaVol2[vwmaVol2.length - 1] !== 0 ? vwma2[vwma2.length - 1] / vwmaVol2[vwmaVol2.length - 1] : NaN;
        a2.push(a2Val);
    }

    // a3 calculation
    const a3 = a1.map((val, i) => isNaN(val) || isNaN(a2[i]) ? NaN : 2 * val - a2[i]);

    // a4 calculation (VWMA of a3)
    for (let i = 0; i < a3.length; i++) {
        if (i < x1 - 1) {
            a4.push(NaN);
            continue;
        }
        const slice = a3.slice(i - x1 + 1, i + 1);
        const volSlice = volume.slice(i - x1 + 1, i + 1);
        let sumValues = 0;
        let sumVolumes = 0;
        for (let j = 0; j < slice.length; j++) {
            sumValues += slice[j] * volSlice[j];
            sumVolumes += volSlice[j];
        }
        a4.push(sumVolumes !== 0 ? sumValues / sumVolumes : NaN);
    }

    // Расчет b1 (сглаженное значение close) - используем логику SMMA
    const b1 = [];
    for (let i = 0; i < close.length; i++) {
        if (i === 0) {
            // Первое значение - SMA
            if (i >= x1 - 1) {
                const slice = close.slice(0, x1);
                const sum = slice.reduce((a, b) => a + b, 0);
                b1.push(sum / x1);
            } else {
                b1.push(NaN);
            }
        } else {
            if (isNaN(b1[i - 1])) {
                // Если предыдущее значение NaN, используем SMA
                if (i >= x1 - 1) {
                    const slice = close.slice(i - x1 + 1, i + 1);
                    const sum = slice.reduce((a, b) => a + b, 0);
                    b1.push(sum / x1);
                } else {
                    b1.push(NaN);
                }
            } else {
                // Сглаженное значение
                b1.push((b1[i - 1] * (x1 - 1) + close[i]) / x1);
            }
        }
    }

    // Расчет a5
    const a5 = a4.map((val, i) => {
        if (isNaN(val) || isNaN(b1[i]) || (val + b1[i]) === 0) {
            return NaN;
        }
        return (2 * val * b1[i]) / (val + b1[i]);
    });

    // Расчет сигналов
    const buy = [];
    const sell = [];
    const xs = [];
    for (let i = 0; i < close.length; i++) {
        const buyCondition = a5[i] <= xl[i] && close[i] > b1[i] * (1 + bpt * 0.01);
        const sellCondition = a5[i] >= xh[i] && close[i] < b1[i] * (1 - spt * 0.01);
        buy.push(buyCondition);
        sell.push(sellCondition);
        if (i === 0) {
            xs.push(buyCondition ? 1 : sellCondition ? -1 : 0);
        } else {
            xs.push(buyCondition ? 1 : sellCondition ? -1 : xs[i - 1]);
        }
    }

    // Определение сигналов для отображения
    const signals = [];
    for (let i = 0; i < close.length; i++) {
        const xsChanged = i === 0 || xs[i] !== xs[i - 1];
        const supertrendDirection = direction[i] || 0;
        if (buy[i] && xsChanged) {
            signals.push({
                time: time[i],
                price: low[i],
                type: 'buy',
                isStrong: supertrendDirection < 0
            });
        } else if (sell[i] && xsChanged) {
            signals.push({
                time: time[i],
                price: high[i],
                type: 'sell',
                isStrong: supertrendDirection > 0
            });
        }
    }

    // --- Расчет SMMA ---
    let smmaData = [];
    if (smmaLength > 0) {
        const smmaValues = smma(close, smmaLength);
        smmaData = smmaValues.map((value, index) => ({
            time: time[index],
            value: value
        })).filter(item => !isNaN(item.value));
    }

    return {
        signals,
        smma: smmaData
    };
}

// Только export для ES6 модулей
export { sma, vwma, ema, atr, smma, calculatePurpleCloudIndicator };

console.log("indicators.js loaded.");