import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProfilePage = () => {
    const navigate = useNavigate();

    const [profileData, setProfileData] = useState({
        username: '',
        email: '',
        display_name: '',
        created_at: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch profile data on mount (read-only)
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://127.0.0.1:5000/api/auth/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProfileData(res.data);
            } catch (err) {
                console.error('Error fetching profile:', err);
                setError('שגיאה בטעינת הפרופיל');
                // Redirect to login if unauthorized
                if (err.response?.status === 401) {
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [navigate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <div className="text-white text-xl">טוען פרופיל... ⏳</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <div className="text-red-500 text-xl">{error}</div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-8 text-white">
            <button
                onClick={() => navigate('/')}
                className="text-gray-400 hover:text-white mb-8 flex items-center"
            >
                <span className="ml-2 text-xl">⬅️</span> חזרה לדשבורד
            </button>

            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-xl">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-blue-500">הפרופיל שלי 👤</h1>
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
                        {profileData.display_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                </div>

                {/* Profile Information - Read Only */}
                <div className="space-y-4">
                    {/* Username */}
                    <div>
                        <label className="block text-gray-400 mb-2">שם משתמש</label>
                        <div className="w-full p-3 rounded bg-gray-700 border border-gray-600 text-gray-300">
                            {profileData.username}
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-gray-400 mb-2">אימייל</label>
                        <div className="w-full p-3 rounded bg-gray-700 border border-gray-600 text-gray-300">
                            {profileData.email}
                        </div>
                    </div>

                    {/* Display Name */}
                    <div>
                        <label className="block text-gray-400 mb-2">שם תצוגה</label>
                        <div className="w-full p-3 rounded bg-gray-700 border border-gray-600 text-gray-300">
                            {profileData.display_name}
                        </div>
                    </div>

                    {/* Created At */}
                    {profileData.created_at && (
                        <div className="text-gray-500 text-sm text-center mt-6 pt-4 border-t border-gray-700">
                            נרשמת בתאריך: {profileData.created_at}
                        </div>
                    )}
                </div>

                {/* Note about read-only profile */}
                <div className="mt-8 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                    <p className="text-gray-400 text-sm text-center">
                        ℹ️ פרטי הפרופיל הם לקריאה בלבד ולא ניתנים לעריכה לאחר ההרשמה.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;