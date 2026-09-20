import React from 'react';

const DraftItem = ({ draft, isActive, onSelect, onDelete }) => {
  const formattedTime = new Date(draft.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isUntitled = !draft.title || draft.title.trim() === '';
  const isTextEmpty = !draft.content || draft.content.trim() === '';
  const hasMedia = draft.media && draft.media.length > 0;
  
  const isMediaOnly = isUntitled && isTextEmpty && hasMedia;

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(draft.id);
  };

  return (
    <div 
      className={`draft-card ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(draft)}
    >
      <div className="draft-card-main">
        {isMediaOnly ? (
          <div className="media-only-card">
            <h3 className="draft-card-title media-title">Media Post</h3>
            <div className="sidebar-thumbnail-wrapper">
              {draft.media[0].type.startsWith('video/') ? (
                <video src={draft.media[0].url} className="sidebar-thumbnail" />
              ) : (
                <img src={draft.media[0].url} className="sidebar-thumbnail" />
              )}
            </div>
          </div>
        ) : (
          <>
            <h3 className={`draft-card-title ${isUntitled ? 'untitled' : ''}`}>
              {isUntitled ? 'Untitled Draft' : draft.title}
            </h3>
            <p className="draft-card-excerpt">
              {!isTextEmpty ? draft.content : <em>No additional text</em>}
            </p>
          </>
        )}
      </div>
      
      <div className="draft-card-meta">
        <span className="draft-card-time">{formattedTime}</span>
        
        {draft.media && draft.media.length > 0 && (
          <span className="media-indicator">📎 {draft.media.length}</span>
        )}
      </div>

      <button 
        className="delete-draft-icon" 
        onClick={handleDelete}
        title="Delete draft"
      >
        ✕
      </button>
    </div>
  );
};

export default DraftItem;
