import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DiscussionSection from '../components/DiscussionSection';

const ProtocolPage = () => {
    const { id } = useParams(); // Get the number from the URL (e.g., 1)
    const navigate = useNavigate();

    const [protocol, setProtocol] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [openDiscussions, setOpenDiscussions] = useState({});
    const [flaggedQuestions, setFlaggedQuestions] = useState({});  // Track flagged questions
    const [flagModal, setFlagModal] = useState({ open: false, questionId: null });
    const [flagReason, setFlagReason] = useState('');
    const [flagLoading, setFlagLoading] = useState(false);

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
        if (showResults) return; // Cannot change after submitting
        setSelectedAnswers({
            ...selectedAnswers,
            [questionId]: answerKey
        });
    };

    const toggleDiscussion = (questionId) => {
        setOpenDiscussions(prev => ({
            ...prev,
            [questionId]: !prev[questionId]
        }));
    };

    const handleFlagQuestion = async () => {
        if (!flagModal.questionId) return;
        setFlagLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://127.0.0.1:5000/api/content/flag-question', {
                question_id: flagModal.questionId,
                reason: flagReason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFlaggedQuestions(prev => ({ ...prev, [flagModal.questionId]: true }));
            setFlagModal({ open: false, questionId: null });
            setFlagReason('');
            alert('השאלה סומנה לבדיקה. תודה!');
        } catch (err) {
            alert(err.response?.data?.message || 'שגיאה בסימון השאלה');
        } finally {
            setFlagLoading(false);
        }
    };

    const checkAnswers = async () => {
        // 1. Calculate score locally and build answers array
        let correctCount = 0;
        const answersArray = [];

        protocol.questions.forEach(q => {
            const userAnswer = selectedAnswers[q.id];
            const isCorrect = userAnswer === q.correct_answer;

            if (isCorrect) correctCount++;

            // Build answer object for weakness tracking
            answersArray.push({
                question_id: q.id,
                user_answer: userAnswer || null,
                is_correct: isCorrect
            });
        });

        const finalScore = Math.round((correctCount / protocol.questions.length) * 100);

        // 2. Show results UI
        setShowResults(true);

        // 3. Send to Server (including individual answers for weakness tracking)
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://127.0.0.1:5000/api/content/submit-test', {
                protocol_id: protocol.id,
                score: finalScore,
                answers: answersArray  // Send individual answers for weakness tracking
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("Score saved successfully!");
        } catch (error) {
            console.error("Failed to save score:", error);
        }

        alert(`סיימת את התרגול! הציון שלך: ${finalScore}`);
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

    if (loading) return <div className="text-white text-center mt-10">טוען שאלות... ⏳</div>;
    if (!protocol) return null;

    return (
        <div className="max-w-3xl mx-auto p-6 text-white pb-20">
            {/* Back button */}
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white mb-4">
                ← חזרה לדשבורד
            </button>
            <button
                onClick={() => navigate('/protocols')}
                className="text-gray-400 hover:text-white mb-6 flex items-center transition"
            >
                <span className="ml-2 text-xl">⬅️</span> חזרה לרשימת הפרוטוקולים
            </button>

            <h1 className="text-3xl font-bold text-blue-500 mb-2">{protocol.title}</h1>
            <p className="text-gray-400 mb-8">תרגול שאלות בחירה (אמריקאיות)</p>

            <div className="space-y-8">
                {protocol.questions.map((q, index) => {
                    const isCorrect = selectedAnswers[q.id] === q.correct_answer;
                    const userAnswer = selectedAnswers[q.id];

                    return (
                        <div key={q.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                            {/* Question header with difficulty badge */}
                            <div className="flex items-start justify-between mb-4">
                                <h3 className="text-xl font-semibold">
                                    <span className="text-blue-500 ml-2">{index + 1}.</span>
                                    {q.text}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-gray-700 text-gray-400 px-2 py-1 rounded border border-gray-600">ID: {q.id}</span>
                                    {!flaggedQuestions[q.id] ? (
                                        <button
                                            onClick={() => setFlagModal({ open: true, questionId: q.id })}
                                            className="text-[10px] bg-red-900/30 text-red-400 px-2 py-1 rounded border border-red-500/30 hover:bg-red-900/50 transition"
                                            title="דווח על בעיה"
                                        >
                                            🚩
                                        </button>
                                    ) : (
                                        <span className="text-[10px] bg-yellow-900/30 text-yellow-400 px-2 py-1 rounded border border-yellow-500/30">סומן ✓</span>
                                    )}
                                    {q.difficulty_level && <DifficultyBadge level={q.difficulty_level} />}
                                </div>
                            </div>

                            <div className="space-y-3">
                                {Object.entries(q.options).map(([key, text]) => {
                                    // Calculate colors for results
                                    let btnClass = "bg-gray-700 hover:bg-gray-600";

                                    if (selectedAnswers[q.id] === key) {
                                        btnClass = "bg-blue-600 border-2 border-blue-400"; // Current selection
                                    }

                                    if (showResults) {
                                        if (key === q.correct_answer) btnClass = "bg-green-600/50 border-2 border-green-500"; // Correct answer
                                        if (userAnswer === key && key !== q.correct_answer) btnClass = "bg-red-600/50 border-2 border-red-500"; // User's mistake
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

                            {/* Discussion Section - Only shown after submission */}
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

            {/* Submit button */}
            {!showResults && (
                <button
                    onClick={checkAnswers}
                    className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-12 rounded-full shadow-xl transition scale-100 hover:scale-105"
                >
                    בדוק תשובות ✅
                </button>
            )}

            {/* Flag Modal */}
            {flagModal.open && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-red-400 mb-4">🚩 דיווח על בעיה בשאלה #{flagModal.questionId}</h3>
                        <p className="text-gray-400 text-sm mb-4">מה הבעיה בשאלה? (תשובה שגויה, ניסוח לא ברור, שגיאת כתיב...)</p>
                        <textarea
                            value={flagReason}
                            onChange={(e) => setFlagReason(e.target.value)}
                            placeholder="תאר את הבעיה..."
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white mb-4 resize-none"
                            rows="3"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={handleFlagQuestion}
                                disabled={flagLoading}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg disabled:opacity-50"
                            >
                                {flagLoading ? 'שולח...' : 'שלח דיווח'}
                            </button>
                            <button
                                onClick={() => { setFlagModal({ open: false, questionId: null }); setFlagReason(''); }}
                                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded-lg"
                            >
                                ביטול
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProtocolPage;