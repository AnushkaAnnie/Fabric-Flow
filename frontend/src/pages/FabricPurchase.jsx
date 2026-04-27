import { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, TextField, Typography, Chip } from '@mui/material';
import { Plus } from 'lucide-react';
import DataTable from '../components/common/DataTable';
import SmartDropdown from '../components/common/SmartDropdown';
import api from '../api/axios';

const initialForm = {
  fabric_code: '',
  purchase_order_no: '',
  supplier_name_id: '',
  particulars: '',
  total_weight: '',
  rate_per_unit: '',
  date: new Date().toISOString().split('T')[0],
};

const formatMoney = (value) => Number(value || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const FabricPurchase = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [poConfigOpen, setPoConfigOpen] = useState(false);
  const [poViewerOpen, setPoViewerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [poData, setPoData] = useState(null);
  const [poConfig, setPoConfig] = useState({ cgst: 2.5, sgst: 2.5 });
  const [poFormData, setPoFormData] = useState({});
  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/fabric-purchase/list');
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const amount = Number(formData.total_weight || 0) * Number(formData.rate_per_unit || 0);
  const cgst = amount * 0.025;
  const sgst = amount * 0.025;
  const grandTotal = amount + cgst + sgst;

  const handleSave = async () => {
    try {
      if (editingId) await api.put(`/fabric-purchase/${editingId}`, formData);
      else await api.post('/fabric-purchase', formData);
      setModalOpen(false);
      setEditingId(null);
      setFormData(initialForm);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving fabric purchase.');
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setFormData({
      fabric_code: row.fabric_code || '',
      purchase_order_no: row.purchase_order_no || '',
      supplier_name_id: row.supplier_name_id || '',
      particulars: row.particulars || '',
      total_weight: row.total_weight || '',
      rate_per_unit: row.rate_per_unit || '',
      date: new Date(row.date).toISOString().split('T')[0],
    });
    setModalOpen(true);
  };

  const handleDelete = async (row) => {
    try {
      await api.delete(`/fabric-purchase/${row.id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting fabric purchase.');
    }
  };

  const amountToWords = (amountValue) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const numToWords = (n) => {
      if (n === 0) return '';
      if (n < 20) return `${ones[n]} `;
      if (n < 100) return `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ''} `;
      if (n < 1000) return `${ones[Math.floor(n / 100)]} Hundred ${numToWords(n % 100)}`;
      if (n < 100000) return `${numToWords(Math.floor(n / 1000))}Thousand ${numToWords(n % 1000)}`;
      if (n < 10000000) return `${numToWords(Math.floor(n / 100000))}Lakh ${numToWords(n % 100000)}`;
      return `${numToWords(Math.floor(n / 10000000))}Crore ${numToWords(n % 10000000)}`;
    };
    const rupees = Math.floor(Number(amountValue || 0));
    const paise = Math.round((Number(amountValue || 0) - rupees) * 100);
    let words = `Rupees ${numToWords(rupees).trim() || 'Zero'}`;
    if (paise > 0) words += ` and ${numToWords(paise).trim()} Paise`;
    return `${words} Only`;
  };

  const handlePrint = (row) => {
    setPoData(row);
    setPoFormData({
      purchase_order_no: row.purchase_order_no || '',
      fabric_code: row.fabric_code || '',
      particulars: row.particulars || '',
      total_weight: row.total_weight || '',
      rate_per_unit: row.rate_per_unit || '',
      date: new Date(row.date).toLocaleDateString('en-GB'),
    });
    setPoConfig({ cgst: 2.5, sgst: 2.5 });
    setPoConfigOpen(true);
  };

  const buildConfiguredPoData = (base = poData) => {
    if (!base) return null;
    const weight = Number(poFormData.total_weight || base.total_weight || 0);
    const rate = Number(poFormData.rate_per_unit || base.rate_per_unit || 0);
    const taxable = weight * rate;
    const cgstAmount = taxable * Number(poConfig.cgst || 0) / 100;
    const sgstAmount = taxable * Number(poConfig.sgst || 0) / 100;
    const totalAmount = taxable + cgstAmount + sgstAmount;
    return {
      ...base,
      purchase_order_no: poFormData.purchase_order_no || '',
      fabric_code: poFormData.fabric_code || '',
      particulars: poFormData.particulars || '',
      total_weight: weight,
      rate_per_unit: rate,
      taxable,
      cgstAmount,
      sgstAmount,
      cgstPercent: Number(poConfig.cgst || 0),
      sgstPercent: Number(poConfig.sgst || 0),
      totalAmount,
      supplierAddress: [
        base.supplierName?.address_line1,
        base.supplierName?.address_line2,
        base.supplierName?.address_line3,
        base.supplierName?.state,
        base.supplierName?.pin_code,
      ].filter(Boolean),
    };
  };

  const reviewPoDetails = () => {
    const configured = buildConfiguredPoData();
    if (!configured) return;
    setPoData(configured);
    setPoConfigOpen(false);
    setConfirmOpen(true);
  };

  const confirmAndGeneratePo = () => {
    const configured = buildConfiguredPoData(poData);
    if (!configured) return;
    setPoData(configured);
    setConfirmOpen(false);
    setPoViewerOpen(true);
  };

  const updatePreviewTax = (field, value) => {
    setPoData((prev) => {
      if (!prev) return prev;
      const cgstPercent = field === 'cgstPercent' ? value : prev.cgstPercent;
      const sgstPercent = field === 'sgstPercent' ? value : prev.sgstPercent;
      const taxable = Number(prev.taxable ?? prev.amount ?? 0);
      const cgstAmount = taxable * Number(cgstPercent || 0) / 100;
      const sgstAmount = taxable * Number(sgstPercent || 0) / 100;
      return {
        ...prev,
        [field]: value,
        cgstPercent,
        sgstPercent,
        cgstAmount,
        sgstAmount,
        totalAmount: taxable + cgstAmount + sgstAmount,
      };
    });
  };

  const columns = [
    { field: 'fabric_code', headerName: 'Fabric Code' },
    { field: 'purchase_order_no', headerName: 'PO No' },
    { field: 'particulars', headerName: 'Particulars' },
    { field: 'total_weight', headerName: 'Weight (kg)' },
    { field: 'rate_per_unit', headerName: 'Rate', renderCell: (row) => formatMoney(row.rate_per_unit) },
    { field: 'amount', headerName: 'Amount', renderCell: (row) => formatMoney(row.amount) },
    { field: 'grand_total', headerName: 'Grand Total', renderCell: (row) => formatMoney(row.grand_total) },
    { field: 'date', headerName: 'Date', renderCell: (row) => new Date(row.date).toLocaleDateString() },
    { field: 'status', headerName: 'Source', renderCell: () => <Chip label="Fabric Purchase" size="small" color="info" variant="outlined" /> },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" color="text.primary">Fabric Purchase</Typography>
        <Button variant="contained" startIcon={<Plus size={18} />}
          onClick={() => {
            setEditingId(null);
            setFormData(initialForm);
            setModalOpen(true);
          }}>
          Add Fabric
        </Button>
      </Box>

      <DataTable columns={columns} data={data} totalCount={data.length} page={1} limit={data.length || 50}
        onEdit={handleEdit} onDelete={handleDelete} onPrint={handlePrint} isLoading={loading} />

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? 'Edit Fabric Purchase' : 'Add Fabric Purchase'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Fabric Code" value={formData.fabric_code}
                onChange={(e) => setFormData({ ...formData, fabric_code: e.target.value })}
                helperText={editingId ? '' : 'Leave blank to auto-generate'} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="PO No" value={formData.purchase_order_no}
                onChange={(e) => setFormData({ ...formData, purchase_order_no: e.target.value })}
                helperText={editingId ? '' : 'Leave blank to auto-generate'} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <SmartDropdown label="Supplier Name" value={formData.supplier_name_id}
                onChange={(e) => setFormData({ ...formData, supplier_name_id: e.target.value })}
                entity="mill-names" required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Date" InputLabelProps={{ shrink: true }}
                value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Particulars" value={formData.particulars}
                onChange={(e) => setFormData({ ...formData, particulars: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Total Weight (kg)" value={formData.total_weight}
                onChange={(e) => setFormData({ ...formData, total_weight: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Rate Per Unit" value={formData.rate_per_unit}
                onChange={(e) => setFormData({ ...formData, rate_per_unit: e.target.value })} required />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 1.5, p: 2, border: '1px solid #1e293b', borderRadius: 2 }}>
                <Typography color="text.secondary">Amount: <strong>Rs {formatMoney(amount)}</strong></Typography>
                <Typography color="text.secondary">CGST: <strong>Rs {formatMoney(cgst)}</strong></Typography>
                <Typography color="text.secondary">SGST: <strong>Rs {formatMoney(sgst)}</strong></Typography>
                <Typography color="text.primary">Grand Total: <strong>Rs {formatMoney(grandTotal)}</strong></Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={poConfigOpen} onClose={() => setPoConfigOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { maxHeight: '90vh' } }}>
        <DialogTitle sx={{ bgcolor: '#1a2e6b', color: 'white', fontWeight: 'bold' }}>Configure Fabric Purchase Order</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1a2e6b', bgcolor: '#eef0fb', px: 1.5, py: 0.5, borderRadius: 1 }}>
                Fabric Details
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="PO No" value={poFormData.purchase_order_no || ''}
                onChange={(e) => setPoFormData(prev => ({ ...prev, purchase_order_no: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Fabric Code" value={poFormData.fabric_code || ''}
                onChange={(e) => setPoFormData(prev => ({ ...prev, fabric_code: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Particulars" value={poFormData.particulars || ''}
                onChange={(e) => setPoFormData(prev => ({ ...prev, particulars: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Total Weight (kg)" value={poFormData.total_weight || ''}
                onChange={(e) => setPoFormData(prev => ({ ...prev, total_weight: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Rate Per Unit" value={poFormData.rate_per_unit || ''}
                onChange={(e) => setPoFormData(prev => ({ ...prev, rate_per_unit: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1a2e6b', bgcolor: '#eef0fb', px: 1.5, py: 0.5, borderRadius: 1 }}>
                PO Settings
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="CGST (%)" value={poConfig.cgst}
                onChange={(e) => setPoConfig({ ...poConfig, cgst: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="SGST (%)" value={poConfig.sgst}
                onChange={(e) => setPoConfig({ ...poConfig, sgst: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 1.5, p: 2, border: '1px solid #1e293b', borderRadius: 2 }}>
                <Typography color="text.secondary">Taxable: <strong>Rs {formatMoney(Number(poFormData.total_weight || 0) * Number(poFormData.rate_per_unit || 0))}</strong></Typography>
                <Typography color="text.secondary">CGST: <strong>Rs {formatMoney(Number(poFormData.total_weight || 0) * Number(poFormData.rate_per_unit || 0) * Number(poConfig.cgst || 0) / 100)}</strong></Typography>
                <Typography color="text.secondary">SGST: <strong>Rs {formatMoney(Number(poFormData.total_weight || 0) * Number(poFormData.rate_per_unit || 0) * Number(poConfig.sgst || 0) / 100)}</strong></Typography>
                <Typography color="text.primary">Grand Total: <strong>Rs {formatMoney((Number(poFormData.total_weight || 0) * Number(poFormData.rate_per_unit || 0)) * (1 + (Number(poConfig.cgst || 0) + Number(poConfig.sgst || 0)) / 100))}</strong></Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setPoConfigOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={reviewPoDetails}>Review &amp; Confirm</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1a2e6b', color: 'white', fontWeight: 'bold' }}>Confirm Purchase Order</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {poData && (
            <Box sx={{ display: 'grid', gap: 1, mt: 1 }}>
              <Typography color="text.secondary">PO No: <strong>{poData.purchase_order_no || '-'}</strong></Typography>
              <Typography color="text.secondary">Fabric Code: <strong>{poData.fabric_code || '-'}</strong></Typography>
              <Typography color="text.secondary">Supplier: <strong>{poData.supplierName?.name || '-'}</strong></Typography>
              <Typography color="text.secondary">Particulars: <strong>{poData.particulars || '-'}</strong></Typography>
              <Typography color="text.secondary">Weight: <strong>{Number(poData.total_weight || 0).toFixed(2)} kg</strong></Typography>
              <Typography color="text.secondary">Rate: <strong>Rs {formatMoney(poData.rate_per_unit)}</strong></Typography>
              <Typography color="text.secondary">Taxable Amount: <strong>Rs {formatMoney(poData.taxable)}</strong></Typography>
              <Typography color="text.secondary">CGST ({poData.cgstPercent || 0}%): <strong>Rs {formatMoney(poData.cgstAmount)}</strong></Typography>
              <Typography color="text.secondary">SGST ({poData.sgstPercent || 0}%): <strong>Rs {formatMoney(poData.sgstAmount)}</strong></Typography>
              <Typography color="text.primary" sx={{ mt: 1 }}>Grand Total: <strong>Rs {formatMoney(poData.totalAmount)}</strong></Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => { setConfirmOpen(false); setPoConfigOpen(true); }}>Edit</Button>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={confirmAndGeneratePo}>
            Confirm &amp; Generate PO
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={poViewerOpen} onClose={() => setPoViewerOpen(false)} maxWidth="xl" fullWidth PaperProps={{ sx: { maxHeight: '95vh' } }}>
        <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', '@media print': { display: 'none' } }}>
          <Typography variant="h6" fontWeight={600}>Fabric Purchase Order Preview</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={() => setPoViewerOpen(false)}>Close</Button>
            <Button variant="contained" onClick={() => window.print()}>Create PDF</Button>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 2, bgcolor: '#f5f5f5' }} id="printable-fabric-po">
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              #printable-fabric-po, #printable-fabric-po * { visibility: visible !important; }
              #printable-fabric-po {
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
            .po-title-bar { color: #0a0f2e; text-align: center; font-size: 15px; font-weight: 900; letter-spacing: 4px; padding: 7px; text-transform: uppercase; border-top: 2px solid #0a0f2e; border-bottom: 2px solid #0a0f2e; }
            .po-meta { display: flex; border-bottom: 2px solid #1a2e6b; }
            .po-meta-cell { flex: 1; padding: 6px 10px; border-right: 2px solid #1a2e6b; }
            .po-meta-cell:last-child { border-right: none; }
            .po-meta-cell .lbl { font-size: 9px; color: #777; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
            .po-meta-cell .val { font-weight: bold; font-size: 12px; color: #1a2e6b; }
            .po-parties { display: flex; border-bottom: 2px solid #1a2e6b; }
            .po-party-block { flex: 1; padding: 8px 12px; border-right: 2px solid #1a2e6b; min-height: 88px; }
            .po-party-block:last-child { border-right: none; }
            .po-party-block .pt { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #777; margin-bottom: 4px; letter-spacing: 0.5px; }
            .po-party-block .pn { font-size: 12px; font-weight: 900; color: #1a2e6b; margin-bottom: 2px; }
            .po-party-block .pa-line { display: block; font-size: 10px; color: #444; line-height: 1.6; }
            .po-party-block .pg { font-size: 10px; font-weight: bold; margin-top: 4px; color: #1a2e6b; }
            .po-table { width: 100%; border-collapse: collapse; }
            .po-table th { background: #eef0fb; color: #1a2e6b; font-weight: bold; padding: 7px 5px; border: 1.5px solid #1a2e6b; text-align: center; font-size: 10px; line-height: 1.3; }
            .po-table td { padding: 8px 5px; border: 1.5px solid #1a2e6b; text-align: center; color: #111; font-size: 11px; }
            .po-table td.al { text-align: left; padding-left: 8px; }
            .po-table tr.total-row td { background: #eef0fb; font-weight: bold; font-size: 11px; color: #1a2e6b; }
            .po-footer { display: flex; min-height: 80px; }
            .po-footer-left { flex: 1; padding: 10px 14px; border-right: 2px solid #1a2e6b; }
            .po-footer-right { width: 240px; padding: 10px 16px; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; }
            .po-footer .flbl { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #777; margin-bottom: 4px; }
            .po-footer .ftxt { font-size: 10px; color: #333; line-height: 1.7; }
            .po-sig-company { font-weight: bold; font-size: 11px; color: #1a2e6b; text-align: center; }
            .po-sig-line { margin-top: 28px; border-top: 1px solid #1a2e6b; padding-top: 4px; font-size: 10px; color: #555; width: 100%; text-align: center; }
          `}</style>

          {poData && (
            <>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, '@media print': { display: 'none' } }}>
              <TextField size="small" label="PO No" value={poData.purchase_order_no || ''}
                onChange={(e) => setPoData(prev => ({ ...prev, purchase_order_no: e.target.value }))} />
              <TextField size="small" label="Fabric Code" value={poData.fabric_code || ''}
                onChange={(e) => setPoData(prev => ({ ...prev, fabric_code: e.target.value }))} />
              <TextField size="small" type="number" label="CGST (%)" value={poData.cgstPercent ?? ''}
                onChange={(e) => updatePreviewTax('cgstPercent', e.target.value)} />
              <TextField size="small" type="number" label="SGST (%)" value={poData.sgstPercent ?? ''}
                onChange={(e) => updatePreviewTax('sgstPercent', e.target.value)} />
            </Box>
            <div className="po-wrap">
              <div className="po-header">
                <h1>CHHAVI NEETU TEXTILES LLP</h1>
                <p>No. 789, Kalampalayam, Andipalayam, Tirupur - 641 601.</p>
                <p>Phone : 96003 20779 &nbsp; | &nbsp; E-mail : chhavineetutextilesllp@gmail.com &nbsp; | &nbsp; GSTIN : 33AATFC5466D1ZC</p>
              </div>
              <div className="po-title-bar">FABRIC PURCHASE ORDER</div>
              <div className="po-meta">
                <div className="po-meta-cell"><div className="lbl">P.O. Number</div><div className="val">{poData.purchase_order_no || '-'}</div></div>
                <div className="po-meta-cell"><div className="lbl">Fabric Code</div><div className="val">{poData.fabric_code || '-'}</div></div>
                <div className="po-meta-cell"><div className="lbl">Date</div><div className="val">{new Date(poData.date).toLocaleDateString('en-GB')}</div></div>
              </div>
              <div className="po-parties">
                <div className="po-party-block">
                  <div className="pt">Supplier Address:</div>
                  <div className="pn">{poData.supplierName?.name || '-'}</div>
                  {poData.supplierAddress?.map((line, i) => <span key={i} className="pa-line">{line}</span>)}
                  <div className="pg">GSTIN : {poData.supplierName?.gstn || '-'}</div>
                </div>
                <div className="po-party-block">
                  <div className="pt">Delivery Address:</div>
                  <div className="pn">CHHAVI NEETU TEXTILES LLP</div>
                  <span className="pa-line">No. 789, Kalampalayam, Andipalayam</span>
                  <span className="pa-line">Tirupur - 641 601</span>
                  <div className="pg">GSTIN : 33AATFC5466D1ZC</div>
                </div>
              </div>
              <table className="po-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>S.No.</th>
                    <th>Description / Particulars</th>
                    <th>Fabric Code</th>
                    <th>Total Wt.<br />(kg)</th>
                    <th>Rate /<br />Unit (Rs)</th>
                    <th>Taxable<br />Amount (Rs)</th>
                    <th>CGST<br />%</th>
                    <th>CGST<br />Amount (Rs)</th>
                    <th>SGST<br />%</th>
                    <th>SGST<br />Amount (Rs)</th>
                    <th>Total<br />Amount (Rs)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td className="al">{poData.particulars}</td>
                    <td>{poData.fabric_code}</td>
                    <td>{Number(poData.total_weight || 0).toFixed(2)}</td>
                    <td>{Number(poData.rate_per_unit || 0).toFixed(2)}</td>
                    <td><strong>{formatMoney(poData.taxable)}</strong></td>
                    <td>{poData.cgstPercent}%</td>
                    <td>{formatMoney(poData.cgstAmount)}</td>
                    <td>{poData.sgstPercent}%</td>
                    <td>{formatMoney(poData.sgstAmount)}</td>
                    <td><strong>{formatMoney(poData.totalAmount)}</strong></td>
                  </tr>
                  <tr className="total-row">
                    <td colSpan={5} style={{ textAlign: 'right', paddingRight: '14px' }}>GRAND TOTAL</td>
                    <td>{formatMoney(poData.taxable)}</td>
                    <td></td>
                    <td>{formatMoney(poData.cgstAmount)}</td>
                    <td></td>
                    <td>{formatMoney(poData.sgstAmount)}</td>
                    <td>Rs {formatMoney(poData.totalAmount)}</td>
                  </tr>
                  <tr style={{ background: '#f0f4ff' }}>
                    <td colSpan={11} style={{ textAlign: 'left', padding: '7px 12px', fontWeight: 'bold', fontSize: '11px', color: '#1a2e6b', fontStyle: 'italic' }}>
                      Amount in Words: <span style={{ fontWeight: 900, fontStyle: 'normal' }}>{amountToWords(poData.totalAmount)}</span>
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
            </>
          )}
        </DialogContent>
      </Dialog>

    </Box>
  );
};

export default FabricPurchase;
