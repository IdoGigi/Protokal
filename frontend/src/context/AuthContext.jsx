import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// 1. יצירת ה"ערוץ" שדרכו המידע יעבור
const AuthContext = createContext();

// 2. הרכיב שעוטף את האפליקציה ומנהל את המידע
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // בדיקה ראשונית כשהאתר עולה: האם יש טוקן שמור?
    useEffect(() => {
        const checkLoggedIn = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                // אם יש טוקן, אנחנו מניחים שהמשתמש מחובר ושומרים אותו בזיכרון
                // (במערכת מושלמת היינו בודקים את הטוקן מול השרת, אבל לכרגע זה מספיק)
                const storedUsername = localStorage.getItem('username');
                setUser({ username: storedUsername });
            }
            setLoading(false);
        };
        checkLoggedIn();
    }, []);

    // פונקציית התחברות (תופעל כשימלאו את טופס הלוגין)
    const login = async (email, password) => {
        try {
            // שליחת הבקשה לשרת הפייתון שלנו
            const res = await axios.post('http://127.0.0.1:5000/api/auth/login', {
                email,
                password
            });

            // אם הצלחנו: שומרים את הטוקן בדפדפן ובזיכרון
            localStorage.setItem('token', res.data.access_token);
            localStorage.setItem('username', res.data.username);
            setUser({ username: res.data.username });
            return { success: true };
        } catch (error) {
            console.error("Login failed:", error);
            return { success: false, error: error.response?.data?.message || "Login failed" };
        }
    };

    // פונקציית התנתקות
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setUser(null);
    };

    // 3. חשיפת המידע והפעולות לכל מי שנמצא בתוך ה-Provider
    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// הוק (Hook) פשוט כדי להשתמש במידע בכל מקום באתר
export const useAuth = () => useContext(AuthContext);