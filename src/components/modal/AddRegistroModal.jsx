import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    Box,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import useCreateData from '../../hooks/useCreateData';
import useHome from '../../hooks/useHome';
import AttachFileIcon from '@mui/icons-material/AttachFile';

/**
 * Modal para agregar o editar un registro.
 */
export const AddRegistroModal = ({ open, onClose, initialData, onSuccess }) => {
    const { companyTypes } = useHome();
    const isEditMode = Boolean(initialData);
    const { createData, updateData, getPeriodosXRepresentacion } = useCreateData();

    // Estado de formulario
    const [form, setForm] = useState({
        tipo: '',
        periodo: '',
        unidades: '',
        unidadesConvertidas: '',
        valores: '',
        valoresLocal: '',
        promedio: '',
        tc: '',
    });
    // Focus por campo
    const [focus, setFocus] = useState({
        unidades: false,
        unidadesConvertidas: false,
        valoresLocal: false,
        tc: false,
    });
    // Archivos
    const [files, setFiles] = useState([]);
    // Periodos habilitados según tipo
    const [enabledPeriods, setEnabledPeriods] = useState([]);

    const monthOrder = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Cuando cambia la representación, pedimos los periodos habilitados
    useEffect(() => {
        if (!form.tipo) {
            setEnabledPeriods([]);
            return;
        }
        (async () => {
            const periods = await getPeriodosXRepresentacion(form.tipo);
            setEnabledPeriods(periods);
        })();
    }, [form.tipo]);

    // Formatea miles y conserva decimales (según los que el usuario escribió)
    const formatDisplay = raw => {
        if (!raw) return '';
        const [intPart, decPart] = raw.split('.');
        const num = Number(intPart.replace(/\D/g, '')) || 0;
        const formattedInt = num.toLocaleString('es-AR');
        return decPart != null
            ? `${formattedInt}.${decPart}`
            : formattedInt;
    };

    const unidadesNum = parseFloat(form.unidades);
    const valoresLocalNum = parseFloat(form.valoresLocal);
    const tcNum = parseFloat(form.tc);
    const valoresPrevNum = parseFloat(form.valores);

    const hasUnidades = !Number.isNaN(unidadesNum) && unidadesNum > 0;
    const canComputeValores = !Number.isNaN(valoresLocalNum) && !Number.isNaN(tcNum) && tcNum !== 0;

    const valoresUsdRounded = canComputeValores
        ? Math.round(valoresLocalNum / tcNum)
        : Number.NaN;

    const valoresUsdComputedStr = !Number.isNaN(valoresUsdRounded)
        ? valoresUsdRounded.toString()
        : '';

    const valoresUsdForDisplay = valoresUsdComputedStr !== ''
        ? valoresUsdComputedStr
        : (form.valores || '');

    const valoresUsdForAverage = valoresUsdComputedStr !== ''
        ? valoresUsdRounded
        : (!Number.isNaN(valoresPrevNum) ? valoresPrevNum : Number.NaN);

    const canComputePromedio = hasUnidades && !Number.isNaN(valoresUsdForAverage);

    const promedioComputedStr = canComputePromedio
        ? (valoresUsdForAverage / unidadesNum).toFixed(4)
        : '';

    const promedioForDisplay = promedioComputedStr !== ''
        ? promedioComputedStr
        : (form.promedio || '');

    // Inicializa form y files al abrir
    useEffect(() => {
        if (!open) return;

        if (isEditMode) {
            let tipoValue = '';
            if (initialData.representacion != null) {
                const f = companyTypes?.find(ct => ct.name.toLowerCase() === initialData.representacion.toLowerCase());
                tipoValue = f ? f.id : '';
            }
            const periodoValue = initialData.mes || '';
            const unidadesRaw = initialData.datosAnioActual?.unidades?.toString() ?? '';
            const unidadesConvertidasRaw = initialData.datosAnioActual?.unidadesConvertidas?.toString() ?? '';
            const valoresRaw = initialData.datosAnioActual?.usd?.toString() ?? '';
            const valoresLocalRaw = initialData.datosAnioActual?.monedaLocal?.toString() ?? '';
            const promedioRaw = initialData.datosAnioActual?.precio?.toString() ?? '';
            const tcRaw = initialData.datosAnioActual?.tc?.toString() ?? '';

            setForm({
                tipo: tipoValue,
                periodo: periodoValue,
                unidades: unidadesRaw,
                unidadesConvertidas: unidadesConvertidasRaw,
                valores: valoresRaw,
                valoresLocal: valoresLocalRaw,
                promedio: promedioRaw,
                tc: tcRaw,
            });
            setFocus({ unidadesConvertidas: false, unidades: false, valoresLocal: false, tc: false });
        } else {
            setForm({ tipo: '', periodo: '', unidadesConvertidas: '', unidades: '', valores: '', valoresLocal: '', promedio: '', tc: '' });
            setFocus({ unidadesConvertidas: false, unidades: false, valoresLocal: false, tc: false });
        }
        setFiles([]);
    }, [open, initialData, isEditMode, companyTypes]);

    // Manejadores genéricos
    const handleChange = field => e =>
        setForm(f => ({ ...f, [field]: e.target.value }));

    // Acepta dígitos y un punto
    const handleNumericChange = field => e => {
        let value = e.target.value.replace(/[^0-9.]/g, '');
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts.shift() + '.' + parts.join('');
        }
        setForm(f => ({ ...f, [field]: value }));
    };

    const handleFocus = field => () =>
        setFocus(f => ({ ...f, [field]: true }));
    const handleBlur = field => () => {
        setFocus(f => ({ ...f, [field]: false }));

        if (field === 'tc') {
            setForm(prev => {
                const raw = prev.tc;
                if (raw === '') return prev;
                const num = parseFloat(raw);
                if (Number.isNaN(num)) return prev;

                const formatted = Math.round(num).toString();
                if (prev.tc === formatted) {
                    return prev;
                }

                return { ...prev, tc: formatted };
            });
        }
    };

    // Archivos
    const handleFileChange = e => {
        setFiles(Array.from(e.target.files));
    };

    const isFormValid = Boolean(form.tipo && form.periodo
        && String(form.unidades ?? '').trim() !== ''
        && String(form.unidadesConvertidas ?? '').trim() !== ''
        && String(form.valoresLocal ?? '').trim() !== ''
        && String(form.tc ?? '').trim() !== ''
        && valoresUsdForDisplay !== ''
        && promedioForDisplay !== '');

    const handleSave = async () => {
        if (!isFormValid) return;
        const payload = new FormData();
        payload.append('tipo', form.tipo);
        payload.append('periodo', form.periodo);
        payload.append('unidades', form.unidades);
        payload.append('unidadesConvertidas', form.unidadesConvertidas);
        payload.append('valoresLocal', form.valoresLocal);
        payload.append('valores', valoresUsdForDisplay);
        payload.append('promedio', promedioForDisplay);
        payload.append('tc', form.tc);
        files.forEach(file => payload.append('documentos', file));

        try {
            if (isEditMode) {
                const id = initialData.datosAnioActual?.id || initialData.idCurrentYear;
                debugger;
                await updateData(id, payload);
            } else {
                await createData(payload);
            }
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Error al guardar:', error);
        }
    };

    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const fileLabel = files.length > 0
        ? `${files.length} archivo${files.length > 1 ? 's' : ''}`
        : 'Adjuntar archivos';

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen={fullScreen}
            fullWidth
            maxWidth="xs"
            scroll="body"
            PaperProps={{ sx: { borderRadius: 2, boxShadow: 'var(--shadow-md)', maxWidth: 420, width: '100%' } }}
        >
            <DialogTitle sx={{ color: '#1976d2', pt: 1.5, pb: 1.5, mb: 0 }}>
                {isEditMode ? 'Editar Registro' : 'Agregar Registro'}
            </DialogTitle>
            <DialogContent sx={{ px: { xs: 1.5, sm: 2 }, pt: 1, pb: 2 }}>
                <Box sx={{ pt: 1, px: 0, display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
                    {/* Representación */}
                    <FormControl fullWidth size="small">
                        <InputLabel id="tipo-label">Representación</InputLabel>
                        <Select
                            labelId="tipo-label"
                            value={form.tipo}
                            label="Representación"
                            onChange={handleChange('tipo')}
                        >
                            <MenuItem value=""><em>Selecciona</em></MenuItem>
                            {companyTypes && companyTypes?.map(ct =>
                                <MenuItem key={ct.id} value={ct.id}>{ct.name}</MenuItem>
                            )}
                        </Select>
                    </FormControl>

                    {/* Periodo */}
                    <FormControl fullWidth size="small">
                        <InputLabel id="periodo-label">Periodo</InputLabel>
                        <Select
                            labelId="periodo-label"
                            value={form.periodo}
                            label="Periodo"
                            onChange={handleChange('periodo')}
                        >
                            <MenuItem value=""><em>Seleccione un periodo</em></MenuItem>
                            {monthOrder.map(m => (
                                <MenuItem key={m} value={m} disabled={!enabledPeriods.includes(m) && !(isEditMode && m === form.periodo)}>
                                    {m} - {(new Date).getFullYear().toLocaleString()}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Unidades */}
                    <TextField
                        fullWidth size="small"
                        label="Unidades"
                        value={focus.unidades
                            ? form.unidades
                            : formatDisplay(form.unidades)
                        }
                        onChange={handleNumericChange('unidades')}
                        onFocus={handleFocus('unidades')}
                        onBlur={handleBlur('unidades')}
                    />

                    {/* Unidades convertidas*/}
                    <TextField
                        fullWidth size="small"
                        label="Unidades Convertidas"
                        value={focus.unidadesConvertidas
                            ? form.unidadesConvertidas
                            : formatDisplay(form.unidadesConvertidas)
                        }
                        onChange={handleNumericChange('unidadesConvertidas')}
                        onFocus={handleFocus('unidadesConvertidas')}
                        onBlur={handleBlur('unidadesConvertidas')}
                    />

                    <TextField
                        fullWidth size="small"
                        label="Valores En Moneda Local"
                        value={focus.valoresLocal
                            ? form.valoresLocal
                            : formatDisplay(form.valoresLocal)
                        }
                        onChange={handleNumericChange('valoresLocal')}
                        onFocus={handleFocus('valoresLocal')}
                        onBlur={handleBlur('valoresLocal')}
                    />

                    {/* TC USD Promedio */}
                    <TextField
                        fullWidth size="small"
                        label="TC USD Promedio"
                        value={focus.tc
                            ? form.tc
                            : formatDisplay(form.tc)
                        }
                        onChange={handleNumericChange('tc')}
                        onFocus={handleFocus('tc')}
                        onBlur={handleBlur('tc')}
                    />

                    {/* Valores USD */}
                    <TextField
                        fullWidth size="small"
                        label="Valores USD"
                        value={formatDisplay(valoresUsdForDisplay)}
                        disabled
                    />

                    {/* Precio Promedio */}
                    <TextField
                        fullWidth size="small"
                        label="Precio Promedio"
                        value={formatDisplay(promedioForDisplay)}
                        disabled
                    />

                    {/* Archivos */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1, gridColumn: '1' }}>
                        <input
                            accept="*"
                            id="file-input"
                            type="file"
                            multiple
                            name="documentos"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                        <label htmlFor="file-input">
                            <Button
                                variant="outlined"
                                component="span"
                                startIcon={<AttachFileIcon />}
                            >
                                {fileLabel}
                            </Button>
                        </label>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 2, py: 1.5 }}>
                <Button onClick={onClose} sx={{ color: '#1976d2' }}>Cancelar</Button>
                <Button
                    onClick={handleSave}
                    disabled={!isFormValid}
                    variant="contained"
                >
                    {isEditMode ? 'Guardar cambios' : 'Agregar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
