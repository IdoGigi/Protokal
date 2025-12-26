import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const GroupsPage = () => {
    const navigate = useNavigate();
    const [myGroups, setMyGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    useEffect(() => {
        fetchMyGroups();
    }, []);

    const fetchMyGroups = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://127.0.0.1:5000/api/groups/my-groups', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyGroups(res.data.groups);
        } catch (err) {
            console.error('Error fetching groups:', err);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) {
            showToast('יש להזין שם לקבוצה', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://127.0.0.1:5000/api/groups/create', {
                name: newGroupName,
                description: newGroupDesc
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            showToast(`הקבוצה "${res.data.group.name}" נוצרה בהצלחה!`, 'success');
            setShowCreateModal(false);
            setNewGroupName('');
            setNewGroupDesc('');
            fetchMyGroups();
        } catch (err) {
            showToast(err.response?.data?.message || 'שגיאה ביצירת הקבוצה', 'error');
        }
    };

    const handleJoinGroup = async () => {
        if (!joinCode.trim()) {
            showToast('יש להזין קוד הזמנה', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://127.0.0.1:5000/api/groups/join', {
                invite_code: joinCode
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            showToast(res.data.message, 'success');
            setShowJoinModal(false);
            setJoinCode('');
            fetchMyGroups();
        } catch (err) {
            showToast(err.response?.data?.message || 'קוד הזמנה שגוי', 'error');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 text-white">
            {/* Toast */}
            {toast.show && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                    {toast.message}
                </div>
            )}

            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white mb-6 flex items-center">
                <span className="ml-2 text-xl">⬅️</span> חזרה לדשבורד
            </button>

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-cyan-400 mb-2">👥 הקבוצות שלי</h1>
                    <p className="text-gray-400">נהל קבוצות והתחרו יחד</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowJoinModal(true)}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold transition"
                    >
                        הצטרף לקבוצה
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-bold transition"
                    >
                        צור קבוצה חדשה +
                    </button>
                </div>
            </div>

            {/* Groups List */}
            {loading ? (
                <div className="text-center text-gray-400 py-10">טוען קבוצות... 👥</div>
            ) : myGroups.length === 0 ? (
                <div className="text-center py-16 bg-gray-800 rounded-2xl border border-gray-700">
                    <span className="text-6xl mb-4 block">👥</span>
                    <h3 className="text-xl font-bold text-gray-300 mb-2">אין לך קבוצות עדיין</h3>
                    <p className="text-gray-500 mb-6">צור קבוצה חדשה או הצטרף לקבוצה קיימת</p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => setShowJoinModal(true)}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-bold transition"
                        >
                            הצטרף עם קוד
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-bold transition"
                        >
                            צור קבוצה
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myGroups.map(group => (
                        <div
                            key={group.id}
                            onClick={() => navigate(`/group/${group.id}`)}
                            className="bg-gray-800 p-5 rounded-xl border border-gray-700 hover:border-cyan-500 transition cursor-pointer group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition">
                                    {group.name}
                                </h3>
                                {group.role === 'admin' && (
                                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                        מנהל
                                    </span>
                                )}
                            </div>
                            {group.description && (
                                <p className="text-gray-400 text-sm mb-3">{group.description}</p>
                            )}
                            <div className="flex items-center justify-between text-sm text-gray-500">
                                <span>👥 {group.member_count} חברים</span>
                                <span>הצטרפת ב-{group.joined_at}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Group Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-cyan-400 mb-4">צור קבוצה חדשה</h3>
                        <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="שם הקבוצה"
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white mb-3"
                        />
                        <textarea
                            value={newGroupDesc}
                            onChange={(e) => setNewGroupDesc(e.target.value)}
                            placeholder="תיאור (אופציונלי)"
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white mb-4 resize-none"
                            rows="2"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={handleCreateGroup}
                                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 rounded-lg"
                            >
                                צור קבוצה
                            </button>
                            <button
                                onClick={() => { setShowCreateModal(false); setNewGroupName(''); setNewGroupDesc(''); }}
                                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded-lg"
                            >
                                ביטול
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Join Group Modal */}
            {showJoinModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-cyan-400 mb-4">הצטרף לקבוצה</h3>
                        <input
                            type="text"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            placeholder="הזן קוד הזמנה"
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white mb-4 text-center text-xl tracking-widest"
                            maxLength={8}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={handleJoinGroup}
                                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 rounded-lg"
                            >
                                הצטרף
                            </button>
                            <button
                                onClick={() => { setShowJoinModal(false); setJoinCode(''); }}
                                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded-lg"
                            >
                                ביטול
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupsPage;
