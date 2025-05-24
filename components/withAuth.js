import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Adjust path as needed

const withAuth = (WrappedComponent, allowedRoles = []) => {
  const Wrapper = (props) => {
    const { isAuthenticated, loading, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        router.replace('/auth?redirect=' + router.pathname); // Redirect to login, optionally pass current path
      }
    }, [loading, isAuthenticated, router]);

    // Role-based access control
    useEffect(() => {
      if (!loading && isAuthenticated && allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
        // If user does not have an allowed role, redirect to a fallback page or home
        // For simplicity, redirecting to home. A dedicated '/unauthorized' page would be better.
        router.replace('/'); 
      }
    }, [loading, isAuthenticated, user, allowedRoles, router]);


    if (loading) {
      return <p>Loading authentication state...</p>; // Or a proper spinner component
    }

    if (!isAuthenticated) {
      // This will likely be preempted by the useEffect redirect, but good as a fallback
      return <p>Redirecting to login...</p>; 
    }
    
    // Role check after authentication
    if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
        return <p>Unauthorized for this page. Redirecting...</p>; // Fallback UI
    }

    return <WrappedComponent {...props} />;
  };

  // Set display name for better debugging
  Wrapper.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return Wrapper;
};

export default withAuth;
