import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Tabs, Tab, Paper, TextField, Button, Autocomplete,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Snackbar, Alert, Grid
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
  const [greyFabricStock, setGreyFabricStock] = useState([]);
  const { stockList, stockLoading, stockError, fetchStock } = useKnittingStore();

  const handleStockFilter = async () => {
    if (!stockKnitter) return;
    fetchStock(stockKnitter.id);
    try {
      const res = await getGreyFabricAvailable(stockKnitter.id);
      setGreyFabricStock(res.data);
    } catch (err) {
      console.error('Failed to fetch grey fabric stock', err);
    }
  };

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
      if (stockKnitter) handleStockFilter();
    } else {
      showSnackbar(result.message, 'error');
    }
  };

  // ========== DELIVERY NOTE TAB ==========
  const { deliveryNotes, deliveryNoteLoading, fetchDeliveryNotes, createDeliveryNote } = useKnittingStore();
  const [deliveryForm, setDeliveryForm] = useState({
    sourceKnitterId: null, destKnitterId: null, yarnId: null, quantity: ''
  });

  useEffect(() => { fetchDeliveryNotes(); }, []);

  const handleDelivery = async () => {
    const result = await createDeliveryNote(deliveryForm);
    if (result.success) {
      showSnackbar('Transfer successful');
      setDeliveryForm({ sourceKnitterId: null, destKnitterId: null, yarnId: null, quantity: '' });
    } else {
      showSnackbar(result.message, 'error');
    }
  };

  // ========== KNITTER PROGRAM TAB ==========
  const { programs, programLoading, fetchPrograms, createProgram, greyFabricList, fetchGreyFabric } = useKnittingStore();
  const [programKnitter, setProgramKnitter] = useState(null);
  const [programForm, setProgramForm] = useState({
    knitterId: null, yarnId: null, quantity_used: '', manual_grey_weight: '', number_of_rolls: '', gauge: '', loop_length: ''
  });

  useEffect(() => { fetchGreyFabric(); }, []);

  const handleProgramFilter = () => {
    if (programKnitter) fetchPrograms(programKnitter.id);
  };

  const handleProgramSubmit = async () => {
    const result = await createProgram(programForm);
    if (result.success) {
      showSnackbar('Program created');
      setProgramForm({ knitterId: null, yarnId: null, quantity_used: '', manual_grey_weight: '', number_of_rolls: '', gauge: '', loop_length: '' });
    } else {
      showSnackbar(result.message, 'error');
    }
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
        {/* Knitter selector + Show Stock button */}
        <Grid container spacing={2} alignItems="center" mb={3}>
          <Grid item xs={12} sm={4}>
            <Autocomplete
              options={knitters}
              getOptionLabel={(o) => o.name}
              value={stockKnitter}
              onChange={(e, v) => setStockKnitter(v)}
              renderInput={(params) => (
                <TextField {...params} label="Select Knitter" />
              )}
            />
          </Grid>
          <Grid item>
            <Button variant="contained" onClick={handleStockFilter}>
              Show Stock
            </Button>
          </Grid>
        </Grid>

        {stockLoading && <CircularProgress />}
        {stockError && <Alert severity="error">{stockError}</Alert>}

        {/* SECTION A: Yarn & Grey Stock combined view */}
        <Typography variant="h6" gutterBottom>
          Yarn &amp; Grey Stock{stockKnitter ? ` — ${stockKnitter.name}` : ''}
        </Typography>
        <Grid container spacing={3}>
          {/* Yarn Stock */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Yarn Stock
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
                    {stockList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">No yarn stock found.</TableCell>
                      </TableRow>
                    ) : (
                      stockList.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>{s.yarn?.hf_code}</TableCell>
                          <TableCell>{s.yarn?.description}</TableCell>
                          <TableCell align="right">{s.received_weight}</TableCell>
                          <TableCell align="right">{s.remaining_weight}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Grey Fabric Stock */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Grey Fabric Stock
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Lot ID</TableCell>
                      <TableCell align="right">Grey Weight (kg)</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {greyFabricStock.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center">No grey fabric lots found.</TableCell>
                      </TableRow>
                    ) : (
                      greyFabricStock.map((gf) => (
                        <TableRow key={gf.id}>
                          <TableCell>{gf.id}</TableCell>
                          <TableCell align="right">{Number(gf.grey_weight).toFixed(2)}</TableCell>
                          <TableCell>{Number(gf.grey_weight) === 0 ? 'Finished' : gf.status}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* SECTION B: Receive Yarn from Mill */}
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            Receive Yarn from Mill
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <Autocomplete
                options={knitters}
                getOptionLabel={(o) => o.name}
                onChange={(e, v) =>
                  setIssueForm({ ...issueForm, knitterId: v?.id })
                }
                renderInput={(p) => <TextField {...p} label="Knitter" />}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Autocomplete
                options={yarns}
                getOptionLabel={(o) => `${o.hf_code}`}
                onChange={(e, v) =>
                  setIssueForm({ ...issueForm, yarnId: v?.id })
                }
                renderInput={(p) => <TextField {...p} label="Yarn (HF Code)" />}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Received Weight (kg)"
                type="number"
                fullWidth
                value={issueForm.received_weight}
                onChange={(e) =>
                  setIssueForm({ ...issueForm, received_weight: e.target.value })
                }
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
          <Grid item>
            <Button variant="contained" onClick={handleDelivery}>Transfer</Button>
          </Grid>
        </Grid>
        {deliveryNoteLoading && <CircularProgress />}
        <TableContainer sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>From</TableCell>
                <TableCell>To</TableCell>
                <TableCell>Yarn</TableCell>
                <TableCell>Qty</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deliveryNotes.map(d => (
                <TableRow key={d.id}>
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
          <Grid item xs={12} sm={3}>
            <Autocomplete
              options={yarns}
              getOptionLabel={o => `${o.hf_code} - ${o.description}`}
              onChange={(e, v) => setProgramForm({ ...programForm, yarnId: v?.id })}
              renderInput={(p) => <TextField {...p} label="Yarn" />}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              label="Qty Used (kg)"
              type="number"
              fullWidth
              value={programForm.quantity_used}
              onChange={e => setProgramForm({ ...programForm, quantity_used: e.target.value })}
            />
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
          <Grid item xs={12} sm={1}>
            <TextField
              label="Rolls"
              type="number"
              fullWidth
              value={programForm.number_of_rolls}
              onChange={e => setProgramForm({ ...programForm, number_of_rolls: e.target.value })}
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
          <Grid item>
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
                <TableCell>Rolls</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {programs.map(p => (
                <TableRow key={p.id}>
                  <TableCell>{new Date(p.productionDate).toLocaleDateString()}</TableCell>
                  <TableCell>{p.yarn?.hf_code}</TableCell>
                  <TableCell>{p.quantity_used}</TableCell>
                  <TableCell>{p.grey_weight}</TableCell>
                  <TableCell>{p.number_of_rolls}</TableCell>
                  <TableCell>{p.greyFabricLot?.status}</TableCell>
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
                <TableCell>Grey Weight</TableCell>
                <TableCell>Rolls</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {greyFabricList.map(gf => (
                <TableRow key={gf.id}>
                  <TableCell>{gf.id}</TableCell>
                  <TableCell>{gf.grey_weight}</TableCell>
                  <TableCell>{gf.knitterProgram?.number_of_rolls}</TableCell>
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
              getOptionLabel={o => `Lot ${o.id} (${o.grey_weight} kg)`}
              onChange={(e, v) => setDyeingForm({ ...dyeingForm, greyFabricLotId: v?.id })}
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
    </Box>
  );
};

export default KnittingPage;
