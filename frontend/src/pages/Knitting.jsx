import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Paper, Alert, Snackbar, Tab, Tabs, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, CircularProgress, Autocomplete, Chip,
} from '@mui/material';
import { Plus } from 'lucide-react';
import useKnittingStore from '../store/knittingStore';
import api from '../api/axios';

// ============================================================================
// Tab Panel Component
// ============================================================================
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`knitting-tabpanel-${index}`}
      aria-labelledby={`knitting-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// ============================================================================
// Stock Tab - Issue Yarn to Knitter
// ============================================================================
function StockTab() {
  const store = useKnittingStore();
  const [knitters, setKnitters] = useState([]);
  const [yarns, setYarns] = useState([]);
  const [selectedKnitterId, setSelectedKnitterId] = useState(null);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({ knitterId: '', yarnId: '', received_weight: '' });
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueError, setIssueError] = useState('');
  const [issueSuccess, setIssueSuccess] = useState(false);

  useEffect(() => {
    store.fetchStock(selectedKnitterId);
  }, [selectedKnitterId, store]);

  useEffect(() => {
    Promise.all([
      api.get('/knitter-names').then(r => setKnitters(r.data)),
      api.get('/yarn').then(r => setYarns(r.data)),
    ]).catch(err => console.error('Failed to load master data:', err));
  }, []);

  const handleIssueSubmit = async () => {
    if (!issueForm.knitterId || !issueForm.yarnId || !issueForm.received_weight) {
      setIssueError('All fields are required');
      return;
    }

    setIssueLoading(true);
    setIssueError('');
    const result = await store.issueYarn({
      knitterId: Number(issueForm.knitterId),
      yarnId: Number(issueForm.yarnId),
      received_weight: Number(issueForm.received_weight),
    });

    if (result.success) {
      setIssueSuccess(true);
      setIssueForm({ knitterId: '', yarnId: '', received_weight: '' });
      setIssueModalOpen(false);
      setTimeout(() => setIssueSuccess(false), 3000);
    } else {
      setIssueError(result.message);
    }
    setIssueLoading(false);
  };

  const stockColumns = [
    { field: 'knitterName.name', headerName: 'Knitter' },
    { field: 'yarn.hf_code', headerName: 'HF Code' },
    { field: 'yarn.description', headerName: 'Description' },
    { field: 'received_weight', headerName: 'Received Weight (kg)' },
    { field: 'remaining_weight', headerName: 'Remaining Weight (kg)' },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Yarn Stock</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Autocomplete
            options={knitters}
            getOptionLabel={(k) => k.name}
            value={knitters.find(k => k.id === selectedKnitterId) || null}
            onChange={(e, val) => setSelectedKnitterId(val?.id || null)}
            sx={{ width: 250 }}
            renderInput={(params) => <TextField {...params} label="Filter by Knitter" size="small" />}
          />
          <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setIssueModalOpen(true)}>
            Issue Yarn
          </Button>
        </Box>
      </Box>

      {store.stockError && <Alert severity="error" sx={{ mb: 2 }}>{store.stockError}</Alert>}

      {store.stockLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                {stockColumns.map((col) => (
                  <TableCell key={col.field} sx={{ fontWeight: 'bold' }}>
                    {col.headerName}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {store.stock.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.knitterName?.name}</TableCell>
                  <TableCell>{row.yarn?.hf_code}</TableCell>
                  <TableCell>{row.yarn?.description}</TableCell>
                  <TableCell>{Number(row.received_weight).toFixed(2)}</TableCell>
                  <TableCell>{Number(row.remaining_weight).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {store.stock.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center', color: '#999' }}>
              No stock records found
            </Box>
          )}
        </TableContainer>
      )}

      {/* Issue Yarn Modal */}
      <Dialog open={issueModalOpen} onClose={() => setIssueModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Issue Yarn to Knitter</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {issueError && <Alert severity="error" sx={{ mb: 2 }}>{issueError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Autocomplete
              options={knitters}
              getOptionLabel={(k) => k.name}
              value={knitters.find(k => k.id === Number(issueForm.knitterId)) || null}
              onChange={(e, val) => setIssueForm(prev => ({ ...prev, knitterId: val?.id || '' }))}
              renderInput={(params) => <TextField {...params} label="Knitter" required />}
            />
            <Autocomplete
              options={yarns}
              getOptionLabel={(y) => `${y.hf_code} - ${y.description}`}
              value={yarns.find(y => y.id === Number(issueForm.yarnId)) || null}
              onChange={(e, val) => setIssueForm(prev => ({ ...prev, yarnId: val?.id || '' }))}
              renderInput={(params) => <TextField {...params} label="Yarn" required />}
            />
            <TextField
              label="Received Weight (kg)"
              type="number"
              inputProps={{ step: '0.01', min: '0' }}
              value={issueForm.received_weight}
              onChange={(e) => setIssueForm(prev => ({ ...prev, received_weight: e.target.value }))}
              fullWidth
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIssueModalOpen(false)}>Cancel</Button>
          <Button onClick={handleIssueSubmit} variant="contained" disabled={issueLoading}>
            {issueLoading ? <CircularProgress size={24} /> : 'Issue'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={issueSuccess} autoHideDuration={3000} onClose={() => setIssueSuccess(false)}>
        <Alert severity="success">Yarn issued successfully</Alert>
      </Snackbar>
    </Box>
  );
}

// ============================================================================
// Delivery Note Tab - Transfer Between Knitters
// ============================================================================
function DeliveryNoteTab() {
  const store = useKnittingStore();
  const [knitters, setKnitters] = useState([]);
  const [yarns, setYarns] = useState([]);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    sourceKnitterId: '',
    destKnitterId: '',
    yarnId: '',
    quantity: '',
  });
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState(false);

  useEffect(() => {
    store.fetchDeliveryNotes();
  }, [store]);

  useEffect(() => {
    Promise.all([
      api.get('/knitter-names').then(r => setKnitters(r.data)),
      api.get('/yarn').then(r => setYarns(r.data)),
    ]).catch(err => console.error('Failed to load master data:', err));
  }, []);

  const handleTransferSubmit = async () => {
    if (!transferForm.sourceKnitterId || !transferForm.destKnitterId || !transferForm.yarnId || !transferForm.quantity) {
      setTransferError('All fields are required');
      return;
    }

    setTransferLoading(true);
    setTransferError('');
    const result = await store.createDeliveryNote({
      sourceKnitterId: Number(transferForm.sourceKnitterId),
      destKnitterId: Number(transferForm.destKnitterId),
      yarnId: Number(transferForm.yarnId),
      quantity: Number(transferForm.quantity),
    });

    if (result.success) {
      setTransferSuccess(true);
      setTransferForm({ sourceKnitterId: '', destKnitterId: '', yarnId: '', quantity: '' });
      setTransferModalOpen(false);
      setTimeout(() => setTransferSuccess(false), 3000);
    } else {
      setTransferError(result.message);
    }
    setTransferLoading(false);
  };

  const deliveryColumns = [
    { field: 'sourceKnitter.name', headerName: 'From Knitter' },
    { field: 'destKnitter.name', headerName: 'To Knitter' },
    { field: 'yarn.hf_code', headerName: 'Yarn HF Code' },
    { field: 'quantity', headerName: 'Quantity (kg)' },
    { field: 'transferDate', headerName: 'Transfer Date' },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Delivery Notes</Typography>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setTransferModalOpen(true)}>
          Transfer Yarn
        </Button>
      </Box>

      {store.deliveryNotesError && <Alert severity="error" sx={{ mb: 2 }}>{store.deliveryNotesError}</Alert>}

      {store.deliveryNotesLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                {deliveryColumns.map((col) => (
                  <TableCell key={col.field} sx={{ fontWeight: 'bold' }}>
                    {col.headerName}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {store.deliveryNotes.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.sourceKnitter?.name}</TableCell>
                  <TableCell>{row.destKnitter?.name}</TableCell>
                  <TableCell>{row.yarn?.hf_code}</TableCell>
                  <TableCell>{Number(row.quantity).toFixed(2)}</TableCell>
                  <TableCell>{new Date(row.transferDate).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {store.deliveryNotes.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center', color: '#999' }}>
              No delivery notes found
            </Box>
          )}
        </TableContainer>
      )}

      {/* Transfer Modal */}
      <Dialog open={transferModalOpen} onClose={() => setTransferModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Transfer Yarn Between Knitters</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {transferError && <Alert severity="error" sx={{ mb: 2 }}>{transferError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Autocomplete
              options={knitters}
              getOptionLabel={(k) => k.name}
              value={knitters.find(k => k.id === Number(transferForm.sourceKnitterId)) || null}
              onChange={(e, val) => setTransferForm(prev => ({ ...prev, sourceKnitterId: val?.id || '' }))}
              renderInput={(params) => <TextField {...params} label="From Knitter" required />}
            />
            <Autocomplete
              options={knitters}
              getOptionLabel={(k) => k.name}
              value={knitters.find(k => k.id === Number(transferForm.destKnitterId)) || null}
              onChange={(e, val) => setTransferForm(prev => ({ ...prev, destKnitterId: val?.id || '' }))}
              renderInput={(params) => <TextField {...params} label="To Knitter" required />}
            />
            <Autocomplete
              options={yarns}
              getOptionLabel={(y) => `${y.hf_code} - ${y.description}`}
              value={yarns.find(y => y.id === Number(transferForm.yarnId)) || null}
              onChange={(e, val) => setTransferForm(prev => ({ ...prev, yarnId: val?.id || '' }))}
              renderInput={(params) => <TextField {...params} label="Yarn" required />}
            />
            <TextField
              label="Quantity (kg)"
              type="number"
              inputProps={{ step: '0.01', min: '0' }}
              value={transferForm.quantity}
              onChange={(e) => setTransferForm(prev => ({ ...prev, quantity: e.target.value }))}
              fullWidth
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferModalOpen(false)}>Cancel</Button>
          <Button onClick={handleTransferSubmit} variant="contained" disabled={transferLoading}>
            {transferLoading ? <CircularProgress size={24} /> : 'Transfer'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={transferSuccess} autoHideDuration={3000} onClose={() => setTransferSuccess(false)}>
        <Alert severity="success">Transfer created successfully</Alert>
      </Snackbar>
    </Box>
  );
}

// ============================================================================
// Knitter Program Tab - Create Knitting Programs + Show Grey Fabric Lots
// ============================================================================
function KnitterProgramTab() {
  const store = useKnittingStore();
  const [knitters, setKnitters] = useState([]);
  const [yarns, setYarns] = useState([]);
  const [selectedKnitterId, setSelectedKnitterId] = useState(null);
  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [programForm, setProgramForm] = useState({
    knitterId: '',
    yarnId: '',
    quantity_used: '',
    manual_grey_weight: '',
    number_of_rolls: '',
    gauge: '',
    loop_length: '',
  });
  const [programLoading, setProgramLoading] = useState(false);
  const [programError, setProgramError] = useState('');
  const [programSuccess, setProgramSuccess] = useState(false);

  useEffect(() => {
    store.fetchPrograms(selectedKnitterId);
    store.fetchGreyFabricLots();
  }, [selectedKnitterId, store]);

  useEffect(() => {
    Promise.all([
      api.get('/knitter-names').then(r => setKnitters(r.data)),
      api.get('/yarn').then(r => setYarns(r.data)),
    ]).catch(err => console.error('Failed to load master data:', err));
  }, []);

  const handleProgramSubmit = async () => {
    if (!programForm.knitterId || !programForm.yarnId || !programForm.quantity_used || programForm.manual_grey_weight === '') {
      setProgramError('Knitter, Yarn, Quantity, and Grey Weight are required');
      return;
    }

    setProgramLoading(true);
    setProgramError('');
    const result = await store.createProgram({
      knitterId: Number(programForm.knitterId),
      yarnId: Number(programForm.yarnId),
      quantity_used: Number(programForm.quantity_used),
      manual_grey_weight: Number(programForm.manual_grey_weight),
      number_of_rolls: programForm.number_of_rolls ? Number(programForm.number_of_rolls) : 0,
      gauge: programForm.gauge || null,
      loop_length: programForm.loop_length ? Number(programForm.loop_length) : null,
    });

    if (result.success) {
      setProgramSuccess(true);
      setProgramForm({
        knitterId: '',
        yarnId: '',
        quantity_used: '',
        manual_grey_weight: '',
        number_of_rolls: '',
        gauge: '',
        loop_length: '',
      });
      setProgramModalOpen(false);
      setTimeout(() => setProgramSuccess(false), 3000);
    } else {
      setProgramError(result.message);
    }
    setProgramLoading(false);
  };

  const programColumns = [
    { field: 'knitterName.name', headerName: 'Knitter' },
    { field: 'yarn.hf_code', headerName: 'HF Code' },
    { field: 'quantity_used', headerName: 'Quantity (kg)' },
    { field: 'grey_weight', headerName: 'Grey Weight (kg)' },
    { field: 'number_of_rolls', headerName: 'Rolls' },
    { field: 'productionDate', headerName: 'Date' },
  ];

  const greyFabricColumns = [
    { field: 'knitterProgram.knitterName.name', headerName: 'Knitter' },
    { field: 'knitterProgram.yarn.hf_code', headerName: 'Yarn HF Code' },
    { field: 'grey_weight', headerName: 'Weight (kg)' },
    { field: 'status', headerName: 'Status' },
    { field: 'createdAt', headerName: 'Created' },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Knitter Programs</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Autocomplete
              options={knitters}
              getOptionLabel={(k) => k.name}
              value={knitters.find(k => k.id === selectedKnitterId) || null}
              onChange={(e, val) => setSelectedKnitterId(val?.id || null)}
              sx={{ width: 250 }}
              renderInput={(params) => <TextField {...params} label="Filter by Knitter" size="small" />}
            />
            <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setProgramModalOpen(true)}>
              Create Program
            </Button>
          </Box>
        </Box>

        {store.programsError && <Alert severity="error" sx={{ mb: 2 }}>{store.programsError}</Alert>}

        {store.programsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  {programColumns.map((col) => (
                    <TableCell key={col.field} sx={{ fontWeight: 'bold' }}>
                      {col.headerName}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {store.programs.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.knitterName?.name}</TableCell>
                    <TableCell>{row.yarn?.hf_code}</TableCell>
                    <TableCell>{Number(row.quantity_used).toFixed(2)}</TableCell>
                    <TableCell>{Number(row.grey_weight).toFixed(2)}</TableCell>
                    <TableCell>{row.number_of_rolls}</TableCell>
                    <TableCell>{new Date(row.productionDate).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {store.programs.length === 0 && (
              <Box sx={{ p: 3, textAlign: 'center', color: '#999' }}>
                No programs found
              </Box>
            )}
          </TableContainer>
        )}
      </Box>

      {/* Grey Fabric Available */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Available Grey Fabric Lots (Ready for Dyeing)
        </Typography>

        {store.greyFabricLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  {greyFabricColumns.map((col) => (
                    <TableCell key={col.field} sx={{ fontWeight: 'bold' }}>
                      {col.headerName}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {store.greyFabricLots.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.knitterProgram?.knitterName?.name}</TableCell>
                    <TableCell>{row.knitterProgram?.yarn?.hf_code}</TableCell>
                    <TableCell>{Number(row.grey_weight).toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip label={row.status} color={row.status === 'AVAILABLE' ? 'success' : 'default'} size="small" />
                    </TableCell>
                    <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {store.greyFabricLots.length === 0 && (
              <Box sx={{ p: 3, textAlign: 'center', color: '#999' }}>
                No available grey fabric lots
              </Box>
            )}
          </TableContainer>
        )}
      </Box>

      {/* Program Modal */}
      <Dialog open={programModalOpen} onClose={() => setProgramModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Knitter Program</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {programError && <Alert severity="error" sx={{ mb: 2 }}>{programError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Autocomplete
              options={knitters}
              getOptionLabel={(k) => k.name}
              value={knitters.find(k => k.id === Number(programForm.knitterId)) || null}
              onChange={(e, val) => setProgramForm(prev => ({ ...prev, knitterId: val?.id || '' }))}
              renderInput={(params) => <TextField {...params} label="Knitter" required />}
            />
            <Autocomplete
              options={yarns}
              getOptionLabel={(y) => `${y.hf_code} - ${y.description}`}
              value={yarns.find(y => y.id === Number(programForm.yarnId)) || null}
              onChange={(e, val) => setProgramForm(prev => ({ ...prev, yarnId: val?.id || '' }))}
              renderInput={(params) => <TextField {...params} label="Yarn" required />}
            />
            <TextField
              label="Quantity Used (kg)"
              type="number"
              inputProps={{ step: '0.01', min: '0' }}
              value={programForm.quantity_used}
              onChange={(e) => setProgramForm(prev => ({ ...prev, quantity_used: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Grey Weight (kg)"
              type="number"
              inputProps={{ step: '0.01', min: '0' }}
              value={programForm.manual_grey_weight}
              onChange={(e) => setProgramForm(prev => ({ ...prev, manual_grey_weight: e.target.value }))}
              fullWidth
              required
              helperText="Manual entry - weight of grey fabric produced"
            />
            <TextField
              label="Number of Rolls"
              type="number"
              inputProps={{ step: '1', min: '0' }}
              value={programForm.number_of_rolls}
              onChange={(e) => setProgramForm(prev => ({ ...prev, number_of_rolls: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Gauge (optional)"
              value={programForm.gauge}
              onChange={(e) => setProgramForm(prev => ({ ...prev, gauge: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Loop Length (optional)"
              type="number"
              inputProps={{ step: '0.01', min: '0' }}
              value={programForm.loop_length}
              onChange={(e) => setProgramForm(prev => ({ ...prev, loop_length: e.target.value }))}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProgramModalOpen(false)}>Cancel</Button>
          <Button onClick={handleProgramSubmit} variant="contained" disabled={programLoading}>
            {programLoading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={programSuccess} autoHideDuration={3000} onClose={() => setProgramSuccess(false)}>
        <Alert severity="success">Program created successfully</Alert>
      </Snackbar>
    </Box>
  );
}

// ============================================================================
// Dyeing Program Tab - Consume Grey Fabric
// ============================================================================
function DyeingProgramTab() {
  const store = useKnittingStore();
  const [dyers, setDyers] = useState([]);
  const [colours, setColours] = useState([]);
  const [greyFabricLots, setGreyFabricLots] = useState([]);
  const [dyeingModalOpen, setDyeingModalOpen] = useState(false);
  const [dyeingForm, setDyeingForm] = useState({
    greyFabricLotId: '',
    dyerId: '',
    lot_no: '',
    colour_id: '',
    gauge: '',
    loop_length: '',
    output_weight: '',
  });
  const [dyeingLoading, setDyeingLoading] = useState(false);
  const [dyeingError, setDyeingError] = useState('');
  const [dyeingSuccess, setDyeingSuccess] = useState(false);
  const [dyeingRecords, setDyeingRecords] = useState([]);
  const [dyeingRecordsLoading, setDyeingRecordsLoading] = useState(false);

  useEffect(() => {
    store.fetchGreyFabricLots();
    fetchDyeingRecords();
  }, [store]);

  useEffect(() => {
    setGreyFabricLots(store.greyFabricLots);
  }, [store.greyFabricLots]);

  useEffect(() => {
    Promise.all([
      api.get('/dyer-names').then(r => setDyers(r.data)),
      api.get('/colours').then(r => setColours(r.data)),
    ]).catch(err => console.error('Failed to load master data:', err));
  }, []);

  const fetchDyeingRecords = async () => {
    setDyeingRecordsLoading(true);
    try {
      const res = await api.get('/dyeing?page=1&limit=50&search=');
      setDyeingRecords(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch dyeing records:', err);
    }
    setDyeingRecordsLoading(false);
  };

  const handleDyeingSubmit = async () => {
    if (!dyeingForm.greyFabricLotId || !dyeingForm.dyerId || !dyeingForm.lot_no || !dyeingForm.colour_id) {
      setDyeingError('Grey Fabric, Dyer, Lot No, and Colour are required');
      return;
    }

    setDyeingLoading(true);
    setDyeingError('');
    try {
      const response = await api.post('/dyeing/program', {
        greyFabricLotId: Number(dyeingForm.greyFabricLotId),
        dyerId: Number(dyeingForm.dyerId),
        lot_no: dyeingForm.lot_no,
        colour_id: Number(dyeingForm.colour_id),
        gauge: dyeingForm.gauge || null,
        loop_length: dyeingForm.loop_length ? Number(dyeingForm.loop_length) : null,
        output_weight: dyeingForm.output_weight ? Number(dyeingForm.output_weight) : null,
      });

      setDyeingSuccess(true);
      setDyeingForm({
        greyFabricLotId: '',
        dyerId: '',
        lot_no: '',
        colour_id: '',
        gauge: '',
        loop_length: '',
        output_weight: '',
      });
      setDyeingModalOpen(false);
      store.fetchGreyFabricLots();
      fetchDyeingRecords();
      setTimeout(() => setDyeingSuccess(false), 3000);
    } catch (err) {
      setDyeingError(err.response?.data?.message || 'Failed to create dyeing program');
    }
    setDyeingLoading(false);
  };

  const dyeingRecordColumns = [
    { field: 'lot_no', headerName: 'Lot No' },
    { field: 'dyerName.name', headerName: 'Dyer' },
    { field: 'colour.name', headerName: 'Colour' },
    { field: 'initial_weight', headerName: 'Initial Weight (kg)' },
    { field: 'output_weight', headerName: 'Output Weight (kg)' },
    { field: 'date', headerName: 'Date' },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Dyeing Programs</Typography>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setDyeingModalOpen(true)}>
          Create Dyeing Program
        </Button>
      </Box>

      {dyeingRecordsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                {dyeingRecordColumns.map((col) => (
                  <TableCell key={col.field} sx={{ fontWeight: 'bold' }}>
                    {col.headerName}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {dyeingRecords.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.lot_no}</TableCell>
                  <TableCell>{row.dyerName?.name}</TableCell>
                  <TableCell>{row.colour?.name}</TableCell>
                  <TableCell>{Number(row.initial_weight).toFixed(2)}</TableCell>
                  <TableCell>{row.output_weight ? Number(row.output_weight).toFixed(2) : '-'}</TableCell>
                  <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {dyeingRecords.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center', color: '#999' }}>
              No dyeing records found
            </Box>
          )}
        </TableContainer>
      )}

      {/* Dyeing Modal */}
      <Dialog open={dyeingModalOpen} onClose={() => setDyeingModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Dyeing Program</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {dyeingError && <Alert severity="error" sx={{ mb: 2 }}>{dyeingError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Autocomplete
              options={greyFabricLots}
              getOptionLabel={(lot) =>
                `Lot #${lot.id} - ${lot.knitterProgram?.knitterName?.name || 'Unknown'} (${Number(lot.grey_weight).toFixed(2)} kg)`
              }
              value={greyFabricLots.find(l => l.id === Number(dyeingForm.greyFabricLotId)) || null}
              onChange={(e, val) => setDyeingForm(prev => ({ ...prev, greyFabricLotId: val?.id || '' }))}
              renderInput={(params) => <TextField {...params} label="Grey Fabric Lot" required />}
            />
            <Autocomplete
              options={dyers}
              getOptionLabel={(d) => d.name}
              value={dyers.find(d => d.id === Number(dyeingForm.dyerId)) || null}
              onChange={(e, val) => setDyeingForm(prev => ({ ...prev, dyerId: val?.id || '' }))}
              renderInput={(params) => <TextField {...params} label="Dyer" required />}
            />
            <TextField
              label="Lot No"
              value={dyeingForm.lot_no}
              onChange={(e) => setDyeingForm(prev => ({ ...prev, lot_no: e.target.value }))}
              fullWidth
              required
            />
            <Autocomplete
              options={colours}
              getOptionLabel={(c) => c.name}
              value={colours.find(c => c.id === Number(dyeingForm.colour_id)) || null}
              onChange={(e, val) => setDyeingForm(prev => ({ ...prev, colour_id: val?.id || '' }))}
              renderInput={(params) => <TextField {...params} label="Colour" required />}
            />
            <TextField
              label="Gauge (optional)"
              value={dyeingForm.gauge}
              onChange={(e) => setDyeingForm(prev => ({ ...prev, gauge: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Loop Length (optional)"
              type="number"
              inputProps={{ step: '0.01', min: '0' }}
              value={dyeingForm.loop_length}
              onChange={(e) => setDyeingForm(prev => ({ ...prev, loop_length: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Output Weight (optional, kg)"
              type="number"
              inputProps={{ step: '0.01', min: '0' }}
              value={dyeingForm.output_weight}
              onChange={(e) => setDyeingForm(prev => ({ ...prev, output_weight: e.target.value }))}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDyeingModalOpen(false)}>Cancel</Button>
          <Button onClick={handleDyeingSubmit} variant="contained" disabled={dyeingLoading}>
            {dyeingLoading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={dyeingSuccess} autoHideDuration={3000} onClose={() => setDyeingSuccess(false)}>
        <Alert severity="success">Dyeing program created successfully</Alert>
      </Snackbar>
    </Box>
  );
}

// ============================================================================
// Main Knitting Component with Tabs
// ============================================================================
const Knitting = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Knitting & Dyeing Pipeline
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="knitting tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Stock" id="knitting-tab-0" aria-controls="knitting-tabpanel-0" />
          <Tab label="Delivery Note" id="knitting-tab-1" aria-controls="knitting-tabpanel-1" />
          <Tab label="Knitter Program" id="knitting-tab-2" aria-controls="knitting-tabpanel-2" />
          <Tab label="Dyeing Program" id="knitting-tab-3" aria-controls="knitting-tabpanel-3" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <StockTab />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <DeliveryNoteTab />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <KnitterProgramTab />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <DyeingProgramTab />
      </TabPanel>
    </Box>
  );
};

export default Knitting;
