import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import ProtocolsLibrary from './pages/ProtocolsLibrary'; // <--- דף חדש
import ProtocolPage from './pages/ProtocolPage';
import GeneralTestPage from './pages/GeneralTestPage';
import StatsPage from './pages/StatsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-900 text-white font-sans">
          <Routes>
            <Route path="/" element={<Dashboard />} /> {/* דף הבית החדש */}
            <Route path="/protocols" element={<ProtocolsLibrary />} /> {/* הדף הישן עבר לפה */}
            <Route path="/protocol/:id" element={<ProtocolPage />} />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/general-test" element={<GeneralTestPage />} />
            {/* הכנה לעתיד (כרגע יציגו דף ריק או שגיאה אם נלחץ) */}
            <Route path="/stats" element={<StatsPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;