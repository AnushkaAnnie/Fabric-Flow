import { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip, Alert, MenuItem } from '@mui/material';
import { Plus } from 'lucide-react';
import DataTable from '../components/common/DataTable';
import SmartDropdown from '../components/common/SmartDropdown';
import api from '../api/axios';

const Dyeing = () => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [fabricOptions, setFabricOptions] = useState([]);

  const [formData, setFormData] = useState({
    source_type: 'KNITTING', hf_code: '', fabric_code: '', count: '', lot_no: '', initial_weight: '', dyer_name_id: '',
    wash_type_id: '', colour_id: '', gg: '', initial_dia: '', final_dia: '',
    no_of_rolls: '', final_weight: '',
    date: new Date().toISOString().split('T')[0]
  });

  const liveProcessLoss = formData.initial_weight && formData.final_weight
    ? ((Number(formData.initial_weight) - Number(formData.final_weight)) / Number(formData.initial_weight)) * 100
    : null;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/dyeing?page=${page}&limit=${limit}&search=${search}`);
      setData(res.data.data);
      setTotal(res.data.total);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [page, limit, search]);

  useEffect(() => {
    api.get('/fabric-purchase/list')
      .then(res => setFabricOptions(res.data || []))
      .catch(() => setFabricOptions([]));
  }, []);

  useEffect(() => {
    if (formData.source_type === 'KNITTING' && formData.hf_code) {
      api.get(`/yarn/hf/${formData.hf_code}`)
        .then(res => { if (res.data?.count) setFormData(prev => ({ ...prev, count: res.data.count })); })
        .catch(() => {});
    }
  }, [formData.hf_code, formData.source_type]);

  const handleSave = async () => {
    try {
      if (editingId) { await api.put(`/dyeing/${editingId}`, formData); }
      else { await api.post('/dyeing', formData); }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving data');
    }
  };

  const handleEdit = (row) => {
    setFormData({ source_type: row.source_type || 'KNITTING', fabric_code: row.fabric_code || '', ...row, date: new Date(row.date).toISOString().split('T')[0] });
    setEditingId(row.id);
    setModalOpen(true);
  };

  const handleDelete = async (row) => {
    try {
      await api.delete(`/dyeing/${row.id}`);
      fetchData();
    } catch (err) { alert(err.response?.data?.message || 'Error deleting record.'); }
  };

  const columns = [
    { field: 'hf_code', headerName: 'HF/Fabric Code' },
    { field: 'count', headerName: 'Count' },
    { field: 'lot_no', headerName: 'Lot No' },
    { field: 'dyerName', headerName: 'Dyer', renderCell: (r) => r.dyerName?.name },
    { field: 'colour', headerName: 'Colour', renderCell: (r) => r.colour?.name },
    { field: 'washType', headerName: 'Wash', renderCell: (r) => r.washType?.name },
    { field: 'initial_weight', headerName: 'Input Wt (kg)' },
    { field: 'final_weight', headerName: 'Output Wt (kg)' },
    { field: 'initial_dia', headerName: 'Initial Dia' },
    { field: 'final_dia', headerName: 'Final Dia' },
    { field: 'gg', headerName: 'GG' },
    { field: 'no_of_rolls', headerName: 'Rolls' },
    {
      field: 'process_loss', headerName: 'Loss/Gain',
      renderCell: (row) => {
        const val = Number(row.process_loss) || 0;
        const color = val > 0 ? 'error' : val < 0 ? 'success' : 'default';
        return <Chip label={`${val > 0 ? '-' : '+'}${Math.abs(val).toFixed(2)}%`} color={color} size="small" />;
      }
    },
    {
      field: 'knitting_lot_entry_id', headerName: 'Source',
      renderCell: (row) => row.source_type === 'INHOUSE_FABRIC'
        ? <Chip label="Fabric Purchase" size="small" color="secondary" variant="outlined" />
        : row.knitting_lot_entry_id
          ? <Chip label="From Knitting" size="small" color="info" variant="outlined" />
          : <Chip label="Manual" size="small" variant="outlined" />
    },
    {
      field: 'status', headerName: 'Status',
      renderCell: (row) => {
        const isComplete = Number(row.final_weight) > 0;
        return <Chip label={isComplete ? 'Completed' : 'Pending'} color={isComplete ? 'success' : 'warning'} size="small" variant="outlined" />;
      }
    },
    { field: 'date', headerName: 'Date', renderCell: (row) => new Date(row.date).toLocaleDateString() },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" color="text.primary">Dyeing Tracker</Typography>
        <Button variant="contained" startIcon={<Plus size={18} />}
          onClick={() => {
            setEditingId(null);
            setFormData({ source_type: 'KNITTING', hf_code: '', fabric_code: '', count: '', lot_no: '', initial_weight: '', dyer_name_id: '', wash_type_id: '', colour_id: '', gg: '', initial_dia: '', final_dia: '', no_of_rolls: '', final_weight: '', date: new Date().toISOString().split('T')[0] });
            setModalOpen(true);
          }}>
          Add Record
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        Records marked <strong>"From Knitting"</strong> come from knitting lots. Choose <strong>"Fabric Purchase"</strong> to dye directly purchased knitted fabric.
      </Alert>

      <DataTable columns={columns} data={data} totalCount={total} page={page} limit={limit}
        onPageChange={setPage} onLimitChange={setLimit} onSearch={setSearch}
        onEdit={handleEdit} onDelete={handleDelete} isLoading={loading} />

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? 'Edit Dyeing Record' : 'Add Dyeing Record'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Source" value={formData.source_type || 'KNITTING'}
                onChange={(e) => setFormData({ ...formData, source_type: e.target.value, hf_code: '', fabric_code: '', initial_weight: '', count: '' })}>
                <MenuItem value="KNITTING">Yarn / Knitting</MenuItem>
                <MenuItem value="INHOUSE_FABRIC">Fabric Purchase</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              {formData.source_type === 'INHOUSE_FABRIC' ? (
                <TextField select fullWidth label="Fabric Code" value={formData.fabric_code || ''}
                  onChange={(e) => {
                    const fabric = fabricOptions.find(item => item.fabric_code === e.target.value);
                    setFormData({
                      ...formData,
                      fabric_code: e.target.value,
                      hf_code: e.target.value,
                      initial_weight: fabric?.total_weight || '',
                      count: '',
                    });
                  }} required>
                  {fabricOptions.map((fabric) => (
                    <MenuItem key={fabric.id} value={fabric.fabric_code}>
                      {fabric.fabric_code} - {fabric.particulars}
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <SmartDropdown label="HF Code" value={formData.hf_code}
                  onChange={(e) => setFormData({ ...formData, hf_code: e.target.value, fabric_code: '' })}
                  entity="/api/yarn/list/hf-codes" valueKey="hf_code" labelKey="hf_code" required />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Lot No" value={formData.lot_no}
                onChange={(e) => setFormData({ ...formData, lot_no: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={4}>
              <SmartDropdown label="Dyer Name" value={formData.dyer_name_id}
                onChange={(e) => setFormData({ ...formData, dyer_name_id: e.target.value })} entity="dyer-names" required />
            </Grid>
            <Grid item xs={12} sm={4}>
              <SmartDropdown label="Wash Type" value={formData.wash_type_id}
                onChange={(e) => setFormData({ ...formData, wash_type_id: e.target.value })} entity="wash-types" required />
            </Grid>
            <Grid item xs={12} sm={4}>
              <SmartDropdown label="Colour" value={formData.colour_id}
                onChange={(e) => setFormData({ ...formData, colour_id: e.target.value })} entity="colours" required />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Count" value={formData.count}
                onChange={(e) => setFormData({ ...formData, count: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Initial Weight (kg)" value={formData.initial_weight}
                onChange={(e) => setFormData({ ...formData, initial_weight: e.target.value })}
                InputProps={{ readOnly: formData.source_type === 'INHOUSE_FABRIC' }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Final Weight (kg)" value={formData.final_weight}
                onChange={(e) => setFormData({ ...formData, final_weight: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Initial Dia" value={formData.initial_dia}
                onChange={(e) => setFormData({ ...formData, initial_dia: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Final Dia" value={formData.final_dia}
                onChange={(e) => setFormData({ ...formData, final_dia: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="GG" value={formData.gg}
                onChange={(e) => setFormData({ ...formData, gg: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="No of Rolls" value={formData.no_of_rolls}
                onChange={(e) => setFormData({ ...formData, no_of_rolls: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="date" label="Date" InputLabelProps={{ shrink: true }}
                value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
            </Grid>
            {liveProcessLoss !== null && (
              <Grid item xs={12}>
                <Alert severity={liveProcessLoss > 0 ? 'error' : liveProcessLoss < 0 ? 'success' : 'info'} icon={false} sx={{ fontWeight: 600 }}>
                  Process Change: {liveProcessLoss > 0 ? '-' : '+'}{Math.abs(liveProcessLoss).toFixed(2)}%
                  {liveProcessLoss > 0 ? ' — Weight lost.' : liveProcessLoss < 0 ? ' — Weight gained.' : ' — No change.'}
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dyeing;
