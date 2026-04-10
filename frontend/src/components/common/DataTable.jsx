import { useState } from 'react';
import { 
  Box, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, TablePagination, Paper,
  IconButton, TextField, InputAdornment, Typography
} from '@mui/material';
import { Edit2, Trash2, Search } from 'lucide-react';

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
  isLoading
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(searchTerm);
    }
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, bgcolor: 'background.paper', border: '1px solid #1e293b', backgroundImage: 'none' }}>
      
      {/* Search Bar */}
      {onSearch && (
        <Box sx={{ p: 2, borderBottom: '1px solid #1e293b' }}>
          <TextField
            size="small"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyPress}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} color="#94a3b8" />
                </InputAdornment>
              )
            }}
            sx={{ width: 300 }}
          />
        </Box>
      )}

      {/* Table Area */}
      <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell 
                  key={col.field} 
                  sx={{ 
                    bgcolor: '#0f172a', 
                    color: 'text.secondary',
                    fontWeight: 600,
                    borderBottom: '2px solid #1e293b'
                  }}
                >
                  {col.headerName}
                </TableCell>
              ))}
              {(onEdit || onDelete) && (
                <TableCell sx={{ bgcolor: '#0f172a', borderBottom: '2px solid #1e293b', width: 100 }} align="right">
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
                <TableRow hover key={row.id} sx={{ '& td': { borderColor: '#1e293b' }}}>
                  {columns.map((col) => (
                    <TableCell key={col.field}>
                      {col.renderCell ? col.renderCell(row) : row[col.field]}
                    </TableCell>
                  ))}
                  {(onEdit || onDelete) && (
                    <TableCell align="right">
                      {onEdit && (
                        <IconButton size="small" onClick={() => onEdit(row)} sx={{ color: 'primary.main', mr: 1 }}>
                          <Edit2 size={16} />
                        </IconButton>
                      )}
                      {onDelete && (
                        <IconButton size="small" onClick={() => onDelete(row)} sx={{ color: 'danger.main' }}>
                          <Trash2 size={16} />
                        </IconButton>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Pagination */}
      {(onPageChange || onLimitChange) && totalCount > 0 && (
        <TablePagination
          component="div"
          count={totalCount}
          page={page - 1} // MUI is 0-indexed
          onPageChange={(_, newPage) => onPageChange(newPage + 1)}
          rowsPerPage={limit}
          onRowsPerPageChange={(e) => onLimitChange(parseInt(e.target.value, 10))}
          sx={{ borderTop: '1px solid #1e293b', color: 'text.secondary' }}
        />
      )}
    </Paper>
  );
};

export default DataTable;
