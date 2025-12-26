import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const GroupDetailPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [group, setGroup] = useState(null);
    const [members, setMembers] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [posts, setPosts] = useState([]);
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('feed');
    const [period, setPeriod] = useState('weekly');
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [showPostModal, setShowPostModal] = useState(false);
    const [showGoalModal, setShowGoalModal] = useState(false);

    // Form States
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostPinned, setNewPostPinned] = useState(false);
    const [newGoalTitle, setNewGoalTitle] = useState('');
    const [newGoalDesc, setNewGoalDesc] = useState('');
    const [newGoalType, setNewGoalType] = useState('tests_count');
    const [newGoalTarget, setNewGoalTarget] = useState('');
    const [newGoalScope, setNewGoalScope] = useState('team');

    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        fetchGroupDetails();
    }, [id]);

    useEffect(() => {
        if (group) {
            if (activeTab === 'leaderboard') fetchLeaderboard();
            if (activeTab === 'feed') fetchPosts();
            if (activeTab === 'goals') fetchGoals();
        }
    }, [group, period, activeTab]);

    const fetchGroupDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://127.0.0.1:5000/api/groups/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGroup(res.data.group);
            setMembers(res.data.members);
            setIsAdmin(res.data.group.is_admin);
        } catch (err) {
            console.error('Error fetching group:', err);
            if (err.response?.status === 403) {
                showToast('אין לך גישה לקבוצה זו', 'error');
                navigate('/groups');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaderboard = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://127.0.0.1:5000/api/groups/${id}/leaderboard?period=${period}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLeaderboard(res.data.leaderboard);
        } catch (err) {
            console.error('Error fetching leaderboard:', err);
        }
    };

    const fetchPosts = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://127.0.0.1:5000/api/groups/${id}/posts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPosts(res.data.posts);
        } catch (err) {
            console.error('Error fetching posts:', err);
        }
    };

    const fetchGoals = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://127.0.0.1:5000/api/groups/${id}/goals`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGoals(res.data.goals);
        } catch (err) {
            console.error('Error fetching goals:', err);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim()) {
            showToast('יש להזין תוכן', 'error');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://127.0.0.1:5000/api/groups/${id}/posts`, {
                title: newPostTitle,
                content: newPostContent,
                is_pinned: newPostPinned
            }, { headers: { Authorization: `Bearer ${token}` } });
            showToast('הפוסט פורסם!', 'success');
            setShowPostModal(false);
            setNewPostTitle('');
            setNewPostContent('');
            setNewPostPinned(false);
            fetchPosts();
        } catch (err) {
            showToast(err.response?.data?.message || 'שגיאה', 'error');
        }
    };

    const handleCreateGoal = async () => {
        if (!newGoalTitle.trim() || !newGoalTarget) {
            showToast('יש למלא כותרת ויעד', 'error');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://127.0.0.1:5000/api/groups/${id}/goals`, {
                title: newGoalTitle,
                description: newGoalDesc,
                target_type: newGoalType,
                target_value: parseInt(newGoalTarget),
                scope: newGoalScope
            }, { headers: { Authorization: `Bearer ${token}` } });
            showToast('היעד נוצר!', 'success');
            setShowGoalModal(false);
            setNewGoalTitle('');
            setNewGoalDesc('');
            setNewGoalTarget('');
            setNewGoalScope('team');
            fetchGoals();
        } catch (err) {
            showToast(err.response?.data?.message || 'שגיאה', 'error');
        }
    };

    const handleCompleteGoal = async (goalId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://127.0.0.1:5000/api/groups/${id}/goals/${goalId}/complete`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast('היעד סומן כהושלם!', 'success');
            fetchGoals();
        } catch (err) {
            showToast('שגיאה', 'error');
        }
    };

    const handleLeaveGroup = async () => {
        if (!confirm('האם אתה בטוח?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://127.0.0.1:5000/api/groups/${id}/leave`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/groups');
        } catch (err) {
            showToast(err.response?.data?.message || 'שגיאה', 'error');
        }
    };

    const copyInviteCode = () => {
        navigator.clipboard.writeText(group.invite_code);
        showToast('קוד ההזמנה הועתק! 📋', 'success');
    };

    const getRankIcon = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return rank;
    };

    if (loading) return <div className="text-white text-center mt-10">טוען קבוצה... 👥</div>;
    if (!group) return null;

    return (
        <div className="max-w-4xl mx-auto p-6 text-white">
            {/* Toast */}
            {toast.show && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {toast.message}
                </div>
            )}

            <button onClick={() => navigate('/groups')} className="text-gray-400 hover:text-white mb-6 flex items-center">
                <span className="ml-2 text-xl">⬅️</span> חזרה לקבוצות
            </button>

            {/* Group Header */}
            <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 p-6 rounded-2xl border border-cyan-500/30 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-cyan-400 mb-2">{group.name}</h1>
                        {group.description && <p className="text-gray-400">{group.description}</p>}
                        <p className="text-gray-500 text-sm mt-2">👥 {members.length} חברים</p>
                    </div>
                    <div className="flex gap-2">
                        {isAdmin && (
                            <button onClick={() => setShowCodeModal(true)} className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-bold transition">
                                📋 הזמנה
                            </button>
                        )}
                        <button onClick={handleLeaveGroup} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold transition">
                            עזוב
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {[
                    { id: 'feed', label: '📢 הודעות', color: 'purple' },
                    { id: 'goals', label: '🎯 יעדים', color: 'green' },
                    { id: 'leaderboard', label: '🏆 דירוג', color: 'yellow' },
                    { id: 'members', label: '👥 חברים', color: 'cyan' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition ${activeTab === tab.id ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Feed Tab */}
            {activeTab === 'feed' && (
                <div>
                    {isAdmin && (
                        <button onClick={() => setShowPostModal(true)} className="mb-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold transition w-full">
                            + פרסם הודעה חדשה
                        </button>
                    )}
                    {posts.length === 0 ? (
                        <div className="text-center py-10 bg-gray-800 rounded-xl">
                            <span className="text-4xl mb-2 block">📢</span>
                            <p className="text-gray-400">אין הודעות עדיין</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {posts.map(post => (
                                <div key={post.id} className={`bg-gray-800 p-5 rounded-xl border ${post.is_pinned ? 'border-yellow-500' : 'border-gray-700'}`}>
                                    {post.is_pinned && <span className="text-yellow-400 text-xs mb-2 block">📌 נעוץ</span>}
                                    {post.title && <h3 className="text-xl font-bold text-white mb-2">{post.title}</h3>}
                                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700">
                                        <span className="text-gray-500 text-sm">{post.author} • {post.created_at}</span>
                                        <span className="text-gray-500 text-sm">💬 {post.comment_count} תגובות</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Goals Tab */}
            {activeTab === 'goals' && (
                <div>
                    {isAdmin && (
                        <button onClick={() => setShowGoalModal(true)} className="mb-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold transition w-full">
                            + צור יעד חדש
                        </button>
                    )}
                    {goals.length === 0 ? (
                        <div className="text-center py-10 bg-gray-800 rounded-xl">
                            <span className="text-4xl mb-2 block">🎯</span>
                            <p className="text-gray-400">אין יעדים עדיין</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {goals.map(goal => (
                                <div key={goal.id} className={`bg-gray-800 p-5 rounded-xl border ${goal.status === 'completed' ? 'border-green-500/50 opacity-70' : 'border-gray-700'}`}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-xs px-2 py-1 rounded-full border border-gray-600 ${goal.scope === 'individual' ? 'bg-purple-900/30 text-purple-300' : 'bg-blue-900/30 text-blue-300'}`}>
                                                    {goal.scope === 'individual' ? '👤 יעד אישי' : '👥 יעד קבוצתי'}
                                                </span>
                                                <span className={`text-xs px-2 py-1 rounded-full border border-gray-600 bg-gray-700 text-gray-300`}>
                                                    {goal.target_type === 'tests_count' ? '📝 כמות מבחנים' :
                                                        goal.target_type === 'correct_answers' ? '✅ תשובות נכונות' :
                                                            '📊 ממוצע ציונים'}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                                {goal.status === 'completed' && <span>✅</span>}
                                                {goal.title}
                                            </h3>
                                            {goal.description && <p className="text-gray-400 text-sm mt-1">{goal.description}</p>}
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-400">
                                                {goal.current_value} / {goal.target_value}
                                                {goal.scope === 'individual' && <span className="text-xs mr-2">(ההתקדמות שלך)</span>}
                                            </span>
                                            <span className={`font-bold ${goal.progress_pct >= 100 ? 'text-green-400' : 'text-cyan-400'}`}>
                                                {goal.progress_pct}%
                                            </span>
                                        </div>
                                        <div className="h-4 bg-gray-700 rounded-full overflow-hidden relative">
                                            <div
                                                className={`h-full transition-all duration-1000 ease-out ${goal.progress_pct >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`}
                                                style={{ width: `${goal.progress_pct}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Top Contributors (for Team Goals) */}
                                    {goal.scope === 'team' && goal.top_contributors && goal.top_contributors.length > 0 && (
                                        <div className="mt-4 pt-3 border-t border-gray-700">
                                            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-bold">🏆 תורמים מובילים</p>
                                            <div className="flex gap-4">
                                                {goal.top_contributors.map((c, i) => (
                                                    <div key={i} className="flex items-center gap-2 bg-gray-900/50 px-3 py-1.5 rounded-lg border border-gray-700/50">
                                                        <span className="text-xs font-bold text-yellow-500/80">#{i + 1}</span>
                                                        <span className="text-sm text-gray-300">{c.name}</span>
                                                        <span className="text-xs bg-gray-700 text-gray-400 px-1.5 rounded">{c.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-gray-700/50">
                                        <span className="text-gray-500">נוצר ע״י {goal.created_by}</span>
                                        {isAdmin && goal.status === 'active' && goal.progress_pct >= 100 && (
                                            <button onClick={() => handleCompleteGoal(goal.id)} className="text-green-400 hover:text-green-300 font-bold bg-green-500/10 px-3 py-1 rounded-lg border border-green-500/20 transition hover:bg-green-500/20">
                                                ✓ סמן כהושלם
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Leaderboard Tab */}
            {activeTab === 'leaderboard' && (
                <div>
                    <div className="flex gap-2 mb-4">
                        {[{ value: 'weekly', label: 'שבועי' }, { value: 'monthly', label: 'חודשי' }, { value: 'all', label: 'כל הזמנים' }].map(p => (
                            <button key={p.value} onClick={() => setPeriod(p.value)}
                                className={`px-3 py-1 rounded-lg text-sm transition ${period === p.value ? 'bg-yellow-500 text-gray-900 font-bold' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Leaderboard Header */}
                    <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                        <div className="flex-1">דירוג</div>
                        <div className="flex items-center gap-6 w-1/2 justify-end">
                            <span className="w-20 text-center">מבחנים</span>
                            <span className="w-20 text-center">✅ נכונות</span>
                            <span className="w-16 text-center">ציון</span>
                        </div>
                    </div>

                    {leaderboard.length === 0 ? (
                        <div className="text-center py-10 bg-gray-800 rounded-xl">
                            <span className="text-4xl mb-2 block">📊</span>
                            <p className="text-gray-400">אין נתונים לתקופה זו</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {leaderboard.map((entry) => (
                                <div key={entry.user_id}
                                    className={`flex items-center justify-between p-4 rounded-xl transition border-l-4 ${entry.is_current_user ? 'bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border-l-blue-500 border-y border-r border-gray-700'
                                            : entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-900/20 to-amber-900/20 border-l-yellow-500 border-y border-r border-gray-700'
                                                : 'bg-gray-800 border-l-gray-600 border-y border-r border-gray-700'
                                        }`}>
                                    <div className="flex items-center gap-4 flex-1">
                                        <span className={`text-2xl w-8 text-center font-bold ${entry.rank <= 3 ? '' : 'text-gray-600'}`}>
                                            {getRankIcon(entry.rank)}
                                        </span>
                                        <span className={`font-bold text-lg ${entry.is_current_user ? 'text-blue-400' : 'text-white'}`}>
                                            {entry.display_name}
                                            {entry.is_current_user && <span className="text-xs text-blue-500 mr-2 bg-blue-500/10 px-2 py-0.5 rounded-full">(את/ה)</span>}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-6 w-1/2 justify-end">
                                        <span className="text-gray-400 w-20 text-center font-mono">{entry.tests_taken}</span>
                                        <span className="text-green-400 font-bold w-20 text-center font-mono text-lg">{entry.correct_answers}</span>
                                        <span className={`font-bold text-lg w-16 text-center ${entry.avg_score >= 80 ? 'text-green-400' : entry.avg_score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {entry.avg_score}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
                <div className="space-y-2">
                    {members.map((member) => (
                        <div key={member.user_id} className="flex items-center justify-between p-4 bg-gray-800 rounded-xl border border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-lg">
                                    {member.role === 'admin' ? '👑' : '👤'}
                                </div>
                                <div>
                                    <span className="font-bold text-white">{member.display_name}</span>
                                    {member.role === 'admin' && <span className="text-xs text-yellow-400 mr-2">(מנהל)</span>}
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-gray-400 text-sm">{member.tests_taken} מבחנים</p>
                                <p className={`font-bold ${member.avg_score >= 80 ? 'text-green-400' : member.avg_score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                    {member.avg_score}%
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Invite Code Modal */}
            {showCodeModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 max-w-md w-full mx-4 text-center">
                        <h3 className="text-xl font-bold text-cyan-400 mb-4">קוד הזמנה</h3>
                        <div className="bg-gray-900 p-4 rounded-xl mb-4">
                            <span className="text-3xl font-mono font-bold text-yellow-400 tracking-widest">{group.invite_code}</span>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={copyInviteCode} className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 rounded-lg">העתק</button>
                            <button onClick={() => setShowCodeModal(false)} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded-lg">סגור</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Post Modal */}
            {showPostModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 max-w-lg w-full mx-4">
                        <h3 className="text-xl font-bold text-purple-400 mb-4">📢 פרסם הודעה</h3>
                        <input type="text" value={newPostTitle} onChange={(e) => setNewPostTitle(e.target.value)}
                            placeholder="כותרת (אופציונלי)" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white mb-3" />
                        <textarea value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)}
                            placeholder="תוכן ההודעה" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white mb-3 resize-none" rows="4" />
                        <label className="flex items-center gap-2 mb-4 cursor-pointer">
                            <input type="checkbox" checked={newPostPinned} onChange={(e) => setNewPostPinned(e.target.checked)} className="w-4 h-4" />
                            <span className="text-gray-300">📌 הצמד למעלה</span>
                        </label>
                        <div className="flex gap-3">
                            <button onClick={handleCreatePost} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg">פרסם</button>
                            <button onClick={() => setShowPostModal(false)} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded-lg">ביטול</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Goal Modal */}
            {showGoalModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 max-w-lg w-full mx-4">
                        <h3 className="text-xl font-bold text-green-400 mb-4">🎯 צור יעד חדש</h3>
                        <input type="text" value={newGoalTitle} onChange={(e) => setNewGoalTitle(e.target.value)}
                            placeholder="שם היעד" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white mb-3" />
                        <textarea value={newGoalDesc} onChange={(e) => setNewGoalDesc(e.target.value)}
                            placeholder="תיאור (אופציונלי)" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white mb-3 resize-none" rows="2" />

                        <div className="grid grid-cols-1 gap-3 mb-3">
                            {/* Scope Selection */}
                            <div className="flex bg-gray-700 p-1 rounded-lg">
                                <button
                                    onClick={() => setNewGoalScope('team')}
                                    className={`flex-1 py-1 text-sm font-bold rounded-md transition ${newGoalScope === 'team' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                                >
                                    👥 קבוצתי
                                </button>
                                <button
                                    onClick={() => setNewGoalScope('individual')}
                                    className={`flex-1 py-1 text-sm font-bold rounded-md transition ${newGoalScope === 'individual' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                                >
                                    👤 אישי
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <select value={newGoalType} onChange={(e) => setNewGoalType(e.target.value)}
                                className="p-3 bg-gray-700 border border-gray-600 rounded-lg text-white">
                                <option value="correct_answers">✅ תשובות נכונות</option>
                                <option value="tests_count">📝 מספר מבחנים</option>
                                <option value="avg_score">📊 ציון ממוצע</option>
                            </select>
                            <input type="number" value={newGoalTarget} onChange={(e) => setNewGoalTarget(e.target.value)}
                                placeholder={newGoalType === 'avg_score' ? 'אחוז (85)' : 'מספר (50)'}
                                className="p-3 bg-gray-700 border border-gray-600 rounded-lg text-white" />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleCreateGoal} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg">צור יעד</button>
                            <button onClick={() => setShowGoalModal(false)} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded-lg">ביטול</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupDetailPage;
