import { useState, useEffect } from 'react';
import { 
  Box, MenuItem, TextField, Dialog, DialogTitle, 
  DialogContent, DialogActions, Button, IconButton,
  Typography, CircularProgress
} from '@mui/material';
import { Plus, X } from 'lucide-react';
import api from '../../api/axios';

const SmartDropdown = ({ 
  label, 
  value, 
  onChange, 
  entity,     // e.g. 'mill-names'
  valueKey = 'id', 
  labelKey = 'name',
  required = false,
  error = false,
  helperText = ''
}) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch options
  const fetchOptions = async () => {
    setLoading(true);
    try {
      if (entity.startsWith('/api/')) {
        // Support custom endpoints
        const res = await api.get(entity.replace('/api/', '/'));
        setOptions(res.data);
      } else {
        // Standard master data endpoints
        const res = await api.get(`/master/${entity}`);
        setOptions(res.data);
      }
    } catch (err) {
      console.error(`Failed to fetch ${entity}`, err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity]);

  const handleAddNew = async () => {
    if (!newValue.trim()) return;
    setSaving(true);
    try {
      const endpoint = entity.startsWith('/api/') ? entity.replace('/api/', '/') : `/master/${entity}`;
      const res = await api.post(endpoint, { [labelKey]: newValue.trim() });
      
      // Select the new item
      onChange({ target: { value: res.data[valueKey] } });
      
      // Close and refresh
      setModalOpen(false);
      setNewValue('');
      await fetchOptions();
    } catch (err) {
      console.error('Failed to add new item', err);
      // You could add toast notification here
    }
    setSaving(false);
  };

  return (
    <>
      <TextField
        select
        fullWidth
        label={label}
        value={value || ''}
        onChange={(e) => {
          if (e.target.value === 'ADD_NEW') {
            setModalOpen(true);
          } else {
            onChange(e);
          }
        }}
        required={required}
        error={error}
        helperText={helperText}
        disabled={loading}
        InputProps={{
          sx: { borderRadius: 2, bgcolor: 'background.paper' }
        }}
      >
        <MenuItem value="ADD_NEW" sx={{ color: 'primary.main', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Plus size={16} /> Add New {label}
          </Box>
        </MenuItem>
        
        {options.map((opt) => (
          <MenuItem key={opt[valueKey]} value={opt[valueKey]}>
            {opt[labelKey] || opt.description} {/* Fallback for yarn dropdowns */}
          </MenuItem>
        ))}
      </TextField>

      {/* Add New Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={600}>Add {label}</Typography>
          <IconButton size="small" onClick={() => setModalOpen(false)}><X size={20} /></IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label={`${label} Name`}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            sx={{ mt: 1 }}
            onKeyDown={(e) => { if(e.key === 'Enter') handleAddNew() }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setModalOpen(false)} color="inherit">Cancel</Button>
          <Button 
            onClick={handleAddNew} 
            variant="contained" 
            disabled={saving || !newValue.trim()}
            startIcon={saving ? <CircularProgress size={16} /> : null}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SmartDropdown;
