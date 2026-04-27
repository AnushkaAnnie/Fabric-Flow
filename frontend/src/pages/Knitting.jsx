import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Grid, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Chip, Divider, IconButton, Paper, Alert, Tooltip, Table,
  TableHead, TableBody, TableRow, TableCell, Collapse, Autocomplete
} from '@mui/material';
import { Plus, Trash2, ChevronDown, ChevronRight, PlusCircle } from 'lucide-react';
import DataTable from '../components/common/DataTable';
import SmartDropdown from '../components/common/SmartDropdown';
import api from '../api/axios';

const emptyYarnUsage = () => ({ hf_code: '', yarn_id: '', remaining: null, total: null });
const emptyLotEntry = () => ({ colour_id: '', weight: '' });
const emptyLot = () => ({ lot_no: '', job_work_no: '', dyer_name_id: '', entries: [emptyLotEntry()] });

const emptyForm = () => ({
  dc_no: '', knitter_name_id: '', total_yarn_qty: '', loop_length: '', dia: '', count: '', gauge: '',
  date_given: new Date().toISOString().split('T')[0],
  fabric_description_id: '', grey_fabric_weight: '', received_weight: '',
  other_yarn_type: '', other_yarn_percentage: '',
  no_of_rolls: '', date: new Date().toISOString().split('T')[0],
  yarnUsages: [emptyYarnUsage()],
  lots: [],
});

