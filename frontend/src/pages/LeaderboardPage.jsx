import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const LeaderboardPage = () => {
    const navigate = useNavigate();
    const [leaderboard, setLeaderboard] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [period, setPeriod] = useState('weekly');
    const [periodName, setPeriodName] = useState('');
    const [loading, setLoading] = useState(true);
    const [rankBy, setRankBy] = useState('avg_score');
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groupName, setGroupName] = useState(null);
    const [leaderboardMode, setLeaderboardMode] = useState('users'); // 'users' or 'groups'
    const [groupsLeaderboard, setGroupsLeaderboard] = useState([]);
    const [userGroups, setUserGroups] = useState([]);

    // Fetch user's groups on mount
    useEffect(() => {
        fetchGroups();
    }, []);

    useEffect(() => {
        if (leaderboardMode === 'users') {
            fetchLeaderboard();
        } else {
            fetchGroupsLeaderboard();
        }
    }, [period, rankBy, selectedGroup, leaderboardMode]);

    const fetchGroups = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://127.0.0.1:5000/api/groups/my-groups', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGroups(res.data.groups);
        } catch (err) {
            console.error('Error fetching groups:', err);
        }
    };

    const fetchGroupsLeaderboard = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://127.0.0.1:5000/api/content/groups-leaderboard?period=${period}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGroupsLeaderboard(res.data.groups_leaderboard);
            setUserGroups(res.data.user_groups);
            setPeriodName(res.data.period_name);
        } catch (err) {
            console.error('Error fetching groups leaderboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            let url = `http://127.0.0.1:5000/api/content/leaderboard?period=${period}&rank_by=${rankBy}`;
            if (selectedGroup) {
                url += `&group_id=${selectedGroup}`;
            }
            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLeaderboard(res.data.leaderboard);
            setCurrentUser(res.data.current_user);
            setPeriodName(res.data.period_name);
            setGroupName(res.data.group_name);
        } catch (err) {
            console.error('Error fetching leaderboard:', err);
        } finally {
            setLoading(false);
        }
    };

    // Medal icons for top 3
    const getRankIcon = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return rank;
    };

    // Row styling based on rank
    const getRowClass = (entry) => {
        let base = 'flex items-center justify-between p-4 rounded-xl transition ';
        if (entry.is_current_user) {
            return base + 'bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border border-blue-500';
        }
        if (entry.rank === 1) return base + 'bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border border-yellow-500/50';
        if (entry.rank === 2) return base + 'bg-gradient-to-r from-gray-600/30 to-gray-700/30 border border-gray-400/50';
        if (entry.rank === 3) return base + 'bg-gradient-to-r from-orange-900/30 to-amber-900/30 border border-orange-500/50';
        return base + 'bg-gray-800 border border-gray-700';
    };

    return (
        <div className="max-w-3xl mx-auto p-6 text-white">
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white mb-6 flex items-center">
                <span className="ml-2 text-xl">⬅️</span> חזרה לדשבורד
            </button>

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-yellow-500 mb-2">🏆 טבלת המובילים</h1>
                <p className="text-gray-400">התתחר עם המתרגלים הטובים ביותר</p>
            </div>

            {/* Mode Toggle: Users vs Groups */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setLeaderboardMode('users')}
                    className={`flex-1 py-3 rounded-xl font-bold text-lg transition ${leaderboardMode === 'users'
                        ? 'bg-yellow-500 text-gray-900'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                >
                    👤 משתמשים
                </button>
                <button
                    onClick={() => setLeaderboardMode('groups')}
                    className={`flex-1 py-3 rounded-xl font-bold text-lg transition ${leaderboardMode === 'groups'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                >
                    🏢 תחרות קבוצות
                </button>
            </div>

            {/* Period Tabs */}
            <div className="flex gap-2 mb-6">
                {[
                    { value: 'weekly', label: 'שבועי' },
                    { value: 'monthly', label: 'חודשי' },
                    { value: 'all', label: 'כל הזמנים' }
                ].map(p => (
                    <button
                        key={p.value}
                        onClick={() => setPeriod(p.value)}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition ${period === p.value
                            ? 'bg-yellow-500 text-gray-900'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Rank Mode Toggle */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setRankBy('avg_score')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition ${rankBy === 'avg_score'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                >
                    📊 לפי ממוצע
                </button>
                <button
                    onClick={() => setRankBy('correct_answers')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition ${rankBy === 'correct_answers'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                >
                    ✅ לפי תשובות נכונות
                </button>
            </div>

            {/* Group Filter */}
            {leaderboardMode === 'users' && groups.length > 0 && (
                <div className="mb-6">
                    <label className="text-gray-400 text-sm block mb-2">👥 סינון לפי קבוצה:</label>
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setSelectedGroup(null)}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition ${selectedGroup === null
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            🌍 כולם
                        </button>
                        {groups.map(g => (
                            <button
                                key={g.id}
                                onClick={() => { setSelectedGroup(g.id); setRankBy('correct_answers'); }}
                                className={`px-4 py-2 rounded-lg font-bold text-sm transition ${selectedGroup === g.id
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                            >
                                {g.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Groups Competition Leaderboard */}
            {leaderboardMode === 'groups' ? (
                loading ? (
                    <div className="text-center text-gray-400 py-10">טוען תחרות קבוצות... 🏢</div>
                ) : groupsLeaderboard.length === 0 ? (
                    <div className="text-center text-gray-500 py-10 bg-gray-800 rounded-xl">
                        אין קבוצות עם פעילות בתקופה זו 📊
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-2 text-gray-400 text-sm font-bold">
                            <div className="flex items-center gap-4">
                                <span className="w-10 text-center">#</span>
                                <span>קבוצה</span>
                            </div>
                            <div className="flex items-center gap-4 text-center">
                                <span className="w-20">✅ תשובות</span>
                                <span className="w-16">חברים</span>
                            </div>
                        </div>

                        {/* Rows */}
                        {groupsLeaderboard.map((g) => (
                            <div key={g.group_id} className={`flex items-center justify-between p-4 rounded-xl transition ${g.rank === 1 ? 'bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border border-yellow-500/50' :
                                g.rank === 2 ? 'bg-gradient-to-r from-gray-600/30 to-gray-700/30 border border-gray-400/50' :
                                    g.rank === 3 ? 'bg-gradient-to-r from-orange-900/30 to-amber-900/30 border border-orange-500/50' :
                                        userGroups.some(ug => ug.group_id === g.group_id) ? 'bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500' :
                                            'bg-gray-800 border border-gray-700'
                                }`}>
                                <div className="flex items-center gap-4">
                                    <span className={`w-10 text-center text-2xl ${g.rank <= 3 ? '' : 'text-gray-500 text-lg'}`}>
                                        {getRankIcon(g.rank)}
                                    </span>
                                    <div>
                                        <span className="font-bold text-white">{g.group_name}</span>
                                        {g.top_contributor && (
                                            <span className="block text-xs text-gray-400">⭐ מוביל: {g.top_contributor} ({g.top_contributor_score})</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-center">
                                    <span className="w-20 font-bold text-green-400 text-lg">{g.total_correct_answers}</span>
                                    <span className="w-16 text-gray-400">{g.member_count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                /* Users Leaderboard Table */
                loading ? (
                    <div className="text-center text-gray-400 py-10">טוען דירוגים... 🏆</div>
                ) : leaderboard.length === 0 ? (
                    <div className="text-center text-gray-500 py-10 bg-gray-800 rounded-xl">
                        אין מספיק נתונים לתקופה זו 📊
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-2 text-gray-400 text-sm font-bold">
                            <div className="flex items-center gap-4">
                                <span className="w-10 text-center">#</span>
                                <span>משתמש</span>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="w-20 text-center">✅ נכונות</span>
                                <span className="w-20 text-center">מבחנים</span>
                                <span className="w-20 text-center">ממוצע</span>
                            </div>
                        </div>

                        {/* Rows */}
                        {leaderboard.map((entry) => (
                            <div key={entry.user_id} className={getRowClass(entry)}>
                                <div className="flex items-center gap-4">
                                    <span className={`w-10 text-center text-2xl ${entry.rank <= 3 ? '' : 'text-gray-500 text-lg'}`}>
                                        {getRankIcon(entry.rank)}
                                    </span>
                                    <div>
                                        <span className={`font-bold ${entry.is_current_user ? 'text-blue-400' : 'text-white'}`}>
                                            {entry.display_name}
                                        </span>
                                        {entry.is_current_user && (
                                            <span className="text-xs text-blue-400 mr-2">(את/ה)</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 text-center">
                                    <span className="w-20 font-bold text-green-400">{entry.correct_answers}</span>
                                    <span className="w-20 text-gray-400">{entry.tests_taken}</span>
                                    <span className={`w-20 font-bold text-lg ${entry.avg_score >= 80 ? 'text-green-400' :
                                        entry.avg_score >= 60 ? 'text-yellow-400' :
                                            'text-red-400'
                                        }`}>
                                        {entry.avg_score}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* Current user rank (if not in top 20) - only in users mode */}
            {leaderboardMode === 'users' && currentUser && (
                <div className="mt-8 p-4 bg-gray-800 rounded-xl border border-gray-700">
                    <p className="text-gray-400 text-sm mb-2">הדירוג שלך:</p>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-2xl text-gray-500">#{currentUser.rank}</span>
                            <span className="font-bold text-white">{currentUser.display_name}</span>
                        </div>
                        <div className="flex items-center gap-6 text-center">
                            <span className="text-gray-400">{currentUser.tests_taken} מבחנים</span>
                            <span className={`font-bold text-lg ${currentUser.avg_score >= 80 ? 'text-green-400' :
                                currentUser.avg_score >= 60 ? 'text-yellow-400' :
                                    'text-red-400'
                                }`}>
                                {currentUser.avg_score}%
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Info note */}
            <div className="mt-6 p-3 bg-gray-800/50 rounded-lg text-center">
                <p className="text-gray-500 text-sm">
                    🎯 {leaderboardMode === 'groups' ? 'דירוג קבוצות לפי סה"כ תשובות נכונות' : 'הדירוג מבוסס על כמות התשובות הנכונות'} ב{periodName}
                </p>
            </div>
        </div>
    );
};

export default LeaderboardPage;
