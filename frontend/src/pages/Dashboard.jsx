import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import { Database, Scissors, Droplets, PackageCheck, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
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

  const pieData = [
    { name: 'Grey Fabric', value: stats.sums.totalGreyFabric || 1, color: '#fbbf24' },
    { name: 'Dyed Fabric', value: stats.sums.totalDyedFabric || 1, color: '#ef4444' },
    { name: 'Compacted Fabric', value: stats.sums.totalCompactedFabric || 1, color: '#14b8a6' },
  ];

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

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, height: 400, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" mb={2}>Production Pipeline Vol (kg)</Typography>
            <Box sx={{ flexGrow: 1, minHeight: 0, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pieData}>
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8, color: '#fff' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, height: 400, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" mb={2}>Volume Distribution</Typography>
            <Box sx={{ flexGrow: 1, minHeight: 0, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8, color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
