import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // כדי להציג את שם המשתמש

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth(); // שימוש ב-AuthContext

    return (
        <div className="p-8 max-w-6xl mx-auto text-white">
            {/* כותרת וברכה למשתמש */}
            <div className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-4xl font-bold text-blue-500 mb-2">שלום, {user?.username || 'חובש'} 👋</h1>
                    <p className="text-gray-400">ברוך הבא למערכת התרגול Proto-Kal</p>
                </div>
                <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="text-gray-400 hover:text-white border border-gray-600 hover:border-gray-400 px-4 py-2 rounded-lg transition"
                >
                    התנתק
                </button>
            </div>

            {/* שלושת הכפתורים הגדולים */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* כרטיס 1: לימוד פרוטוקולים */}
                <div
                    onClick={() => navigate('/protocols')}
                    className="bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-blue-500 hover:bg-gray-750 transition cursor-pointer shadow-lg hover:shadow-blue-900/20 group"
                >
                    <div className="text-5xl mb-4 group-hover:scale-110 transition duration-300">📚</div>
                    <h2 className="text-2xl font-bold text-white mb-2">ספריית פרוטוקולים</h2>
                    <p className="text-gray-400">תרגול ממוקד לפי נושאים: החייאה, טראומה, ועוד.</p>
                </div>

                {/* כרטיס 2: מבחן כללי (כרגע עדיין לא פעיל) */}
                <div
                    onClick={() => navigate('/general-test')}
                    className="bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-purple-500 hover:bg-gray-750 transition cursor-pointer shadow-lg hover:shadow-purple-900/20 group"
                >
                    <div className="text-5xl mb-4 group-hover:scale-110 transition duration-300">🚑</div>
                    <h2 className="text-2xl font-bold text-white mb-2">מבחן מסכם (100)</h2>
                    <p className="text-gray-400">מבחן רנדומלי של 100 שאלות מכל הנושאים המדמה מבחן אמת.</p>
                </div>

                {/* כרטיס 3: הסטטיסטיקות שלי (כרגע עדיין לא פעיל) */}
                <div
                    onClick={() => navigate('/stats')}
                    className="bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-green-500 hover:bg-gray-750 transition cursor-pointer shadow-lg hover:shadow-green-900/20 group"
                >
                    <div className="text-5xl mb-4 group-hover:scale-110 transition duration-300">📈</div>
                    <h2 className="text-2xl font-bold text-white mb-2">הביצועים שלי</h2>
                    <p className="text-gray-400">צפייה בהיסטוריית מבחנים, גרף שיפור ונקודות לחיזוק.</p>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;