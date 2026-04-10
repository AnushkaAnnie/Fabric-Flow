import { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { Plus } from 'lucide-react';
import DataTable from '../components/common/DataTable';
import SmartDropdown from '../components/common/SmartDropdown';
import api from '../api/axios';

const Knitting = () => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    hf_code: '', knitter_name_id: '',
    yarn_quantity: '', loop_length: '', dia: '', count: '', gauge: '',
    date_given: new Date().toISOString().split('T')[0],
    fabric_description_id: '', grey_fabric_weight: '', 
    other_yarn_type: '', other_yarn_percentage: '',
    gsm: '', no_of_rolls: '', date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/knitting?page=${page}&limit=${limit}&search=${search}`);
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
        await api.put(`/knitting/${editingId}`, formData);
      } else {
        await api.post('/knitting', formData);
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
      date_given: new Date(row.date_given).toISOString().split('T')[0],
      date: new Date(row.date).toISOString().split('T')[0]
    });
    setEditingId(row.id);
    setModalOpen(true);
  };

  const handleDelete = async (row) => {
    if (window.confirm(`Delete Knitting record?`)) {
      try {
        await api.delete(`/knitting/${row.id}`);
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const columns = [
    { field: 'hf_code', headerName: 'HF Code' },
    { field: 'knitterName', headerName: 'Knitter', renderCell: (row) => row.knitterName?.name },
    { field: 'fabricDescription', headerName: 'Fabric', renderCell: (row) => row.fabricDescription?.name },
    { field: 'grey_fabric_weight', headerName: 'Grey Wt' },
    { field: 'other_yarn_type', headerName: 'Other Yarn' },
    { field: 'other_yarn_percentage', headerName: 'Other Y. %' },
    { field: 'gsm', headerName: 'GSM' },
    { field: 'yarn_quantity', headerName: 'Yarn Qty' },
    { field: 'date', headerName: 'Date', renderCell: (row) => new Date(row.date).toLocaleDateString() },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" color="text.primary">Knitting Tracker</Typography>
        <Button 
          variant="contained" 
          startIcon={<Plus size={18} />}
          onClick={() => {
            setEditingId(null);
            setFormData({
              hf_code: '', knitter_name_id: '',
              yarn_quantity: '', loop_length: '', dia: '', count: '', gauge: '',
              date_given: new Date().toISOString().split('T')[0],
              fabric_description_id: '', grey_fabric_weight: '',
              other_yarn_type: '', other_yarn_percentage: '',
              gsm: '', no_of_rolls: '', date: new Date().toISOString().split('T')[0]
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
        <DialogTitle>{editingId ? 'Edit Knitting Record' : 'Add Post-Knitting Record'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <SmartDropdown label="HF Code" value={formData.hf_code} onChange={(e) => setFormData({...formData, hf_code: e.target.value})} entity="/api/yarn/list/hf-codes" valueKey="hf_code" labelKey="hf_code" required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <SmartDropdown label="Knitter Name" value={formData.knitter_name_id} onChange={(e) => setFormData({...formData, knitter_name_id: e.target.value})} entity="knitter-names" required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <SmartDropdown label="Fabric Description" value={formData.fabric_description_id} onChange={(e) => setFormData({...formData, fabric_description_id: e.target.value})} entity="fabric-descriptions" required />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="HF Code" value={formData.hf_code} onChange={(e) => setFormData({...formData, hf_code: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Yarn Quantity" value={formData.yarn_quantity} onChange={(e) => setFormData({...formData, yarn_quantity: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Loop Length" value={formData.loop_length} onChange={(e) => setFormData({...formData, loop_length: e.target.value})} />
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField fullWidth type="number" label="Dia" value={formData.dia} onChange={(e) => setFormData({...formData, dia: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label="Count" value={formData.count} onChange={(e) => setFormData({...formData, count: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label="Gauge" value={formData.gauge} onChange={(e) => setFormData({...formData, gauge: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth type="number" label="GSM" value={formData.gsm} onChange={(e) => setFormData({...formData, gsm: e.target.value})} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Grey Fabric Weight" type="number" inputProps={{step:"any"}} value={formData.grey_fabric_weight} onChange={(e) => setFormData({...formData, grey_fabric_weight: e.target.value})} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Other Yarn Type (Optional)" value={formData.other_yarn_type} onChange={(e) => setFormData({...formData, other_yarn_type: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Other Yarn % (Optional)" type="number" inputProps={{step:"any"}} value={formData.other_yarn_percentage || ''} onChange={(e) => setFormData({...formData, other_yarn_percentage: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="No of Rolls" value={formData.no_of_rolls} onChange={(e) => setFormData({...formData, no_of_rolls: e.target.value})} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Date Given" InputLabelProps={{ shrink: true }} value={formData.date_given} onChange={(e) => setFormData({...formData, date_given: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Date Received" InputLabelProps={{ shrink: true }} value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
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

export default Knitting;
