import { useAuthStore } from '../store/authStore';
import Login from '../pages/Login';
import LoadingSpinner from './LoadingSpinner';

/**
 * Renders children only when the user is authenticated.
 * Shows a spinner while auth state is initializing,
 * otherwise falls back to the Login page.
 */
export default function ProtectedRoute({ children }) {
  const { accessToken, loading } = useAuthStore();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!accessToken) {
    return <Login />;
  }

  return children;
}
