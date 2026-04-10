import { useState } from 'react';
import { Box, Typography, TextField, Button, Card, CardContent, Grid, Divider } from '@mui/material';
import { Search as SearchIcon, ArrowRight } from 'lucide-react';
import api from '../api/axios';

const Search = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query) return;
    
    setLoading(true);
    try {
      const res = await api.get(`/search?q=${query}`);
      setResult(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const currentProcessCount = (knitting, dyeing, compacting) => {
    let count = 0;
    if (knitting?.length) count++;
    if (dyeing?.length) count++;
    if (compacting?.length) count++;
    return count;
  };

  return (
    <Box>
      <Typography variant="h4" color="text.primary" mb={3}>Search & Track Lifecycle</Typography>
      
      <Card sx={{ mb: 4, p: 2 }}>
        <form onSubmit={handleSearch}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField 
              fullWidth
              placeholder="Search by HF Code or Lot No..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button variant="contained" type="submit" disabled={loading} startIcon={<SearchIcon size={18} />} sx={{ px: 4 }}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </Box>
        </form>
      </Card>

      {result && result.yarn && (
        <Box>
          {/* Yarn Stage */}
          <Typography variant="h5" color="primary.main" mb={2}>Stage 1: Yarn</Typography>
          <Card sx={{ mb: 4, borderLeft: '4px solid #14b8a6' }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={3}><Typography color="text.secondary">HF Code</Typography><Typography fontWeight={600}>{result.yarn.hf_code}</Typography></Grid>
                <Grid item xs={3}><Typography color="text.secondary">Mill</Typography><Typography fontWeight={600}>{result.yarn.millName?.name}</Typography></Grid>
                <Grid item xs={3}><Typography color="text.secondary">Desc</Typography><Typography fontWeight={600}>{result.yarn.description}</Typography></Grid>
                <Grid item xs={3}><Typography color="text.secondary">Total Weight</Typography><Typography fontWeight={600}>{result.yarn.total_weight} kg</Typography></Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Knitting Stage */}
          {result.knitting.length > 0 && (
            <>
              <Typography variant="h5" color="secondary.main" mb={2} mt={4}>Stage 2: Knitting</Typography>
              {result.knitting.map(knit => (
                <Card key={knit.id} sx={{ mb: 2, borderLeft: '4px solid #fbbf24' }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={4}><Typography color="text.secondary">Knitter</Typography><Typography fontWeight={600}>{knit.knitterName?.name}</Typography></Grid>
                      <Grid item xs={4}><Typography color="text.secondary">Fabric</Typography><Typography fontWeight={600}>{knit.fabricDescription?.name}</Typography></Grid>
                      <Grid item xs={4}><Typography color="text.secondary">Grey Weight</Typography><Typography fontWeight={600}>{knit.grey_fabric_weight} kg</Typography></Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </>
          )}

          {/* Dyeing Stage */}
          {result.dyeing.length > 0 && (
            <>
              <Typography variant="h5" color="error.main" mb={2} mt={4}>Stage 3: Dyeing</Typography>
              {result.dyeing.map(dye => (
                <Card key={dye.id} sx={{ mb: 2, borderLeft: '4px solid #ef4444' }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={3}><Typography color="text.secondary">Lot No</Typography><Typography fontWeight={600}>{dye.lot_no}</Typography></Grid>
                      <Grid item xs={3}><Typography color="text.secondary">Dyer</Typography><Typography fontWeight={600}>{dye.dyerName?.name}</Typography></Grid>
                      <Grid item xs={3}><Typography color="text.secondary">Colour</Typography><Typography fontWeight={600}>{dye.colour?.name}</Typography></Grid>
                      <Grid item xs={3}><Typography color="text.secondary">Input / Output</Typography><Typography fontWeight={600}>{dye.initial_weight} &rarr; {dye.final_weight} kg</Typography></Grid>
                    </Grid>
                    
                    {/* Compacting sub-stage for this lot */}
                    {result.compacting.filter(c => c.lot_no === dye.lot_no).map(comp => (
                      <Box key={comp.id} sx={{ mt: 2, pt: 2, borderTop: '1px solid #1e293b' }}>
                        <Typography variant="subtitle2" color="primary.main" mb={1}>Stage 4: Compacting</Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={3}><Typography color="text.secondary">Compacter</Typography><Typography fontWeight={600}>{comp.compacterName?.name}</Typography></Grid>
                          <Grid item xs={3}><Typography color="text.secondary">Input / Output</Typography><Typography fontWeight={600}>{comp.initial_weight} &rarr; {comp.final_weight} kg</Typography></Grid>
                          <Grid item xs={3}><Typography color="text.secondary">Final Dia/GSM</Typography><Typography fontWeight={600}>{comp.final_dia} / {comp.final_gsm}</Typography></Grid>
                          <Grid item xs={3}><Typography color="text.secondary">Process Loss</Typography><Typography fontWeight={600} color="error.main">{Number(comp.process_loss).toFixed(2)}%</Typography></Grid>
                        </Grid>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </Box>
      )}

      {result && !result.yarn && query && !loading && (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No matching records found for "{query}"</Typography>
        </Card>
      )}
    </Box>
  );
};

export default Search;
