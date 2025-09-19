import React, { useState } from 'react';
import {
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Stack,
    CircularProgress,
    Box,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import HistoryIcon from '@mui/icons-material/HistoryEdu';
import { message } from 'antd';
import useHome from '../../hooks/useHome';

export const RegistroGridActions = ({ user, row, handleDelete, handleFiles }) => {
    const roleName = (user?.rol?.name || '').toLowerCase();
    const { getDataReportLog } = useHome();

    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyRow, setHistoryRow] = useState(null);

    // Estado del fetch del historial
    const [historyState, setHistoryState] = useState({
        loading: false,
        data: null, // { dataReportId, fechaInicio, fechaFin, cantMovimientos, items[], raw }
        error: null,
    });

    const fmtDateTime = (input) => {
        if (!input) return '-';
        const dt =
            typeof input === 'string'
                ? new Date(String(input).replace(' ', 'T'))
                : new Date(input);
        if (isNaN(dt.getTime())) return String(input);
        const dd = String(dt.getDate()).padStart(2, '0');
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const yyyy = dt.getFullYear();
        const HH = String(dt.getHours()).padStart(2, '0');
        const MM = String(dt.getMinutes()).padStart(2, '0');
        return `${dd}/${mm}/${yyyy} ${HH}:${MM} Hs`;
    };

    // Helpers para historial (parseo más tolerante + redacción amigable)
    const parseHistoryItem = (raw) => {
        const text = String(raw).replace(/^\s*\u0007\s*/, '').trim();

        // Intento 1: "YYYY-MM-DD HH:mm[:ss] - Etapa (Usuario) ..."
        let m = text.match(
            /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)\s*-\s*([^\(\[]+)\s*\(([^)]+)\)?(.*)$/
        );

        let ts = '';
        let stage = '';
        let usr = '';
        let tail = text;

        if (m) {
            ts = `${m[1]}T${m[2].length === 5 ? m[2] + ':00' : m[2]}`;
            stage = (m[3] || '').trim();
            usr = (m[4] || '').trim();
            tail = m[5] || '';
        } else {
            // Intento 2: "Etapa (Usuario) - YYYY-MM-DD HH:mm[:ss] ..."
            m = text.match(
                /([^\(\[]+)\s*\(([^)]+)\)\s*-\s*(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)(.*)$/
            );
            if (m) {
                stage = (m[1] || '').trim();
                usr = (m[2] || '').trim();
                ts = `${m[3]}T${m[4].length === 5 ? m[4] + ':00' : m[4]}`;
                tail = m[5] || '';
            } else {
                // Intento 3: detectar fecha en cualquier lugar (ISO o dd/MM/yyyy)
                const iso = text.match(/(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)/);
                const latam = text.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}:\d{2}(?::\d{2})?)/);
                if (iso) {
                    ts = `${iso[1]}T${iso[2].length === 5 ? iso[2] + ':00' : iso[2]}`;
                } else if (latam) {
                    const dd = latam[1];
                    const mm = latam[2];
                    const yyyy = latam[3];
                    const hhmm = latam[4];
                    ts = `${yyyy}-${mm}-${dd}T${hhmm.length === 5 ? hhmm + ':00' : hhmm}`;
                }

                // Etapa y usuario por aproximación
                const stageMatch = text.match(/\b(Carga|Control|Aprobaci[\u00F3o]n|Aprobacion|Finalizado)\b/i);
                stage = stageMatch ? stageMatch[1] : '';
                const userMatch = text.match(/\(([^)]+)\)/);
                usr = userMatch ? userMatch[1] : '';
                tail = text;
            }
        }

        const tlow = tail.toLowerCase();
        const direction = tlow.includes('adelante')
            ? 'forward'
            : (tlow.includes('atr') || tlow.includes('devolv'))
                ? 'back'
                : tlow.includes('[inicio]')
                    ? 'start'
                    : '';
        const noteMatch = tail.match(/Obs:\s*\"?([^\"\n]+)\"?|Observaciones?:\s*\"?([^\"\n]+)\"?/i);
        const note = noteMatch ? (noteMatch[1] || noteMatch[2] || '') : '';
        return { ts, stage, user: usr, direction, note };
    };

    const prettySentence = (obj) => {
        const { ts, stage, user, direction, note } = obj;
        const dateStr = ts ? fmtDateTime(ts) : '';
        const st = (stage || '').toLowerCase();

        if (direction === 'start') {
            return `El usuario ${user} creó el registro${dateStr ? ` el ${dateStr}` : ''}.`;
        }
        if (direction === 'back') {
            const stPart = stage ? ` (${stage})` : '';
            const dtPart = dateStr ? ` el ${dateStr}` : '';
            return `El usuario ${user} devolvió el registro${stPart}${dtPart}${note ? ` con la justificación: "${note}"` : ''}.`;
        }

        // Forward o movimiento normal: el texto debe reflejar envío al siguiente estado
        let sentence = '';
        if (st === 'control') {
            sentence = `El usuario ${user} envió el registro para su control${dateStr ? ` el ${dateStr}` : ''}.`;
        } else if (st === 'aprobacion' || st === 'aprobación') {
            sentence = `El usuario ${user} envió el registro para su aprobación${dateStr ? ` el ${dateStr}` : ''}.`;
        } else if (st === 'finalizado') {
            // Llegó a finalizado: alguien con Aprobación lo aprobó/finalizó
            sentence = `El usuario ${user} aprobó y finalizó el registro${dateStr ? ` el ${dateStr}` : ''}.`;
        } else {
            // Desconocido: fallback neutro
            sentence = `El usuario ${user} avanzó en el registro${dateStr ? ` el ${dateStr}` : ''}.`;
        }
        return sentence;
    };

    const openHistory = async (e, r) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();

        // Toma el id del reporte (año actual) o cae a r.id
        const reportId = r?.datosAnioActual?.id ?? r?.id;
        if (!reportId) {
            message.warning('No se encontró el ID del registro para historial.');
            return;
        }

        setHistoryRow(r);
        setHistoryOpen(true);
        setHistoryState({ loading: true, data: null, error: null });

        try {
            const log = await getDataReportLog(reportId, { asArray: true });
            setHistoryState({ loading: false, data: log, error: null });
        } catch (err) {
            setHistoryState({
                loading: false,
                data: null,
                error:
                    err?.response?.data?.message || err?.message || 'Error desconocido',
            });
        }
    };

    const closeHistory = (e) => {
        e?.stopPropagation?.();
        setHistoryOpen(false);
        setHistoryRow(null);
        setHistoryState({ loading: false, data: null, error: null });
    };

    const onFiles = (e) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        handleFiles(e, row);
    };

    const onDelete = (e) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        if (!row?.isLatest) return;
        handleDelete(e, row);
    };

    const Cell = ({ children }) => (
        <td
            className="action-icon"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            {children}
        </td>
    );

    const renderActions = () => {
        switch (roleName) {
            case 'carga':
                return (
                    <Cell>
                        <IconButton size="small" onClick={onDelete} disabled={!row?.isLatest}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={onFiles}>
                            <AttachFileIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={(e) => openHistory(e, row)}>
                            <HistoryIcon fontSize="small" />
                        </IconButton>
                    </Cell>
                );

            case 'control':
            case 'aprobacion':
                return (
                    <Cell>
                        <IconButton size="small" onClick={onFiles}>
                            <AttachFileIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={(e) => openHistory(e, row)}>
                            <HistoryIcon fontSize="small" />
                        </IconButton>
                    </Cell>
                );

            case 'admin':
                return null;

            default:
                return null;
        }
    };

    const renderHistoryBodyFriendly = () => {
        if (historyState.loading) {
            return (
                <Stack alignItems="center" py={3}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        Cargando historial...
                    </Typography>
                </Stack>
            );
        }
        if (historyState.error) {
            return (
                <Typography variant="body2" color="error">
                    {historyState.error}
                </Typography>
            );
        }
        const data = historyState.data;
        if (!data) {
            return <Typography variant="body2">Sin información de historial.</Typography>;
        }
        const items = (data.items || []).map(parseHistoryItem);

        return (
            <Stack spacing={1.5}>
                <Box
                    sx={{
                        p: 1.5,
                        borderRadius: 1,
                        background: 'rgba(108,188,170,0.06)',
                        border: '1px solid rgba(108,188,170,0.25)',
                    }}
                >
                    <Typography variant="subtitle2" sx={{ color: '#4e8e86' }}>
                        Resumen del registro #{data.dataReportId ?? historyRow?.id ?? '-'}
                    </Typography>
                    <Typography variant="body2">
                        Desde: {fmtDateTime(data.fechaInicio)} - Hasta: {fmtDateTime(data.fechaFin)}
                    </Typography>
                    <Typography variant="body2">
                        Movimientos: {data.cantMovimientos ?? items.length}
                    </Typography>
                </Box>

                <Stack spacing={1} sx={{ mt: 0.5 }}>
                    {items.map((ev, idx) => (
                        <Box key={idx} sx={{ display: 'flex', gap: 1.2, alignItems: 'flex-start' }}>
                            <Box
                                sx={{
                                    width: 10,
                                    height: 10,
                                    mt: 0.6,
                                    borderRadius: '50%',
                                    backgroundColor:
                                        ev.direction === 'back'
                                            ? '#f5b3b3'
                                            : ev.direction === 'start'
                                                ? '#b3d9c8'
                                                : '#b3e1f0',
                                }}
                            />
                            <Typography variant="body2" sx={{ lineHeight: 1.35 }}>
                                {prettySentence(ev)}
                            </Typography>
                        </Box>
                    ))}
                </Stack>
            </Stack>
        );
    };

    return (
        <>
            {renderActions()}

            <Dialog
                open={historyOpen}
                onClose={closeHistory}
                fullWidth
                maxWidth="sm"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
            >
                <DialogTitle onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>Historial del registro</DialogTitle>
                <DialogContent dividers onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                    {renderHistoryBodyFriendly()}
                </DialogContent>
                <DialogActions onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                    <Button onClick={closeHistory} variant="contained">
                        Cerrar
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
