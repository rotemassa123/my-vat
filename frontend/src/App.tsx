import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import AnalysisPage from './pages/AnalysisPage';
import ReportingPage from './pages/ReportingPage';
import ManagePage from './pages/ManagePage';
import LoginPage from './pages/LoginPage';
import AuthTestPage from './pages/AuthTestPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes - no authentication required */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth-test" element={<AuthTestPage />} />
        
        {/* Protected routes - authentication required */}
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout><DashboardPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <AppLayout><DashboardPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/analysis" element={
          <ProtectedRoute>
            <AppLayout><AnalysisPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/reporting" element={
          <ProtectedRoute>
            <AppLayout><ReportingPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/manage" element={
          <ProtectedRoute>
            <AppLayout><ManagePage /></AppLayout>
          </ProtectedRoute>
        } />
        
        {/* Catch all - redirect to dashboard (which will redirect to login if not authenticated) */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
