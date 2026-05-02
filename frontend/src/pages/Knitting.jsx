import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Tabs, Tab, Paper, TextField, Button, Autocomplete,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Snackbar, Alert, Grid, ToggleButtonGroup, ToggleButton,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import useKnittingStore from '../store/knittingStore';
import useDyeingStore from '../store/dyeingStore';
import { getKnitters, getYarns, getDyers, getColours } from '../api/masters';
import { getGreyFabricAvailable } from '../api/knitting';

const TabPanel = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const KnittingPage = () => {
  const [tabValue, setTabValue] = useState(0);

  // Master data
  const [knitters, setKnitters] = useState([]);
  const [yarns, setYarns] = useState([]);
  const [dyers, setDyers] = useState([]);
  const [colours, setColours] = useState([]);

  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [k, y, d, c] = await Promise.all([
          getKnitters(),
          getYarns(),
          getDyers(),
          getColours(),
        ]);
        setKnitters(k.data);
        setYarns(y.data);
        setDyers(d.data);
        setColours(c.data);
      } catch (err) {
        console.error('Failed to load master data', err);
      }
    };
    loadMasters();
  }, []);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const showSnackbar = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  // ========== STOCK TAB ==========
  const [stockKnitter, setStockKnitter] = useState(null);
  const [stockViewMode, setStockViewMode] = useState('yarn');
  const { 
    stockList, stockLoading, stockError, fetchStock,
    greyFabricLoading, greyFabricError, fetchGreyFabricForKnitter
  } = useKnittingStore();

  // Issue / Receive Yarn
  const { issueYarn } = useKnittingStore();
  const [issueForm, setIssueForm] = useState({
    knitterId: null, yarnId: null, received_weight: ''
  });

  const handleIssue = async () => {
    const result = await issueYarn(issueForm);
    if (result.success) {
      showSnackbar('Yarn received successfully');
      setIssueForm({ knitterId: null, yarnId: null, received_weight: '' });
      if (stockKnitter && stockViewMode === 'yarn') {
        fetchStock(stockKnitter.id);
      }
    } else {
      showSnackbar(result.message, 'error');
    }
  };

  // ========== DELIVERY NOTE TAB ==========
  const { deliveryNotes, deliveryNoteLoading, fetchDeliveryNotes, createDeliveryNote } = useKnittingStore();
  const [deliveryForm, setDeliveryForm] = useState({
    sourceKnitterId: null, destKnitterId: null, yarnId: null, quantity: '', transfer_dc_no: ''
  });

  useEffect(() => { fetchDeliveryNotes(); }, []);

  const handleDelivery = async () => {
    const result = await createDeliveryNote(deliveryForm);
    if (result.success) {
      showSnackbar('Transfer successful');
      setDeliveryForm({ sourceKnitterId: null, destKnitterId: null, yarnId: null, quantity: '', transfer_dc_no: '' });
    } else {
      showSnackbar(result.message, 'error');
    }
  };

  // ========== KNITTER PROGRAM TAB ==========
  const { programs, programLoading, fetchPrograms, createProgram, greyFabricList, fetchGreyFabric } = useKnittingStore();
  const [programKnitter, setProgramKnitter] = useState(null);
  const [programForm, setProgramForm] = useState({
    knitterId: null, yarns: [{ yarnId: null, quantity_used: '' }], manual_grey_weight: '', gauge: '', loop_length: '', dia: '', gsm: '', description: '', productionDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => { fetchGreyFabric(); }, []);

  const handleProgramFilter = () => {
    if (programKnitter) fetchPrograms(programKnitter.id);
  };

  const handleProgramSubmit = async () => {
    // Basic validation
    const validYarns = programForm.yarns.filter(y => y.yarnId && y.quantity_used);
    if (!validYarns.length) {
      showSnackbar('Please add at least one valid yarn and quantity', 'error');
      return;
    }
    
    const payload = {
      ...programForm,
      yarns: validYarns,
      grey_weight: programForm.manual_grey_weight
    };

    const result = await createProgram(payload);
    if (result.success) {
      showSnackbar('Program created');
      setProgramForm({ knitterId: null, yarns: [{ yarnId: null, quantity_used: '' }], manual_grey_weight: '', gauge: '', loop_length: '', dia: '', gsm: '', description: '', productionDate: new Date().toISOString().split('T')[0] });
    } else {
      showSnackbar(result.message, 'error');
    }
  };

  const handleAddYarn = () => {
    setProgramForm({
      ...programForm,
      yarns: [...programForm.yarns, { yarnId: null, quantity_used: '' }]
    });
  };

  const handleRemoveYarn = (index) => {
    const newYarns = programForm.yarns.filter((_, i) => i !== index);
    setProgramForm({ ...programForm, yarns: newYarns });
  };

  const handleYarnChange = (index, field, value) => {
    const newYarns = [...programForm.yarns];
    newYarns[index][field] = value;
    setProgramForm({ ...programForm, yarns: newYarns });
  };

  // ========== MEMO PRINTING ==========
  const [memoConfigOpen, setMemoConfigOpen] = useState(false);
  const [memoViewerOpen, setMemoViewerOpen] = useState(false);
  const [memoData, setMemoData] = useState(null);
  const [memoConfig, setMemoConfig] = useState({
    deliveryTo: '',
    colour: '',
    process: '',
    remarks: ''
  });

  const handleOpenMemoConfig = (program) => {
    setMemoData(program);
    setMemoConfig({ deliveryTo: '', colour: '', process: 'Biowash', remarks: '' });
    setMemoConfigOpen(true);
  };

  // ========== DYEING PROGRAM TAB ==========
  const { dyeingList, dyeingLoading, fetchDyeings, createDyeingProgram } = useDyeingStore();
  const [dyeingForm, setDyeingForm] = useState({
    greyFabricLotId: null, dyerId: null, lot_no: '', colour_id: null, output_weight: '', gauge: '', loop_length: ''
  });

  useEffect(() => { fetchDyeings(); }, []);

  const handleDyeingSubmit = async () => {
    const result = await createDyeingProgram(dyeingForm);
    if (result.success) {
      showSnackbar('Dyeing program created');
      setDyeingForm({ greyFabricLotId: null, dyerId: null, lot_no: '', colour_id: null, output_weight: '', gauge: '', loop_length: '' });
    } else {
      showSnackbar(result.message, 'error');
    }
  };

  // ---------- RENDER ----------
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Knitting &amp; Dyeing</Typography>
      <Paper>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="Stock" />
          <Tab label="Delivery Note" />
          <Tab label="Knitter Program" />
          <Tab label="Dyeing Program" />
        </Tabs>
      </Paper>

      {/* STOCK TAB */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={2} alignItems="center" mb={2}>
          <Grid item xs={12} sm={4}>
            <Autocomplete
              options={knitters}
              getOptionLabel={(o) => o.name}
              value={stockKnitter}
              onChange={(e, v) => {
                setStockKnitter(v);
                if (v) {
                  if (stockViewMode === 'yarn') fetchStock(v.id);
                  else fetchGreyFabricForKnitter(v.id);
                }
              }}
              renderInput={(params) => <TextField {...params} label="Select Knitter" />}
            />
          </Grid>
          <Grid item>
            <ToggleButtonGroup
              value={stockViewMode}
              exclusive
              onChange={(e, newMode) => {
                if (newMode !== null) {
                  setStockViewMode(newMode);
                  if (stockKnitter) {
                    if (newMode === 'yarn') fetchStock(stockKnitter.id);
                    else fetchGreyFabricForKnitter(stockKnitter.id);
                  }
                }
              }}
              size="small"
            >
              <ToggleButton value="yarn">Yarn Stock</ToggleButton>
              <ToggleButton value="grey">Grey Stock</ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>

        {stockLoading && <CircularProgress />}
        {greyFabricLoading && <CircularProgress />}
        {stockError && <Alert severity="error">{stockError}</Alert>}
        {greyFabricError && <Alert severity="error">{greyFabricError}</Alert>}

        {/* Yarn Stock Display */}
        {stockViewMode === 'yarn' && (
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Yarn Stock – {stockKnitter?.name || '...'}
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>HF Code</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Received (kg)</TableCell>
                    <TableCell align="right">Remaining (kg)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stockList.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.yarn?.hf_code}</TableCell>
                      <TableCell>{s.yarn?.description}</TableCell>
                      <TableCell align="right">{s.received_weight}</TableCell>
                      <TableCell align="right">{s.remaining_weight}</TableCell>
                    </TableRow>
                  ))}
                  {stockList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">No yarn stock found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Grey Stock Display */}
        {stockViewMode === 'grey' && (
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Grey Fabric Stock – {stockKnitter?.name || '...'}
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Lot ID</TableCell>
                    <TableCell>HF Code</TableCell>
                    <TableCell>Count</TableCell>
                    <TableCell>Dia (in)</TableCell>
                    <TableCell>Gauge</TableCell>
                    <TableCell>Loop Length</TableCell>
                    <TableCell align="right">Qty (kg)</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {greyFabricList.map((gf) => (
                    <TableRow key={gf.id}>
                      <TableCell>{gf.id}</TableCell>
                      <TableCell>{gf.knitterProgram?.yarns?.map(y => y.yarn?.hf_code)?.join(', ')}</TableCell>
                      <TableCell>{gf.knitterProgram?.yarns?.map(y => y.yarn?.count)?.join(', ')}</TableCell>
                      <TableCell>{gf.knitterProgram?.dia}</TableCell>
                      <TableCell>{gf.knitterProgram?.gauge}</TableCell>
                      <TableCell>{gf.knitterProgram?.loop_length}</TableCell>
                      <TableCell align="right">{Number(gf.grey_weight).toFixed(2)}</TableCell>
                      <TableCell>{Number(gf.grey_weight) === 0 ? 'Finished' : gf.status}</TableCell>
                    </TableRow>
                  ))}
                  {greyFabricList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">No grey fabric lots found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* ---- Receive Yarn from Mill ---- */}
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            Receive Yarn from Mill
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <Autocomplete
                options={knitters}
                getOptionLabel={(o) => o.name}
                onChange={(e, v) => setIssueForm({ ...issueForm, knitterId: v?.id })}
                renderInput={(p) => <TextField {...p} label="Knitter" />}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Autocomplete
                options={yarns}
                getOptionLabel={(o) => `${o.hf_code} - ${o.description}`}
                onChange={(e, v) => setIssueForm({ ...issueForm, yarnId: v?.id })}
                renderInput={(p) => <TextField {...p} label="Yarn" />}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Received Weight (kg)"
                type="number"
                fullWidth
                value={issueForm.received_weight}
                onChange={(e) => setIssueForm({ ...issueForm, received_weight: e.target.value })}
              />
            </Grid>
            <Grid item sx={{ display: 'flex', alignItems: 'center' }}>
              <Button variant="contained" onClick={handleIssue}>
                Receive
              </Button>
            </Grid>
          </Grid>
        </Box>
      </TabPanel>

      {/* DELIVERY NOTE TAB */}
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6">Transfer Yarn</Typography>
        <Grid container spacing={2} mt={1}>
          <Grid item xs={12} sm={2}>
            <Autocomplete
              options={knitters}
              getOptionLabel={o => o.name}
              onChange={(e, v) => setDeliveryForm({ ...deliveryForm, sourceKnitterId: v?.id })}
              renderInput={(p) => <TextField {...p} label="From Knitter" />}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Autocomplete
              options={knitters}
              getOptionLabel={o => o.name}
              onChange={(e, v) => setDeliveryForm({ ...deliveryForm, destKnitterId: v?.id })}
              renderInput={(p) => <TextField {...p} label="To Knitter" />}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Autocomplete
              options={yarns}
              getOptionLabel={o => `${o.hf_code} - ${o.description}`}
              onChange={(e, v) => setDeliveryForm({ ...deliveryForm, yarnId: v?.id })}
              renderInput={(p) => <TextField {...p} label="Yarn" />}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              label="Quantity (kg)"
              type="number"
              fullWidth
              value={deliveryForm.quantity}
              onChange={e => setDeliveryForm({ ...deliveryForm, quantity: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              label="Transfer DC No."
              fullWidth
              value={deliveryForm.transfer_dc_no}
              onChange={e => setDeliveryForm({ ...deliveryForm, transfer_dc_no: e.target.value })}
            />
          </Grid>
          <Grid item>
            <Button variant="contained" onClick={handleDelivery}>Transfer</Button>
          </Grid>
        </Grid>
        {deliveryNoteLoading && <CircularProgress />}
        <TableContainer sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Transfer DC No.</TableCell>
                <TableCell>From</TableCell>
                <TableCell>To</TableCell>
                <TableCell>Yarn</TableCell>
                <TableCell>Qty (kg)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deliveryNotes.map(d => (
                <TableRow key={d.id}>
                  <TableCell>{d.transfer_dc_no || '—'}</TableCell>
                  <TableCell>{d.sourceKnitter?.name}</TableCell>
                  <TableCell>{d.destKnitter?.name}</TableCell>
                  <TableCell>{d.yarn?.hf_code}</TableCell>
                  <TableCell>{d.quantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* KNITTER PROGRAM TAB */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6">Knitting Program</Typography>
        <Grid container spacing={2} mt={1}>
          <Grid item xs={12} sm={3}>
            <Autocomplete
              options={knitters}
              getOptionLabel={o => o.name}
              onChange={(e, v) => { setProgramForm({ ...programForm, knitterId: v?.id }); setProgramKnitter(v); }}
              renderInput={(p) => <TextField {...p} label="Knitter" />}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Yarns Used</Typography>
            {programForm.yarns.map((y, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 2, mb: 1, alignItems: 'center' }}>
                <Autocomplete
                  options={yarns}
                  getOptionLabel={o => `${o.hf_code} - ${o.description}`}
                  onChange={(e, v) => handleYarnChange(index, 'yarnId', v?.id)}
                  renderInput={(p) => <TextField {...p} label="Yarn" />}
                  sx={{ width: 300 }}
                />
                <TextField
                  label="Qty Used (kg)"
                  type="number"
                  value={y.quantity_used}
                  onChange={e => handleYarnChange(index, 'quantity_used', e.target.value)}
                  sx={{ width: 150 }}
                />
                {programForm.yarns.length > 1 && (
                  <Button variant="outlined" color="error" onClick={() => handleRemoveYarn(index)}>
                    Remove
                  </Button>
                )}
              </Box>
            ))}
            <Button variant="outlined" size="small" onClick={handleAddYarn} sx={{ mt: 1 }}>
              + Add Yarn
            </Button>
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              label="Manual Grey Wt (kg)"
              type="number"
              fullWidth
              value={programForm.manual_grey_weight}
              onChange={e => setProgramForm({ ...programForm, manual_grey_weight: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              label="Gauge"
              type="number"
              fullWidth
              value={programForm.gauge}
              onChange={e => setProgramForm({ ...programForm, gauge: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              label="Loop Length"
              type="number"
              fullWidth
              value={programForm.loop_length}
              onChange={e => setProgramForm({ ...programForm, loop_length: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              label="Dia (inches)"
              type="number"
              fullWidth
              value={programForm.dia}
              onChange={e => setProgramForm({ ...programForm, dia: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              label="GSM"
              type="number"
              fullWidth
              value={programForm.gsm}
              onChange={e => setProgramForm({ ...programForm, gsm: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              label="Description"
              fullWidth
              value={programForm.description}
              onChange={e => setProgramForm({ ...programForm, description: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              label="Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={programForm.productionDate}
              onChange={e => setProgramForm({ ...programForm, productionDate: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" onClick={handleProgramSubmit}>Create Program</Button>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Autocomplete
            options={knitters}
            getOptionLabel={o => o.name}
            value={programKnitter}
            onChange={(e, v) => setProgramKnitter(v)}
            renderInput={(p) => <TextField {...p} label="Filter by Knitter" />}
            sx={{ width: 250 }}
          />
          <Button variant="outlined" onClick={handleProgramFilter}>Load Programs</Button>
        </Box>
        {programLoading && <CircularProgress />}
        <TableContainer sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Yarn</TableCell>
                <TableCell>Qty Used</TableCell>
                <TableCell>Grey Wt</TableCell>
                <TableCell>Dia</TableCell>
                <TableCell>GSM</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {programs.map(p => (
                <TableRow key={p.id}>
                  <TableCell>{new Date(p.productionDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {p.yarns?.map(y => `${y.yarn?.hf_code} (${y.quantity_used}kg)`)?.join(', ')}
                  </TableCell>
                  <TableCell>{p.yarns?.reduce((sum, y) => sum + Number(y.quantity_used), 0).toFixed(2)}</TableCell>
                  <TableCell>{p.grey_weight}</TableCell>
                  <TableCell>{p.dia}</TableCell>
                  <TableCell>{p.gsm}</TableCell>
                  <TableCell>{p.description || '—'}</TableCell>
                  <TableCell>{p.greyFabricLot?.status}</TableCell>
                  <TableCell>
                    <Button variant="outlined" size="small" onClick={() => handleOpenMemoConfig(p)}>
                      Print Memo
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="h6" mt={4}>Available Grey Fabric</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Lot ID</TableCell>
                <TableCell>HF Code</TableCell>
                <TableCell>Count</TableCell>
                <TableCell>Dia</TableCell>
                <TableCell>GSM</TableCell>
                <TableCell>Gauge</TableCell>
                <TableCell>Loop Length</TableCell>
                <TableCell>Grey Weight</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {greyFabricList.map(gf => (
                <TableRow key={gf.id}>
                  <TableCell>{gf.id}</TableCell>
                  <TableCell>{gf.knitterProgram?.yarns?.map(y => y.yarn?.hf_code)?.join(', ')}</TableCell>
                  <TableCell>{gf.knitterProgram?.yarns?.map(y => y.yarn?.count)?.join(', ')}</TableCell>
                  <TableCell>{gf.knitterProgram?.dia}</TableCell>
                  <TableCell>{gf.knitterProgram?.gsm}</TableCell>
                  <TableCell>{gf.knitterProgram?.gauge}</TableCell>
                  <TableCell>{gf.knitterProgram?.loop_length}</TableCell>
                  <TableCell>{gf.grey_weight}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* DYEING PROGRAM TAB */}
      <TabPanel value={tabValue} index={3}>
        <Typography variant="h6">Dyeing from Grey Fabric</Typography>
        <Grid container spacing={2} mt={1}>
          <Grid item xs={12} sm={2}>
            <Autocomplete
              options={greyFabricList}
              getOptionLabel={o => o ? `Memo ${o.knitterProgram?.id || 'N/A'} - Lot ${o.id} (${o.grey_weight} kg)` : ''}
              onChange={(e, v) => setDyeingForm({ ...dyeingForm, greyFabricLotId: v?.id, lot_no: v?.knitterProgram?.id ? v.knitterProgram.id.toString() : '' })}
              renderInput={(p) => <TextField {...p} label="Grey Lot" />}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Autocomplete
              options={dyers}
              getOptionLabel={o => o.name}
              onChange={(e, v) => setDyeingForm({ ...dyeingForm, dyerId: v?.id })}
              renderInput={(p) => <TextField {...p} label="Dyer" />}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Autocomplete
              options={colours}
              getOptionLabel={o => o.name}
              onChange={(e, v) => setDyeingForm({ ...dyeingForm, colour_id: v?.id })}
              renderInput={(p) => <TextField {...p} label="Colour" />}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              label="Lot No."
              fullWidth
              value={dyeingForm.lot_no}
              onChange={e => setDyeingForm({ ...dyeingForm, lot_no: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              label="Output Weight (kg)"
              type="number"
              fullWidth
              value={dyeingForm.output_weight}
              onChange={e => setDyeingForm({ ...dyeingForm, output_weight: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              label="Gauge"
              type="number"
              fullWidth
              value={dyeingForm.gauge}
              onChange={e => setDyeingForm({ ...dyeingForm, gauge: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              label="Loop Length"
              type="number"
              fullWidth
              value={dyeingForm.loop_length}
              onChange={e => setDyeingForm({ ...dyeingForm, loop_length: e.target.value })}
            />
          </Grid>
          <Grid item>
            <Button variant="contained" onClick={handleDyeingSubmit}>Create Dyeing</Button>
          </Grid>
        </Grid>

        <Typography variant="h6" mt={4}>Recent Dyeings</Typography>
        {dyeingLoading && <CircularProgress />}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Memo No</TableCell>
                <TableCell>Lot No.</TableCell>
                <TableCell>Colour</TableCell>
                <TableCell>Dyer</TableCell>
                <TableCell>Output Wt</TableCell>
                <TableCell>Grey Lot</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dyeingList.map(d => (
                <TableRow key={d.id}>
                  <TableCell>{d.greyFabricLot?.knitterProgram?.id || '—'}</TableCell>
                  <TableCell>{d.lot_no}</TableCell>
                  <TableCell>{d.colour?.name}</TableCell>
                  <TableCell>{d.dyer?.name}</TableCell>
                  <TableCell>{d.output_weight}</TableCell>
                  <TableCell>{d.greyFabricLot?.id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* MEMO CONFIG DIALOG */}
      <Dialog open={memoConfigOpen} onClose={() => setMemoConfigOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configure Memo</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Delivery To (Dyer)" value={memoConfig.deliveryTo} onChange={e => setMemoConfig({ ...memoConfig, deliveryTo: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Colour" value={memoConfig.colour} onChange={e => setMemoConfig({ ...memoConfig, colour: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Process (e.g. Biowash)" value={memoConfig.process} onChange={e => setMemoConfig({ ...memoConfig, process: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Remarks / Details (e.g. for Dmart Shorts)" value={memoConfig.remarks} onChange={e => setMemoConfig({ ...memoConfig, remarks: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMemoConfigOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => { setMemoConfigOpen(false); setMemoViewerOpen(true); }}>Review &amp; Print</Button>
        </DialogActions>
      </Dialog>

      {/* MEMO PRINT PREVIEW DIALOG */}
      <Dialog open={memoViewerOpen} onClose={() => setMemoViewerOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', '@media print': { display: 'none' } }}>
          <Typography variant="h6">Print Memo</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={() => setMemoViewerOpen(false)}>Close</Button>
            <Button variant="contained" onClick={() => window.print()} color="primary">🖨 Print Memo</Button>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 2, bgcolor: '#f5f5f5' }} id="printable-memo">
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              #printable-memo, #printable-memo * { visibility: visible !important; }
              #printable-memo {
                position: absolute !important;
                left: 0; top: 0;
                width: 100%;
                margin: 0; padding: 15mm;
                background: white !important;
              }
            }
            .memo-wrap { font-family: sans-serif; color: #1a2e6b; max-width: 650px; margin: 0 auto; background: white; padding: 20px; border: 1px solid #ccc; min-height: 500px; position: relative; }
            .memo-header { text-align: center; border-bottom: 2px solid #1a2e6b; padding-bottom: 10px; margin-bottom: 15px; }
            .memo-header h1 { font-size: 24px; color: #1a2e6b; margin: 0 0 5px; font-weight: 900; }
            .memo-header p { margin: 2px 0; font-size: 13px; font-weight: bold; }
            .memo-title { display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; margin-bottom: 20px; border-bottom: 2px solid #1a2e6b; padding-bottom: 5px; }
            .memo-address { margin-bottom: 20px; font-size: 15px; }
            .memo-address div { margin-bottom: 5px; }
            .memo-yarn { font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #1a2e6b; }
            .memo-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            .memo-table th { border-bottom: 2px solid #1a2e6b; padding: 8px 5px; text-align: left; font-size: 14px; color: #1a2e6b; text-transform: uppercase; }
            .memo-table td { padding: 8px 5px; font-size: 15px; font-weight: bold; }
            .memo-footer { text-align: center; font-size: 15px; line-height: 1.6; margin-top: 30px; font-weight: bold; }
          `}</style>
          {memoData && (
            <div className="memo-wrap">
              <div className="memo-header">
                <h1>CHHAVI NEETU TEXTILES LLP</h1>
                <p>No. 789, Kalampalayam, Andipalayam, Tirupur - 641 601.</p>
                <p>Phone : 96003 20779</p>
                <p>E-mail : chhavineetutextilesllp@gmail.com</p>
                <p>GSTIN : 33AATFC5466D1ZC</p>
              </div>
              <div className="memo-title">
                <span>MEMO &nbsp;&nbsp;&nbsp; {memoData.id}</span>
                <span>Date : {new Date(memoData.productionDate).toLocaleDateString('en-GB')}</span>
              </div>
              <div className="memo-address">
                <div style={{color: '#1a2e6b'}}>To,</div>
                <div style={{ marginLeft: '20px', fontWeight: 'bold' }}>{memoData.knitterName?.name}</div>
                <div style={{ marginTop: '15px', color: '#1a2e6b' }}>Delivery To,</div>
                <div style={{ marginLeft: '20px', fontWeight: 'bold' }}>{memoConfig.deliveryTo || '_______________________'}</div>
              </div>
              <div className="memo-yarn">
                {memoData.yarns?.map(y => `${y.yarn?.count || ''} ${y.yarn?.description || ''} ${y.yarn?.purchase_order_no ? `(PO: ${y.yarn.purchase_order_no})` : ''}`)?.join(', ')}
              </div>
              <table className="memo-table">
                <thead>
                  <tr>
                    <th>LOT NO</th>
                    <th>Dia</th>
                    <th>GG</th>
                    <th>LL</th>
                    <th>KG</th>
                    <th>Colour</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{memoData.greyFabricLot?.id || '—'}</td>
                    <td>{memoData.dia || '—'}</td>
                    <td>{memoData.gauge || '—'}</td>
                    <td>{memoData.loop_length || '—'}</td>
                    <td>{memoData.grey_weight}kg</td>
                    <td>{memoConfig.colour || '—'}</td>
                  </tr>
                </tbody>
              </table>
              <div className="memo-footer">
                <div>{memoConfig.process || ''}</div>
                <div>{memoConfig.remarks ? `for ${memoConfig.remarks}` : ''}</div>
                <div style={{ fontWeight: 'bold', marginTop: '20px' }}>
                  {memoData.yarns?.map(y => `HF-${y.yarn?.hf_code}`)?.join(', ')}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default KnittingPage;
