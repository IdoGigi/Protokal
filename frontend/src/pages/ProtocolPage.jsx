import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProtocolPage = () => {
    const { id } = useParams(); // לוקח את המספר מה-URL (למשל 1)
    const navigate = useNavigate();

    const [protocol, setProtocol] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedAnswers, setSelectedAnswers] = useState({}); // איזה תשובה המשתמש בחר לכל שאלה
    const [showResults, setShowResults] = useState(false); // האם להציג תוצאות?

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`http://127.0.0.1:5000/api/content/protocol/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProtocol(res.data);
            } catch (err) {
                console.error(err);
                alert("שגיאה בטעינת הפרוטוקול");
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    const handleSelectAnswer = (questionId, answerKey) => {
        if (showResults) return; // אי אפשר לשנות אחרי שמגישים
        setSelectedAnswers({
            ...selectedAnswers,
            [questionId]: answerKey
        });
    };

    const checkAnswers = async () => {
        // 1. Calculate score locally
        let correctCount = 0;
        protocol.questions.forEach(q => {
            if (selectedAnswers[q.id] === q.correct_answer) {
                correctCount++;
            }
        });

        const finalScore = Math.round((correctCount / protocol.questions.length) * 100);

        // 2. Show results UI
        setShowResults(true);

        // 3. Send to Server (The new part)
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://127.0.0.1:5000/api/content/submit-test', {
                protocol_id: protocol.id,
                score: finalScore
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("Score saved successfully!");
        } catch (error) {
            console.error("Failed to save score:", error);
        }

        alert(`סיימת את התרגול! הציון שלך: ${finalScore}`);
    };

    if (loading) return <div className="text-white text-center mt-10">טוען שאלות... ⏳</div>;
    if (!protocol) return null;

    return (


        <div className="max-w-3xl mx-auto p-6 text-white pb-20">
            {/* כפתור חזרה */}
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white mb-4">
                ← חזרה לדשבורד
            </button>
            <button
                onClick={() => navigate('/protocols')}
                className="text-gray-400 hover:text-white mb-6 flex items-center transition"
            >
                <span className="ml-2 text-xl">⬅️</span> חזרה לרשימת הפרוטוקולים
            </button>
            {/* ---------------------------------- */}

            <h1 className="text-3xl font-bold text-blue-500 mb-2">{protocol.title}</h1>
            <p className="text-gray-400 mb-8">תרגול שאלות בחירה (אמריקאיות)</p>

            <div className="space-y-8">
                {protocol.questions.map((q, index) => {
                    const isCorrect = selectedAnswers[q.id] === q.correct_answer;
                    const userAnswer = selectedAnswers[q.id];

                    return (
                        <div key={q.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                            <h3 className="text-xl font-semibold mb-4">
                                <span className="text-blue-500 ml-2">{index + 1}.</span>
                                {q.text}
                            </h3>

                            <div className="space-y-3">
                                {Object.entries(q.options).map(([key, text]) => {
                                    // חישוב צבעים לתוצאות
                                    let btnClass = "bg-gray-700 hover:bg-gray-600";

                                    if (selectedAnswers[q.id] === key) {
                                        btnClass = "bg-blue-600 border-2 border-blue-400"; // בחירה נוכחית
                                    }

                                    if (showResults) {
                                        if (key === q.correct_answer) btnClass = "bg-green-600/50 border-2 border-green-500"; // התשובה הנכונה
                                        if (userAnswer === key && key !== q.correct_answer) btnClass = "bg-red-600/50 border-2 border-red-500"; // טעות של המשתמש
                                    }

                                    return (
                                        <div
                                            key={key}
                                            onClick={() => handleSelectAnswer(q.id, key)}
                                            className={`p-3 rounded-lg cursor-pointer transition flex items-center ${btnClass}`}
                                        >
                                            <span className="w-8 h-8 flex items-center justify-center bg-gray-900 rounded-full ml-3 text-sm font-bold">
                                                {key.toUpperCase()}
                                            </span>
                                            <span>{text}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* כפתור סיום */}
            {!showResults && (
                <button
                    onClick={checkAnswers}
                    className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-12 rounded-full shadow-xl transition scale-100 hover:scale-105"
                >
                    בדוק תשובות ✅
                </button>
            )}
        </div>
    );
};

export default ProtocolPage;