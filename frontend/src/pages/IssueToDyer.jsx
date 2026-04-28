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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Typography,
  Chip,
} from '@mui/material';
import { Trash2, Send, CheckCircle } from 'lucide-react';
import api from '../api/axios';

export default function IssueToDyer() {
  const [greyFabrics, setGreyFabrics] = useState([]);
  const [selectedLots, setSelectedLots] = useState([]);
  const [dyeingOrders, setDyeingOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const [orderForm, setOrderForm] = useState({
    dcNo: '',
    dyerName: '',
    issueDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    fetchGreyFabrics();
    fetchDyeingOrders();
  }, []);

  const fetchGreyFabrics = async () => {
    try {
      const knittingRes = await api.get('/knitting');
      const knittings = knittingRes.data.data || [];

      const fabricsWithDetails = [];
      for (const knitting of knittings) {
        if (knitting.greyFabric) {
          // Calculate remaining quantity
          const dyeingRes = await api.get(`/dyeing-orders`);
          const dyeingOrders = dyeingRes.data.data || [];

          let totalIssued = 0;
          for (const order of dyeingOrders) {
            for (const lot of order.lots) {
              if (lot.knittingId === knitting.id) {
                totalIssued += lot.weight;
              }
            }
          }

          const remaining = knitting.greyFabric.quantity - totalIssued;

          fabricsWithDetails.push({
            knittingId: knitting.id,
            hfCode: knitting.hf_code,
            greyFabric: knitting.greyFabric,
            remaining: Math.max(0, remaining),
            totalQuantity: knitting.greyFabric.quantity,
            issued: totalIssued,
          });
        }
      }

      setGreyFabrics(fabricsWithDetails);
    } catch (err) {
      console.error('Failed to fetch grey fabrics:', err);
    }
  };

  const fetchDyeingOrders = async () => {
    try {
      const response = await api.get('/dyeing-orders');
      setDyeingOrders(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch dyeing orders:', err);
    }
  };

  const handleSelectLot = (index) => {
    setSelectedLots(prev => {
      const updated = [...prev];
      updated[index] = updated[index] ? { ...updated[index] } : { colour: '', weight: '' };
      return updated;
    });
  };

  const handleLotChange = (index, field, value) => {
    setSelectedLots(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleOrderFormChange = (e) => {
    const { name, value } = e.target;
    setOrderForm(prev => ({ ...prev, [name]: value }));
  };

  const getSelectedLotsForSubmit = () => {
    return greyFabrics
      .map((fabric, index) => {
        const lotData = selectedLots[index];
        if (lotData && lotData.colour && lotData.weight) {
          return {
            knittingId: fabric.knittingId,
            colour: lotData.colour,
            weight: parseFloat(lotData.weight),
          };
        }
        return null;
      })
      .filter(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const lotsToSubmit = getSelectedLotsForSubmit();

    if (!orderForm.dcNo || !orderForm.dyerName) {
      setError('Please enter DC Number and Dyer Name');
      return;
    }

    if (lotsToSubmit.length === 0) {
      setError('Please select at least one lot with colour and weight');
      return;
    }

    // Validate weights
    for (let i = 0; i < lotsToSubmit.length; i++) {
      const fabric = greyFabrics.find(f => f.knittingId === lotsToSubmit[i].knittingId);
      if (lotsToSubmit[i].weight > fabric.remaining) {
        setError(
          `Insufficient grey fabric for ${fabric.hfCode}. Available: ${fabric.remaining.toFixed(2)} kg, Requested: ${lotsToSubmit[i].weight} kg`
        );
        return;
      }
    }

    try {
      setLoading(true);
      const response = await api.post('/dyeing-orders', {
        dcNo: orderForm.dcNo,
        dyerName: orderForm.dyerName,
        issueDate: orderForm.issueDate,
        notes: orderForm.notes || null,
        lots: lotsToSubmit,
      });

      setSuccess('Dyeing order created successfully!');
      setDialogOpen(false);
      setOrderForm({ dcNo: '', dyerName: '', issueDate: new Date().toISOString().split('T')[0], notes: '' });
      setSelectedLots([]);

      // Refresh orders and fabrics
      await fetchGreyFabrics();
      await fetchDyeingOrders();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create dyeing order');
    } finally {
      setLoading(false);
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
          startIcon={<Send size={20} />}
          onClick={() => setDialogOpen(true)}
        >
          Create Dyeing Order
        </Button>
      </Box>

      {/* Create Order Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Issue Grey Fabric to Dyer</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            {/* Order Details */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Order Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="dcNo"
                    label="DC Number"
                    value={orderForm.dcNo}
                    onChange={handleOrderFormChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="dyerName"
                    label="Dyer Name"
                    value={orderForm.dyerName}
                    onChange={handleOrderFormChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    name="issueDate"
                    label="Issue Date"
                    value={orderForm.issueDate}
                    onChange={handleOrderFormChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="notes"
                    label="Notes (Optional)"
                    multiline
                    rows={2}
                    value={orderForm.notes}
                    onChange={handleOrderFormChange}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Grey Fabrics Selection */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Select Lots for Dyeing
              </Typography>
              {greyFabrics.length === 0 ? (
                <Alert severity="info">No grey fabrics available</Alert>
              ) : (
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell width={40}><strong>Select</strong></TableCell>
                        <TableCell><strong>HF Code</strong></TableCell>
                        <TableCell align="right"><strong>Available (kg)</strong></TableCell>
                        <TableCell><strong>Colour</strong></TableCell>
                        <TableCell align="right"><strong>Weight (kg)</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {greyFabrics.map((fabric, index) => {
                        const isSelected = selectedLots[index] && selectedLots[index].colour;
                        return (
                          <TableRow key={fabric.knittingId} sx={{ backgroundColor: isSelected ? '#f0f8ff' : 'inherit' }}>
                            <TableCell>
                              <Checkbox
                                checked={isSelected}
                                onChange={() => handleSelectLot(index)}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 500 }}>{fabric.hfCode}</TableCell>
                            <TableCell align="right">
                              <Chip
                                label={fabric.remaining.toFixed(2)}
                                color={fabric.remaining > 0 ? 'success' : 'error'}
                                variant="outlined"
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {isSelected ? (
                                <TextField
                                  size="small"
                                  value={selectedLots[index]?.colour || ''}
                                  onChange={(e) => handleLotChange(index, 'colour', e.target.value)}
                                  placeholder="e.g., Red, Blue"
                                />
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {isSelected ? (
                                <TextField
                                  size="small"
                                  type="number"
                                  inputProps={{ step: '0.01', min: '0', max: fabric.remaining }}
                                  value={selectedLots[index]?.weight || ''}
                                  onChange={(e) => handleLotChange(index, 'weight', e.target.value)}
                                  sx={{ width: 100 }}
                                />
                              ) : (
                                '-'
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle size={20} />}
          >
            {loading ? 'Creating...' : 'Create Order'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dyeing Orders List */}
      <Card>
        <CardHeader title="Dyeing Orders" />
        <CardContent>
          {dyeingOrders.length === 0 ? (
            <Alert severity="info">No dyeing orders created yet</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>DC Number</strong></TableCell>
                    <TableCell><strong>Dyer Name</strong></TableCell>
                    <TableCell align="center"><strong>Lots</strong></TableCell>
                    <TableCell><strong>Issue Date</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dyeingOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell sx={{ fontWeight: 500 }}>{order.dcNo}</TableCell>
                      <TableCell>{order.dyerName}</TableCell>
                      <TableCell align="center">
                        <Chip label={order.lotCount} color="primary" size="small" />
                      </TableCell>
                      <TableCell>{new Date(order.issueDate).toLocaleDateString()}</TableCell>
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
