import { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
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
  
  const [formData, setFormData] = useState({
    hf_code: '', lot_no: '', initial_weight: '', dyer_name_id: '',
    wash_type_id: '', colour_id: '', gg: '', initial_dia: '',
    final_dia: '', initial_gsm: '', final_gsm: '',
    final_quantity: '', no_of_rolls: '', final_weight: '', 
    date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/dyeing?page=${page}&limit=${limit}&search=${search}`);
      setData(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [page, limit, search]);

  const handleSave = async () => {
    try {
      if (editingId) {
        await api.put(`/dyeing/${editingId}`, formData);
      } else {
        await api.post('/dyeing', formData);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error saving data');
    }
  };

  const handleEdit = (row) => {
    setFormData({
      ...row,
      date: new Date(row.date).toISOString().split('T')[0]
    });
    setEditingId(row.id);
    setModalOpen(true);
  };

  const handleDelete = async (row) => {
    if (window.confirm(`Delete Dyeing record for Lot No ${row.lot_no}?`)) {
      try {
        await api.delete(`/dyeing/${row.id}`);
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const columns = [
    { field: 'hf_code', headerName: 'HF Code' },
    { field: 'lot_no', headerName: 'Lot No' },
    { field: 'dyerName', headerName: 'Dyer', renderCell: (r) => r.dyerName?.name },
    { field: 'colour', headerName: 'Colour', renderCell: (row) => row.colour?.name },
    { field: 'washType', headerName: 'Wash', renderCell: (row) => row.washType?.name },
    { field: 'initial_weight', headerName: 'Input Wt' },
    { field: 'final_weight', headerName: 'Output Wt' },
    { field: 'date', headerName: 'Date', renderCell: (row) => new Date(row.date).toLocaleDateString() },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" color="text.primary">Dyeing Tracker</Typography>
        <Button 
          variant="contained" 
          startIcon={<Plus size={18} />}
          onClick={() => {
            setEditingId(null);
            setFormData({
              hf_code: '', lot_no: '', initial_weight: '', dyer_name_id: '',
              wash_type_id: '', colour_id: '', gg: '', initial_dia: '',
              final_dia: '', initial_gsm: '', final_gsm: '',
              final_quantity: '', no_of_rolls: '', final_weight: '', 
              date: new Date().toISOString().split('T')[0]
            });
            setModalOpen(true);
          }}
        >
          Add Record
        </Button>
      </Box>

      <DataTable 
        columns={columns}
        data={data}
        totalCount={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onSearch={setSearch}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={loading}
      />

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? 'Edit Dyeing Record' : 'Add Dyeing Record'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <SmartDropdown label="HF Code" value={formData.hf_code} onChange={(e) => setFormData({...formData, hf_code: e.target.value})} entity="/api/yarn/list/hf-codes" valueKey="hf_code" labelKey="hf_code" required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Lot No (Assign New)" value={formData.lot_no} onChange={(e) => setFormData({...formData, lot_no: e.target.value})} required />
            </Grid>
            <Grid item xs={12} sm={4}>
              <SmartDropdown label="Dyer Name" value={formData.dyer_name_id} onChange={(e) => setFormData({...formData, dyer_name_id: e.target.value})} entity="dyer-names" required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <SmartDropdown label="Wash Type" value={formData.wash_type_id} onChange={(e) => setFormData({...formData, wash_type_id: e.target.value})} entity="wash-types" required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <SmartDropdown label="Colour" value={formData.colour_id} onChange={(e) => setFormData({...formData, colour_id: e.target.value})} entity="colours" required />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Initial Weight" value={formData.initial_weight} onChange={(e) => setFormData({...formData, initial_weight: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Final Weight" value={formData.final_weight} onChange={(e) => setFormData({...formData, final_weight: e.target.value})} required />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Final Quantity (kg)" value={formData.final_quantity} onChange={(e) => setFormData({...formData, final_quantity: e.target.value})} />
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField fullWidth type="number" label="Initial Dia" value={formData.initial_dia} onChange={(e) => setFormData({...formData, initial_dia: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth type="number" label="Final Dia" value={formData.final_dia} onChange={(e) => setFormData({...formData, final_dia: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth type="number" label="Initial GSM" value={formData.initial_gsm} onChange={(e) => setFormData({...formData, initial_gsm: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth type="number" label="Final GSM" value={formData.final_gsm} onChange={(e) => setFormData({...formData, final_gsm: e.target.value})} />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="GG" value={formData.gg} onChange={(e) => setFormData({...formData, gg: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="No of Rolls" value={formData.no_of_rolls} onChange={(e) => setFormData({...formData, no_of_rolls: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="date" label="Date" InputLabelProps={{ shrink: true }} value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
            </Grid>
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
