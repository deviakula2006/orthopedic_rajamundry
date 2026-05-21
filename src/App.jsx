import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { HospitalProvider } from './context/HospitalContext';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <AuthProvider>
      <HospitalProvider>
        <AppRoutes />
      </HospitalProvider>
    </AuthProvider>
  );
}

export default App;
