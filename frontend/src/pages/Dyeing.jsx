import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Autocomplete,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Grid, CircularProgress, Snackbar, Alert,
} from '@mui/material';
import useKnittingStore from '../store/knittingStore';
import useDyeingStore from '../store/dyeingStore';
import { getDyers, getColours, getCompacters } from '../api/masters';

const DyeingPage = () => {
  const { greyFabricList, fetchGreyFabric } = useKnittingStore();
  const { dyeingList, dyeingLoading, fetchDyeings, createDyeingProgram } =
    useDyeingStore();

  const [dyers, setDyers] = useState([]);
  const [colours, setColours] = useState([]);
  const [compacters, setCompacters] = useState([]);

  const [form, setForm] = useState({
    greyFabricLotId: null,
    knitterDcNo: '',
    companyDcNo: '',
    lot_no: '',
    dyerId: null,
    colour_id: null,
    compacterId: null,
    output_weight: '',
    gauge: '',
    loop_length: '',
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const showSnackbar = (msg, sev = 'success') =>
    setSnackbar({ open: true, message: msg, severity: sev });

  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [dyerRes, colourRes, compRes] = await Promise.all([
          getDyers(),
          getColours(),
          getCompacters(),
        ]);
        setDyers(dyerRes.data);
        setColours(colourRes.data);
        setCompacters(compRes.data);
      } catch (e) {
        console.error('Failed to load master data', e);
      }
    };
    loadMasters();
    fetchGreyFabric();
    fetchDyeings();
  }, []);

  const handleSubmit = async () => {
    const result = await createDyeingProgram({
      greyFabricLotId: form.greyFabricLotId,
      dyerId: form.dyerId,
      lot_no: form.lot_no,
      colour_id: form.colour_id,
      output_weight: parseFloat(form.output_weight) || 0,
      gauge: parseFloat(form.gauge) || 0,
      loop_length: parseFloat(form.loop_length) || 0,
      knitterDcNo: form.knitterDcNo,
      companyDcNo: form.companyDcNo,
      compacterId: form.compacterId,
    });

    if (result.success) {
      showSnackbar('Dyeing program created successfully');
      setForm({
        greyFabricLotId: null,
        knitterDcNo: '',
        companyDcNo: '',
        lot_no: '',
        dyerId: null,
        colour_id: null,
        compacterId: null,
        output_weight: '',
        gauge: '',
        loop_length: '',
      });
      fetchGreyFabric();
      fetchDyeings();
    } else {
      showSnackbar(result.message, 'error');
    }
  };

  const selectedLot = greyFabricList.find(
    (l) => l.id === form.greyFabricLotId
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dyeing Program
      </Typography>

      {/* Dyeing Form */}
      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          New Dyeing Entry
        </Typography>
        <Grid container spacing={2}>
          {/* Grey Fabric Lot */}
          <Grid item xs={12} sm={4}>
            <Autocomplete
              options={greyFabricList}
              getOptionLabel={(o) => `Lot ${o.id} (${o.grey_weight} kg)`}
              value={selectedLot || null}
              onChange={(e, v) =>
                setForm({ ...form, greyFabricLotId: v?.id })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Grey Fabric Lot"
                  helperText={
                    selectedLot
                      ? `Grey weight: ${selectedLot.grey_weight} kg`
                      : ''
                  }
                />
              )}
            />
          </Grid>

          {/* Knitter DC No. */}
          <Grid item xs={12} sm={4}>
            <TextField
              label="Knitter DC No."
              fullWidth
              value={form.knitterDcNo}
              onChange={(e) =>
                setForm({ ...form, knitterDcNo: e.target.value })
              }
            />
          </Grid>

          {/* Company DC No. */}
          <Grid item xs={12} sm={4}>
            <TextField
              label="Company DC No."
              fullWidth
              value={form.companyDcNo}
              onChange={(e) =>
                setForm({ ...form, companyDcNo: e.target.value })
              }
            />
          </Grid>

          {/* Lot No. */}
          <Grid item xs={12} sm={4}>
            <TextField
              label="Lot No. (Dyeing)"
              fullWidth
              value={form.lot_no}
              onChange={(e) =>
                setForm({ ...form, lot_no: e.target.value })
              }
            />
          </Grid>

          {/* Dyer */}
          <Grid item xs={12} sm={4}>
            <Autocomplete
              options={dyers}
              getOptionLabel={(o) => o.name}
              value={dyers.find((d) => d.id === form.dyerId) || null}
              onChange={(e, v) =>
                setForm({ ...form, dyerId: v?.id })
              }
              renderInput={(params) => (
                <TextField {...params} label="Dyer" />
              )}
            />
          </Grid>

          {/* Colour */}
          <Grid item xs={12} sm={4}>
            <Autocomplete
              options={colours}
              getOptionLabel={(o) => o.name}
              value={colours.find((c) => c.id === form.colour_id) || null}
              onChange={(e, v) =>
                setForm({ ...form, colour_id: v?.id })
              }
              renderInput={(params) => (
                <TextField {...params} label="Colour" />
              )}
            />
          </Grid>

          {/* Compacter */}
          <Grid item xs={12} sm={4}>
            <Autocomplete
              options={compacters}
              getOptionLabel={(o) => o.name}
              value={
                compacters.find((c) => c.id === form.compacterId) || null
              }
              onChange={(e, v) =>
                setForm({ ...form, compacterId: v?.id })
              }
              renderInput={(params) => (
                <TextField {...params} label="Compacter" />
              )}
            />
          </Grid>

          {/* Output Weight */}
          <Grid item xs={12} sm={4}>
            <TextField
              label="Output Weight (kg)"
              type="number"
              fullWidth
              value={form.output_weight}
              onChange={(e) =>
                setForm({ ...form, output_weight: e.target.value })
              }
            />
          </Grid>

          {/* Gauge */}
          <Grid item xs={12} sm={4}>
            <TextField
              label="Gauge"
              type="number"
              fullWidth
              value={form.gauge}
              onChange={(e) =>
                setForm({ ...form, gauge: e.target.value })
              }
            />
          </Grid>

          {/* Loop Length */}
          <Grid item xs={12} sm={4}>
            <TextField
              label="Loop Length"
              type="number"
              fullWidth
              value={form.loop_length}
              onChange={(e) =>
                setForm({ ...form, loop_length: e.target.value })
              }
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              size="large"
            >
              Create Dyeing
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Dyeing Records Table */}
      <Typography variant="h6" gutterBottom>
        All Dyeing Records
      </Typography>
      {dyeingLoading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Lot No.</TableCell>
                <TableCell>Grey Lot</TableCell>
                <TableCell>Knitter DC</TableCell>
                <TableCell>Company DC</TableCell>
                <TableCell>Colour</TableCell>
                <TableCell>Dyer</TableCell>
                <TableCell>Compacter</TableCell>
                <TableCell>Output Wt</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dyeingList.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.lot_no}</TableCell>
                  <TableCell>{d.greyFabricLot?.id || '-'}</TableCell>
                  <TableCell>{d.knitterDcNo || '-'}</TableCell>
                  <TableCell>{d.companyDcNo || '-'}</TableCell>
                  <TableCell>{d.colour?.name}</TableCell>
                  <TableCell>{d.dyerName?.name}</TableCell>
                  <TableCell>{d.compacter?.name || '-'}</TableCell>
                  <TableCell>{d.final_weight}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DyeingPage;
