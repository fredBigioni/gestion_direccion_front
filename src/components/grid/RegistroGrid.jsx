// src/components/RegistroGrid.jsx

import React, { useEffect, useState } from 'react';
import './registroGrid.css';
import { useRecoilState, useRecoilValue } from 'recoil';
import { dataToShowState } from '../../atoms';
import {
    transformToGridRows,
    calculateTotals,
    monthOrder,
    formatNumber,
    formatNumberDecimals
} from '../../helpers/data';
import { AddRegistroModal } from '../modal';
import { RegistroDetalleModal } from '../modal/RegistroDetalleModal';
import useHome from '../../hooks/useHome';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SendData from '@mui/icons-material/ForwardToInbox';
import IconButton from '@mui/material/IconButton';
import Preview from '@mui/icons-material/RemoveRedEye';
import Download from '@mui/icons-material/Download';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { message } from 'antd';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import Button from '@mui/material/Button';
import api from '../../api/api';
import { Box, TextField, Typography } from '@mui/material';

// Import de SheetJS para convertir hoja a HTML
import * as XLSX from 'xlsx';
import MSGReader from 'msgreader';
import { RegistroGridHeaderActions } from './RegistroGridHeaderActions';
import { RegistroGridFooterActions } from './RegistroGridFooterActions';
import { selectedCompanyState } from '../../atoms/selectedCompanyState';
import { RegistroGridActions } from './RegistroGridActions';

