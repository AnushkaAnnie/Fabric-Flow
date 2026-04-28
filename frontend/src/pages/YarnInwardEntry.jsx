import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from '@mui/material';
import { Trash2, Plus, PackagePlus } from 'lucide-react';
import SmartDropdown from '../components/common/SmartDropdown';
import api from '../api/axios';

export default function YarnInwardEntry() {
  const [formData, setFormData] = useState({
    yarnId: '',
    quantity: '',
    dcNo: '',
    notes: '',
  });
  const [yarnOptions, setYarnOptions] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchYarnOptions();
    fetchReceipts();
  }, []);

  const fetchYarnOptions = async () => {
    try {
      const response = await api.get('/yarn/list/hf-codes');
      const options = response.data.map(yarn => ({
        id: yarn.id,
        label: `${yarn.hf_code} - ${yarn.description}`,
        value: yarn.id,
      }));
      setYarnOptions(options);
    } catch (err) {
      console.error('Failed to fetch yarns:', err);
    }
  };

  const fetchReceipts = async () => {
    try {
      const response = await api.get('/yarn-receipts');
      setReceipts(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch receipts:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleYarnSelect = (selectedId) => {
    setFormData(prev => ({ ...prev, yarnId: selectedId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.yarnId || !formData.quantity) {
      setError('Please select a yarn and enter a quantity');
      return;
    }

    try {
      setLoading(true);
      await api.post('/yarn-receipts', {
        yarnId: parseInt(formData.yarnId),
        quantity: parseFloat(formData.quantity),
        dcNo: formData.dcNo || null,
        notes: formData.notes || null,
      });

      setSuccess('Yarn receipt recorded successfully!');
      setFormData({ yarnId: '', quantity: '', dcNo: '', notes: '' });
      setDialogOpen(false);
      
      // Refresh receipts list
      await fetchReceipts();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record receipt');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReceipt = async (id) => {
    if (window.confirm('Are you sure you want to delete this receipt?')) {
      try {
        await api.delete(`/yarn-receipts/${id}`);
        setSuccess('Receipt deleted successfully!');
        fetchReceipts();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete receipt');
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Plus size={20} />}
          onClick={() => setDialogOpen(true)}
        >
          Record Yarn Inward
        </Button>
      </Box>

      {/* Dialog for adding receipt */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Yarn Inward</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <SmartDropdown
              label="Select Yarn"
              options={yarnOptions}
              value={formData.yarnId}
              onChange={handleYarnSelect}
              required
            />
            <TextField
              name="quantity"
              label="Quantity (kg)"
              type="number"
              inputProps={{ step: '0.01', min: '0' }}
              value={formData.quantity}
              onChange={handleInputChange}
              required
            />
            <TextField
              name="dcNo"
              label="DC Number (Optional)"
              value={formData.dcNo}
              onChange={handleInputChange}
            />
            <TextField
              name="notes"
              label="Notes (Optional)"
              multiline
              rows={3}
              value={formData.notes}
              onChange={handleInputChange}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <PackagePlus size={20} />}
          >
            {loading ? 'Recording...' : 'Record Receipt'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Receipts Table */}
      <Card>
        <CardHeader title="Yarn Inward Records" />
        <CardContent>
          {receipts.length === 0 ? (
            <Alert severity="info">No yarn receipts recorded yet</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>HF Code</strong></TableCell>
                    <TableCell><strong>Description</strong></TableCell>
                    <TableCell align="right"><strong>Quantity (kg)</strong></TableCell>
                    <TableCell><strong>DC Number</strong></TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell align="center"><strong>Action</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {receipts.map(receipt => (
                    <TableRow key={receipt.id}>
                      <TableCell>{receipt.yarn.hf_code}</TableCell>
                      <TableCell>{receipt.yarn.description}</TableCell>
                      <TableCell align="right">{receipt.quantity.toFixed(2)}</TableCell>
                      <TableCell>{receipt.dcNo || '-'}</TableCell>
                      <TableCell>{new Date(receipt.receiptDate).toLocaleDateString()}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteReceipt(receipt.id)}
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
