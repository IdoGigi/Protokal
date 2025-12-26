import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if user is logged in on initial load
    useEffect(() => {
        const checkLoggedIn = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                const storedDisplayName = localStorage.getItem('display_name');
                const storedIsAdmin = localStorage.getItem('is_admin') === 'true';
                setUser({ display_name: storedDisplayName, is_admin: storedIsAdmin });
            }
            setLoading(false);
        };
        checkLoggedIn();
    }, []);

    // Login function - authenticates with username and password
    const login = async (username, password) => {
        try {
            const res = await axios.post('http://127.0.0.1:5000/api/auth/login', {
                username,
                password
            });

            localStorage.setItem('token', res.data.access_token);
            localStorage.setItem('display_name', res.data.display_name);
            localStorage.setItem('is_admin', res.data.is_admin ? 'true' : 'false');
            setUser({
                display_name: res.data.display_name,
                is_admin: res.data.is_admin
            });
            return { success: true };
        } catch (error) {
            console.error("Login failed:", error);
            return { success: false, error: error.response?.data?.message || "Login failed" };
        }
    };

    // Logout function - clears user session
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('display_name');
        localStorage.removeItem('is_admin');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);