export const RegistroGrid = ({ user }) => {
    const companySelectedId = useRecoilValue(selectedCompanyState);
    const [dataToShow] = useRecoilState(dataToShowState);
    const [dataGrid, setDataGrid] = useState([]);
    const [totals, setTotals] = useState({
        datosAnioAnterior: { unidades: 0, precio: 0, monedaLocal: 0, usd: 0, tc: 0 },
        datosAnioActual: { unidades: 0, precio: 0, monedaLocal: 0, usd: 0, tc: 0 },
        variacion: { total: 0, vol: 0, precio: 0 }
    });

    const { refreshData, deleteRegistro, getData, sendDataForward, sendDataToReturn } = useHome();

    const [filesDialogOpen, setFilesDialogOpen] = useState(false);
    const [fileList, setFileList] = useState([]); // metadatos: { id, filename, mimetype, size }

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmSendFile, setConfirmSendFile] = useState(false);
    const [confirmReturnFile, setConfirmReturnFile] = useState(false);
    const [openConfirmSendFile, setOpenConfirmSendFile] = useState(false);
    const [openConfirmReturnFile, setOpenConfirmReturnFile] = useState(false);
    const [fileToDelete, setFileToDelete] = useState(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);

    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [rowToDelete, setRowToDelete] = useState(null);

    // Preview modal states
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
    const [previewMime, setPreviewMime] = useState(null);
    const [previewText, setPreviewText] = useState(null);
    const [previewHtml, setPreviewHtml] = useState(null);

    // ðŸ”¹ Observaciones para "Devolver"
    const [returnNotes, setReturnNotes] = useState('');

    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    useEffect(() => {
        buildGrid()
    }, [dataToShow]);

    const colorClass = v => (v < 0 ? 'text-red' : v > 0 ? 'text-green' : '');

    // Vista compacta para tablets/móviles (pero NO para notebooks/monitores)
    const [isCompact, setIsCompact] = useState(false);
    useEffect(() => {
        const update = () => {
            const width = window.innerWidth;
            const isCoarse = window.matchMedia('(pointer: coarse)').matches; // pantallas táctiles
            // Compacto si: teléfono/tablet (ancho <= 1024) o dispositivo tÃ¡ctil hasta 1366 (iPad Pro landscape)
            const compact = (width <= 1024) || (isCoarse && width <= 1366);
            setIsCompact(compact);
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    function buildGrid() {
        if (!Array.isArray(dataToShow) || dataToShow.length === 0) {
            setDataGrid([]);
            setTotals({
                datosAnioAnterior: { unidades: 0, precio: 0, monedaLocal: 0, usd: 0, tc: 0 },
                datosAnioActual: { unidades: 0, precio: 0, monedaLocal: 0, usd: 0, tc: 0 },
                variacion: { total: 0, vol: 0, precio: 0 }
            });
            return;
        }

        const rows = transformToGridRows(dataToShow);

        const roleName = (user?.rol?.name || '').toLowerCase();
        const expectedByRole = { 'carga': 1, 'control': 2, 'aprobacion': 3, 'aprobación': 3 };
        const expected = expectedByRole[roleName];

        const processed = rows.map(r => {
            // rowStatusId viene del SP (Id del estado actual). Si no viene, lo trato como expected.
            const currentStatus = Number(r.rowStatusId ?? expected);
            const isFinal = currentStatus === 4;
            const isAhead = expected != null ? currentStatus > expected : false;

            // Habilitado = está exactamente en el estado del rol (pendiente), no finalizado, no adelantado.
            const isEnabled = expected != null ? (!isFinal && !isAhead && currentStatus === expected) : false;

            return {
                ...r,
                isEnabled,
                isFinal,
                isSentAhead: isAhead,
                // alias para no tocar tu UI/handlers: “isLatest” == habilitado
                isLatest: isEnabled,
            };
        });

        // Orden como lo tenías (mes desc, luego representación)
        processed.sort((a, b) => {
            const diff = monthOrder.indexOf(b.mes) - monthOrder.indexOf(a.mes);
            return diff !== 0 ? diff : a.representacion.localeCompare(b.representacion);
        });

        setDataGrid(processed);
        setTotals(calculateTotals(processed));
    }


    /**
     * handlePreview:
     * - Descarga blob del archivo.
     * - Si es text/*, lee como texto.
     * - Si es Excel, convierte la primera hoja a HTML con SheetJS.
     * - Guarda HTML en previewHtml; el modal usa iframe srcDoc.
     */
    const handlePreview = async file => {
        try {
            const res = await api.get(`/home/files/download/${file.id}`, {
                responseType: 'blob'
            });
            const blob = new Blob([res.data], { type: file.mimetype });
            const url = window.URL.createObjectURL(blob);

            setPreviewMime(file.mimetype);
            setPreviewBlobUrl(url);
            setPreviewText(null);
            setPreviewHtml(null);

            if (file.mimetype.startsWith('text/')) {
                const txt = await blob.text();
                setPreviewText(txt);

            } else if (
                file.mimetype ===
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                file.mimetype === 'application/vnd.ms-excel'
            ) {
                const arrayBuffer = await res.data.arrayBuffer();
                const wb = XLSX.read(arrayBuffer, { type: 'array' });
                const sheet = wb.Sheets[wb.SheetNames[0]];
                const sheetHtml = XLSX.utils.sheet_to_html(sheet, { editable: false });
                setPreviewHtml(`<!DOCTYPE html>${sheetHtml}`);

            } else if (
                file.mimetype === 'application/vnd.ms-outlook' ||
                file.filename?.toLowerCase().endsWith('.msg')
            ) {
                // parse .msg
                const arrayBuffer = await res.data.arrayBuffer();
                const msgReader = new MSGReader(arrayBuffer);
                const msgInfo = msgReader.getFileData();
                const subject = msgInfo.subject || '(sin asunto)';
                const fromName = msgInfo.senderName || msgInfo.senderEmail || 'desconocido';
                const bodyHtml = msgInfo.body || '<p>(sin cuerpo)</p>';

                const headerHtml = `
        <h3>${subject}</h3>
        <p><strong>De:</strong> ${fromName}</p>
        <hr/>
      `;
                setPreviewHtml(`<!DOCTYPE html><html><body>${headerHtml}${bodyHtml}</body></html>`);

            } else if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
                // lo atiende el modal <object> o <img>
            } else {
                message.info('No hay previsualización disponible para este tipo de archivo.');
            }

            setPreviewDialogOpen(true);
        } catch (err) {
            console.error('Error previsualizando archivo:', err);
            message.error('No se pudo previsualizar el archivo');
        }
    };

    const handlePreviewClose = () => {
        setPreviewDialogOpen(false);
        if (previewBlobUrl) window.URL.revokeObjectURL(previewBlobUrl);
        setPreviewBlobUrl(null);
        setPreviewMime(null);
        setPreviewText(null);
        setPreviewHtml(null);
    };

    const handleFilesClick = async (e, row) => {
        try {
            const res = await api.get(`/home/files/${row.datosAnioActual.id}`);
            setFileList(res.data);
            setFilesDialogOpen(true);
        } catch (err) {
            console.error(err);
            message.error('No se pudieron cargar los archivos');
        }
    };

    const handleSendRegistro = async (e, row) => {
        setConfirmSendFile(row);
        setOpenConfirmSendFile(true);
    }

    const handleReturnRegistro = async (e, row) => {
        setConfirmReturnFile(row);
        setReturnNotes('');
        setOpenConfirmReturnFile(true);
    }

    // 1) reemplazá donde calculás si hay algo para operar:
    const hasEnabled = dataGrid.some(r => r.isEnabled ?? r.isLatest); // usa isEnabled si ya lo agregaste

    // 2) reemplazá confirmSendRegistro
    const confirmSendRegistro = async () => {
        try {
            const ids = dataGrid
                .filter(r => (r.isEnabled ?? r.isLatest)) // habilitados para el rol
                .map(r => r?.datosAnioActual?.id)
                .filter(Boolean);

            if (ids.length === 0) {
                message.info('No hay registros habilitados para enviar.');
                return;
            }

            await sendDataForward(companySelectedId, ids); // <-- PASO IDS
            message.success(`Se enviaron ${ids.length} registro(s).`);
            await refreshData();
        } catch (err) {
            console.error(err);
            message.error('No se pudo enviar.');
        } finally {
            setOpenConfirmSendFile(false);
        }
    };


    const confirmReturnRegistro = async () => {
        try {
            const ids = dataGrid.filter(r => r.isEnabled).map(r => r?.datosAnioActual?.id).filter(Boolean);
            if (ids.length === 0) { message.info('No hay registros habilitados para devolver.'); return; }

            await sendDataToReturn(companySelectedId, returnNotes, ids); // <-- nuevo: paso IDs
            message.success(`Se devolvieron ${ids.length} registro(s).`);
            await refreshData();
        } catch (err) {
            console.error(err);
            message.error('No se pudo devolver.');
        } finally {
            setOpenConfirmReturnFile(false);
            setReturnNotes('');
        }
    };

    const handleDownload = async file => {
        try {
            const response = await api.get(`/home/files/download/${file.id}`, {
                responseType: 'blob'
            });
            const blob = new Blob([response.data], { type: file.mimetype });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error descargando archivo:', err);
            message.error('No se pudo descargar el archivo');
        }
    };

    const askDelete = (file) => {
        setFileToDelete(file);
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/home/files/${fileToDelete.id}`);
            setFileList(list => list.filter(f => f.id !== fileToDelete.id));
            message.success('Archivo eliminado');
        } catch {
            message.error('No se pudo eliminar el archivo');
        } finally {
            setConfirmOpen(false);
            setFileToDelete(null);
        }
    };

    const handleRowClick = row => {
        if (!row.isLatest) return;
        setSelectedRow(row);
        if (isCompact) setDetailOpen(true);
        else setModalOpen(true);
    };

    const handleAddNew = () => {
        setSelectedRow(null);
        setModalOpen(true);
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setSelectedRow(null);
    };
    const handleDetailClose = () => {
        setDetailOpen(false);
        setSelectedRow(null);
    };
    const handleDetailEdit = () => {
        setDetailOpen(false);
        setModalOpen(true);
    };

    const handleAfterSave = async () => {
        await refreshData();
    };

    const handleDeleteClick = (e, row) => {
        setRowToDelete(row);
        setOpenDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
        if (!rowToDelete) return setOpenDeleteDialog(false);
        try {
            await deleteRegistro(rowToDelete.datosAnioActual.id);
            message.success('Registro eliminado.');
            await refreshData();
        } catch {
            message.error('Error al eliminar.');
        }
        setOpenDeleteDialog(false);
        setRowToDelete(null);
    };

    const handleDeleteCancel = () => {
        setOpenDeleteDialog(false);
        setRowToDelete(null);
    };

    let lastMonth = null;

    const renderActions = () => {
        const canOperate = dataGrid.some(r => r.isLatest);
        switch (user.rol.name.toLowerCase()) {
            case 'carga':
                return (
                    <div className="button-group">
                        <button onClick={handleAddNew} className="btn-add">
                            <AddCircleOutlineIcon fontSize="small" />
                            Agregar
                        </button>
                        <button onClick={handleSendRegistro} className="btn-add" disabled={!hasEnabled}>
                            <SkipNextIcon fontSize="small" /> Enviar
                        </button>
                    </div>
                );

            case 'control':
                return (
                    <div className="button-group">
                        <button onClick={handleReturnRegistro} className="btn-add" disabled={!canOperate}>
                            <SkipPreviousIcon fontSize='small' />
                            Devolver
                        </button>
                        <button onClick={handleSendRegistro} className="btn-add" disabled={!canOperate}>
                            <SkipNextIcon fontSize="small" />
                            Aprobar
                        </button>
                    </div>
                )
            case 'aprobacion':
                return (
                    <div className="button-group">
                        <button onClick={handleReturnRegistro} className="btn-add" disabled={!canOperate}>
                            <SkipPreviousIcon fontSize='small' />
                            Devolver
                        </button>
                        <button onClick={handleSendRegistro} className="btn-add" disabled={!canOperate}>
                            <SendData fontSize="small" />
                            Confirmar
                        </button>
                    </div>
                )
            case 'admin':
                return <></>;

            default:
                return null;
        }
    };

    const isControl = (user?.rol?.name || '').toLowerCase() === 'control';
    // Normalizo rol y cuento habilitados para singular/plural
    const roleNameNorm = (user?.rol?.name || '').toLowerCase();
    const enabledCount = dataGrid.filter(r => (r.isEnabled ?? r.isLatest)).length;

    // Copys del modal de "Enviar" según rol
    const sendCopy = (() => {
        const plural = enabledCount !== 1;
        if (roleNameNorm === 'carga') {
            return {
                title: plural ? 'Enviar registros' : 'Enviar registro',
                text: `¿Querés enviar ${plural ? 'los registros' : 'el registro'} para su control?`,
                cta: 'Enviar',
            };
        }
        if (roleNameNorm === 'control') {
            return {
                title: plural ? 'Enviar registros' : 'Enviar registro',
                text: `¿Querés enviar ${plural ? 'los registros' : 'el registro'} para su aprobación?`,
                cta: 'Enviar',
            };
        }
        if (roleNameNorm === 'aprobacion' || roleNameNorm === 'aprobación') {
            return {
                title: plural ? 'Aprobar registros' : 'Aprobar registro',
                text: `¿Querés aprobar ${plural ? 'los registros' : 'el registro'}?`,
                cta: 'Aprobar',
            };
        }
        // fallback (admin u otros)
        return {
            title: 'Enviar',
            text: '¿Deseás continuar?',
            cta: 'Sí',
        };
    })();

    return (
        <div className="registro-grid__wrapper">
            <div className="registro-grid__header">
                <h3 className="registro-grid__title">Registros disponibles</h3>
                <>{renderActions()}</>
            </div>

            <div className="registro-grid__container">
                <table className="registro-grid">
                    <thead>
                        {isCompact ? (
                            <tr>
                                <th className="header-year">Mes</th>
                                <th className="header-year">Representación</th>
                                <RegistroGridHeaderActions user={user} />
                            </tr>
                        ) : (
                            <>
                                <tr>
                                    <th rowSpan={2} className="header-year">Mes</th>
                                    <th rowSpan={2} className="header-year">Representación</th>
                                    <th colSpan={5} className="header-year">{previousYear}</th>
                                    <th colSpan={5} className="header-year">{currentYear}</th>
                                    <th colSpan={3} className="header-year">Variación</th>
                                    <RegistroGridHeaderActions user={user} />
                                </tr>
                                <tr>
                                    <th className="blue-header">Unidades</th>
                                    <th className="blue-header">Precio Prom.</th>
                                    <th className="blue-header">Valores ARS</th>
                                    <th className="blue-header">Valores USD</th>
                                    <th className="blue-header">TC Prom.</th>
                                    <th className="yellow-header">Unidades</th>
                                    <th className="yellow-header">Precio Prom.</th>
                                    <th className="yellow-header">Valores ARS</th>
                                    <th className="yellow-header">Valores USD</th>
                                    <th className="yellow-header">TC Prom.</th>
                                    <th className="green-header">Total %</th>
                                    <th className="green-header">Vol %</th>
                                    <th className="green-header">Precio %</th>
                                </tr>
                            </>
                        )}
                    </thead>
                    <tbody>
                        {dataGrid.map((row, idx) => {
                            lastMonth = row.mes;
                            return (
                                <React.Fragment key={idx}>
                                    <tr
                                        className={row.isLatest ? 'row-enabled' : 'row-disabled'}
                                        onClick={() => handleRowClick(row)}
                                        style={{
                                            cursor: row.isLatest ? 'pointer' : 'default'
                                        }}
                                        title={
                                            row.isLatest
                                                ? 'Click para editar'
                                                : 'Solo último mes editable'
                                        }
                                    >
                                        {isCompact ? (
                                            <>
                                                <td style={{ fontWeight: 'bold' }}>{row.mes}</td>
                                                <td style={{ fontWeight: 'bold' }}>{row.representacion}</td>
                                                <RegistroGridActions
                                                    user={user}
                                                    row={row}
                                                    handleDelete={handleDeleteClick}
                                                    handleFiles={handleFilesClick}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <td style={{ fontWeight: 'bold' }}>{row.mes}</td>
                                                <td style={{ fontWeight: 'bold' }}>{row.representacion}</td>
                                                <td>{formatNumber(row.datosAnioAnterior.unidades)}</td>
                                                <td>{formatNumberDecimals(row.datosAnioAnterior.precio, 1)}</td>
                                                <td>{formatNumber(row.datosAnioAnterior.monedaLocal)}</td>
                                                <td>{formatNumber(row.datosAnioAnterior.usd)}</td>
                                                <td>{formatNumberDecimals(row.datosAnioAnterior.tc, 2)}</td>
                                                <td>{formatNumber(row.datosAnioActual.unidades)}</td>
                                                <td>{formatNumberDecimals(row.datosAnioActual.precio, 2)}</td>
                                                <td>{formatNumber(row.datosAnioActual.monedaLocal)}</td>
                                                <td>{formatNumber(row.datosAnioActual.usd)}</td>
                                                <td>{formatNumberDecimals(row.datosAnioActual.tc, 2)}</td>
                                                <td className={colorClass(row.variacion.total)}>{formatNumberDecimals(row.variacion.total, 2)}</td>
                                                <td className={colorClass(row.variacion.vol)}>{formatNumberDecimals(row.variacion.vol, 2)}</td>
                                                <td className={colorClass(row.variacion.precio)}>{formatNumberDecimals(row.variacion.precio, 2)}</td>
                                                <RegistroGridActions
                                                    user={user}
                                                    row={row}
                                                    handleDelete={handleDeleteClick}
                                                    handleFiles={handleFilesClick}
                                                />
                                            </>
                                        )}

                                    </tr>
                                </React.Fragment>
                            );
                        })}

                        {!isCompact && (
                            <tr className="totales-row">
                                <td colSpan={2}>Totales</td>
                                <td>{formatNumber(totals.datosAnioAnterior.unidades)}</td>
                                <td>
                                    {formatNumberDecimals(totals.datosAnioAnterior.precio, 1)}
                                </td>
                                <td>{formatNumber(totals.datosAnioAnterior.monedaLocal)}</td>
                                <td>{formatNumber(totals.datosAnioAnterior.usd)}</td>
                                <td>
                                    {formatNumberDecimals(totals.datosAnioAnterior.tc, 1)}
                                </td>
                                <td>{formatNumber(totals.datosAnioActual.unidades)}</td>
                                <td>
                                    {formatNumberDecimals(totals.datosAnioActual.precio, 1)}
                                </td>
                                <td>{formatNumber(totals.datosAnioActual.monedaLocal)}</td>
                                <td>{formatNumber(totals.datosAnioActual.usd)}</td>
                                <td>
                                    {formatNumberDecimals(totals.datosAnioActual.tc, 1)}
                                </td>
                                <td className="green-text">
                                    {formatNumberDecimals(totals.variacion.total, 1)}
                                </td>
                                <td className="green-text">
                                    {formatNumberDecimals(totals.variacion.vol, 1)}
                                </td>
                                <td className="green-text">
                                    {formatNumberDecimals(totals.variacion.precio, 1)}
                                </td>
                                <RegistroGridFooterActions user={user} />
                            </tr>)}
                    </tbody>
                </table>
            </div>

            {/* Modal Agregar/Editar */}
            <AddRegistroModal
                open={modalOpen}
                onClose={handleModalClose}
                initialData={selectedRow}
                onSuccess={handleAfterSave}
            />

            <RegistroDetalleModal
                open={detailOpen}
                onClose={handleDetailClose}
                onEdit={handleDetailEdit}
                row={selectedRow}
            />

            {/* Modal Confirm Delete */}
            <Dialog
                open={openDeleteDialog}
                onClose={handleDeleteCancel}
                aria-labelledby="confirm-delete-dialog-title"
                aria-describedby="confirm-delete-dialog-description"
            >
                <DialogTitle id="confirm-delete-dialog-title">
                    Confirmar eliminación
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="confirm-delete-dialog-description">
                        ¿Eliminar <strong>{rowToDelete?.representacion}</strong> de{' '}
                        <strong>{rowToDelete?.mes}</strong>?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel}>Cancelar</Button>
                    <Button onClick={handleDeleteConfirm} color="error" autoFocus>
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal Lista de Archivos */}
            <Dialog
                open={filesDialogOpen}
                onClose={() => setFilesDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Archivos adjuntos</DialogTitle>
                <DialogContent dividers>
                    {fileList.length === 0 ? (
                        <DialogContentText>No hay archivos.</DialogContentText>
                    ) : (
                        fileList.map((f) => (
                            <Box
                                key={f.id}
                                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
                            >
                                <Typography variant="body2">{f.filename}</Typography>
                                <Box>
                                    {!isControl && (
                                        <IconButton size="small" onClick={() => askDelete(f)} aria-label="Eliminar">
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                    <IconButton size="small" onClick={() => handleDownload(f)} aria-label="Descargar">
                                        <Download fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => handlePreview(f)} aria-label="Previsualizar">
                                        <Preview fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Box>
                        ))
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setFilesDialogOpen(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
            >
                <DialogTitle>¿Eliminar archivo?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Seguro quieres borrar "{fileToDelete?.filename}"?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)}>No</Button>
                    <Button onClick={confirmDelete} color="error">Sí, eliminar</Button>
                </DialogActions>
            </Dialog>

            {/* Modal Confirmar Envío */}
            <Dialog
                open={openConfirmSendFile}
                onClose={() => setOpenConfirmSendFile(false)}
            >
                <DialogTitle>{sendCopy.title}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {sendCopy.text}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenConfirmSendFile(false)}>No</Button>
                    <Button color="error" onClick={confirmSendRegistro}>
                        {sendCopy.cta}
                    </Button>
                </DialogActions>
            </Dialog>


            {/* Modal Devolver con Observaciones */}
            <Dialog
                open={openConfirmReturnFile}
                onClose={() => setOpenConfirmReturnFile(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Devolver registro</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Queres devolver los registros para su corrección? Podés dejar observaciones:
                    </DialogContentText>

                    <Box sx={{ mt: 2 }}>
                        <TextField
                            label="Observaciones"
                            multiline
                            minRows={3}
                            fullWidth
                            value={returnNotes}
                            onChange={(e) => setReturnNotes(e.target.value)}
                            placeholder="Escribí aquí los motivos o indicacionesâ€¦"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setOpenConfirmReturnFile(false); setReturnNotes(''); }}>
                        Cancelar
                    </Button>
                    <Button color="error" variant="contained" onClick={confirmReturnRegistro}>
                        Guardar y devolver
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal previsualización */}
            <Dialog
                open={previewDialogOpen}
                onClose={handlePreviewClose}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>previsualización</DialogTitle>
                <DialogContent
                    dividers
                    sx={{ textAlign: 'center', minHeight: '60vh', overflowY: 'auto' }}
                >
                    {previewHtml ? (
                        <Box sx={{ width: '100%', height: '80vh', p: 0 }}>
                            <iframe
                                title="Excel Preview"
                                srcDoc={previewHtml}
                                style={{ width: '100%', height: '100%', border: 'none' }}
                            />
                        </Box>
                    ) : previewMime?.startsWith('image/') ? (
                        <img
                            src={previewBlobUrl}
                            alt="preview"
                            style={{ maxWidth: '100%', maxHeight: '80vh' }}
                        />
                    ) : previewMime === 'application/pdf' ? (
                        <object
                            data={previewBlobUrl}
                            type="application/pdf"
                            width="100%"
                            height="600px"
                        >
                            <p>
                                Tu navegador no soporta PDF embebido.{` `}
                                <a href={previewBlobUrl} target="_blank" rel="noopener noreferrer">
                                    Ver PDF
                                </a>
                            </p>
                        </object>
                    ) : previewText != null ? (
                        <Box
                            component="pre"
                            sx={{ textAlign: 'left', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
                        >
                            {previewText}
                        </Box>
                    ) : (
                        <DialogContentText>Cargando...</DialogContentText>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handlePreviewClose}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};




