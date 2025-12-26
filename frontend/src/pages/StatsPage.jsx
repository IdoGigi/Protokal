import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const StatsPage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'protocols', 'general'

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://127.0.0.1:5000/api/content/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(res.data);
            } catch (err) {
                console.error(err);
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [navigate]);

    if (loading) return <div className="text-white text-center mt-10">טוען נתונים... 📊</div>;
    if (!stats) return null;

    // Get the appropriate history based on active tab
    const getHistoryData = () => {
        switch (activeTab) {
            case 'protocols':
                return stats.protocol_stats.history;
            case 'general':
                return stats.general_stats.history;
            default:
                // Combine and sort by date (newest first)
                return [...stats.protocol_stats.history, ...stats.general_stats.history]
                    .sort((a, b) => {
                        // Parse dates in DD/MM/YYYY HH:MM format
                        const parseDate = (dateStr) => {
                            const [datePart, timePart] = dateStr.split(' ');
                            const [day, month, year] = datePart.split('/');
                            const [hour, minute] = timePart.split(':');
                            return new Date(year, month - 1, day, hour, minute);
                        };
                        return parseDate(b.date) - parseDate(a.date);
                    });
        }
    };

    // Get stats for the current tab
    const getCurrentStats = () => {
        switch (activeTab) {
            case 'protocols':
                return { total: stats.protocol_stats.total, average: stats.protocol_stats.average };
            case 'general':
                return { total: stats.general_stats.total, average: stats.general_stats.average };
            default:
                return { total: stats.total_tests, average: stats.average_score };
        }
    };

    const currentStats = getCurrentStats();
    const historyData = getHistoryData();

    return (
        <div className="max-w-4xl mx-auto p-6 text-white">
            {/* Back button */}
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white mb-8 flex items-center">
                <span className="ml-2 text-xl">⬅️</span> חזרה לדשבורד
            </button>

            <h1 className="text-3xl font-bold text-green-500 mb-8">הביצועים שלי 📈</h1>

            {/* Tab navigation */}
            <div className="flex gap-2 mb-8">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 rounded-lg font-bold transition ${activeTab === 'all'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                >
                    כל המבחנים
                </button>
                <button
                    onClick={() => setActiveTab('protocols')}
                    className={`px-4 py-2 rounded-lg font-bold transition ${activeTab === 'protocols'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                >
                    תרגול פרוטוקולים 📚
                </button>
                <button
                    onClick={() => setActiveTab('general')}
                    className={`px-4 py-2 rounded-lg font-bold transition ${activeTab === 'general'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                >
                    מבחנים מסכמים 🚑
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-sm">
                            {activeTab === 'all' && 'סה"כ מבחנים שבוצעו'}
                            {activeTab === 'protocols' && 'תרגולי פרוטוקולים'}
                            {activeTab === 'general' && 'מבחנים מסכמים'}
                        </p>
                        <p className="text-4xl font-bold text-white">{currentStats.total}</p>
                    </div>
                    <div className="text-4xl">
                        {activeTab === 'all' && '📝'}
                        {activeTab === 'protocols' && '📚'}
                        {activeTab === 'general' && '🚑'}
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-sm">ציון ממוצע</p>
                        <p className={`text-4xl font-bold ${currentStats.average >= 80 ? 'text-green-400' :
                            currentStats.average >= 60 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                            {currentStats.average}
                        </p>
                    </div>
                    <div className="text-4xl">🎯</div>
                </div>
            </div>

            {/* Quick stats comparison (only shown on 'all' tab) */}
            {activeTab === 'all' && (stats.protocol_stats.total > 0 || stats.general_stats.total > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl">
                        <div className="flex items-center justify-between">
                            <span className="text-blue-400 font-bold">📚 תרגול פרוטוקולים</span>
                            <span className="text-gray-400 text-sm">{stats.protocol_stats.total} מבחנים</span>
                        </div>
                        <p className={`text-2xl font-bold mt-2 ${stats.protocol_stats.average >= 80 ? 'text-green-400' :
                            stats.protocol_stats.average >= 60 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                            ממוצע: {stats.protocol_stats.average || '-'}
                        </p>
                    </div>
                    <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-xl">
                        <div className="flex items-center justify-between">
                            <span className="text-purple-400 font-bold">🚑 מבחנים מסכמים</span>
                            <span className="text-gray-400 text-sm">{stats.general_stats.total} מבחנים</span>
                        </div>
                        <p className={`text-2xl font-bold mt-2 ${stats.general_stats.average >= 80 ? 'text-green-400' :
                            stats.general_stats.average >= 60 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                            ממוצע: {stats.general_stats.average || '-'}
                        </p>
                    </div>
                </div>
            )}

            {/* History table */}
            <h2 className="text-xl font-bold text-white mb-4">
                {activeTab === 'all' && 'היסטוריית כל המבחנים'}
                {activeTab === 'protocols' && 'היסטוריית תרגול פרוטוקולים'}
                {activeTab === 'general' && 'היסטוריית מבחנים מסכמים'}
            </h2>
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-gray-700 text-gray-300">
                        <tr>
                            <th className="p-4">תאריך</th>
                            <th className="p-4">סוג המבחן</th>
                            <th className="p-4">ציון</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {historyData.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="p-8 text-center text-gray-500">
                                    {activeTab === 'all' && 'עדיין לא ביצעת מבחנים. זה הזמן להתחיל! 🚀'}
                                    {activeTab === 'protocols' && 'עדיין לא תרגלת פרוטוקולים. לך לספריית הפרוטוקולים! 📚'}
                                    {activeTab === 'general' && 'עדיין לא ביצעת מבחנים מסכמים. נסה את המבחן הכללי! 🚑'}
                                </td>
                            </tr>
                        ) : (
                            historyData.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-750 transition">
                                    <td className="p-4 text-gray-400 font-mono text-sm">{item.date}</td>
                                    <td className="p-4 font-bold">
                                        <span className={`inline-flex items-center ${item.protocol === 'מבחן מסכם רב-תחומי'
                                            ? 'text-purple-400'
                                            : 'text-blue-400'
                                            }`}>
                                            {item.protocol === 'מבחן מסכם רב-תחומי' ? '🚑 ' : '📚 '}
                                            {item.protocol}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${item.score >= 80 ? 'bg-green-500/20 text-green-400' :
                                            item.score >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-red-500/20 text-red-400'
                                            }`}>
                                            {item.score}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StatsPage;
