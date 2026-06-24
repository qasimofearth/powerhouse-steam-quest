import React, { useState, useEffect, useCallback } from 'react';
import { useGameContext } from '../hooks/useGameContext';

interface ReviewComment {
  sceneIndex: number;
  sceneName?: string;
  dialogIndex?: number;
  comment: string;
  timestamp: string;
}

interface ReviewPanelProps {
  sceneData: { type: string }[];
  sceneNames?: Record<string, string>;
}

const STORAGE_KEY = 'quest-review-comments';

const ReviewPanel: React.FC<ReviewPanelProps> = ({ sceneData, sceneNames }) => {
  const { currentSceneIndex, dialogIndex } = useGameContext();
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [currentComment, setCurrentComment] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);

  // Load comments from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setComments(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load review comments:', e);
      }
    }
  }, []);

  // Save comments to localStorage
  const saveComments = useCallback((newComments: ReviewComment[]) => {
    setComments(newComments);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newComments));
  }, []);

  // Get scene name if available
  const getSceneName = (index: number) => {
    if (sceneNames) {
      const key = `scene_${index + 1}`;
      return sceneNames[key] || `Scene ${index + 1}`;
    }
    return `Scene ${index + 1}`;
  };

  // Add a comment
  const handleAddComment = () => {
    if (!currentComment.trim()) return;

    const newComment: ReviewComment = {
      sceneIndex: currentSceneIndex,
      sceneName: getSceneName(currentSceneIndex),
      dialogIndex: dialogIndex,
      comment: currentComment.trim(),
      timestamp: new Date().toISOString(),
    };

    saveComments([...comments, newComment]);
    setCurrentComment('');
  };

  // Delete a comment
  const handleDeleteComment = (index: number) => {
    const newComments = comments.filter((_, i) => i !== index);
    saveComments(newComments);
  };

  // Export comments as JSON
  const handleExport = () => {
    const gameId = import.meta.env.VITE_GAME_ID || 'quest';
    const exportData = {
      questId: gameId,
      exportedAt: new Date().toISOString(),
      totalScenes: sceneData.length,
      comments: comments,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${gameId}-review-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear all comments
  const handleClearAll = () => {
    if (window.confirm('Clear all review comments? This cannot be undone.')) {
      saveComments([]);
    }
  };

  // Get comments for current scene
  const currentSceneComments = comments.filter(c => c.sceneIndex === currentSceneIndex);

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.ctrlKey && currentComment.trim()) {
        handleAddComment();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentComment]);

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed top-4 right-4 z-50 bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2"
        title="Open Review Panel"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
        {comments.length > 0 && (
          <span className="bg-white text-amber-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
            {comments.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 max-h-[80vh] flex flex-col">
      {/* Header */}
      <div className="bg-amber-500 text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
        <div>
          <h3 className="font-bold text-sm">Review Mode</h3>
          <p className="text-xs opacity-90">
            Scene {currentSceneIndex + 1}/{sceneData.length}
            {dialogIndex !== undefined && ` (Dialog ${dialogIndex + 1})`}
          </p>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="hover:bg-amber-600 p-1 rounded"
          title="Minimize"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Scene info */}
      <div className="px-4 py-2 bg-gray-50 border-b text-xs text-gray-600">
        <strong>{getSceneName(currentSceneIndex)}</strong>
      </div>

      {/* Comment input */}
      <div className="p-3 border-b">
        <textarea
          value={currentComment}
          onChange={(e) => setCurrentComment(e.target.value)}
          placeholder="Add feedback for this scene..."
          className="w-full h-20 p-2 text-sm border rounded resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-400">Ctrl+Enter to submit</span>
          <button
            onClick={handleAddComment}
            disabled={!currentComment.trim()}
            className="bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white px-3 py-1 rounded text-sm font-medium"
          >
            Add Comment
          </button>
        </div>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase">
            {showAllComments ? 'All Comments' : 'This Scene'}
          </h4>
          <button
            onClick={() => setShowAllComments(!showAllComments)}
            className="text-xs text-amber-600 hover:text-amber-700"
          >
            {showAllComments ? 'Show Current' : `Show All (${comments.length})`}
          </button>
        </div>

        {(showAllComments ? comments : currentSceneComments).length === 0 ? (
          <p className="text-xs text-gray-400 italic">No comments yet</p>
        ) : (
          <div className="space-y-2">
            {(showAllComments ? comments : currentSceneComments).map((comment, idx) => {
              const actualIdx = showAllComments ? idx : comments.findIndex(c => c === comment);
              return (
                <div key={actualIdx} className="bg-gray-50 rounded p-2 text-xs">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-gray-600">
                      {showAllComments ? comment.sceneName : `Dialog ${(comment.dialogIndex ?? 0) + 1}`}
                    </span>
                    <button
                      onClick={() => handleDeleteComment(actualIdx)}
                      className="text-red-400 hover:text-red-600"
                      title="Delete"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-gray-700">{comment.comment}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 border-t bg-gray-50 rounded-b-lg flex gap-2">
        <button
          onClick={handleExport}
          disabled={comments.length === 0}
          className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white px-3 py-2 rounded text-sm font-medium"
        >
          Export JSON
        </button>
        <button
          onClick={handleClearAll}
          disabled={comments.length === 0}
          className="bg-red-100 hover:bg-red-200 disabled:bg-gray-100 text-red-600 disabled:text-gray-400 px-3 py-2 rounded text-sm font-medium"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default ReviewPanel;
