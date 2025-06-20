import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import AnalysisPage from './pages/AnalysisPage';
import ReportingPage from './pages/ReportingPage';
import ManagePage from './pages/ManagePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout><DashboardPage /></AppLayout>} />
        <Route path="/dashboard" element={<AppLayout><DashboardPage /></AppLayout>} />
        <Route path="/analysis" element={<AppLayout><AnalysisPage /></AppLayout>} />
        <Route path="/reporting" element={<AppLayout><ReportingPage /></AppLayout>} />
        <Route path="/manage" element={<AppLayout><ManagePage /></AppLayout>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
