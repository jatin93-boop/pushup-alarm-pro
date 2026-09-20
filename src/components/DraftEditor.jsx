import React, { useState, useEffect, useRef, useCallback } from 'react';
import { uploadMedia } from '../api/mockApi';

const DraftEditor = ({ draft, onSave, addToast }) => {
  const [title, setTitle] = useState(draft.title || '');
  const [content, setContent] = useState(draft.content || '');
  const [media, setMedia] = useState(draft.media || []);
  
  const [saveStatus, setSaveStatus] = useState('Saved'); // 'Saved', 'Saving...', 'Error'
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Auto-resize content textarea
  const textareaRef = useRef(null);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  // Trigger auto-save when content changes
  useEffect(() => {
    // Don't trigger save if nothing actually changed from initial state on first mount
    if (title === draft.title && content === draft.content && media === draft.media) {
      return;
    }

    setSaveStatus('Saving...');
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await onSave({ ...draft, title, content, media });
        setSaveStatus('Saved');
      } catch (e) {
        setSaveStatus('Error');
      }
    }, 1000);

    return () => clearTimeout(saveTimeoutRef.current);
  }, [title, content, media, draft, onSave]);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map(file => uploadMedia(file));
      const uploadedMedia = await Promise.all(uploadPromises);
      setMedia(prev => [...prev, ...uploadedMedia]);
      addToast('Media added', 'success');
    } catch (error) {
      addToast('Failed to upload media', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveMedia = (indexToRemove) => {
    setMedia(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="editor-panel distraction-free">
      <div className="editor-header">
        <span className={`save-status ${saveStatus.toLowerCase()}`}>
          {saveStatus}
        </span>
      </div>

      <input 
        type="text" 
        className="editor-title-input" 
        placeholder="Untitled Draft" 
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      
      <textarea 
        ref={textareaRef}
        className="editor-content-input" 
        placeholder="Start writing..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      {media.length > 0 && (
        <div className="editor-media-preview">
          {media.map((m, idx) => (
            <div key={idx} className="editor-media-item">
              {m.type.startsWith('video/') ? (
                <video src={m.url} controls />
              ) : (
                <img src={m.url} alt={m.name} />
              )}
              <button 
                type="button" 
                className="remove-media-btn" 
                onClick={() => handleRemoveMedia(idx)}
                title="Remove media"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="editor-toolbar">
        <button 
          className={`toolbar-btn ${isUploading ? 'uploading' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          title="Add Image/Video"
        >
          {isUploading ? <span className="loader toolbar-loader"></span> : 'Add Media'}
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          multiple
          accept="image/*,video/*"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default DraftEditor;
