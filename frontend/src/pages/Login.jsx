import { useState } from 'react';
import { Box, Button, Card, TextField, Typography, InputAdornment, IconButton } from '@mui/material';
import { Lock, User, Eye, EyeOff, PackageCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const result = await login(username, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
    
    setIsLoading(false);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      bgcolor: 'background.default',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decoration elements */}
      <Box sx={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.1) 0%, rgba(15,23,42,0) 70%)' }} />
      <Box sx={{ position: 'absolute', bottom: -150, right: -100, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,191,36,0.05) 0%, rgba(15,23,42,0) 70%)' }} />

      <Card sx={{ 
        width: '100%', 
        maxWidth: 420, 
        p: 5, 
        zIndex: 1,
        bgcolor: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ 
            width: 64, height: 64, 
            borderRadius: 3, 
            bgcolor: 'primary.main', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            mx: 'auto', mb: 2,
            boxShadow: '0 10px 25px -5px rgba(20, 184, 166, 0.4)'
          }}>
            <PackageCheck size={36} color="#fff" />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
            FabricFlow
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Production Management System
          </Typography>
        </Box>

        {error && (
          <Box sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <Typography variant="body2" sx={{ color: 'danger.main', textAlign: 'center', fontWeight: 500 }}>
              {error}
            </Typography>
          </Box>
        )}

        <form onSubmit={handleLogin}>
          <TextField
            fullWidth
            placeholder="Username"
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{ mb: 2.5 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <User size={20} color="#94a3b8" />
                </InputAdornment>
              ),
              sx: { borderRadius: 2, bgcolor: 'background.default' }
            }}
          />
          
          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 4 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock size={20} color="#94a3b8" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#94a3b8' }}>
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </IconButton>
                </InputAdornment>
              ),
              sx: { borderRadius: 2, bgcolor: 'background.default' }
            }}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            color="primary"
            disabled={isLoading || !username || !password}
            sx={{ py: 1.5, fontSize: '1rem' }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </Card>
    </Box>
  );
};

export default Login;
