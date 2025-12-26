import { useState, useEffect } from 'react';
import axios from 'axios';

const DiscussionSection = ({ questionId, isOpen, onToggle }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Fetch comments when section is opened
    useEffect(() => {
        if (isOpen && questionId) {
            fetchComments();
        }
    }, [isOpen, questionId]);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://127.0.0.1:5000/api/discussion/comments/${questionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setComments(res.data.comments);
        } catch (err) {
            console.error('Error fetching comments:', err);
            setError('שגיאה בטעינת התגובות');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmitting(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://127.0.0.1:5000/api/discussion/comments', {
                question_id: questionId,
                content: newComment
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Add new comment to top of list
            setComments([res.data.comment, ...comments]);
            setNewComment('');
        } catch (err) {
            console.error('Error adding comment:', err);
            setError('שגיאה בהוספת התגובה');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (commentId) => {
        if (!window.confirm('האם אתה בטוח שברצונך למחוק את התגובה?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://127.0.0.1:5000/api/discussion/comments/${commentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Remove from list
            setComments(comments.filter(c => c.id !== commentId));
        } catch (err) {
            console.error('Error deleting comment:', err);
            if (err.response?.status === 403) {
                setError('ניתן למחוק רק תגובות שלך');
            } else {
                setError('שגיאה במחיקת התגובה');
            }
        }
    };

    // Get current user's display name for delete button visibility
    const currentUserDisplayName = localStorage.getItem('display_name');

    return (
        <div className="mt-4">
            {/* Toggle Button */}
            <button
                onClick={onToggle}
                className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition"
            >
                <span className="text-lg">💬</span>
                <span>דיון קהילתי ({comments.length})</span>
                <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {/* Collapsible Content */}
            {isOpen && (
                <div className="mt-4 p-4 bg-gray-900/50 border border-cyan-500/20 rounded-xl">

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-2 bg-red-500/10 border border-red-500 rounded text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Add Comment Form */}
                    <form onSubmit={handleSubmit} className="mb-4">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="שתף את המחשבות שלך על השאלה הזו..."
                            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none resize-none"
                            rows="2"
                        />
                        <button
                            type="submit"
                            disabled={submitting || !newComment.trim()}
                            className={`mt-2 px-4 py-2 rounded-lg font-bold text-sm transition ${submitting || !newComment.trim()
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                                }`}
                        >
                            {submitting ? 'שולח...' : 'הוסף תגובה'}
                        </button>
                    </form>

                    {/* Comments List */}
                    {loading ? (
                        <div className="text-center text-gray-400 py-4">טוען תגובות... 💭</div>
                    ) : comments.length === 0 ? (
                        <div className="text-center text-gray-500 py-4">
                            אין תגובות עדיין. היה הראשון להגיב! 🎯
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {comments.map((comment) => (
                                <div key={comment.id} className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-sm font-bold">
                                                {comment.display_name?.charAt(0)?.toUpperCase() || '?'}
                                            </span>
                                            <span className="font-bold text-cyan-400">{comment.display_name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">{comment.created_at}</span>
                                            {/* Delete button - only for own comments */}
                                            {comment.display_name === currentUserDisplayName && (
                                                <button
                                                    onClick={() => handleDelete(comment.id)}
                                                    className="text-red-400 hover:text-red-300 text-sm"
                                                    title="מחק תגובה"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-gray-300 text-sm leading-relaxed">{comment.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DiscussionSection;
