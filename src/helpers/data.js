// helpers/data.js

// monthOrder para determinar cuál es el último mes y para selects
export const monthOrder = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Convierte cada objeto crudo de dataToShow a la forma interna de fila de grilla.
 * Incluye idPrevYear e idCurrentYear, además de datosPrevios y datosActuales.
 * @param {Array} rawRows - arreglo de objetos con propiedades tal cual devuelve el SP:
 *   CompanyTypeId, CompanyName, CompanyTypeName, Period,
 *   IdPrevYear, UnitPrevYear, AvgPricePrevYear, ValueUSDPrevYear, TCPrevYear,
 *   IdCurrentYear, UnitCurrentYear, AvgPriceCurrentYear, ValueUSDCurrentYear, TCCurrentYear
 * @returns {Array} filas transformadas con:
 *   {
 *     representacion: string,
 *     mes: string,
 *     idPrevYear: number,
 *     idCurrentYear: number,
 *     datosAnioAnterior: { id: number, unidades: number, precio: number, usd: number, tc: number },
 *     datosAnioActual:   { id: number, unidades: number, precio: number, usd: number, tc: number },
 *     variacion:         { total: number, vol: number, precio: number }
 *   }
 */
export function transformToGridRows(rawRows) {
    return rawRows.map(item => {
        // Representación: usar CompanyTypeName
        const representacion = item.CompanyTypeName;
        // Mes: usar Period
        const mes = item.Period;

        // IDs (pueden venir como string o number)
        const idPrev = Number(item.IdPrevYear) || 0;
        const idCurr = Number(item.IdCurrentYear) || 0;

        // Valores previos
        const unidadesPrev = Number(item.UnitPrevYear) || 0;
        const precioPrev = Number(item.AvgPricePrevYear) || 0;
        const usdPrev = Number(item.ValueUSDPrevYear) || 0;
        const tcPrev = Number(item.TCPrevYear) || 0;

        // Valores actuales
        const unidadesCurr = Number(item.UnitCurrentYear) || 0;
        const precioCurr = Number(item.AvgPriceCurrentYear) || 0;
        const usdCurr = Number(item.ValueUSDCurrentYear) || 0;
        const tcCurr = Number(item.TCCurrentYear) || 0;

        // Cálculo de variaciones porcentuales:
        let totalPct = 0;
        if (usdPrev !== 0) {
            totalPct = ((usdCurr - usdPrev) / usdPrev) * 100;
        } else if (usdPrev === 0 && usdCurr !== 0) {
            totalPct = 100;
        }
        let volPct = 0;
        if (unidadesPrev !== 0) {
            volPct = ((unidadesCurr - unidadesPrev) / unidadesPrev) * 100;
        } else if (unidadesPrev === 0 && unidadesCurr !== 0) {
            volPct = 100;
        }
        let precioPct = 0;
        if (precioPrev !== 0) {
            precioPct = (((((precioPrev / 100) + 1)) / ((precioCurr / 100) + 1)) - 1) * 100;
        } else if (precioPrev === 0 && precioCurr !== 0) {
            precioPct = 100;
        }

        return {
            representacion,
            mes,
            idPrevYear: idPrev,
            idCurrentYear: idCurr,
            datosAnioAnterior: {
                id: idPrev,
                unidades: unidadesPrev,
                precio: precioPrev,
                usd: usdPrev,
                tc: tcPrev
            },
            datosAnioActual: {
                id: idCurr,
                unidades: unidadesCurr,
                precio: precioCurr,
                usd: usdCurr,
                tc: tcCurr
            },
            variacion: {
                total: totalPct,
                vol: volPct,
                precio: precioPct
            }
        };
    });
}

/**
 * Calcula totales de todas las filas tal cual vienen en processedRows.
 * Suma unidades, USD, y promedia precios y TC de forma simple (sumar y dividir por cantidad de filas).
 * Luego calcula variaciones porcentuales de totales basadas en USD total, unidades total y precio promedio total.
 * @param {Array} rows - filas resultantes de transformToGridRows, con datos numéricos
 * @returns {Object} totales con la misma forma que espera el componente:
 *   {
 *     datosAnioAnterior: { unidades, precio, usd, tc },
 *     datosAnioActual:   { unidades, precio, usd, tc },
 *     variacion:         { total, vol, precio }
 *   }
 */
