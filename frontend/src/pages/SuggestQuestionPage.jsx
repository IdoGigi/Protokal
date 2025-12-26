import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SuggestQuestionPage = () => {
    const navigate = useNavigate();
    const [protocols, setProtocols] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        protocol_id: '',
        text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: '',
        explanation: '',
        source_reference: '',
        difficulty_level: 1
    });

    // Fetch protocols for dropdown
    useEffect(() => {
        const fetchProtocols = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://127.0.0.1:5000/api/content/protocols', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProtocols(res.data);
            } catch (err) {
                console.error('Error fetching protocols:', err);
            }
        };
        fetchProtocols();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://127.0.0.1:5000/api/suggestions/propose-question', {
                ...formData,
                protocol_id: formData.protocol_id ? parseInt(formData.protocol_id) : null,
                difficulty_level: parseInt(formData.difficulty_level)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess(true);
            // Reset form
            setFormData({
                protocol_id: '',
                text: '',
                option_a: '',
                option_b: '',
                option_c: '',
                option_d: '',
                correct_answer: '',
                explanation: '',
                source_reference: '',
                difficulty_level: 1
            });
        } catch (err) {
            console.error('Error submitting suggestion:', err);
            setError(err.response?.data?.message || 'שגיאה בשליחת ההצעה');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6 text-white">
            {/* Back button */}
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white mb-6 flex items-center">
                <span className="ml-2 text-xl">⬅️</span> חזרה לדשבורד
            </button>

            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                    <span className="text-4xl">💡</span>
                    <div>
                        <h1 className="text-2xl font-bold text-yellow-400">הצע שאלה חדשה</h1>
                        <p className="text-gray-400 text-sm">עזור לקהילה ללמוד על ידי הוספת שאלות חדשות</p>
                    </div>
                </div>

                {/* Success Message */}
                {success && (
                    <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-xl text-center">
                        <span className="text-2xl">🎉</span>
                        <h3 className="text-green-400 font-bold text-lg mt-2">תודה רבה!</h3>
                        <p className="text-gray-300">השאלה שלך נשלחה לבדיקה. נעדכן אותך כשהיא תאושר.</p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Protocol Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">פרוטוקול (קטגוריה)</label>
                        <select
                            name="protocol_id"
                            value={formData.protocol_id}
                            onChange={handleChange}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                        >
                            <option value="">בחר פרוטוקול...</option>
                            {protocols.map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                    </div>

                    {/* Question Text */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">תוכן השאלה *</label>
                        <textarea
                            name="text"
                            value={formData.text}
                            onChange={handleChange}
                            required
                            rows="3"
                            placeholder="הקלד את השאלה כאן..."
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none resize-none"
                        />
                    </div>

                    {/* Answer Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {['a', 'b', 'c', 'd'].map((letter) => (
                            <div key={letter}>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    תשובה {letter.toUpperCase()} *
                                </label>
                                <input
                                    type="text"
                                    name={`option_${letter}`}
                                    value={formData[`option_${letter}`]}
                                    onChange={handleChange}
                                    required
                                    placeholder={`תשובה ${letter.toUpperCase()}`}
                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Correct Answer */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">התשובה הנכונה *</label>
                        <div className="flex gap-4">
                            {['a', 'b', 'c', 'd'].map((letter) => (
                                <label key={letter} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="correct_answer"
                                        value={letter}
                                        checked={formData.correct_answer === letter}
                                        onChange={handleChange}
                                        required
                                        className="w-5 h-5 text-yellow-500 bg-gray-700 border-gray-600 focus:ring-yellow-500"
                                    />
                                    <span className="text-white font-bold">{letter.toUpperCase()}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Difficulty Level */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">רמת קושי</label>
                        <div className="flex gap-4">
                            {[
                                { value: 1, label: 'קל', color: 'text-green-400' },
                                { value: 2, label: 'בינוני', color: 'text-yellow-400' },
                                { value: 3, label: 'קשה', color: 'text-red-400' }
                            ].map(({ value, label, color }) => (
                                <label key={value} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="difficulty_level"
                                        value={value}
                                        checked={formData.difficulty_level === value || formData.difficulty_level === String(value)}
                                        onChange={handleChange}
                                        className="w-5 h-5 bg-gray-700 border-gray-600"
                                    />
                                    <span className={`font-bold ${color}`}>{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Explanation */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">הסבר לתשובה הנכונה</label>
                        <textarea
                            name="explanation"
                            value={formData.explanation}
                            onChange={handleChange}
                            rows="3"
                            placeholder="הסבר מדוע התשובה הנכונה היא הטובה ביותר..."
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none resize-none"
                        />
                    </div>

                    {/* Source Reference */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">מקור / הפניה</label>
                        <input
                            type="text"
                            name="source_reference"
                            value={formData.source_reference}
                            onChange={handleChange}
                            placeholder="לדוגמה: פרוטוקול ALS מד״א, עמוד 12"
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition ${loading
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-yellow-500 hover:bg-yellow-600 text-gray-900'
                            }`}
                    >
                        {loading ? 'שולח...' : 'שלח הצעה לבדיקה 📤'}
                    </button>
                </form>

                {/* Info Note */}
                <div className="mt-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                    <p className="text-gray-400 text-sm text-center">
                        ℹ️ השאלות נבדקות על ידי צוות המנהלים לפני הוספתן למאגר הראשי.
                        <br />נודיע לך כשהשאלה תאושר או אם נדרשים תיקונים.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SuggestQuestionPage;
