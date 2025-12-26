import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const GeneralTestPage = () => {
    const navigate = useNavigate();
    const [testData, setTestData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(null);

    // טעינת המבחן מהשרת
    useEffect(() => {
        const fetchTest = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://127.0.0.1:5000/api/content/general-test', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTestData(res.data);
            } catch (err) {
                console.error(err);
                alert("שגיאה בטעינת המבחן");
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        fetchTest();
    }, [navigate]);

    const handleSelectAnswer = (questionId, answerKey) => {
        if (showResults) return;
        setSelectedAnswers({ ...selectedAnswers, [questionId]: answerKey });
    };

    const checkAnswers = () => {
        let correctCount = 0;
        testData.questions.forEach(q => {
            if (selectedAnswers[q.id] === q.correct_answer) correctCount++;
        });

        const finalScore = Math.round((correctCount / testData.questions.length) * 100);
        setScore(finalScore);
        setShowResults(true);
        window.scrollTo(0, 0); // גלילה למעלה לראות את הציון
    };

    if (loading) return <div className="text-white text-center mt-10">מכין את המבחן... 🎲</div>;
    if (!testData) return null;

    return (
        <div className="max-w-3xl mx-auto p-6 text-white pb-20">
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white mb-6 flex items-center">
                <span className="ml-2 text-xl">⬅️</span> חזרה לדשבורד
            </button>

            <div className="mb-8 border-b border-gray-700 pb-4">
                <h1 className="text-3xl font-bold text-purple-500 mb-2">{testData.title}</h1>
                <p className="text-gray-400">{testData.description}</p>
                {showResults && (
                    <div className="mt-4 p-4 bg-purple-900/30 border border-purple-500 rounded-xl text-center">
                        <span className="text-2xl font-bold text-white">הציון שלך: {score} 🏆</span>
                    </div>
                )}
            </div>

            <div className="space-y-8">
                {testData.questions.map((q, index) => {
                    const userAnswer = selectedAnswers[q.id];
                    return (
                        <div key={q.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700 relative overflow-hidden">
                            {/* תגית שם הפרוטוקול */}
                            <span className="absolute top-0 left-0 bg-gray-700 text-xs px-2 py-1 text-gray-300 rounded-br-lg">
                                {q.protocol_title}
                            </span>

                            <h3 className="text-xl font-semibold mb-4 mt-2">
                                <span className="text-purple-500 ml-2">{index + 1}.</span>
                                {q.text}
                            </h3>

                            <div className="space-y-3">
                                {Object.entries(q.options).map(([key, text]) => {
                                    let btnClass = "bg-gray-700 hover:bg-gray-600";
                                    if (userAnswer === key) btnClass = "bg-purple-600 border-2 border-purple-400";

                                    if (showResults) {
                                        if (key === q.correct_answer) btnClass = "bg-green-600/50 border-2 border-green-500";
                                        if (userAnswer === key && key !== q.correct_answer) btnClass = "bg-red-600/50 border-2 border-red-500";
                                    }

                                    return (
                                        <div key={key} onClick={() => handleSelectAnswer(q.id, key)}
                                            className={`p-3 rounded-lg cursor-pointer transition flex items-center ${btnClass}`}>
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

            {!showResults && (
                <button onClick={checkAnswers}
                    className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-12 rounded-full shadow-xl transition scale-100 hover:scale-105">
                    הגש מבחן 🏁
                </button>
            )}
        </div>
    );
};

export default GeneralTestPage;