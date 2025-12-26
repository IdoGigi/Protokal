import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const StatsPage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="max-w-4xl mx-auto p-6 text-white">
            {/* כפתור חזרה */}
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white mb-8 flex items-center">
                <span className="ml-2 text-xl">⬅️</span> חזרה לדשבורד
            </button>

            <h1 className="text-3xl font-bold text-green-500 mb-8">הביצועים שלי 📈</h1>

            {/* כרטיסי סיכום */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-sm">סה"כ מבחנים שבוצעו</p>
                        <p className="text-4xl font-bold text-white">{stats.total_tests}</p>
                    </div>
                    <div className="text-4xl">📝</div>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-sm">ציון ממוצע משוקלל</p>
                        <p className={`text-4xl font-bold ${stats.average_score >= 80 ? 'text-green-400' :
                            stats.average_score >= 60 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                            {stats.average_score}
                        </p>
                    </div>
                    <div className="text-4xl">🎯</div>
                </div>
            </div>

            {/* טבלת היסטוריה */}
            <h2 className="text-xl font-bold text-white mb-4">היסטוריית מבחנים אחרונים</h2>
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-gray-700 text-gray-300">
                        <tr>
                            <th className="p-4">תאריך</th>
                            <th className="p-4">נושא המבחן</th>
                            <th className="p-4">ציון</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {stats.history.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="p-8 text-center text-gray-500">
                                    עדיין לא ביצעת מבחנים. זה הזמן להתחיל! 🚀
                                </td>
                            </tr>
                        ) : (
                            stats.history.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-750 transition">
                                    <td className="p-4 text-gray-400 font-mono text-sm">{item.date}</td>
                                    <td className="p-4 font-bold">{item.protocol}</td>
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