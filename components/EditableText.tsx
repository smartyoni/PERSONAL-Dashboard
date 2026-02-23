import React, { useState, useEffect, useRef, useCallback } from 'react';


interface EditableTextProps {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
  onEditingChange?: (isEditing: boolean) => void;
}

const EditableText: React.FC<EditableTextProps> = ({ value, onChange, placeholder, className = "", compact = false, onEditingChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
      // 커서를 텍스트 끝으로 이동
      const len = tempValue.length;
      textareaRef.current?.setSelectionRange(len, len);
      autoResize();
    }
  }, [isEditing]);

  useEffect(() => {
    if (isEditing) {
      autoResize();
    }
  }, [tempValue, isEditing, autoResize]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setTempValue(value);
    onEditingChange?.(true);
  };

  const handleSave = () => {
    onChange(tempValue);
    setIsEditing(false);
    onEditingChange?.(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
    onEditingChange?.(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') handleCancel();
  };

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        onDragStart={(e) => e.stopPropagation()}
        rows={1}
        className={`w-full ${compact ? 'p-0 text-lg leading-normal' : 'p-1'} border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white resize-none overflow-hidden ${className}`}
      />
    );
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={`cursor-pointer hover:bg-slate-50 transition-colors ${compact ? 'p-0 min-h-0 text-lg leading-tight' : 'p-1 min-h-[1.5rem]'} rounded break-words whitespace-pre-wrap ${className}`}
    >
      {value || <span className="text-slate-400 italic text-[0.8em]">{placeholder}</span>}
    </div>
  );
};

export default EditableText;