import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { TrendingUp } from 'lucide-react';
import api from '../api/axios';

export default function YarnStockDashboard() {
  const [stockData, setStockData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStockData();
  }, []);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/yarn/stock');
      setStockData(response.data);
      setFilteredData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch stock data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = stockData.filter(
      item =>
        item.hfCode.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term)
    );
    setFilteredData(filtered);
  };

  const getConsumptionPercentage = (item) => {
    if (item.totalReceived === 0) return 0;
    return (item.totalUsed / item.totalReceived) * 100;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardHeader
          title="Yarn Stock Dashboard"
          subheader="Track yarn receipts, usage, and remaining stock"
          avatar={<TrendingUp size={28} />}
        />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            placeholder="Search by HF Code or Description..."
            value={searchTerm}
            onChange={handleSearch}
            variant="outlined"
            size="small"
            sx={{ mb: 3 }}
          />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : filteredData.length === 0 ? (
            <Typography color="textSecondary" align="center">
              No yarn records found
            </Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>HF Code</strong></TableCell>
                    <TableCell><strong>Description</strong></TableCell>
                    <TableCell align="right"><strong>Received (kg)</strong></TableCell>
                    <TableCell align="right"><strong>Used (kg)</strong></TableCell>
                    <TableCell align="right"><strong>Remaining (kg)</strong></TableCell>
                    <TableCell><strong>Consumption</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.map((item) => {
                    const consumptionPct = getConsumptionPercentage(item);
                    return (
                      <TableRow key={item.yarnId}>
                        <TableCell sx={{ fontWeight: 500 }}>{item.hfCode}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="right">{item.totalReceived.toFixed(2)}</TableCell>
                        <TableCell align="right">{item.totalUsed.toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 500, color: item.remaining > 0 ? 'green' : 'red' }}>
                          {item.remaining.toFixed(2)}
                        </TableCell>
                        <TableCell sx={{ width: 200 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(consumptionPct, 100)}
                              sx={{
                                flexGrow: 1,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: '#e0e0e0',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor:
                                    consumptionPct < 50
                                      ? '#4caf50'
                                      : consumptionPct < 80
                                      ? '#ff9800'
                                      : '#f44336',
                                },
                              }}
                            />
                            <Typography variant="caption" sx={{ minWidth: 40 }}>
                              {consumptionPct.toFixed(0)}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
