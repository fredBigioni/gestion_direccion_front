// helpers/data.js

// monthOrder para determinar cuál es el último mes y para selects
export const monthOrder = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Convierte cada objeto crudo de dataToShow a la forma interna de fila de grilla.
 */
export function transformToGridRows(rawRows) {
    return rawRows.map(item => {
        const representacion = item.CompanyTypeName;
        const mes = item.Period;
        const idPrev = Number(item.IdPrevYear) || 0;
        const idCurr = Number(item.IdCurrentYear) || 0;

        const unidadesPrev = Number(item.UnitPrevYear) || 0;
        const unidadesConvertidasPrev = Number(item.UnitConvertedPrevYear) || 0;
        const precioPrev = Number(item.AvgPricePrevYear) || 0;
        const arsPrev = Number(item.ValueLocalCurrencyPrevYear) || 0;
        const usdPrev = Number(item.ValueUSDPrevYear) || 0;
        const tcPrev = Number(item.TCPrevYear) || 0;

        const unidadesCurr = Number(item.UnitCurrentYear) || 0;
        const unidadesConvertidasCurr = Number(item.UnitConvertedCurrentYear) || 0;
        const precioCurr = Number(item.AvgPriceCurrentYear) || 0;
        const arsCurr = Number(item.ValueLocalCurrencyCurrentYear) || 0;
        const usdCurr = Number(item.ValueUSDCurrentYear) || 0;
        const tcCurr = Number(item.TCCurrentYear) || 0;

        const hasRoleAccess = item.HasRoleAccess || 0;
        const expectedRowStatusId = Number(item.ExpectedRowStatusId ?? 0) || 0;
        // RowStatus del registro del año actual (intentamos cubrir distintos nombres posibles)
        const rowStatusId = Number(
            item.RowStatusIdCurrentYear ??
            item.RowStatusId ??
            item.rowStatusId ??
            item.RowStatus ??
            item.StatusId ??
            0
        ) || 0;

        let totalPct = 0;
        if (usdPrev !== 0) totalPct = ((usdCurr - usdPrev) / usdPrev) * 100;
        else if (usdPrev === 0 && usdCurr !== 0) totalPct = 100;

        let volPct = 0;
        if (unidadesPrev !== 0) volPct = ((unidadesCurr - unidadesPrev) / unidadesPrev) * 100;
        else if (unidadesPrev === 0 && unidadesCurr !== 0) volPct = 100;

        let precioPct = 0;
        if (volPct !== -100) precioPct = (((totalPct / 100 + 1) / (volPct / 100 + 1)) - 1) * 100;

        return {
            representacion,
            mes,
            idPrevYear: idPrev,
            idCurrentYear: idCurr,
            datosAnioAnterior: { id: idPrev, unidades: unidadesPrev, unidadesConvertidas: unidadesConvertidasPrev, precio: precioPrev, monedaLocal: arsPrev, usd: usdPrev, tc: tcPrev },
            datosAnioActual: { id: idCurr, unidades: unidadesCurr, unidadesConvertidas: unidadesConvertidasCurr, precio: precioCurr, monedaLocal: arsCurr, usd: usdCurr, tc: tcCurr },
            variacion: { total: totalPct, vol: volPct, precio: precioPct },
            hasRoleAccess,
            rowStatusId,
            expectedRowStatusId,
        };
    });
}

/**
 * Calcula totales de todas las filas y variaciones.
 */
export function calculateTotals(rows) {
    let sumUnidadesPrev = 0, sumUsdPrev = 0, sumArsPrev = 0;
    let sumUnidadesCurr = 0, sumUsdCurr = 0, sumArsCurr = 0;

    rows.forEach(r => {
        sumUnidadesPrev += r.datosAnioAnterior.unidades;
        sumUsdPrev += r.datosAnioAnterior.usd;
        sumArsPrev += Number(r?.datosAnioAnterior?.monedaLocal) || 0;

        sumUnidadesCurr += r.datosAnioActual.unidades;
        sumUsdCurr += r.datosAnioActual.usd;
        sumArsCurr += Number(r?.datosAnioActual?.monedaLocal) || 0;
    });

    const count = rows.length;
    const avgPrecioPrev = count > 0 ? rows.reduce((acc, r) => acc + r.datosAnioAnterior.precio, 0) / count : 0;
    const avgPrecioCurr = count > 0 ? rows.reduce((acc, r) => acc + r.datosAnioActual.precio, 0) / count : 0;

    let totalPct = 0;
    if (sumUsdPrev !== 0) totalPct = ((sumUsdCurr - sumUsdPrev) / sumUsdPrev) * 100;
    else if (sumUsdPrev === 0 && sumUsdCurr !== 0) totalPct = 100;

    let volPct = 0;
    if (sumUnidadesPrev !== 0) volPct = ((sumUnidadesCurr - sumUnidadesPrev) / sumUnidadesPrev) * 100;
    else if (sumUnidadesPrev === 0 && sumUnidadesCurr !== 0) volPct = 100;

    let precioPct = 0;
    if (volPct !== -100) precioPct = (((totalPct / 100 + 1) / (volPct / 100 + 1)) - 1) * 100;

    // ⬇️ TC compuesto (ponderado por USD)
    const tcPrevComp = getCompositeAverage(rows, { year: 'prev', value: 'tc', weight: 'usd' });
    const tcCurrComp = getCompositeAverage(rows, { year: 'curr', value: 'tc', weight: 'usd' });

    return {
        datosAnioAnterior: { unidades: sumUnidadesPrev, precio: avgPrecioPrev, monedaLocal: sumArsPrev, usd: sumUsdPrev, tc: tcPrevComp },
        datosAnioActual: { unidades: sumUnidadesCurr, precio: avgPrecioCurr, monedaLocal: sumArsCurr, usd: sumUsdCurr, tc: tcCurrComp },
        variacion: { total: totalPct, vol: volPct, precio: precioPct }
    };
}


export function formatNumber(value) {
    if (value == null || value === '') return '';
    const num = Number(value);
    if (isNaN(num)) return '';
    return num.toLocaleString('es-AR');
}

export function formatNumberDecimals(value, decimals = 2) {
    if (value == null || value === '') return '';
    const num = Number(value);
    if (isNaN(num)) return '';
    return num.toLocaleString('es-AR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function parseNumber(formatted) {
    if (formatted == null) return NaN;
    return Number(String(formatted).replace(/\./g, ''));
}

// helpers/data.js

/**
 * Promedio compuesto genérico.
 * Por defecto: value='tc' ponderado por weight='usd'.
 * year: 'prev' | 'curr'  -> mapea a 'datosAnioAnterior' o 'datosAnioActual'.
 */
export function getCompositeAverage(rows, { year = 'prev', value = 'tc', weight = 'usd' } = {}) {
    const key = year === 'prev' ? 'datosAnioAnterior' : 'datosAnioActual';

    let numerador = 0; // sum(value_i * weight_i)
    let denominador = 0; // sum(weight_i)

    for (const r of rows) {
        const v = Number(r?.[key]?.[value]) || 0;
        const w = Number(r?.[key]?.[weight]) || 0;
        if (w > 0) {
            numerador += v * w;
            denominador += w;
        }
    }

    return denominador > 0 ? numerador / denominador : 0;
}
