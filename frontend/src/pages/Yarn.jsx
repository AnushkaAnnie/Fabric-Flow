import { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Card, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { Plus } from 'lucide-react';
import DataTable from '../components/common/DataTable';
import SmartDropdown from '../components/common/SmartDropdown';
import api from '../api/axios';

const Yarn = () => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    mill_name_id: '', description: '', hf_code: '', count: '', quality: 'rl', no_of_bags: '', bag_weight: '', rate_per_kg: '', date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/yarn?page=${page}&limit=${limit}&search=${search}`);
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
        await api.put(`/yarn/${editingId}`, formData);
      } else {
        await api.post('/yarn', formData);
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
    if (window.confirm(`Delete Yarn?`)) {
      try {
        await api.delete(`/yarn/${row.id}`);
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const columns = [
    { field: 'hf_code', headerName: 'HF Code' },
    { field: 'millName', headerName: 'Mill Name', renderCell: (row) => row.millName?.name },
    { field: 'description', headerName: 'Description' },
    { field: 'count', headerName: 'Count' },
    { field: 'quality', headerName: 'Quality' },
    { field: 'no_of_bags', headerName: 'Bags' },
    { field: 'bag_weight', headerName: 'Bag Wt' },
    { field: 'total_weight', headerName: 'Total Wt' },
    { field: 'date', headerName: 'Date', renderCell: (row) => new Date(row.date).toLocaleDateString() },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" color="text.primary">Yarn Inventory</Typography>
        <Button 
          variant="contained" 
          startIcon={<Plus size={18} />}
          onClick={() => {
            setEditingId(null);
            setFormData({ mill_name_id: '', description: '', hf_code: '', count: '', quality: 'rl', no_of_bags: '', bag_weight: '', rate_per_kg: '', date: new Date().toISOString().split('T')[0] });
            setModalOpen(true);
          }}
        >
          Add Yarn
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
        <DialogTitle>{editingId ? 'Edit Yarn' : 'Add New Yarn'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <SmartDropdown label="Mill Name" value={formData.mill_name_id} onChange={(e) => setFormData({...formData, mill_name_id: e.target.value})} entity="mill-names" required />
            </Grid>
            <Grid item xs={12} sm={6}>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="HF Code" value={formData.hf_code} onChange={(e) => setFormData({...formData, hf_code: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Count" value={formData.count} onChange={(e) => setFormData({...formData, count: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select SelectProps={{ native: true }} fullWidth label="Quality" value={formData.quality} onChange={(e) => setFormData({...formData, quality: e.target.value})}>
                <option value="rl">RL</option>
                <option value="vl">VL</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="No of Bags" value={formData.no_of_bags} onChange={(e) => setFormData({...formData, no_of_bags: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Bag Weight" value={formData.bag_weight} onChange={(e) => setFormData({...formData, bag_weight: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Rate Per Kg" value={formData.rate_per_kg} onChange={(e) => setFormData({...formData, rate_per_kg: e.target.value})} />
            </Grid>
            <Grid item xs={12}>
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

export default Yarn;
