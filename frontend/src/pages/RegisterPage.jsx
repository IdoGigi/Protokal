import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
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

        try {
            // Direct call to the server (Register doesn't need Context because we don't get a token yet)
            await axios.post('http://127.0.0.1:5000/api/auth/register', formData);

            // If successful, redirect to login page
            alert("Registration successful! Please login.");
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed");
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
                        <label className="block text-sm font-medium text-gray-300 mb-1">שם מלא</label>
                        <input
                            type="text" name="username" required
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="ישראל ישראלי"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">אימייל</label>
                        <input
                            type="email" name="email" required
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="medic@mda.org.il"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">סיסמה</label>
                        <input
                            type="password" name="password" required
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && <div className="text-red-500 text-sm text-center">{error}</div>}

                    <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition mt-4">
                        הרשמה
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