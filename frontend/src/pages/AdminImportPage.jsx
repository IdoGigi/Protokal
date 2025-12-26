import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function AdminImportPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setError('');
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('אנא בחר קובץ CSV');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://127.0.0.1:5000/api/admin/import-questions', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            setResult(res.data);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'שגיאה בהעלאת הקובץ');
        } finally {
            setUploading(false);
        }
    };

    const generateTemplate = () => {
        const headers = ['protocol_name', 'text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'explanation', 'difficulty_level', 'source_reference'];
        const row1 = ['דום לב במבוגר - VF/VT', 'דוגמה לשאלה?', 'תשובה א', 'תשובה ב', 'תשובה ג', 'תשובה ד', 'a', 'הסבר כאן', '1', 'עמוד 2'];
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), row1.join(',')].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "questions_template.csv");
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="max-w-4xl mx-auto p-6 text-white min-h-screen">
            <button onClick={() => navigate('/admin')} className="text-gray-400 hover:text-white mb-6 flex items-center transition">
                <span className="ml-2 text-xl">⬅️</span> חזרה ללוח הבקרה
            </button>

            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500 mb-8">
                📡 ייבוא שאלות המוני (Bulk Import)
            </h1>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 mb-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">

                    {/* Instructions */}
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-blue-400 mb-4">הוראות שימוש</h2>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 text-sm">
                            <li>העלה קובץ <strong>CSV</strong> בלבד.</li>
                            <li><strong>חדש!</strong> בעמודה <code>protocol_name</code> רשום את <strong>שם הפרוטוקול המלא</strong> (כפי שהוא מופיע בספריה).</li>
                            <li>חובה לכלול את העמודות: <code>protocol_name</code>, <code>text</code>, <code>correct_answer</code> (a/b/c/d), ו-4 האפשרויות.</li>
                            <li>מומלץ להשתמש בתבנית המוכנה שלנו.</li>
                            <li>וודא שה-Encoding הוא <strong>UTF-8</strong> (חשוב לעברית).</li>
                        </ul>
                        <button
                            onClick={generateTemplate}
                            className="mt-6 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg border border-gray-500 transition flex items-center gap-2"
                        >
                            📥 הורד תבנית CSV
                        </button>
                    </div>

                    {/* Upload Zone */}
                    <div className="flex-1 w-full">
                        <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-blue-500 transition bg-gray-900/50">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="hidden"
                                id="csvInput"
                            />
                            <label htmlFor="csvInput" className="cursor-pointer flex flex-col items-center">
                                <span className="text-4xl mb-2">📂</span>
                                <span className="text-lg font-bold text-gray-300">בחר קובץ CSV</span>
                                <span className="text-sm text-gray-500 mt-1">{file ? file.name : "או גרור לכאן"}</span>
                            </label>
                        </div>

                        {file && (
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className={`mt-4 w-full py-3 rounded-xl font-bold text-lg transition ${uploading ? 'bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-lg'
                                    }`}
                            >
                                {uploading ? 'מעלה...' : '🚀 התחל ייבוא'}
                            </button>
                        )}

                        {error && (
                            <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300 text-sm text-center">
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Results Log */}
            {result && (
                <div className="animate-fade-in">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-green-900/30 border border-green-500/30 p-4 rounded-xl text-center">
                            <span className="block text-3xl font-bold text-green-400">{result.imported_count}</span>
                            <span className="text-sm text-gray-400">שאלות יובאו בהצלחה ✅</span>
                        </div>
                        <div className="bg-red-900/30 border border-red-500/30 p-4 rounded-xl text-center">
                            <span className="block text-3xl font-bold text-red-400">{result.failed_count}</span>
                            <span className="text-sm text-gray-400">שורות נכשלים ❌</span>
                        </div>
                    </div>

                    {result.errors.length > 0 && (
                        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-red-400 mb-3">יומן שגיאות (דוגמית)</h3>
                            <div className="bg-black/50 p-4 rounded font-mono text-xs text-red-300 overflow-y-auto max-h-48">
                                {result.errors.map((err, i) => (
                                    <div key={i} className="mb-1 border-b border-red-900/30 pb-1 last:border-0">{err}</div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="text-center mt-6">
                        <button onClick={() => { setFile(null); setResult(null); }} className="text-blue-400 hover:text-blue-300 underline">
                            ייבא קובץ נוסף
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
