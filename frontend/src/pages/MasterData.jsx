import { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Plus } from 'lucide-react';
import DataTable from '../components/common/DataTable';
import api from '../api/axios';

const ENTITIES = [
  { id: 'mill-names', label: 'Mill Names' },
  { id: 'knitter-names', label: 'Knitter Names' },
  { id: 'dyer-names', label: 'Dyer Names' },
  { id: 'compacter-names', label: 'Compacter Names' },
  { id: 'colours', label: 'Colours' },
  { id: 'wash-types', label: 'Wash Types' },
  { id: 'fabric-descriptions', label: 'Fabric Descriptions' },
];

const MasterData = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [addressLine3, setAddressLine3] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [gstn, setGstn] = useState('');

  const currentEntity = ENTITIES[tabIndex];
  const isActor = ['mill-names', 'knitter-names', 'dyer-names', 'compacter-names'].includes(currentEntity.id);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/master/${currentEntity.id}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabIndex]);

  const handleSave = async () => {
    try {
      const payload = { name };
      if (isActor) {
        payload.address_line1 = addressLine1;
        payload.address_line2 = addressLine2;
        payload.address_line3 = addressLine3;
        payload.state = stateRegion;
        payload.pin_code = pinCode;
        payload.gstn = gstn;
      }
      
      if (editingId) {
        await api.put(`/master/${currentEntity.id}/${editingId}`, payload);
      } else {
        await api.post(`/master/${currentEntity.id}`, payload);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setName(row.name);
    setAddressLine1(row.address_line1 || '');
    setAddressLine2(row.address_line2 || '');
    setAddressLine3(row.address_line3 || '');
    setStateRegion(row.state || '');
    setPinCode(row.pin_code || '');
    setGstn(row.gstn || '');
    setModalOpen(true);
  };

  const handleDelete = async (row) => {
    try {
      await api.delete(`/master/${currentEntity.id}/${row.id}`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error deleting record.');
    }
  };

  return (
    <Box>
      <Typography variant="h4" color="text.primary" mb={3}>Master Data</Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabIndex} 
          onChange={(_, newValue) => setTabIndex(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {ENTITIES.map((ent, idx) => (
            <Tab key={ent.id} label={ent.label} value={idx} />
          ))}
        </Tabs>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">{currentEntity.label}</Typography>
        <Button 
          variant="contained" 
          startIcon={<Plus size={18} />}
          onClick={() => {
            setEditingId(null);
            setName('');
            setAddressLine1('');
            setAddressLine2('');
            setAddressLine3('');
            setStateRegion('');
            setPinCode('');
            setGstn('');
            setModalOpen(true);
          }}
        >
          Add {currentEntity.label.replace('Names', '').replace('s', '')}
        </Button>
      </Box>

      <DataTable
        columns={[
          { field: 'id', headerName: 'ID' },
          { field: 'name', headerName: 'Name' },
          ...(isActor ? [
            { field: 'address_line1', headerName: 'Address Line 1' },
            { field: 'state', headerName: 'State' },
            { field: 'pin_code', headerName: 'Pin Code' },
            { field: 'gstn', headerName: 'GSTN' }
          ] : []),
          { field: 'createdAt', headerName: 'Created Date', renderCell: (r) => new Date(r.createdAt).toLocaleDateString() }
        ]}
        data={data}
        isLoading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingId ? 'Edit' : 'Add'} {currentEntity.label}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if(e.key === 'Enter') handleSave() }}
          />
          {isActor && (
            <>
              <TextField
                fullWidth
                margin="dense"
                label="Address Line 1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
              />
              <TextField
                fullWidth
                margin="dense"
                label="Address Line 2"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
              />
              <TextField
                fullWidth
                margin="dense"
                label="Address Line 3"
                value={addressLine3}
                onChange={(e) => setAddressLine3(e.target.value)}
              />
              <TextField
                fullWidth
                margin="dense"
                label="State"
                value={stateRegion}
                onChange={(e) => setStateRegion(e.target.value)}
              />
              <TextField
                fullWidth
                margin="dense"
                label="Pin Code"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
              />
              <TextField
                fullWidth
                margin="dense"
                label="GSTN"
                value={gstn}
                onChange={(e) => setGstn(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter') handleSave() }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!name.trim()}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MasterData;
