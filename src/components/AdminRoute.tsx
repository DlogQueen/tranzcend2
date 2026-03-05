import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminRoute = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return profile?.is_admin ? <Outlet /> : <Navigate to="/" replace />;
};

export default AdminRoute;
