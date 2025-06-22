import React from 'react';
import Login from '../components/Login';

export default function LoginPage() {
  const handleLoginSuccess = (userData: any) => {
    console.log('User logged in:', userData);
    // You can add additional logic here, like updating global state
  };

  return <Login onLogin={handleLoginSuccess} />;
} 