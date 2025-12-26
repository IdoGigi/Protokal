import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ProtocolsLibrary() {
    const navigate = useNavigate();
    const [protocols, setProtocols] = useState([]);
    const [loading, setLoading] = useState(true);
    // State to track which categories are expanded
    // Initialize with "Resuscitation" expanded by default if you want, or empty for all closed
    const [expandedCategories, setExpandedCategories] = useState({});

    useEffect(() => {
        const fetchProtocols = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://127.0.0.1:5000/api/content/protocols', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProtocols(res.data);

                // Optional: Auto-expand the first category or specific ones once loaded
                // const firstCat = res.data[0]?.category || 'Resuscitation';
                // setExpandedCategories({ [firstCat]: true });

            } catch (err) {
                console.error("Error loading protocols:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProtocols();
    }, []);

    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    // Group protocols by category
    const groupedProtocols = protocols.reduce((acc, protocol) => {
        const category = protocol.category || 'כללי';
        if (!acc[category]) acc[category] = [];
        acc[category].push(protocol);
        return acc;
    }, {});

    const categoryOrder = [
        "Resuscitation", "Adult Medicine", "Respiratory", "Cardiology",
        "Neurology", "Trauma", "Pediatrics", "Environmental", "OB/GYN"
    ];

    const sortedCategories = Object.keys(groupedProtocols).sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    if (loading) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
    );

    return (
        <div className="p-4 max-w-5xl mx-auto pb-24">
            <button
                onClick={() => navigate('/')}
                className="text-gray-400 hover:text-white mb-6 flex items-center transition group"
            >
                <span className="ml-2 text-xl group-hover:-translate-x-1 transition-transform">⬅️</span> חזרה לדשבורד
            </button>

            <header className="mb-8 text-center">
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-2">
                    ספריית פרוטוקולים
                </h1>
                <p className="text-gray-400">גישה מהירה לכל הפרוטוקולים וההנחיות הקליניות</p>
            </header>

            <div className="space-y-4">
                {sortedCategories.map(category => {
                    const isExpanded = expandedCategories[category];
                    const count = groupedProtocols[category].length;

                    return (
                        <div key={category} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden transition-all duration-300 hover:border-cyan-500/30">
                            {/* Accordion Header */}
                            <button
                                onClick={() => toggleCategory(category)}
                                className="w-full flex items-center justify-between p-5 text-right transition-colors hover:bg-white/5 active:bg-white/10"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg transition-colors ${isExpanded ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-700/50 text-gray-400'}`}>
                                        {getCategoryIcon(category)}
                                    </div>
                                    <div>
                                        <h2 className={`text-lg font-bold transition-colors ${isExpanded ? 'text-white' : 'text-gray-300'}`}>
                                            {translateCategory(category)}
                                        </h2>
                                        <p className="text-xs text-gray-500 text-right">{count} פרוטוקולים</p>
                                    </div>
                                </div>
                                <span className={`text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-cyan-400' : ''}`}>
                                    ▼
                                </span>
                            </button>

                            {/* Accordion Content */}
                            <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {groupedProtocols[category].map(protocol => (
                                        <Link
                                            to={`/protocol/${protocol.id}`}
                                            key={protocol.id}
                                            className="group block bg-gray-900/40 border border-gray-700/50 hover:border-cyan-500/50 rounded-lg p-4 transition-all hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:-translate-y-1 relative overflow-hidden"
                                        >
                                            {/* Hover Glow Effect */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent -translate-x-full group-hover:animate-shimmer z-0 pointer-events-none"></div>

                                            <div className="relative z-10">
                                                <h3 className="font-bold text-gray-200 group-hover:text-cyan-300 transition-colors mb-1">
                                                    {protocol.title}
                                                </h3>
                                                {/* <p className="text-gray-500 text-xs line-clamp-2 mb-3">
                                                    {protocol.description}
                                                </p> */}

                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-1 rounded border border-gray-700">
                                                        #{protocol.id}
                                                    </span>
                                                    {protocol.best_score !== undefined && (
                                                        <span className={`text-xs font-bold ${protocol.best_score >= 85 ? 'text-emerald-400' :
                                                            protocol.best_score >= 70 ? 'text-yellow-400' : 'text-gray-500'
                                                            }`}>
                                                            {protocol.best_score}%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function translateCategory(englishName) {
    const mapping = {
        "Resuscitation": "🔴 החייאה וטיפול נמרץ",
        "Adult Medicine": "🩺 רפואה דחופה (מבוגרים)",
        "Respiratory": "🫁 מערכת הנשימה",
        "Cardiology": "❤️ קרדיולוגיה והפרעות קצב",
        "Neurology": "🧠 נוירולוגיה",
        "Trauma": "🩹 טראומה ו-PHTLS",
        "Pediatrics": "👶 רפואת ילדים",
        "Environmental": "☣️ טוקסיקולוגיה וסביבה",
        "OB/GYN": "🤰 מיילדות וגינקולוגיה"
    };
    return mapping[englishName] || englishName;
}

function getCategoryIcon(category) {
    const icons = {
        "Resuscitation": "⚡",
        "Adult Medicine": "💊",
        "Respiratory": "💨",
        "Cardiology": "💓",
        "Neurology": "🧠",
        "Trauma": "🤕",
        "Pediatrics": "🧸",
        "Environmental": "🐍",
        "OB/GYN": "👶"
    };
    return icons[category] || "📄";
}