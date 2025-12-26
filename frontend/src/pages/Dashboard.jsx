import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // <--- אל תשכח להוסיף את זה למעלה

const Dashboard = () => {
    const navigate = useNavigate();
    const [protocols, setProtocols] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProtocols = async () => {
            try {
                // אנחנו חייבים לשלוח את הטוקן כדי שהשרת יסכים לדבר איתנו
                const token = localStorage.getItem('token');
                console.log("MY TOKEN IS:", token); // <--- שורת הבדיקה
                const response = await axios.get('http://127.0.0.1:5000/api/content/protocols', {
                    headers: { Authorization: `Bearer ${token}` } // <--- הצגת כרטיס הכניסה
                });

                setProtocols(response.data);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("לא הצלחנו לטעון את הפרוטוקולים. נסה להתחבר מחדש.");
            } finally {
                setLoading(false);
            }
        };

        fetchProtocols();
    }, []);

    if (loading) return <div className="text-center text-white mt-10">טוען פרוטוקולים... ⏳</div>;
    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
            <div className="bg-red-500/10 border border-red-500 p-6 rounded-lg max-w-md">
                <h3 className="text-red-500 text-xl font-bold mb-2">אופס! משהו השתבש ⚠️</h3>
                <p className="text-gray-300 mb-4">{error}</p>
                <button
                    onClick={() => navigate('/login')}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded transition"
                >
                    חזור להתחברות
                </button>
            </div>
        </div>
    );

    return (
        <div className="p-8">
            <h2 className="text-3xl font-bold text-white mb-6 border-r-4 border-blue-500 pr-4">
                פרוטוקולים רפואיים 📚
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {protocols.map((protocol) => (
                    <div key={protocol.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition shadow-lg hover:shadow-blue-900/20 cursor-pointer">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-blue-400">{protocol.title}</h3>

                            <span className="bg-gray-700 text-xs text-gray-300 px-2 py-1 rounded">Protocol #{protocol.id}</span>

                        </div>
                        <div className="mb-3">
                            {protocol.best_score !== null ? (
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${protocol.best_score >= 80 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                        protocol.best_score >= 50 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                            'bg-red-500/20 text-red-400 border border-red-500/30'
                                    }`}>
                                    ציון שיא: {protocol.best_score} 🏆
                                </span>
                            ) : (
                                <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-700 text-gray-400 border border-gray-600">
                                    לא בוצע ⚪
                                </span>
                            )}
                        </div>
                        <p className="text-gray-400 text-sm mb-4">
                            {protocol.description}
                        </p>
                        <button
                            onClick={() => navigate(`/protocol/${protocol.id}`)} // <--- הניווט החדש
                            className="w-full bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white py-2 rounded transition text-sm font-bold"
                        >
                            התחל תרגול 🚀
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;