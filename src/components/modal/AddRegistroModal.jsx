// src/components/modal/AddRegistroModal.jsx

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
    const { createData, updateData } = useCreateData();

    // Estado de formulario
    const [form, setForm] = useState({
        tipo: '',
        periodo: '',
        unidades: '',
        valores: '',
        promedio: '',
        tc: '',
    });
    // Focus por campo
    const [focus, setFocus] = useState({
        unidades: false,
        valores: false,
        promedio: false,
        tc: false,
    });
    // Archivos
    const [files, setFiles] = useState([]);

    const monthOrder = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Formatea miles y conserva decimales (según los que el usuario escribió)
    const formatDisplay = raw => {
        if (!raw) return '';
        // split raw en parte entera y decimal
        const [intPart, decPart] = raw.split('.');
        const num = Number(intPart.replace(/\D/g, '')) || 0;
        const formattedInt = num.toLocaleString('es-AR');
        return decPart != null
            ? `${formattedInt}.${decPart}`
            : formattedInt;
    };

    // Inicializa form y files al abrir
    useEffect(() => {
        if (!open) return;

        if (isEditMode) {
            // tu lógica existente para mapear initialData a form...
            let tipoValue = '';
            if (initialData.representacion != null) {
                const f = companyTypes?.find(ct => ct.name.toLowerCase() === initialData.representacion.toLowerCase());
                tipoValue = f ? f.id : '';
            }
            const periodoValue = initialData.mes || '';
            const unidadesRaw = initialData.datosAnioActual?.unidades?.toString() ?? '';
            const valoresRaw = initialData.datosAnioActual?.usd?.toString() ?? '';
            const promedioRaw = initialData.datosAnioActual?.precio?.toString() ?? '';
            const tcRaw = initialData.datosAnioActual?.tc?.toString() ?? '';

            setForm({
                tipo: tipoValue,
                periodo: periodoValue,
                unidades: unidadesRaw,
                valores: valoresRaw,
                promedio: promedioRaw,
                tc: tcRaw,
            });
            setFocus({ unidades: false, valores: false, promedio: false, tc: false });
        } else {
            setForm({ tipo: '', periodo: '', unidades: '', valores: '', promedio: '', tc: '' });
            setFocus({ unidades: false, valores: false, promedio: false, tc: false });
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
    const handleBlur = field => () =>
        setFocus(f => ({ ...f, [field]: false }));

    // Archivos
    const handleFileChange = e => {
        setFiles(Array.from(e.target.files));
    };

    const isFormValid = form.tipo && form.periodo
        && form.unidades.trim() !== ''
        && form.valores.trim() !== ''
        && form.promedio.trim() !== ''
        && form.tc.trim() !== '';

    const handleSave = async () => {
        if (!isFormValid) return;
        const payload = new FormData();
        payload.append('tipo', form.tipo);
        payload.append('periodo', form.periodo);
        payload.append('unidades', form.unidades);
        payload.append('valores', form.valores);
        payload.append('promedio', form.promedio);
        payload.append('tc', form.tc);
        files.forEach(file => payload.append('documentos', file));

        try {
            if (isEditMode) {
                const id = initialData.datosAnioActual?.id || initialData.idCurrentYear;
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
            scroll="paper"
        >
            <DialogTitle sx={{ color: '#1976d2', pt: 1, pb: 1, mb: 2 }}>
                {isEditMode ? 'Editar Registro' : 'Agregar Registro'}
            </DialogTitle>
            <DialogContent sx={{ px: 0, py: 0 }}>
                <Box sx={{ pt: 3, px: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                            <MenuItem value=""><em>Selecciona</em></MenuItem>
                            {monthOrder.map(mes =>
                                <MenuItem key={mes} value={mes}>{mes}</MenuItem>
                            )}
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

                    {/* Valores USD */}
                    <TextField
                        fullWidth size="small"
                        label="Valores USD"
                        value={focus.valores
                            ? form.valores
                            : formatDisplay(form.valores)
                        }
                        onChange={handleNumericChange('valores')}
                        onFocus={handleFocus('valores')}
                        onBlur={handleBlur('valores')}
                    />

                    {/* Precio Promedio */}
                    <TextField
                        fullWidth size="small"
                        label="Precio Promedio"
                        value={focus.promedio
                            ? form.promedio
                            : formatDisplay(form.promedio)
                        }
                        onChange={handleNumericChange('promedio')}
                        onFocus={handleFocus('promedio')}
                        onBlur={handleBlur('promedio')}
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

                    {/* Archivos */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1 }}>
                        <input
                            accept="*"
                            id="file-input"
                            type="file"
                            multiple
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

            <DialogActions sx={{ px: 2, py: 1 }}>
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
