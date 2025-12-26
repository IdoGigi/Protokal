import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DiscussionSection from '../components/DiscussionSection';

const WeaknessTestPage = () => {
    const navigate = useNavigate();
    const [testData, setTestData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(null);
    const [openDiscussions, setOpenDiscussions] = useState({});
    const [noWeaknesses, setNoWeaknesses] = useState(false);

    // Load weakness test from server
    useEffect(() => {
        const fetchTest = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://127.0.0.1:5000/api/content/weakness-test', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTestData(res.data);
                if (res.data.no_weaknesses) {
                    setNoWeaknesses(true);
                }
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

    const toggleDiscussion = (questionId) => {
        setOpenDiscussions(prev => ({
            ...prev,
            [questionId]: !prev[questionId]
        }));
    };

    const checkAnswers = async () => {
        // Calculate score and build answers array
        let correctCount = 0;
        const answersArray = [];

        testData.questions.forEach(q => {
            const userAnswer = selectedAnswers[q.id];
            const isCorrect = userAnswer === q.correct_answer;

            if (isCorrect) correctCount++;

            answersArray.push({
                question_id: q.id,
                user_answer: userAnswer || null,
                is_correct: isCorrect
            });
        });

        const finalScore = Math.round((correctCount / testData.questions.length) * 100);
        setScore(finalScore);
        setShowResults(true);
        window.scrollTo(0, 0);

        // Save score to server (protocol_id = null for weakness test too)
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://127.0.0.1:5000/api/content/submit-test', {
                protocol_id: null,
                score: finalScore,
                answers: answersArray
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("Weakness test score saved successfully!");
        } catch (error) {
            console.error("Failed to save score:", error);
        }
    };

    // Difficulty badge component
    const DifficultyBadge = ({ level }) => {
        const config = {
            1: { text: 'קל', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
            2: { text: 'בינוני', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
            3: { text: 'קשה', color: 'bg-red-500/20 text-red-400 border-red-500/30' }
        };
        const { text, color } = config[level] || config[1];
        return (
            <span className={`text-xs px-2 py-1 rounded-full border ${color}`}>
                {text}
            </span>
        );
    };

    if (loading) return <div className="text-white text-center mt-10">מכין מבחן מותאם אישית... 🎯</div>;

    // No weaknesses message
    if (noWeaknesses) {
        return (
            <div className="max-w-3xl mx-auto p-6 text-white">
                <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white mb-6 flex items-center">
                    <span className="ml-2 text-xl">⬅️</span> חזרה לדשבורד
                </button>

                <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 p-8 rounded-2xl border border-green-500/30 text-center">
                    <span className="text-6xl mb-4 block">🏆</span>
                    <h2 className="text-2xl font-bold text-green-400 mb-3">מעולה! אין לך נקודות חולשה</h2>
                    <p className="text-gray-300 mb-6">
                        לא נמצאו שאלות שטעית בהן בעבר. המשך לתרגל כדי להתקדם!
                    </p>
                    <button
                        onClick={() => navigate('/general-test')}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl transition"
                    >
                        עבור למבחן מסכם 🚑
                    </button>
                </div>
            </div>
        );
    }

    if (!testData) return null;

    return (
        <div className="max-w-3xl mx-auto p-6 text-white pb-20">
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white mb-6 flex items-center">
                <span className="ml-2 text-xl">⬅️</span> חזרה לדשבורד
            </button>

            <div className="mb-8 border-b border-gray-700 pb-4">
                <h1 className="text-3xl font-bold text-orange-500 mb-2">{testData.title}</h1>
                <p className="text-gray-400">{testData.description}</p>
                {showResults && (
                    <div className="mt-4 p-4 bg-orange-900/30 border border-orange-500 rounded-xl text-center">
                        <span className="text-2xl font-bold text-white">הציון שלך: {score} 🎯</span>
                    </div>
                )}
            </div>

            <div className="space-y-8">
                {testData.questions.map((q, index) => {
                    const userAnswer = selectedAnswers[q.id];
                    return (
                        <div key={q.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700 relative overflow-hidden">
                            {/* Protocol name tag */}
                            <span className="absolute top-0 left-0 bg-gray-700 text-xs px-2 py-1 text-gray-300 rounded-br-lg">
                                {q.protocol_title}
                            </span>

                            {/* Difficulty badge */}
                            {q.difficulty_level && (
                                <div className="absolute top-0 right-0 p-2">
                                    <DifficultyBadge level={q.difficulty_level} />
                                </div>
                            )}

                            <h3 className="text-xl font-semibold mb-4 mt-4">
                                <span className="text-orange-500 ml-2">{index + 1}.</span>
                                {q.text}
                            </h3>

                            <div className="space-y-3">
                                {Object.entries(q.options).map(([key, text]) => {
                                    let btnClass = "bg-gray-700 hover:bg-gray-600";
                                    if (userAnswer === key) btnClass = "bg-orange-600 border-2 border-orange-400";

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

                            {/* Knowledge Box - Only shown after submission */}
                            {showResults && (q.explanation || q.source_reference) && (
                                <div className="mt-6 p-4 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-2xl">💡</span>
                                        <h4 className="text-lg font-bold text-indigo-300">הסבר ומקורות</h4>
                                    </div>

                                    {q.explanation && (
                                        <p className="text-gray-200 leading-relaxed mb-3">
                                            {q.explanation}
                                        </p>
                                    )}

                                    {q.source_reference && (
                                        <div className="flex items-center gap-2 pt-3 border-t border-indigo-500/20">
                                            <span className="text-lg">📚</span>
                                            <span className="text-indigo-300 text-sm font-medium">
                                                מקור: {q.source_reference}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Discussion Section */}
                            {showResults && (
                                <DiscussionSection
                                    questionId={q.id}
                                    isOpen={openDiscussions[q.id] || false}
                                    onToggle={() => toggleDiscussion(q.id)}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {!showResults && testData.questions.length > 0 && (
                <button onClick={checkAnswers}
                    className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-12 rounded-full shadow-xl transition scale-100 hover:scale-105">
                    בדוק תשובות 💪
                </button>
            )}
        </div>
    );
};

export default WeaknessTestPage;
