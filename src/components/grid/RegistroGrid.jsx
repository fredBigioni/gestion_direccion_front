// src/components/RegistroGrid.jsx

import React, { useEffect, useState } from 'react';
import './registroGrid.css';
import { useRecoilState } from 'recoil';
import { dataToShowState } from '../../atoms';
import {
    transformToGridRows,
    calculateTotals,
    monthOrder,
    formatNumber,
    formatNumberDecimals
} from '../../helpers/data';
import { AddRegistroModal } from '../modal';
import useHome from '../../hooks/useHome';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import IconButton from '@mui/material/IconButton';
import { message } from 'antd';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

export const RegistroGrid = () => {
    const [dataToShow] = useRecoilState(dataToShowState);
    const [dataGrid, setDataGrid] = useState([]);
    const [totals, setTotals] = useState({
        datosAnioAnterior: { unidades: 0, precio: 0, usd: 0, tc: 0 },
        datosAnioActual: { unidades: 0, precio: 0, usd: 0, tc: 0 },
        variacion: { total: 0, vol: 0, precio: 0 }
    });

    const { refreshData, deleteRegistro } = useHome();

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);

    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [rowToDelete, setRowToDelete] = useState(null);

    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    useEffect(() => {
        buildGrid();
    }, [dataToShow]);

    const colorClass = v => v < 0 ? 'text-red' : v > 0 ? 'text-green' : '';

    const buildGrid = () => {
        if (!Array.isArray(dataToShow) || dataToShow.length === 0) {
            setDataGrid([]);
            setTotals({
                datosAnioAnterior: { unidades: 0, precio: 0, usd: 0, tc: 0 },
                datosAnioActual: { unidades: 0, precio: 0, usd: 0, tc: 0 },
                variacion: { total: 0, vol: 0, precio: 0 }
            });
            return;
        }

        const rows = transformToGridRows(dataToShow);
        const latestByRep = {};
        rows.forEach(r => {
            const idx = monthOrder.indexOf(r.mes);
            if (idx < 0) return;
            latestByRep[r.representacion] = Math.max(latestByRep[r.representacion] ?? -1, idx);
        });

        const processed = rows.map(r => ({
            ...r,
            isLatest: monthOrder.indexOf(r.mes) === latestByRep[r.representacion]
        }));

        // Orden: mes descendente, luego representación ascendente (o el que prefieras)
        processed.sort((a, b) => {
            const diff = monthOrder.indexOf(b.mes) - monthOrder.indexOf(a.mes);
            if (diff !== 0) return diff;
            return a.representacion.localeCompare(b.representacion);
        });

        setDataGrid(processed);
        setTotals(calculateTotals(processed));
    };

    const handleRowClick = row => {
        if (!row.isLatest) return;
        setSelectedRow(row);
        setModalOpen(true);
    };
    const handleAddNew = () => {
        setSelectedRow(null);
        setModalOpen(true);
    };
    const handleModalClose = () => {
        setModalOpen(false);
        setSelectedRow(null);
    };
    const handleAfterSave = async () => {
        await refreshData();
    };
    const handleDeleteClick = (e, row) => {
        e.stopPropagation();
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
    return (
        <div className="registro-grid__wrapper">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="registro-grid__title">Registros disponibles</h3>
                <button onClick={handleAddNew} className="btn-add">+ Agregar Registro</button>
            </div>
            <table className="registro-grid">
                <thead>
                    <tr>
                        <th rowSpan={2} className="header-year">Mes</th>
                        <th rowSpan={2} className="header-year">Representación</th>
                        <th colSpan={4} className="header-year">{previousYear}</th>
                        <th colSpan={4} className="header-year">{currentYear}</th>
                        <th colSpan={3} className="header-year">Variación</th>
                        <th rowSpan={2} className="header-year">Acciones</th>
                    </tr>
                    <tr>
                        <th className="blue-header">Unidades</th>
                        <th className="blue-header">Precio Prom.</th>
                        <th className="blue-header">Valores USD</th>
                        <th className="blue-header">TC Prom.</th>
                        <th className="yellow-header">Unidades</th>
                        <th className="yellow-header">Precio Prom.</th>
                        <th className="yellow-header">Valores USD</th>
                        <th className="yellow-header">TC Prom.</th>
                        <th className="green-header">Total %</th>
                        <th className="green-header">Vol %</th>
                        <th className="green-header">Precio %</th>
                    </tr>
                </thead>
                <tbody>
                    {dataGrid.map((row, idx) => {
                        const showHeader = row.mes !== lastMonth;
                        lastMonth = row.mes;
                        return (
                            <React.Fragment key={idx}>
                                {/* {showHeader && (
                                    <tr className="group-header">
                                        <td colSpan={15}><strong>{row.mes}</strong></td>
                                    </tr>
                                )} */}
                                <tr
                                    className={row.isLatest ? 'row-enabled' : 'row-disabled'}
                                    onClick={() => handleRowClick(row)}
                                    style={{ cursor: row.isLatest ? 'pointer' : 'default' }}
                                    title={row.isLatest ? 'Click para editar' : 'Solo último mes editable'}
                                >
                                    <td style={{ fontWeight: 'bold' }}>{row.mes}</td>
                                    <td style={{ fontWeight: 'bold' }}>{row.representacion}</td>
                                    <td>{formatNumber(row.datosAnioAnterior.unidades)}</td>
                                    <td>{formatNumberDecimals(row.datosAnioAnterior.precio, 2)}</td>
                                    <td>{formatNumber(row.datosAnioAnterior.usd)}</td>
                                    <td>{formatNumberDecimals(row.datosAnioAnterior.tc, 2)}</td>
                                    <td>{formatNumber(row.datosAnioActual.unidades)}</td>
                                    <td>{formatNumberDecimals(row.datosAnioActual.precio, 2)}</td>
                                    <td>{formatNumber(row.datosAnioActual.usd)}</td>
                                    <td>{formatNumberDecimals(row.datosAnioActual.tc, 2)}</td>
                                    <td className={colorClass(row.variacion.total)}>
                                        {formatNumberDecimals(row.variacion.total, 2)}
                                    </td>
                                    <td className={colorClass(row.variacion.vol)}>
                                        {formatNumberDecimals(row.variacion.vol, 2)}
                                    </td>
                                    <td className={colorClass(row.variacion.precio)}>
                                        {formatNumberDecimals(row.variacion.precio, 2)}
                                    </td>
                                    <td className="delete-icon">
                                        <IconButton size="small" onClick={e => handleDeleteClick(e, row)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size='small'>
                                            <AttachFileIcon fontSize="small" />
                                        </IconButton>
                                    </td>
                                </tr>
                            </React.Fragment>
                        );
                    })}
                    {/* Totales */}
                    <tr className="totals-row">
                        <td colSpan={2}>Totales</td>
                        <td className="">{formatNumber(totals.datosAnioAnterior.unidades)}</td>
                        <td className="">{formatNumberDecimals(totals.datosAnioAnterior.precio, 2)}</td>
                        <td className="">{formatNumber(totals.datosAnioAnterior.usd)}</td>
                        <td className="">{formatNumberDecimals(totals.datosAnioAnterior.tc, 2)}</td>
                        <td className="">{formatNumber(totals.datosAnioActual.unidades)}</td>
                        <td className="">{formatNumberDecimals(totals.datosAnioActual.precio, 2)}</td>
                        <td className="">{formatNumber(totals.datosAnioActual.usd)}</td>
                        <td className="">{formatNumberDecimals(totals.datosAnioActual.tc, 2)}</td>
                        <td className="green-text">{formatNumberDecimals(totals.variacion.total, 2)}</td>
                        <td className="green-text">{formatNumberDecimals(totals.variacion.vol, 2)}</td>
                        <td className="green-text">{formatNumberDecimals(totals.variacion.precio, 2)}</td>
                        <td>-</td>
                    </tr>
                </tbody>
            </table>

            <AddRegistroModal
                open={modalOpen}
                onClose={handleModalClose}
                initialData={selectedRow}
                onSuccess={handleAfterSave}
            />

            <Dialog
                open={openDeleteDialog}
                onClose={handleDeleteCancel}
                aria-labelledby="confirm-delete-dialog-title"
                aria-describedby="confirm-delete-dialog-description"
            >
                <DialogTitle id="confirm-delete-dialog-title">Confirmar eliminación</DialogTitle>
                <DialogContent>
                    <DialogContentText id="confirm-delete-dialog-description">
                        ¿Eliminar <strong>{rowToDelete?.representacion}</strong> de <strong>{rowToDelete?.mes}</strong>?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel}>Cancelar</Button>
                    <Button onClick={handleDeleteConfirm} color="error" autoFocus>Eliminar</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};
