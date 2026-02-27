import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { postComment } from '../services/projectService';
import { Reply, UserCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CommentThread = ({ comment, allComments, projectId, onReplyPosted }) => {
  const { user } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);

  // Find all comments that are direct replies to THIS comment.
  const nestedReplies = allComments.filter(c => c.parentComment === comment._id);

  const handlePostReply = async () => {
    if (!replyText.trim()) return;
    setLoading(true);
    try {
      await postComment(projectId, replyText, comment._id);
      toast.success('Reply posted!');
      setReplyText('');
      setIsReplying(false);
      onReplyPosted();
    } catch (error) {
      toast.error('Failed to post reply.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 flex flex-col pt-2 border-l-2 border-gray-800 pl-4 w-full">
      {/* Individual Comment Box */}
      <div className="bg-[#1e293b]/50 rounded-xl p-4 border border-gray-800/60 shadow-sm relative group">
        
        {/* Author Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <UserCircle2 size={18} className="text-gray-400" />
            <span className="font-bold text-sm text-gray-200">{comment.author?.name}</span>
            {comment.author?.reputationScore !== undefined && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
                ⭐ {comment.author.reputationScore}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500">
            {new Date(comment.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Comment Text */}
        <p className="text-gray-300 text-sm leading-relaxed mb-3">
          {comment.text}
        </p>

        {/* Action Bar (Reply Button) */}
        <div className="flex justify-end">
          <button 
            onClick={() => setIsReplying(!isReplying)}
            className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-blue-400 transition-colors"
          >
            <Reply size={14} />
            Reply
          </button>
        </div>
      </div>

      {/* Reply Input Box (Visible if "Reply" is clicked) */}
      {isReplying && (
        <div className="mt-3 ml-4 relative">
          <div className="absolute -left-4 top-0 bottom-0 w-px bg-blue-500/30"></div>
          <div className="flex items-start gap-2">
            <textarea
              className="flex-1 bg-gray-900 border border-gray-700 text-sm text-white rounded-lg p-2 min-h-[60px] outline-none focus:border-blue-500 transition-colors"
              placeholder={`Reply to ${comment.author?.name}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <button 
              onClick={handlePostReply}
              disabled={loading || !replyText.trim()}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50 h-[38px]"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Recursive Render for Nested Replies */}
      {nestedReplies.length > 0 && (
        <div className="ml-2 mt-2">
          {nestedReplies.map(reply => (
            <CommentThread 
              key={reply._id}
              comment={reply}
              allComments={allComments}
              projectId={projectId}
              onReplyPosted={onReplyPosted}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentThread;
