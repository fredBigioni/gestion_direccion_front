import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Stack, Typography } from '@mui/material';
import { formatNumber, formatNumberDecimals } from '../../helpers/data';

export const RegistroDetalleModal = ({ open, onClose, row, onEdit }) => {
  if (!row) return null;

  const LeftCol = ({ title, value }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
      <Typography variant="body2" sx={{ color: '#666' }}>{title}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>{value}</Typography>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {row.mes} - {row.representacion}
      </DialogTitle>
      <DialogContent dividers>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          {/* Izquierda: Año anterior */}
          <Box flex={1} sx={{ p: 1, borderRadius: 1, bgcolor: '#fff8f0' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: '#9c7b3e' }}>{new Date().getFullYear() - 1} (Anterior)</Typography>
            <LeftCol title="Unidades" value={formatNumber(row.datosAnioAnterior.unidades)} />
            <LeftCol title="Precio Prom." value={formatNumberDecimals(row.datosAnioAnterior.precio, 2)} />
            <LeftCol title="Valores ARS" value={formatNumber(row.datosAnioAnterior.monedaLocal)} />
            <LeftCol title="Valores USD" value={formatNumber(row.datosAnioAnterior.usd)} />
            <LeftCol title="TC Prom." value={formatNumberDecimals(row.datosAnioAnterior.tc, 2)} />
          </Box>

          {/* Derecha: Año actual */}
          <Box flex={1} sx={{ p: 1, borderRadius: 1, bgcolor: '#f6faf9' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: '#5ba79c' }}>{new Date().getFullYear()} (Actual)</Typography>
            <LeftCol title="Unidades" value={formatNumber(row.datosAnioActual.unidades)} />
            <LeftCol title="Precio Prom." value={formatNumberDecimals(row.datosAnioActual.precio, 2)} />
            <LeftCol title="Valores ARS" value={formatNumber(row.datosAnioActual.monedaLocal)} />
            <LeftCol title="Valores USD" value={formatNumber(row.datosAnioActual.usd)} />
            <LeftCol title="TC Prom." value={formatNumberDecimals(row.datosAnioActual.tc, 2)} />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        {onEdit && (
          <Button variant="contained" onClick={onEdit}>Editar</Button>
        )}
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};
