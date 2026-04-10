import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import { Database, Scissors, Droplets, PackageCheck, AlertTriangle } from 'lucide-react';
import api from '../api/axios';

const StatCard = ({ title, value, subtitle, icon, color }) => (
  <Card sx={{ bgcolor: 'background.paper', height: '100%', display: 'flex', flexDirection: 'column', p: 1 }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography color="text.secondary" variant="body2" fontWeight={600} gutterBottom>{title}</Typography>
          <Typography variant="h4" fontWeight={700} color="text.primary">{value}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}20`, color }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/analytics');
        setStats(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  if (!stats) return <Typography>Loading dashboard...</Typography>;

  return (
    <Box>
      <Typography variant="h4" color="text.primary" mb={4}>Dashboard</Typography>
      
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Yarn" 
            value={`${stats.counts.yarn} Lots`}
            subtitle={`${Number(stats.sums.totalYarnWeight || 0).toFixed(1)} kg`}
            icon={<Database size={24} />} 
            color="#3b82f6" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Knitting" 
            value={`${stats.counts.knitting} Lots`}
            subtitle={`${Number(stats.sums.totalGreyFabric || 0).toFixed(1)} kg`}
            icon={<Scissors size={24} />} 
            color="#fbbf24" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Dyeing" 
            value={`${stats.counts.dyeing} Lots`}
            subtitle={`${Number(stats.sums.totalDyedFabric || 0).toFixed(1)} kg`}
            icon={<Droplets size={24} />} 
            color="#ef4444" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Avg Process Loss" 
            value={`${Number(stats.averages.avgProcessLoss).toFixed(2)}%`}
            subtitle="Overall Quality Metric"
            icon={<AlertTriangle size={24} />} 
            color="#f97316" 
          />
        </Grid>
      </Grid>

    </Box>
  );
};

export default Dashboard;
