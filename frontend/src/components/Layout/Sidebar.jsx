import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Divider, IconButton } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Scissors, Droplets, PackageCheck, Search, Database, LogOut, Layers, TrendingUp, PackagePlus, Send } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const DRAWER_WIDTH = 260;

const menuItems = [
  { text: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
  { text: 'Yarn', icon: <Database size={20} />, path: '/yarn' },
  { text: 'Fabric Purchase', icon: <Layers size={20} />, path: '/fabric-purchase' },
  { text: 'Knitting', icon: <Scissors size={20} />, path: '/knitting' },
  { text: 'Dyeing', icon: <Droplets size={20} />, path: '/dyeing' },
  { text: 'Compacting', icon: <PackageCheck size={20} />, path: '/compacting' },
  { text: 'Search & Track', icon: <Search size={20} />, path: '/search' },
  { text: 'Master Data', icon: <Database size={20} />, path: '/master' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { 
          width: DRAWER_WIDTH, 
          boxSizing: 'border-box',
          backgroundColor: '#0f172a',
          borderRight: '1px solid #1e293b'
        },
      }}
    >
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PackageCheck size={20} color="#fff" />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.5px' }}>
          FabricFlow
        </Typography>
      </Box>

      <List sx={{ px: 2, flex: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: '8px',
                  bgcolor: isActive ? 'rgba(20, 184, 166, 0.1)' : 'transparent',
                  color: isActive ? 'primary.main' : 'text.secondary',
                  '&:hover': {
                    bgcolor: isActive ? 'rgba(20, 184, 166, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    color: isActive ? 'primary.main' : 'text.primary',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontSize: '0.9rem', 
                    fontWeight: isActive ? 600 : 500 
                  }} 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: '#1e293b', mx: 2 }} />
      
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, mb: 1, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.02)' }}>
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', noWrap: true }}>
              {user?.username || 'User'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {user?.role || 'operator'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleLogout} sx={{ color: 'text.secondary', '&:hover': { color: 'danger.main' } }}>
            <LogOut size={18} />
          </IconButton>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
