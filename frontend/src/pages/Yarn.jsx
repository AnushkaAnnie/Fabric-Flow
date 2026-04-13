import { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Chip } from '@mui/material';
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

  const [poViewerOpen, setPoViewerOpen] = useState(false);
  const [prePrintOpen, setPrePrintOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [poData, setPoData] = useState(null);
  const [poConfig, setPoConfig] = useState({ agent: '', cgst: 2.5, sgst: 2.5, expectedDeliveryDate: '' });
  const [poFormData, setPoFormData] = useState({});
  const updPo = (field, val) => setPoFormData(p => ({ ...p, [field]: val }));

  const [formData, setFormData] = useState({
    mill_name_id: '', description: '', hf_code: '', purchase_order_no: '',
    invoice_no: '', delivery_to: '', count: '', quality: 'rl',
    no_of_bags: '', bag_weight: '60', rate_per_kg: '',
    issued_date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/yarn?page=${page}&limit=${limit}&search=${search}`);
      setData(res.data.data);
      setTotal(res.data.total);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [page, limit, search]);

  const handleSave = async () => {
    try {
      if (editingId) { await api.put(`/yarn/${editingId}`, formData); }
      else { await api.post('/yarn', formData); }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error saving data');
    }
  };

  const handleEdit = (row) => {
    setFormData({ ...row, issued_date: new Date(row.issued_date).toISOString().split('T')[0] });
    setEditingId(row.id);
    setModalOpen(true);
  };

  const handleDelete = async (row) => {
    try {
      await api.delete(`/yarn/${row.id}`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error deleting yarn record.');
    }
  };

  const amountToWords = (amount) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const numToWords = (n) => {
      if (n === 0) return '';
      if (n < 20) return ones[n] + ' ';
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '') + ' ';
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred ' + numToWords(n % 100);
      if (n < 100000) return numToWords(Math.floor(n / 1000)) + 'Thousand ' + numToWords(n % 1000);
      if (n < 10000000) return numToWords(Math.floor(n / 100000)) + 'Lakh ' + numToWords(n % 100000);
      return numToWords(Math.floor(n / 10000000)) + 'Crore ' + numToWords(n % 10000000);
    };
    const rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);
    let words = 'Rupees ' + numToWords(rupees).trim();
    if (paise > 0) words += ' and ' + numToWords(paise).trim() + ' Paise';
    return words + ' Only';
  };

  const handlePrint = async (row) => {
    try {
      const res = await api.get('/master/knitter-names');
      const dk = res.data.find(k => k.name === row.delivery_to) || null;
      setPoData({ yarn: row, deliveryKnitter: dk });
      setPoConfig({ agent: '', cgst: 2.5, sgst: 2.5, expectedDeliveryDate: '' });
      setPoFormData({
        description: row.description || '',
        count: row.count || '',
        quality: row.quality?.toUpperCase() || '',
        no_of_bags: String(row.no_of_bags || ''),
        bag_weight: String(row.bag_weight || 60),
        total_weight: row.total_weight?.toFixed(2) || '',
        rate_per_kg: row.rate_per_kg?.toFixed(2) || '',
        hf_code: row.hf_code || '',
        purchase_order_no: row.purchase_order_no || '',
        issued_date: new Date(row.issued_date).toLocaleDateString('en-GB'),
        mill_name: row.millName?.name || '',
        mill_gstin: row.millName?.gstn || '',
        mill_address: [row.millName?.address_line1, row.millName?.address_line2, row.millName?.state, row.millName?.pin_code].filter(Boolean).join(', '),
        knitter_name: dk?.name || row.delivery_to || '',
        knitter_gstin: dk?.gstn || '',
        knitter_address: dk ? [dk.address_line1, dk.address_line2, dk.state, dk.pin_code].filter(Boolean).join(', ') : '',
      });
      setPrePrintOpen(true);
    } catch (e) {
      console.error(e);
      alert('Failed to load PO details from master data.');
    }
  };

  const Section = ({ children }) => (
    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1a2e6b', bgcolor: '#eef0fb', px: 1.5, py: 0.5, borderRadius: 1 }}>
      {children}
    </Typography>
  );

  const columns = [
    { field: 'hf_code', headerName: 'HF Code' },
    { field: 'purchase_order_no', headerName: 'PO No' },
    { field: 'invoice_no', headerName: 'Invoice No.' },
    { field: 'delivery_to', headerName: 'Delivery To' },
    { field: 'millName', headerName: 'Mill Name', renderCell: (row) => row.millName?.name },
    { field: 'description', headerName: 'Description' },
    { field: 'count', headerName: 'Count' },
    { field: 'quality', headerName: 'Quality' },
    { field: 'no_of_bags', headerName: 'Bags' },
    { field: 'bag_weight', headerName: 'Bag Wt' },
    { field: 'total_weight', headerName: 'Total Wt' },
    { field: 'rate_per_kg', headerName: 'Rate/Kg' },
    { field: 'total_cost', headerName: 'Amount (Rs)', renderCell: (row) => row.total_cost ? row.total_cost.toFixed(2) : '0.00' },
    { field: 'issued_date', headerName: 'Issued Date', renderCell: (row) => new Date(row.issued_date).toLocaleDateString() },
    {
      field: 'status', headerName: 'Status',
      renderCell: (row) => {
        const s = (row.invoice_no && row.invoice_no.trim() !== '') ? 'Received' : (row.status || 'Pending');
        return <Chip label={s} color={s === 'Received' ? 'success' : 'warning'} size="small" variant="filled" />;
      }
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" color="text.primary">Yarn Inventory</Typography>
        <Button variant="contained" startIcon={<Plus size={18} />}
          onClick={() => {
            setEditingId(null);
            setFormData({ mill_name_id: '', description: '', hf_code: '', purchase_order_no: '', invoice_no: '', delivery_to: '', count: '', quality: 'rl', no_of_bags: '', bag_weight: '60', rate_per_kg: '', issued_date: new Date().toISOString().split('T')[0] });
            setModalOpen(true);
          }}>
          Add Yarn
        </Button>
      </Box>

      <DataTable columns={columns} data={data} totalCount={total} page={page} limit={limit}
        onPageChange={setPage} onLimitChange={setLimit} onSearch={setSearch}
        onEdit={handleEdit} onDelete={handleDelete} onPrint={handlePrint} isLoading={loading} />

      {/* Add/Edit Dialog */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? 'Edit Yarn' : 'Add New Yarn'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <SmartDropdown label="Mill Name" value={formData.mill_name_id} onChange={(e) => setFormData({ ...formData, mill_name_id: e.target.value })} entity="mill-names" required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="HF Code" value={formData.hf_code} onChange={(e) => setFormData({ ...formData, hf_code: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Purchase Order No" value={formData.purchase_order_no} onChange={(e) => setFormData({ ...formData, purchase_order_no: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Invoice No." value={formData.invoice_no} onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <SmartDropdown label="Delivery To (Knitter)" value={formData.delivery_to} onChange={(e) => setFormData({ ...formData, delivery_to: e.target.value })} entity="knitter-names" valueKey="name" labelKey="name" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Count" value={formData.count} onChange={(e) => setFormData({ ...formData, count: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Quality" value={formData.quality} onChange={(e) => setFormData({ ...formData, quality: e.target.value })}>
                <MenuItem value="rl">RL</MenuItem>
                <MenuItem value="vl">VL</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="No of Bags" value={formData.no_of_bags} onChange={(e) => setFormData({ ...formData, no_of_bags: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Bag Weight (kg)" value={formData.bag_weight} onChange={(e) => setFormData({ ...formData, bag_weight: e.target.value })} helperText="Autofilled to 60 kg" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Rate Per Kg" value={formData.rate_per_kg} onChange={(e) => setFormData({ ...formData, rate_per_kg: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth type="date" label="Issued Date" InputLabelProps={{ shrink: true }} value={formData.issued_date} onChange={(e) => setFormData({ ...formData, issued_date: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Configure PO Dialog — all fields editable */}
      <Dialog open={prePrintOpen} onClose={() => setPrePrintOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { maxHeight: '90vh' } }}>
        <DialogTitle sx={{ bgcolor: '#1a2e6b', color: 'white', fontWeight: 'bold' }}>
          Configure Purchase Order
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><Section>🧵 Yarn Details</Section></Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Description" value={poFormData.description || ''} onChange={(e) => updPo('description', e.target.value)} size="small" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth label="Count" value={poFormData.count || ''} onChange={(e) => updPo('count', e.target.value)} size="small" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth label="Quality" value={poFormData.quality || ''} onChange={(e) => updPo('quality', e.target.value)} size="small" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth type="number" label="No. of Bags" value={poFormData.no_of_bags || ''} onChange={(e) => updPo('no_of_bags', e.target.value)} size="small" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth type="number" label="Bag Weight (kg)" value={poFormData.bag_weight || ''} onChange={(e) => updPo('bag_weight', e.target.value)} size="small" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth type="number" label="Total Weight (kg)" value={poFormData.total_weight || ''} onChange={(e) => updPo('total_weight', e.target.value)} size="small" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth type="number" label="Rate per Kg (₹)" value={poFormData.rate_per_kg || ''} onChange={(e) => updPo('rate_per_kg', e.target.value)} size="small" />
            </Grid>

            <Grid item xs={12}><Section>📋 PO Reference</Section></Grid>
            <Grid item xs={6} sm={4}>
              <TextField fullWidth label="HF Code" value={poFormData.hf_code || ''} onChange={(e) => updPo('hf_code', e.target.value)} size="small" />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField fullWidth label="PO Number" value={poFormData.purchase_order_no || ''} onChange={(e) => updPo('purchase_order_no', e.target.value)} size="small" />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField fullWidth label="Date" value={poFormData.issued_date || ''} onChange={(e) => updPo('issued_date', e.target.value)} size="small" />
            </Grid>

            <Grid item xs={12}><Section>🏭 Supplier (Mill)</Section></Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Mill Name" value={poFormData.mill_name || ''} onChange={(e) => updPo('mill_name', e.target.value)} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Mill GSTIN" value={poFormData.mill_gstin || ''} onChange={(e) => updPo('mill_gstin', e.target.value)} size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Mill Address" value={poFormData.mill_address || ''} onChange={(e) => updPo('mill_address', e.target.value)} size="small" />
            </Grid>

            <Grid item xs={12}><Section>🚚 Delivery To</Section></Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Knitter Name" value={poFormData.knitter_name || ''} onChange={(e) => updPo('knitter_name', e.target.value)} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Knitter GSTIN" value={poFormData.knitter_gstin || ''} onChange={(e) => updPo('knitter_gstin', e.target.value)} size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Delivery Address" value={poFormData.knitter_address || ''} onChange={(e) => updPo('knitter_address', e.target.value)} size="small" />
            </Grid>

            <Grid item xs={12}><Section>⚙️ PO Settings</Section></Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Agent Name" value={poConfig.agent} onChange={(e) => setPoConfig({ ...poConfig, agent: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth type="number" label="CGST (%)" value={poConfig.cgst} onChange={(e) => setPoConfig({ ...poConfig, cgst: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth type="number" label="SGST (%)" value={poConfig.sgst} onChange={(e) => setPoConfig({ ...poConfig, sgst: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Expected Delivery Date</Typography>
              <TextField fullWidth type="date" value={poConfig.expectedDeliveryDate} onChange={(e) => setPoConfig({ ...poConfig, expectedDeliveryDate: e.target.value })} size="small" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setPrePrintOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => { setPrePrintOpen(false); setConfirmOpen(true); }}>
            Review &amp; Confirm →
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Summary Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1a2e6b', color: 'white', fontWeight: 'bold' }}>
          ✅ Confirm Purchase Order
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {(() => {
            const cgst = Number(poConfig.cgst || 0);
            const sgst = Number(poConfig.sgst || 0);
            const ratePerKg = Number(poFormData.rate_per_kg || 0);
            const totalWt = Number(poFormData.total_weight || 0);
            const taxable = totalWt * ratePerKg;
            const cgstAmt = taxable * cgst / 100;
            const sgstAmt = taxable * sgst / 100;
            const grandTotal = taxable + cgstAmt + sgstAmt;
            const fmt = (n) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const Row = ({ label, value }) => (
              <Box sx={{ display: 'flex', mb: 0.5, gap: 1, px: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 160 }}>{label}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{value || '—'}</Typography>
              </Box>
            );
            const ST = ({ c }) => (
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1a2e6b', bgcolor: '#eef0fb', px: 1.5, py: 0.5, borderRadius: 1, mt: 1.5, mb: 0.5 }}>{c}</Typography>
            );
            return (
              <Box>
                <ST c="📋 PO Info" />
                <Row label="PO Number" value={poFormData.purchase_order_no} />
                <Row label="HF Code" value={poFormData.hf_code} />
                <Row label="Date" value={poFormData.issued_date} />
                <Row label="Agent" value={poConfig.agent} />
                <Row label="Exp. Delivery Date" value={poConfig.expectedDeliveryDate ? new Date(poConfig.expectedDeliveryDate).toLocaleDateString('en-GB') : ''} />
                <ST c="🏭 Supplier" />
                <Row label="Mill Name" value={poFormData.mill_name} />
                <Row label="GSTIN" value={poFormData.mill_gstin} />
                <Row label="Address" value={poFormData.mill_address} />
                <ST c="🚚 Delivery To" />
                <Row label="Knitter" value={poFormData.knitter_name} />
                <Row label="GSTIN" value={poFormData.knitter_gstin} />
                <Row label="Address" value={poFormData.knitter_address} />
                <ST c="🧵 Yarn" />
                <Row label="Description" value={poFormData.description} />
                <Row label="Count" value={poFormData.count} />
                <Row label="Quality" value={poFormData.quality} />
                <Row label="No. of Bags" value={poFormData.no_of_bags} />
                <Row label="Bag Weight" value={`${poFormData.bag_weight || '60'} kg`} />
                <Row label="Total Weight" value={`${poFormData.total_weight} kg`} />
                <Row label="Rate / Kg" value={`₹ ${poFormData.rate_per_kg}`} />
                <ST c="💰 Amount" />
                <Row label="Taxable Amount" value={`₹ ${fmt(taxable)}`} />
                <Row label={`CGST (${cgst}%)`} value={`₹ ${fmt(cgstAmt)}`} />
                <Row label={`SGST (${sgst}%)`} value={`₹ ${fmt(sgstAmt)}`} />
                <Box sx={{ display: 'flex', gap: 1, mt: 1, p: 1.5, bgcolor: '#eef0fb', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ color: '#1a2e6b', fontWeight: 'bold', minWidth: 160 }}>GRAND TOTAL</Typography>
                  <Typography sx={{ fontWeight: 900, color: '#1a2e6b', fontSize: '1rem' }}>₹ {fmt(grandTotal)}</Typography>
                </Box>
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => { setConfirmOpen(false); setPrePrintOpen(true); }}>← Edit</Button>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={() => { setConfirmOpen(false); setPoViewerOpen(true); }}>
            ✅ Confirm &amp; Generate PO
          </Button>
        </DialogActions>
      </Dialog>

      {/* PO Print Dialog */}
      <Dialog open={poViewerOpen} onClose={() => setPoViewerOpen(false)} maxWidth="xl" fullWidth PaperProps={{ sx: { maxHeight: '95vh' } }}>
        <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', '@media print': { display: 'none' } }}>
          <Typography variant="h6" fontWeight={600}>Purchase Order Preview</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={() => setPoViewerOpen(false)}>Close</Button>
            <Button variant="contained" onClick={() => window.print()} color="primary">🖨 Print PO</Button>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 2, bgcolor: '#f5f5f5' }} id="printable-po">
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              #printable-po, #printable-po * { visibility: visible !important; }
              #printable-po {
                position: fixed !important;
                top: 0; left: 0;
                width: 100%; height: 100%;
                margin: 0; padding: 6mm;
                box-sizing: border-box;
                background: white !important;
              }
            }
            @page { size: A4 landscape; margin: 6mm; }
            .po-wrap { font-family: Arial, sans-serif; color: #1a2e6b; border: 2px solid #1a2e6b; background: white; width: 100%; box-sizing: border-box; }
            .po-header { text-align: center; padding: 10px 16px 8px; border-bottom: 2px solid #1a2e6b; }
            .po-header h1 { margin: 0 0 4px; font-size: 20px; letter-spacing: 2px; font-weight: 900; }
            .po-header p { margin: 2px 0; font-size: 11px; font-weight: bold; color: #333; }
            .po-title-bar { background: #ffffff; color: #0a0f2e; text-align: center; font-size: 15px; font-weight: 900; letter-spacing: 4px; padding: 7px; text-transform: uppercase; border-top: 2px solid #0a0f2e; border-bottom: 2px solid #0a0f2e; }
            .po-meta { display: flex; border-bottom: 2px solid #1a2e6b; }
            .po-meta-cell { flex: 1; padding: 6px 10px; border-right: 2px solid #1a2e6b; }
            .po-meta-cell:last-child { border-right: none; }
            .po-meta-cell .lbl { font-size: 9px; color: #777; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
            .po-meta-cell .val { font-weight: bold; font-size: 12px; color: #1a2e6b; }
            .po-parties { display: flex; border-bottom: 2px solid #1a2e6b; }
            .po-party-block { flex: 1; padding: 8px 12px; border-right: 2px solid #1a2e6b; }
            .po-party-block:last-child { border-right: none; }
            .po-party-block .pt { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #999; margin-bottom: 4px; letter-spacing: 0.5px; }
            .po-party-block .pn { font-size: 13px; font-weight: 900; color: #1a2e6b; margin-bottom: 2px; }
            .po-party-block .pa { font-size: 10px; color: #444; line-height: 1.5; }
            .po-party-block .pg { font-size: 10px; font-weight: bold; margin-top: 4px; color: #1a2e6b; }
            .po-table { width: 100%; border-collapse: collapse; }
            .po-table th { background: #eef0fb; color: #1a2e6b; font-weight: bold; padding: 7px 5px; border: 1.5px solid #1a2e6b; text-align: center; font-size: 10px; line-height: 1.3; }
            .po-table td { padding: 8px 5px; border: 1.5px solid #1a2e6b; text-align: center; color: #111; font-size: 11px; }
            .po-table td.al { text-align: left; padding-left: 8px; }
            .po-table tr.filler td { height: 26px; }
            .po-table tr.total-row td { background: #eef0fb; font-weight: bold; font-size: 11px; color: #1a2e6b; }
            .po-footer { display: flex; min-height: 80px; }
            .po-footer-left { flex: 1; padding: 10px 14px; border-right: 2px solid #1a2e6b; }
            .po-footer-right { width: 240px; padding: 10px 16px; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; }
            .po-footer .flbl { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #999; margin-bottom: 4px; }
            .po-footer .ftxt { font-size: 10px; color: #333; line-height: 1.7; }
            .po-sig-company { font-weight: bold; font-size: 11px; color: #1a2e6b; text-align: center; }
            .po-sig-line { margin-top: 28px; border-top: 1px solid #1a2e6b; padding-top: 4px; font-size: 10px; color: #555; width: 100%; text-align: center; }
          `}</style>

          {poData && (() => {
            const cgst = Number(poConfig.cgst || 0);
            const sgst = Number(poConfig.sgst || 0);
            const ratePerKg = Number(poFormData.rate_per_kg || 0);
            const totalWt = Number(poFormData.total_weight || 0);
            const taxable = totalWt * ratePerKg;
            const cgstAmt = taxable * cgst / 100;
            const sgstAmt = taxable * sgst / 100;
            const grandTotal = taxable + cgstAmt + sgstAmt;
            const fmt = (n) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            return (
              <div className="po-wrap">
                <div className="po-header">
                  <h1>CHHAVI NEETU TEXTILES LLP</h1>
                  <p>No. 789, Kalampalayam, Andipalayam, Tirupur &ndash; 641 601.</p>
                  <p>Phone&nbsp;: 96003 20779 &nbsp;&bull;&nbsp; E-mail&nbsp;: chhavineetutextilesllp@gmail.com &nbsp;&bull;&nbsp; GSTIN&nbsp;: 33AATFC5466D1ZC</p>
                </div>
                <div className="po-title-bar">YARN PURCHASE ORDER</div>
                <div className="po-meta">
                  <div className="po-meta-cell"><div className="lbl">P.O. Number</div><div className="val">{poFormData.purchase_order_no || '—'}</div></div>
                  <div className="po-meta-cell"><div className="lbl">HF Code</div><div className="val">{poFormData.hf_code || '—'}</div></div>
                  <div className="po-meta-cell"><div className="lbl">Agent</div><div className="val">{poConfig.agent || '—'}</div></div>
                  <div className="po-meta-cell"><div className="lbl">Date</div><div className="val">{poFormData.issued_date || '—'}</div></div>
                  <div className="po-meta-cell"><div className="lbl">Exp. Delivery Date</div><div className="val">{poConfig.expectedDeliveryDate ? new Date(poConfig.expectedDeliveryDate).toLocaleDateString('en-GB') : '—'}</div></div>
                </div>
                <div className="po-parties">
                  <div className="po-party-block">
                    <div className="pt">Supplier (Please supply to):</div>
                    <div className="pn">{poFormData.mill_name || '—'}</div>
                    <div className="pa">{poFormData.mill_address || '—'}</div>
                    <div className="pg">GSTIN : {poFormData.mill_gstin || '—'}</div>
                  </div>
                  <div className="po-party-block">
                    <div className="pt">Delivery To:</div>
                    <div className="pn">{poFormData.knitter_name || '—'}</div>
                    <div className="pa">{poFormData.knitter_address || '—'}</div>
                    <div className="pg">GSTIN : {poFormData.knitter_gstin || '—'}</div>
                  </div>
                </div>
                <table className="po-table">
                  <thead>
                    <tr>
                      <th style={{ width: '36px' }}>S.No.</th>
                      <th style={{ width: '17%' }}>Description / Particulars</th>
                      <th>Count</th><th>Quality</th>
                      <th>No. of<br />Bags</th>
                      <th>Bag Wt.<br />(kg)</th>
                      <th>Total Wt.<br />(kg)</th>
                      <th>Rate /<br />Unit (&#8377;)</th>
                      <th>Taxable<br />Amount (&#8377;)</th>
                      <th>CGST<br />%</th>
                      <th>CGST<br />Amount (&#8377;)</th>
                      <th>SGST<br />%</th>
                      <th>SGST<br />Amount (&#8377;)</th>
                      <th>Total<br />Amount (&#8377;)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1</td>
                      <td className="al">{poFormData.description}</td>
                      <td>{poFormData.count}</td>
                      <td>{poFormData.quality}</td>
                      <td>{poFormData.no_of_bags}</td>
                      <td>{Number(poFormData.bag_weight || 60).toFixed(2)}</td>
                      <td>{totalWt.toFixed(2)}</td>
                      <td>{ratePerKg.toFixed(2)}</td>
                      <td><strong>{fmt(taxable)}</strong></td>
                      <td>{cgst > 0 ? `${cgst}%` : '—'}</td>
                      <td>{cgst > 0 ? fmt(cgstAmt) : '—'}</td>
                      <td>{sgst > 0 ? `${sgst}%` : '—'}</td>
                      <td>{sgst > 0 ? fmt(sgstAmt) : '—'}</td>
                      <td><strong>{fmt(grandTotal)}</strong></td>
                    </tr>
                    {[1, 2, 3].map(i => (
                      <tr key={i} className="filler">
                        {Array(14).fill(null).map((_, j) => <td key={j}></td>)}
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td colSpan={8} style={{ textAlign: 'right', paddingRight: '14px' }}>GRAND TOTAL</td>
                      <td>{fmt(taxable)}</td>
                      <td></td>
                      <td>{cgst > 0 ? fmt(cgstAmt) : '—'}</td>
                      <td></td>
                      <td>{sgst > 0 ? fmt(sgstAmt) : '—'}</td>
                      <td>&#8377; {fmt(grandTotal)}</td>
                    </tr>
                    <tr style={{ background: '#f0f4ff' }}>
                      <td colSpan={14} style={{ textAlign: 'left', padding: '6px 12px', fontWeight: 'bold', fontSize: '11px', color: '#1a2e6b', borderTop: '2px solid #1a2e6b' }}>
                        Total No. of Bags: <span style={{ fontWeight: '900', fontSize: '12px' }}>{poFormData.no_of_bags}</span>
                        &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
                        Total Weight: <span style={{ fontWeight: '900', fontSize: '12px' }}>{totalWt.toFixed(2)} kg</span>
                      </td>
                    </tr>
                    <tr style={{ background: '#f0f4ff' }}>
                      <td colSpan={14} style={{ textAlign: 'left', padding: '7px 12px', fontWeight: 'bold', fontSize: '11px', color: '#1a2e6b', fontStyle: 'italic' }}>
                        Amount in Words: <span style={{ fontWeight: '900', fontStyle: 'normal' }}>{amountToWords(grandTotal)}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="po-footer">
                  <div className="po-footer-left">
                    <div className="flbl">Terms &amp; Conditions</div>
                    <div className="ftxt">
                      1. Goods once sold will not be taken back.<br />
                      2. Subject to Tirupur jurisdiction.<br />
                      3. E&amp;OE.
                    </div>
                  </div>
                  <div className="po-footer-right">
                    <div className="po-sig-company">For CHHAVI NEETU TEXTILES LLP</div>
                    <div className="po-sig-line">Authorised Signatory</div>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Yarn;
