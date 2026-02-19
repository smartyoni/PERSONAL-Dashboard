import React, { useState, useEffect, useRef } from 'react';


interface EditableTextAreaProps {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  className?: string;
  textClassName?: string;
  rows?: number;
  maxLength?: number;
}

const EditableTextArea: React.FC<EditableTextAreaProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  textClassName = '',
  rows = 2,
  maxLength = 100
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

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
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value.slice(0, maxLength))}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        rows={rows}
        maxLength={maxLength}
        className={`w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white resize-none ${className}`}
      />
    );
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={`cursor-pointer hover:bg-slate-50 transition-colors p-3 min-h-[4rem] rounded-lg ${textClassName} ${className}`}
    >
      {value ? (
        value
      ) : (
        <span className="text-slate-400 italic">{placeholder}</span>
      )}
    </div>
  );
};

export default EditableTextArea;
