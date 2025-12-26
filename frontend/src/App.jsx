import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import ProtocolPage from './pages/ProtocolPage'; // למעלה

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* הגדרת הרקע הכללי לכל האפליקציה */}
        <div className="min-h-screen bg-gray-900 text-white">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/protocol/:id" element={<ProtocolPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;