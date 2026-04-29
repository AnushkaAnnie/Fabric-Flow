import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DyeingRedirect = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/knitting', { replace: true });
  }, [navigate]);
  return null;
};

export default DyeingRedirect;
