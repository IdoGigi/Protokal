import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import ProtocolsLibrary from './pages/ProtocolsLibrary';
import ProtocolPage from './pages/ProtocolPage';
import GeneralTestPage from './pages/GeneralTestPage';
import StatsPage from './pages/StatsPage';
import ProfilePage from './pages/ProfilePage';
import SuggestQuestionPage from './pages/SuggestQuestionPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminImportPage from './pages/AdminImportPage';
import WeaknessTestPage from './pages/WeaknessTestPage';
import LeaderboardPage from './pages/LeaderboardPage';
import GroupsPage from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-900 text-white font-sans">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/protocols" element={<ProtocolsLibrary />} />
            <Route path="/protocol/:id" element={<ProtocolPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/general-test" element={<GeneralTestPage />} />
            <Route path="/stats" element={<StatsPage />} />
            {/* Profile page is read-only - no edit functionality */}
            <Route path="/profile" element={<ProfilePage />} />
            {/* Crowdsourcing - suggest new questions */}
            <Route path="/suggest-question" element={<SuggestQuestionPage />} />
            {/* Admin routes - protected by is_admin check in component */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/import" element={<AdminImportPage />} />
            {/* Personalized weakness practice */}
            <Route path="/weakness-test" element={<WeaknessTestPage />} />
            {/* Leaderboard - rankings */}
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            {/* Groups - teams */}
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/group/:id" element={<GroupDetailPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;