const Knitting = () => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [hfCodeOptions, setHfCodeOptions] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/knitting?page=${page}&limit=${limit}&search=${search}`);
      setData(res.data.data);
      setTotal(res.data.total);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [page, limit, search]);

  const fetchHfOptions = useCallback(async () => {
    try {
      const res = await api.get('/yarn/list/hf-codes');
      setHfCodeOptions(res.data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (modalOpen) fetchHfOptions(); }, [modalOpen, fetchHfOptions]);

  // When an HF code is selected in a yarn usage row, auto-fill count and fetch remaining
  const handleHfCodeChange = async (idx, hfCode) => {
    const opt = hfCodeOptions.find(o => o.hf_code === hfCode);
    const newUsages = [...formData.yarnUsages];
    newUsages[idx] = {
      ...newUsages[idx],
      hf_code: hfCode,
      yarn_id: opt?.id || '',
      remaining: opt ? opt.remaining : null,
      total: opt ? opt.total_weight : null,
    };
    setFormData(prev => ({
      ...prev,
      yarnUsages: newUsages,
      count: opt ? (prev.count || '') : prev.count,
    }));

    // Auto-fill count from first HF code
    if (idx === 0 && opt) {
      try {
        const res = await api.get(`/yarn/hf/${hfCode}`);
        if (res.data?.count) setFormData(prev => ({ ...prev, count: res.data.count }));
      } catch {}
    }
  };

  const updateUsage = (idx, field, val) => {
    const newUsages = [...formData.yarnUsages];
    newUsages[idx] = { ...newUsages[idx], [field]: val };
    setFormData(prev => ({ ...prev, yarnUsages: newUsages }));
  };

  const addUsage = () => setFormData(prev => ({ ...prev, yarnUsages: [...prev.yarnUsages, emptyYarnUsage()] }));
  const removeUsage = (idx) => setFormData(prev => ({ ...prev, yarnUsages: prev.yarnUsages.filter((_, i) => i !== idx) }));

  const addLot = () => setFormData(prev => ({ ...prev, lots: [...prev.lots, emptyLot()] }));
  const removeLot = (idx) => setFormData(prev => ({ ...prev, lots: prev.lots.filter((_, i) => i !== idx) }));

  const updateLot = (idx, field, val) => {
    const newLots = [...formData.lots];
    newLots[idx] = { ...newLots[idx], [field]: val };
    setFormData(prev => ({ ...prev, lots: newLots }));
  };

  const addLotEntry = (lotIdx) => {
    const newLots = [...formData.lots];
    newLots[lotIdx] = { ...newLots[lotIdx], entries: [...newLots[lotIdx].entries, emptyLotEntry()] };
    setFormData(prev => ({ ...prev, lots: newLots }));
  };

  const removeLotEntry = (lotIdx, entryIdx) => {
    const newLots = [...formData.lots];
    newLots[lotIdx] = { ...newLots[lotIdx], entries: newLots[lotIdx].entries.filter((_, i) => i !== entryIdx) };
    setFormData(prev => ({ ...prev, lots: newLots }));
  };

  const updateLotEntry = (lotIdx, entryIdx, field, val) => {
    const newLots = [...formData.lots];
    const newEntries = [...newLots[lotIdx].entries];
    newEntries[entryIdx] = { ...newEntries[entryIdx], [field]: val };
    newLots[lotIdx] = { ...newLots[lotIdx], entries: newEntries };
    setFormData(prev => ({ ...prev, lots: newLots }));
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        hf_code: formData.yarnUsages[0]?.hf_code || '',
      };
      if (editingId) {
        await api.put(`/knitting/${editingId}`, payload);
      } else {
        await api.post('/knitting', payload);
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
      dc_no: row.dc_no || '',
      knitter_name_id: row.knitter_name_id || '',
      loop_length: row.loop_length || '',
      dia: row.dia || '',
      count: row.count || '',
      gauge: row.gauge || '',
      date_given: new Date(row.date_given).toISOString().split('T')[0],
      fabric_description_id: row.fabric_description_id || '',
      grey_fabric_weight: row.grey_fabric_weight || '',
      received_weight: row.received_weight || '',
      other_yarn_type: row.other_yarn_type || '',
      other_yarn_percentage: row.other_yarn_percentage || '',
      no_of_rolls: row.no_of_rolls || '',
      date: new Date(row.date).toISOString().split('T')[0],
      total_yarn_qty: row.total_yarn_qty || '',
      yarnUsages: (row.yarnUsages || []).map(u => ({
        hf_code: u.hf_code,
        yarn_id: u.yarn_id,
        remaining: null,
        total: null,
      })),
      lots: (row.lots || []).map(lot => ({
        lot_no: lot.lot_no,
        job_work_no: lot.job_work_no || '',
        dyer_name_id: lot.dyer_name_id,
        entries: (lot.entries || []).map(e => ({
          colour_id: e.colour_id,
          weight: e.weight,
        })),
      })),
    });
    setEditingId(row.id);
    setModalOpen(true);
  };

  const handleDelete = async (row) => {
    try {
      await api.delete(`/knitting/${row.id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting record.');
    }
  };

  const toggleRow = (id) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));

  const columns = [
    {
      field: 'expand', headerName: '',
      renderCell: (row) => (
        <IconButton size="small" onClick={() => toggleRow(row.id)}>
          {expandedRows[row.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </IconButton>
      )
    },
    { field: 'hf_code', headerName: 'HF Code(s)',
      renderCell: (row) => (row.yarnUsages || []).map(u => u.hf_code).join(', ') || row.hf_code
    },
    { field: 'dc_no', headerName: 'DC No' },
    { field: 'knitterName', headerName: 'Knitter', renderCell: (row) => row.knitterName?.name },
    { field: 'fabricDescription', headerName: 'Fabric', renderCell: (row) => row.fabricDescription?.name },
    { field: 'loop_length', headerName: 'Loop Length' },
    { field: 'dia', headerName: 'Dia' },
    { field: 'count', headerName: 'Count' },
    { field: 'gauge', headerName: 'Gauge' },
    { field: 'grey_fabric_weight', headerName: 'Grey Wt (kg)' },
    { field: 'received_weight', headerName: 'Received Wt (kg)', renderCell: (row) => row.received_weight != null ? row.received_weight : '—' },
    { field: 'no_of_rolls', headerName: 'Rolls' },
    {
      field: 'lots', headerName: 'Lots',
      renderCell: (row) => (row.lots || []).length > 0
        ? <Chip label={`${row.lots.length} lot(s)`} size="small" color="info" variant="outlined" />
        : <Chip label="None" size="small" variant="outlined" />
    },
    {
      field: 'status', headerName: 'Status',
      renderCell: (row) => {
        const isComplete = Number(row.grey_fabric_weight) > 0;
        return <Chip label={isComplete ? 'Completed' : 'Pending'} color={isComplete ? 'success' : 'warning'} size="small" variant="outlined" />;
      }
    },
    { field: 'date_given', headerName: 'Date Given', renderCell: (row) => new Date(row.date_given).toLocaleDateString() },
    { field: 'date', headerName: 'Date Received', renderCell: (row) => new Date(row.date).toLocaleDateString() },
  ];

  // Custom table expansion row rendering (injected after each row)
  const renderExpanded = (row) => {
    if (!expandedRows[row.id]) return null;
    return (
      <Box sx={{ px: 3, py: 1.5, bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>Yarn HF Code Usages</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>Total Yarn Given: <strong>{row.total_yarn_qty} kg</strong></Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {(row.yarnUsages || []).map((u, i) => (
                <Chip key={i} label={u.hf_code} size="small" variant="outlined" />
              ))}
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>Dyeing Lots</Typography>
            {(row.lots || []).length === 0 ? <Typography variant="body2" color="text.secondary">No lots assigned.</Typography> : (
              row.lots.map((lot, li) => (
                <Box key={li} sx={{ mb: 1, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight={600}>Lot: {lot.lot_no} {lot.job_work_no ? `(Job Work: ${lot.job_work_no}) ` : ''}→ {lot.dyerName?.name}</Typography>
                  {(lot.entries || []).map((e, ei) => (
                    <Typography key={ei} variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      {e.colour?.name} — {e.weight} kg
                    </Typography>
                  ))}
                </Box>
              ))
            )}
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" color="text.primary">Knitting Tracker</Typography>
        <Button variant="contained" startIcon={<Plus size={18} />}
          onClick={() => { setEditingId(null); setFormData(emptyForm()); setModalOpen(true); }}>
          Add Record
        </Button>
      </Box>

      <DataTable
        columns={columns} data={data} totalCount={total} page={page} limit={limit}
        onPageChange={setPage} onLimitChange={setLimit} onSearch={setSearch}
        onEdit={handleEdit} onDelete={handleDelete} isLoading={loading}
        expandedContent={renderExpanded}
      />

      {/* ── Add / Edit Dialog ── */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="lg" fullWidth
        PaperProps={{ sx: { maxHeight: '95vh' } }}>
        <DialogTitle>{editingId ? 'Edit Knitting Record' : 'Add Knitting Record'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>

            {/* ── Section: Knitter Details ── */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={600} color="primary" gutterBottom>
                Knitter Details
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="DC No" value={formData.dc_no}
                onChange={(e) => setFormData({ ...formData, dc_no: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={8}>
              <SmartDropdown label="Knitter Name" value={formData.knitter_name_id}
                onChange={(e) => setFormData({ ...formData, knitter_name_id: e.target.value })}
                entity="knitter-names" required />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label="Total Yarn Qty (kg)" type="number" value={formData.total_yarn_qty}
                onChange={(e) => setFormData({ ...formData, total_yarn_qty: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label="Loop Length (mm)" type="number" value={formData.loop_length}
                onChange={(e) => setFormData({ ...formData, loop_length: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label="Dia (inches)" type="number" value={formData.dia}
                onChange={(e) => setFormData({ ...formData, dia: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label="Count (auto from yarn)" value={formData.count}
                onChange={(e) => setFormData({ ...formData, count: e.target.value })}
                helperText="Auto-filled from first HF Code" />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label="Gauge" value={formData.gauge}
                onChange={(e) => setFormData({ ...formData, gauge: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <SmartDropdown label="Fabric Description" value={formData.fabric_description_id}
                onChange={(e) => setFormData({ ...formData, fabric_description_id: e.target.value })}
                entity="fabric-descriptions" required />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label="Grey Fabric Weight (kg)" type="number" value={formData.grey_fabric_weight}
                onChange={(e) => setFormData({ ...formData, grey_fabric_weight: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label="Received Weight from Yarn (kg)" type="number" value={formData.received_weight}
                onChange={(e) => setFormData({ ...formData, received_weight: e.target.value })}
                helperText="Actual weight received back from knitter" />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label="No of Rolls" type="number" value={formData.no_of_rolls}
                onChange={(e) => setFormData({ ...formData, no_of_rolls: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label="Other Yarn Type" value={formData.other_yarn_type}
                onChange={(e) => setFormData({ ...formData, other_yarn_type: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label="Other Yarn %" type="number" value={formData.other_yarn_percentage}
                onChange={(e) => setFormData({ ...formData, other_yarn_percentage: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth type="date" label="Date Given" InputLabelProps={{ shrink: true }}
                value={formData.date_given} onChange={(e) => setFormData({ ...formData, date_given: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth type="date" label="Date Received" InputLabelProps={{ shrink: true }}
                value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
            </Grid>

            {/* ── Section: Yarn HF Code Usages ── */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" fontWeight={600} color="primary" sx={{ mb: 1.5 }}>
                Yarn Usage (Select HF Codes)
              </Typography>
              <Autocomplete
                multiple
                options={hfCodeOptions}
                getOptionLabel={(option) => `${option.hf_code} — ${option.description} (Rem: ${(option.remaining || 0).toFixed(1)} kg)`}
                isOptionEqualToValue={(option, value) => option.hf_code === value.hf_code}
                value={hfCodeOptions.filter(opt => formData.yarnUsages.some(u => u.hf_code === opt.hf_code))}
                onChange={(event, newValue) => {
                  setFormData(prev => ({
                    ...prev,
                    yarnUsages: newValue.map(opt => ({ hf_code: opt.hf_code, remaining: opt.remaining }))
                  }));
                }}
                renderInput={(params) => (
                  <TextField {...params} variant="outlined" label="HF Codes" placeholder="Select HF Codes..." />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={key}
                        variant="outlined"
                        label={`${option.hf_code} (${option.remaining?.toFixed(1)}kg)`}
                        {...tagProps}
                        color={option.remaining > 0 ? 'success' : 'error'}
                        size="small"
                        sx={{ m: 0.5 }}
                      />
                    );
                  })
                }
              />
            </Grid>

            {/* ── Section: Dyeing Lots ── */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={600} color="primary">
                  Dyeing Lots
                </Typography>
                <Button size="small" startIcon={<PlusCircle size={14} />} onClick={addLot}>Add Lot</Button>
              </Box>
              {formData.lots.length === 0 && (
                <Typography variant="body2" color="text.secondary">No lots added. Click "Add Lot" to assign dyeing lots.</Typography>
              )}
              {formData.lots.map((lot, lotIdx) => (
                <Paper key={lotIdx} variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
                  <Grid container spacing={1.5} alignItems="flex-start">
                    <Grid item xs={12} sm={3}>
                      <TextField fullWidth size="small" label="Lot No" value={lot.lot_no}
                        onChange={(e) => updateLot(lotIdx, 'lot_no', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField fullWidth size="small" label="Job Work No" value={lot.job_work_no}
                        onChange={(e) => updateLot(lotIdx, 'job_work_no', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <SmartDropdown size="small" label="Dyer Name" value={lot.dyer_name_id}
                        onChange={(e) => updateLot(lotIdx, 'dyer_name_id', e.target.value)}
                        entity="dyer-names" />
                    </Grid>
                    <Grid item xs={12} sm={2} sx={{ textAlign: 'right' }}>
                      <IconButton size="small" color="error" onClick={() => removeLot(lotIdx)}>
                        <Trash2 size={14} />
                      </IconButton>
                    </Grid>
                    {/* Entries */}
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                        Colour entries for this lot:
                      </Typography>
                      {lot.entries.map((entry, entryIdx) => (
                        <Grid container spacing={1} key={entryIdx} sx={{ mt: 0.5 }} alignItems="center">
                          <Grid item xs={12} sm={5}>
                            <SmartDropdown size="small" label="Colour" value={entry.colour_id}
                              onChange={(e) => updateLotEntry(lotIdx, entryIdx, 'colour_id', e.target.value)}
                              entity="colours" />
                          </Grid>
                          <Grid item xs={8} sm={4}>
                            <TextField fullWidth size="small" type="number" label="Weight (kg)"
                              value={entry.weight}
                              onChange={(e) => updateLotEntry(lotIdx, entryIdx, 'weight', e.target.value)} />
                          </Grid>
                          <Grid item xs={4} sm={3} sx={{ textAlign: 'right' }}>
                            {lot.entries.length > 1 && (
                              <IconButton size="small" color="error" onClick={() => removeLotEntry(lotIdx, entryIdx)}>
                                <Trash2 size={12} />
                              </IconButton>
                            )}
                          </Grid>
                        </Grid>
                      ))}
                      <Button size="small" sx={{ mt: 0.5 }} onClick={() => addLotEntry(lotIdx)}>
                        + Add colour entry
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Grid>

          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Knitting;
