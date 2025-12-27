import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [suggestions, setSuggestions] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [rejectModal, setRejectModal] = useState({ open: false, suggestionId: null });
    const [rejectReason, setRejectReason] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    const [activeTab, setActiveTab] = useState('suggestions'); // 'suggestions' or 'flags'
    const [flaggedQuestions, setFlaggedQuestions] = useState([]);
    const [flagFilter, setFlagFilter] = useState('pending');

    // Check admin access - only redirect AFTER auth is loaded
    useEffect(() => {
        if (!authLoading && user && !user.is_admin) {
            navigate('/');
        }
    }, [user, authLoading, navigate]);

    // Fetch data
    useEffect(() => {
        if (user?.is_admin) {
            if (activeTab === 'suggestions') {
                fetchSuggestions();
            } else {
                fetchFlaggedQuestions();
            }
            fetchStats();
        }
    }, [user, statusFilter, activeTab, flagFilter]);

    const fetchSuggestions = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://127.0.0.1:5000/api/admin/suggestions?status=${statusFilter}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuggestions(res.data.suggestions);
        } catch (err) {
            console.error('Error fetching suggestions:', err);
            showToast('שגיאה בטעינת ההצעות', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchFlaggedQuestions = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://127.0.0.1:5000/api/admin/flagged-questions?status=${flagFilter}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFlaggedQuestions(res.data.flags);
        } catch (err) {
            console.error('Error fetching flagged questions:', err);
            showToast('שגיאה בטעינת השאלות המסומנות', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResolveFlag = async (flagId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://127.0.0.1:5000/api/admin/resolve-flag/${flagId}`, {
                status: 'resolved'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFlaggedQuestions(flaggedQuestions.filter(f => f.id !== flagId));
            showToast('השאלה סומנה כטופלה', 'success');
        } catch (err) {
            showToast('שגיאה', 'error');
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://127.0.0.1:5000/api/admin/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
    };

    const handleApprove = async (suggestionId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://127.0.0.1:5000/api/admin/approve/${suggestionId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Remove from list
            setSuggestions(suggestions.filter(s => s.id !== suggestionId));
            showToast('השאלה אושרה והתווספה למאגר! ✅', 'success');
            fetchStats();
        } catch (err) {
            console.error('Error approving:', err);
            showToast(err.response?.data?.message || 'שגיאה באישור השאלה', 'error');
        }
    };

    const handleReject = async () => {
        if (!rejectModal.suggestionId) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://127.0.0.1:5000/api/admin/reject/${rejectModal.suggestionId}`, {
                reason: rejectReason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Remove from list
            setSuggestions(suggestions.filter(s => s.id !== rejectModal.suggestionId));
            setRejectModal({ open: false, suggestionId: null });
            setRejectReason('');
            showToast('השאלה נדחתה', 'warning');
            fetchStats();
        } catch (err) {
            console.error('Error rejecting:', err);
            showToast('שגיאה בדחיית השאלה', 'error');
        }
    };

    // Show loading while auth is loading
    if (authLoading) {
        return <div className="text-white text-center mt-10">טוען... ⏳</div>;
    }

    // Show access denied if not admin
    if (!user?.is_admin) {
        return <div className="text-white text-center mt-10">אין לך הרשאה לצפות בעמוד זה</div>;
    }

    return (
        <div className="max-w-6xl mx-auto p-6 text-white">
            {/* Toast Notification */}
            {toast.show && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl ${toast.type === 'success' ? 'bg-green-600' :
                    toast.type === 'warning' ? 'bg-yellow-600' :
                        'bg-red-600'
                    }`}>
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white mb-2 flex items-center text-sm">
                        <span className="ml-2">⬅️</span> חזרה לדשבורד
                    </button>
                    <h1 className="text-3xl font-bold text-red-500">🛡️ לוח בקרה למנהלים</h1>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    <div className="bg-yellow-900/30 border border-yellow-500/30 p-4 rounded-xl text-center">
                        <p className="text-2xl font-bold text-yellow-400">{stats.suggestions.pending}</p>
                        <p className="text-gray-400 text-sm">ממתינות לאישור</p>
                    </div>
                    <div className="bg-green-900/30 border border-green-500/30 p-4 rounded-xl text-center">
                        <p className="text-2xl font-bold text-green-400">{stats.suggestions.approved}</p>
                        <p className="text-gray-400 text-sm">אושרו</p>
                    </div>
                    <div className="bg-red-900/30 border border-red-500/30 p-4 rounded-xl text-center">
                        <p className="text-2xl font-bold text-red-400">{stats.suggestions.rejected}</p>
                        <p className="text-gray-400 text-sm">נדחו</p>
                    </div>
                    <div className="bg-blue-900/30 border border-blue-500/30 p-4 rounded-xl text-center">
                        <p className="text-2xl font-bold text-blue-400">{stats.total_questions}</p>
                        <p className="text-gray-400 text-sm">שאלות במאגר</p>
                    </div>
                    <div className="bg-purple-900/30 border border-purple-500/30 p-4 rounded-xl text-center">
                        <p className="text-2xl font-bold text-purple-400">{stats.total_users}</p>
                        <p className="text-gray-400 text-sm">משתמשים רשומים</p>
                    </div>
                </div>
            )}



            {/* Actions Bar */}
            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => navigate('/admin/import')}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 p-4 rounded-xl shadow-lg border border-blue-400/30 flex items-center justify-center gap-3 transition transform hover:scale-[1.02]"
                >
                    <span className="text-2xl">📡</span>
                    <div className="text-right">
                        <span className="block font-bold text-white text-lg">ייבוא שאלות המוני (Bulk Import)</span>
                        <span className="text-blue-100 text-sm">העלאת קובץ CSV עם מאות שאלות</span>
                    </div>
                </button>
            </div>

            {/* Main Tab Switcher */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setActiveTab('suggestions')}
                    className={`flex-1 py-3 rounded-xl font-bold transition ${activeTab === 'suggestions' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                    📝 הצעות שאלות ({stats?.suggestions?.pending || 0})
                </button>
                <button
                    onClick={() => setActiveTab('flags')}
                    className={`flex-1 py-3 rounded-xl font-bold transition ${activeTab === 'flags' ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                    🚩 שאלות מסומנות
                </button>
            </div>

            {/* Conditional Content */}
            {activeTab === 'suggestions' ? (
                <>
                    {/* Filter Tabs for Suggestions */}
                    <div className="flex gap-2 mb-6">
                        {['pending', 'approved', 'rejected', 'all'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 rounded-lg font-bold text-sm transition ${statusFilter === status
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                            >
                                {status === 'pending' && 'ממתינות'}
                                {status === 'approved' && 'אושרו'}
                                {status === 'rejected' && 'נדחו'}
                                {status === 'all' && 'הכל'}
                            </button>
                        ))}
                    </div>

                    {/* Suggestions List */}
                    {
                        loading ? (
                            <div className="text-center text-gray-400 py-10">טוען הצעות... ⏳</div>
                        ) : suggestions.length === 0 ? (
                            <div className="text-center text-gray-500 py-10 bg-gray-800 rounded-xl">
                                אין הצעות בסטטוס זה 📭
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {suggestions.map(s => (
                                    <div key={s.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <span className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">#{s.id}</span>
                                                <span className="text-blue-400 font-bold">{s.protocol}</span>
                                                <span className={`text-xs px-2 py-1 rounded ${s.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    s.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                                        'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {s.status}
                                                </span>
                                            </div>
                                            <div className="text-left">
                                                <span className="text-gray-500 text-sm block">הוצע ע"י: <span className="text-cyan-400">{s.suggested_by}</span></span>
                                                {s.suggested_by_email && (
                                                    <span
                                                        className="text-blue-400 text-xs cursor-pointer hover:underline"
                                                        onClick={() => { navigator.clipboard.writeText(s.suggested_by_email); alert('המייל הועתק!'); }}
                                                        title="לחץ להעתקה"
                                                    >
                                                        📧 {s.suggested_by_email}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Question Text */}
                                        <h3 className="text-lg font-bold text-white mb-4">{s.text}</h3>

                                        {/* Options */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                                            {['a', 'b', 'c', 'd'].map(letter => (
                                                <div
                                                    key={letter}
                                                    className={`p-2 rounded flex items-center gap-2 ${s.correct_answer === letter
                                                        ? 'bg-green-600/30 border border-green-500'
                                                        : 'bg-gray-700'
                                                        }`}
                                                >
                                                    <span className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center text-xs font-bold">
                                                        {letter.toUpperCase()}
                                                    </span>
                                                    <span className="text-sm">{s[`option_${letter}`]}</span>
                                                    {s.correct_answer === letter && <span className="mr-auto text-green-400">✓</span>}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Explanation & Source */}
                                        {(s.explanation || s.source_reference) && (
                                            <div className="text-sm text-gray-400 mb-4 p-3 bg-gray-900 rounded">
                                                {s.explanation && <p className="mb-1">💡 {s.explanation}</p>}
                                                {s.source_reference && <p>📚 מקור: {s.source_reference}</p>}
                                            </div>
                                        )}

                                        {/* Action Buttons (only for pending) */}
                                        {s.status === 'pending' && (
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleApprove(s.id)}
                                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition"
                                                >
                                                    ✅ אשר והוסף למאגר
                                                </button>
                                                <button
                                                    onClick={() => setRejectModal({ open: true, suggestionId: s.id })}
                                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition"
                                                >
                                                    ❌ דחה
                                                </button>
                                            </div>
                                        )}

                                        {/* Admin Feedback (for rejected) */}
                                        {s.status === 'rejected' && s.admin_feedback && (
                                            <div className="text-sm text-red-400 p-3 bg-red-900/20 rounded border border-red-500/30">
                                                סיבת הדחייה: {s.admin_feedback}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )
                    }

                    {/* Reject Modal */}
                    {rejectModal.open && (
                        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 max-w-md w-full mx-4">
                                <h3 className="text-xl font-bold text-red-400 mb-4">דחיית הצעה</h3>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="סיבת הדחייה (אופציונלי)..."
                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white mb-4 resize-none"
                                    rows="3"
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleReject}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg"
                                    >
                                        דחה
                                    </button>
                                    <button
                                        onClick={() => { setRejectModal({ open: false, suggestionId: null }); setRejectReason(''); }}
                                        className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded-lg"
                                    >
                                        ביטול
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                /* Flagged Questions Tab */
                <div>
                    {/* Filter for Flags */}
                    <div className="flex gap-2 mb-6">
                        {['pending', 'resolved', 'all'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFlagFilter(status)}
                                className={`px-4 py-2 rounded-lg font-bold text-sm transition ${flagFilter === status
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                            >
                                {status === 'pending' && 'ממתינות'}
                                {status === 'resolved' && 'טופלו'}
                                {status === 'all' && 'הכל'}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="text-center text-gray-400 py-10">טוען שאלות מסומנות... ⏳</div>
                    ) : flaggedQuestions.length === 0 ? (
                        <div className="text-center text-gray-500 py-10 bg-gray-800 rounded-xl">
                            אין שאלות מסומנות בסטטוס זה 🎉
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {flaggedQuestions.map(f => (
                                <div key={f.id} className="bg-gray-800 p-5 rounded-xl border border-orange-500/30">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-xs">🚩 ID: {f.question_id}</span>
                                            <span className="text-blue-400 text-sm">{f.protocol_title}</span>
                                        </div>
                                        <div className="text-left">
                                            <span className="text-gray-500 text-xs block">דווח ע"י: {f.flagged_by}</span>
                                            {f.flagged_by_email && (
                                                <span
                                                    className="text-blue-400 text-xs cursor-pointer hover:underline"
                                                    onClick={() => { navigator.clipboard.writeText(f.flagged_by_email); alert('המייל הועתק!'); }}
                                                    title="לחץ להעתקה"
                                                >
                                                    📧 {f.flagged_by_email}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-white font-medium mb-2">{f.question_text}</p>
                                    <p className="text-gray-400 text-sm mb-3">📝 סיבה: {f.reason}</p>

                                    {f.status === 'pending' && (
                                        <button
                                            onClick={() => handleResolveFlag(f.id)}
                                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition"
                                        >
                                            ✅ סמן כטופל
                                        </button>
                                    )}
                                    {f.status === 'resolved' && (
                                        <span className="text-green-400 text-sm">✓ טופל</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
