import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    return (
        <div className="p-8 max-w-6xl mx-auto text-white">
            {/* Header with greeting and logout button */}
            <div className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-4xl font-bold text-blue-500 mb-2">שלום, {user?.display_name || 'חובש'} 👋</h1>
                    <p className="text-gray-400">ברוך הבא למערכת התרגול Proto-Kal</p>
                </div>
                <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="text-gray-400 hover:text-white border border-gray-600 hover:border-gray-400 px-4 py-2 rounded-lg transition"
                >
                    התנתק
                </button>
            </div>

            {/* Admin Banner (only for admins) */}
            {user?.is_admin && (
                <div
                    onClick={() => navigate('/admin')}
                    className="mb-8 bg-gradient-to-r from-red-900/40 to-pink-900/40 p-4 rounded-xl border border-red-500/30 hover:border-red-500 transition cursor-pointer"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🛡️</span>
                        <div>
                            <h3 className="font-bold text-red-400">לוח בקרה למנהלים</h3>
                            <p className="text-gray-400 text-sm">ניהול הצעות שאלות, אישור ודחייה</p>
                        </div>
                        <span className="mr-auto text-red-400">→</span>
                    </div>
                </div>
            )}

            {/* Main action cards - Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">

                {/* Card 1: Protocols Library */}
                <div
                    onClick={() => navigate('/protocols')}
                    className="bg-gray-800 p-6 rounded-2xl border border-gray-700 hover:border-blue-500 hover:bg-gray-750 transition cursor-pointer shadow-lg hover:shadow-blue-900/20 group"
                >
                    <div className="text-4xl mb-3 group-hover:scale-110 transition duration-300">📚</div>
                    <h2 className="text-xl font-bold text-white mb-1">ספריית פרוטוקולים</h2>
                    <p className="text-gray-400 text-sm">תרגול ממוקד לפי נושאים</p>
                </div>

                {/* Card 2: General Test */}
                <div
                    onClick={() => navigate('/general-test')}
                    className="bg-gray-800 p-6 rounded-2xl border border-gray-700 hover:border-purple-500 hover:bg-gray-750 transition cursor-pointer shadow-lg hover:shadow-purple-900/20 group"
                >
                    <div className="text-4xl mb-3 group-hover:scale-110 transition duration-300">🚑</div>
                    <h2 className="text-xl font-bold text-white mb-1">מבחן מסכם (100)</h2>
                    <p className="text-gray-400 text-sm">100 שאלות מכל הנושאים</p>
                </div>

                {/* Card 3: Weakness Practice */}
                <div
                    onClick={() => navigate('/weakness-test')}
                    className="bg-gradient-to-br from-orange-900/40 to-red-900/40 p-6 rounded-2xl border border-orange-500/30 hover:border-orange-500 transition cursor-pointer shadow-lg hover:shadow-orange-900/20 group"
                >
                    <div className="text-4xl mb-3 group-hover:scale-110 transition duration-300">💪</div>
                    <h2 className="text-xl font-bold text-orange-400 mb-1">חזק את החולשות</h2>
                    <p className="text-gray-400 text-sm">תרגול מותאם אישית</p>
                </div>

                {/* Card 4: My Statistics */}
                <div
                    onClick={() => navigate('/stats')}
                    className="bg-gray-800 p-6 rounded-2xl border border-gray-700 hover:border-green-500 hover:bg-gray-750 transition cursor-pointer shadow-lg hover:shadow-green-900/20 group"
                >
                    <div className="text-4xl mb-3 group-hover:scale-110 transition duration-300">📈</div>
                    <h2 className="text-xl font-bold text-white mb-1">הביצועים שלי</h2>
                    <p className="text-gray-400 text-sm">היסטוריה וגרפים</p>
                </div>

            </div>

            {/* Secondary row - Social features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Leaderboard */}
                <div
                    onClick={() => navigate('/leaderboard')}
                    className="bg-gradient-to-r from-yellow-900/40 to-amber-900/40 p-5 rounded-2xl border border-yellow-500/30 hover:border-yellow-500 transition cursor-pointer shadow-lg group"
                >
                    <div className="flex items-center gap-3">
                        <div className="text-3xl group-hover:scale-110 transition duration-300">🏆</div>
                        <div>
                            <h2 className="text-lg font-bold text-yellow-400">טבלת המובילים</h2>
                            <p className="text-gray-400 text-xs">התחרה עם עמיתים</p>
                        </div>
                    </div>
                </div>

                {/* Groups */}
                <div
                    onClick={() => navigate('/groups')}
                    className="bg-gradient-to-r from-cyan-900/40 to-teal-900/40 p-5 rounded-2xl border border-cyan-500/30 hover:border-cyan-500 transition cursor-pointer shadow-lg group"
                >
                    <div className="flex items-center gap-3">
                        <div className="text-3xl group-hover:scale-110 transition duration-300">👥</div>
                        <div>
                            <h2 className="text-lg font-bold text-cyan-400">הקבוצות שלי</h2>
                            <p className="text-gray-400 text-xs">צוותים ותחרויות</p>
                        </div>
                    </div>
                </div>

                {/* Suggest Question */}
                <div
                    onClick={() => navigate('/suggest-question')}
                    className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 p-5 rounded-2xl border border-purple-500/30 hover:border-purple-500 transition cursor-pointer shadow-lg group"
                >
                    <div className="flex items-center gap-3">
                        <div className="text-3xl group-hover:scale-110 transition duration-300">💡</div>
                        <div>
                            <h2 className="text-lg font-bold text-purple-400">הצע שאלה חדשה</h2>
                            <p className="text-gray-400 text-xs">עזור לקהילה</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;