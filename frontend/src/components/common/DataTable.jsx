import { useState } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Paper,
  IconButton, TextField, InputAdornment, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Collapse
} from '@mui/material';
import { Edit2, Trash2, Search, AlertTriangle, Printer } from 'lucide-react';

const DataTable = ({
  columns,
  data,
  totalCount,
  page,
  limit,
  onPageChange,
  onLimitChange,
  onSearch,
  onEdit,
  onDelete,
  onPrint,
  isLoading,
  // Optional: render expanded content below each row
  expandedContent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const triggerDelete = (row) => { setItemToDelete(row); setDeleteConfirmOpen(true); };
  const confirmDelete = () => {
    if (itemToDelete && onDelete) onDelete(itemToDelete);
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter' && onSearch) onSearch(searchTerm);
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, bgcolor: 'background.paper', border: '1px solid #1e293b', backgroundImage: 'none' }}>
      {onSearch && (
        <Box sx={{ p: 2, borderBottom: '1px solid #1e293b' }}>
          <TextField size="small" placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyPress}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search size={18} color="#94a3b8" /></InputAdornment> }}
            sx={{ width: 300 }}
          />
        </Box>
      )}

      <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.field}
                  sx={{ bgcolor: '#0f172a', color: 'text.secondary', fontWeight: 600, borderBottom: '2px solid #1e293b' }}>
                  {col.headerName}
                </TableCell>
              ))}
              {(onEdit || onDelete || onPrint) && (
                <TableCell sx={{ bgcolor: '#0f172a', borderBottom: '2px solid #1e293b', width: 120 }} align="right">
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">Loading data...</Typography>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No records found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <>
                  <TableRow hover key={row.id} sx={{ '& td': { borderColor: '#1e293b' } }}>
                    {columns.map((col) => (
                      <TableCell key={col.field}>
                        {col.renderCell ? col.renderCell(row) : row[col.field]}
                      </TableCell>
                    ))}
                    {(onEdit || onDelete || onPrint) && (
                      <TableCell align="right">
                        {onPrint && (
                          <IconButton size="small" onClick={() => onPrint(row)} sx={{ color: 'secondary.main', mr: 1 }}>
                            <Printer size={16} />
                          </IconButton>
                        )}
                        {onEdit && (
                          <IconButton size="small" onClick={() => onEdit(row)} sx={{ color: 'primary.main', mr: 1 }}>
                            <Edit2 size={16} />
                          </IconButton>
                        )}
                        {onDelete && (
                          <IconButton size="small" onClick={() => triggerDelete(row)} sx={{ color: 'danger.main' }}>
                            <Trash2 size={16} />
                          </IconButton>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                  {expandedContent && (
                    <TableRow key={`${row.id}-expanded`}>
                      <TableCell colSpan={columns.length + 1} sx={{ p: 0, border: 0 }}>
                        {expandedContent(row)}
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {(onPageChange || onLimitChange) && totalCount > 0 && (
        <TablePagination
          component="div" count={totalCount} page={page - 1}
          onPageChange={(_, newPage) => onPageChange(newPage + 1)}
          rowsPerPage={limit}
          onRowsPerPageChange={(e) => onLimitChange(parseInt(e.target.value, 10))}
          sx={{ borderTop: '1px solid #1e293b', color: 'text.secondary' }}
        />
      )}

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{ sx: { bgcolor: 'background.paper', borderRadius: 2 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'danger.main' }}>
          <AlertTriangle size={24} />Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">Are you sure you want to delete this record? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={confirmDelete} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default DataTable;
