import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Autocomplete, Grid, Chip
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import useDyeingStore from '../store/dyeingStore';
import { getCompacters } from '../api/masters';

const DyeingPage = () => {
  const { dyeingList, dyeingLoading, fetchDyeings, updateDyeing, deleteDyeing } = useDyeingStore();
  const [compacters, setCompacters] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDyeing, setSelectedDyeing] = useState(null);
  const [editForm, setEditForm] = useState({
    initial_weight: '',
    knitterDcNo: '',
    companyDcNo: '',
    compacterId: null,
    dateGiven: '',
  });

  useEffect(() => {
    fetchDyeings();
    getCompacters().then(res => setCompacters(res.data)).catch(console.error);
  }, []);

  const handleEditOpen = (dyeing) => {
    setSelectedDyeing(dyeing);
    setEditForm({
      initial_weight: dyeing.initial_weight ?? '',
      knitterDcNo: dyeing.knitterDcNo ?? '',
      companyDcNo: dyeing.companyDcNo ?? '',
      compacterId: dyeing.compacterId ?? null,
      dateGiven: dyeing.dateGiven ? dyeing.dateGiven.slice(0, 10) : '',
    });
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!selectedDyeing) return;
    const payload = {
      initial_weight: editForm.initial_weight,
      knitterDcNo: editForm.knitterDcNo,
      companyDcNo: editForm.companyDcNo,
      compacterId: editForm.compacterId,
      dateGiven: editForm.dateGiven,
    };
    await updateDyeing(selectedDyeing.id, payload);
    setEditDialogOpen(false);
    fetchDyeings();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      await deleteDyeing(id);
      fetchDyeings();
    }
  };

  const calcProcessLoss = (initial, final) => {
    if (!initial || initial === 0) return '0.00';
    return (((initial - final) / initial) * 100).toFixed(2);
  };

  // Compute status based on manual fields
  const getStatus = (item) => {
    if (item.companyDcNo && item.dateGiven) return 'In Dyeing';
    return 'Awaiting DC';
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dyeing Records
      </Typography>

      {dyeingLoading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Lot No.</TableCell>
                <TableCell>Received Weight (kg)</TableCell>
                <TableCell>Final Weight (kg)</TableCell>
                <TableCell>Process Loss (%)</TableCell>
                <TableCell>Knitter DC</TableCell>
                <TableCell>Company DC</TableCell>
                <TableCell>Colour</TableCell>
                <TableCell>Dyer</TableCell>
                <TableCell>Compacter</TableCell>
                <TableCell>Date Given</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dyeingList.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.lot_no}</TableCell>
                  <TableCell>{d.initial_weight ?? '-'}</TableCell>
                  <TableCell>{d.final_weight ?? '-'}</TableCell>
                  <TableCell>{calcProcessLoss(d.initial_weight, d.final_weight)}</TableCell>
                  <TableCell>{d.knitterDcNo || '-'}</TableCell>
                  <TableCell>{d.companyDcNo || '-'}</TableCell>
                  <TableCell>{d.colour?.name}</TableCell>
                  <TableCell>{d.dyerName?.name}</TableCell>
                  <TableCell>{d.compacter?.name || '-'}</TableCell>
                  <TableCell>{d.dateGiven ? new Date(d.dateGiven).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatus(d)}
                      color={getStatus(d) === 'In Dyeing' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEditOpen(d)}><Edit /></IconButton>
                    <IconButton onClick={() => handleDelete(d.id)}><Delete /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Edit Dialog – unchanged except status shown as read‑only */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Dyeing Record</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={6}>
              <TextField label="Lot No." fullWidth disabled value={selectedDyeing?.lot_no || ''} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Final Weight (kg)" fullWidth disabled value={selectedDyeing?.final_weight || ''} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Received Weight (kg)" type="number" fullWidth value={editForm.initial_weight}
                onChange={e => setEditForm({...editForm, initial_weight: e.target.value})} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Knitter DC No." fullWidth value={editForm.knitterDcNo}
                onChange={e => setEditForm({...editForm, knitterDcNo: e.target.value})} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Company DC No." fullWidth value={editForm.companyDcNo}
                onChange={e => setEditForm({...editForm, companyDcNo: e.target.value})} />
            </Grid>
            <Grid item xs={6}>
              <Autocomplete
                options={compacters}
                getOptionLabel={o => o.name}
                value={compacters.find(c => c.id === editForm.compacterId) || null}
                onChange={(e, v) => setEditForm({...editForm, compacterId: v?.id || null})}
                renderInput={(params) => <TextField {...params} label="Compacter" />}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Date Given" type="date" fullWidth InputLabelProps={{ shrink: true }}
                value={editForm.dateGiven} onChange={e => setEditForm({...editForm, dateGiven: e.target.value})} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Colour" fullWidth disabled value={selectedDyeing?.colour?.name || ''} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Dyer" fullWidth disabled value={selectedDyeing?.dyerName?.name || ''} />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Status"
                fullWidth
                disabled
                value={selectedDyeing ? (selectedDyeing.companyDcNo && selectedDyeing.dateGiven ? 'In Dyeing' : 'Awaiting DC') : ''}
                helperText="Auto‑calculated from Company DC & Date Given"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DyeingPage;
