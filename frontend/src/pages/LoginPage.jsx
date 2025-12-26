import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage = () => {
    // 1. ניהול המידע של הטופס
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // הוקים לניווט ולשימוש במוח של האפליקציה
    const { login } = useAuth();
    const navigate = useNavigate();

    // 2. עדכון המשתנים כשהמשתמש מקליד
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // 3. שליחת הטופס
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // ניקוי שגיאות קודמות
        setLoading(true);

        // קריאה לפונקציית הלוגין מה-Context
        const result = await login(formData.email, formData.password);

        if (result.success) {
            // אם הצליח -> לך הביתה
            navigate('/');
        } else {
            // אם נכשל -> תציג את השגיאה
            setError("שם המשתמש או הסיסמה שגויים");
        }
        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white px-4">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md">

                {/* כותרת */}
                <h2 className="text-3xl font-bold text-center text-blue-500 mb-2">כניסה למערכת</h2>
                <p className="text-center text-gray-400 mb-8">Proto-Kal V2 🚑</p>

                {/* טופס */}
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* שדה אימייל */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">כתובת אימייל</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-white"
                            placeholder="medic@mda.org.il"
                        />
                    </div>

                    {/* שדה סיסמה */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">סיסמה</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-white"
                            placeholder="••••••••"
                        />
                    </div>

                    {/* הודעת שגיאה */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded text-center text-sm">
                            {error}
                        </div>
                    )}

                    {/* כפתור שליחה */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-lg font-bold text-white transition transform hover:scale-[1.02] 
                            ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {loading ? 'מתחבר...' : 'התחבר'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-400">
                    עדיין אין לך משתמש? <Link to="/register" className="text-blue-400 hover:underline">הירשם כאן</Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;