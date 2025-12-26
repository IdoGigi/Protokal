import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        display_name: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Direct call to the server (Register doesn't need Context because we don't get a token yet)
            await axios.post('http://127.0.0.1:5000/api/auth/register', formData);

            // If successful, redirect to login page
            alert("ההרשמה הצליחה! אנא התחבר.");
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || "ההרשמה נכשלה");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white px-4">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md">
                <h2 className="text-3xl font-bold text-center text-blue-500 mb-2">הרשמה למערכת</h2>
                <p className="text-center text-gray-400 mb-8">יצירת משתמש חדש</p>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Username */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">שם משתמש</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="בחר שם משתמש ייחודי"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">אימייל</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="medic@mda.org.il"
                        />
                    </div>

                    {/* Display Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">שם תצוגה</label>
                        <input
                            type="text"
                            name="display_name"
                            value={formData.display_name}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="השם שלך"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">סיסמה</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && <div className="text-red-500 text-sm text-center">{error}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2 rounded-lg font-bold text-white transition mt-4 
                            ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                        {loading ? 'נרשם...' : 'הרשמה'}
                    </button>
                </form>

                <div className="mt-4 text-center text-sm text-gray-400">
                    כבר יש לך משתמש? <Link to="/login" className="text-blue-400 hover:underline">התחבר כאן</Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;