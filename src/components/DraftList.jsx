import React from 'react';
import DraftItem from './DraftItem';

const DraftList = ({ drafts, activeDraftId, onSelectDraft, onDeleteDraft }) => {
  if (drafts.length === 0) {
    return (
      <div className="draft-list">
        <p style={{ color: 'var(--text-secondary)' }}>No drafts found. Create one!</p>
      </div>
    );
  }

  return (
    <div className="draft-list">
      {drafts.map(draft => (
        <DraftItem 
          key={draft.id} 
          draft={draft} 
          isActive={activeDraftId === draft.id}
          onSelect={onSelectDraft}
          onDelete={onDeleteDraft}
        />
      ))}
    </div>
  );
};

export default DraftList;