export function calculateTotals(rows) {
    let sumUnidadesPrev = 0;
    let sumUsdPrev = 0;
    let sumPrecioPrev = 0;
    let sumTcPrev = 0;

    let sumUnidadesCurr = 0;
    let sumUsdCurr = 0;
    let sumPrecioCurr = 0;
    let sumTcCurr = 0;

    const count = rows.length;

    rows.forEach(row => {
        const prev = row.datosAnioAnterior;
        sumUnidadesPrev += prev.unidades;
        sumUsdPrev += prev.usd;
        sumPrecioPrev += prev.precio;
        sumTcPrev += prev.tc;

        const curr = row.datosAnioActual;
        sumUnidadesCurr += curr.unidades;
        sumUsdCurr += curr.usd;
        sumPrecioCurr += curr.precio;
        sumTcCurr += curr.tc;
    });

    const avgPrecioPrev = count > 0 ? sumPrecioPrev / count : 0;
    const avgTcPrev = count > 0 ? sumTcPrev / count : 0;
    const avgPrecioCurr = count > 0 ? sumPrecioCurr / count : 0;
    const avgTcCurr = count > 0 ? sumTcCurr / count : 0;

    let totalPct = 0;
    if (sumUsdPrev !== 0) {
        totalPct = ((sumUsdCurr - sumUsdPrev) / sumUsdPrev) * 100;
    } else if (sumUsdPrev === 0 && sumUsdCurr !== 0) {
        totalPct = 100;
    }
    let volPct = 0;
    if (sumUnidadesPrev !== 0) {
        volPct = ((sumUnidadesCurr - sumUnidadesPrev) / sumUnidadesPrev) * 100;
    } else if (sumUnidadesPrev === 0 && sumUnidadesCurr !== 0) {
        volPct = 100;
    }
    let precioPct = 0;
    if (avgPrecioPrev !== 0) {
        precioPct = ((avgPrecioCurr - avgPrecioPrev) / avgPrecioPrev) * 100;
    } else if (avgPrecioPrev === 0 && avgPrecioCurr !== 0) {
        precioPct = 100;
    }

    return {
        datosAnioAnterior: {
            unidades: sumUnidadesPrev,
            precio: avgPrecioPrev,
            usd: sumUsdPrev,
            tc: sumTcPrev
        },
        datosAnioActual: {
            unidades: sumUnidadesCurr,
            precio: avgPrecioCurr,
            usd: sumUsdCurr,
            tc: sumTcCurr
        },
        variacion: {
            total: totalPct,
            vol: volPct,
            precio: precioPct
        }
    };
}

/**
 * Formatea un número o string numérico a formato de miles 'es-AR', e.g. 100000 -> "100.000".
 * Si el valor no es convertible a número, devuelve cadena vacía.
 * @param {number|string} value
 * @returns {string}
 */
export function formatNumber(value) {
    if (value == null || value === '') return '';
    const num = Number(value);
    if (isNaN(num)) return '';
    return num.toLocaleString('es-AR');
}

/**
 * Formatea un número o string numérico a formato con separador de miles y 2 decimales, e.g. 1234.5 -> "1.234,50"
 * @param {number|string} value
 * @param {number} decimals - número de decimales (por defecto 2)
 * @returns {string}
 */
export function formatNumberDecimals(value, decimals = 2) {
    if (value == null || value === '') return '';
    const num = Number(value);
    if (isNaN(num)) return '';
    return num.toLocaleString('es-AR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * Parsea una cadena con separador de miles (p.ej. "100.000") y devuelve número.
 * Elimina puntos. Si falla, devuelve NaN.
 * @param {string} formatted
 * @returns {number}
 */
export function parseNumber(formatted) {
    if (formatted == null) return NaN;
    const raw = String(formatted).replace(/\./g, '');
    return Number(raw);
}
