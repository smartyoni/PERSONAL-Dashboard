import React, { useState, useEffect, useRef } from 'react';

interface EditableTextProps {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

const EditableText: React.FC<EditableTextProps> = ({ value, onChange, placeholder, className = "", compact = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setTempValue(value);
  };

  const handleSave = () => {
    onChange(tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`w-full ${compact ? 'p-0 text-lg leading-normal' : 'p-1'} border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white ${className}`}
      />
    );
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={`cursor-pointer hover:bg-slate-50 transition-colors ${compact ? 'p-0 min-h-0 text-lg leading-tight' : 'p-1 min-h-[1.5rem]'} rounded break-words ${className}`}
    >
      {value ? value : <span className="text-slate-400 italic text-[0.8em]">{placeholder}</span>}
    </div>
  );
};

export default EditableText;