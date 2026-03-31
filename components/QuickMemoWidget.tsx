import React, { useState, useEffect, useRef } from 'react';

interface QuickMemoWidgetProps {
  value: string;
  onUpdate: (newValue: string) => void;
  isMobileLayout?: boolean;
}

const QuickMemoWidget: React.FC<QuickMemoWidgetProps> = ({ value, onUpdate, isMobileLayout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (tempValue !== value) {
      onUpdate(tempValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      textareaRef.current?.blur();
    }
    if (e.key === 'Escape') {
      setTempValue(value);
      setIsEditing(false);
    }
  };

  return (
    <div 
      className={`flex flex-col bg-white border-2 border-black rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 ${isMobileLayout ? 'h-auto min-h-[120px]' : 'h-full'}`}
      onDoubleClick={handleDoubleClick}
    >
      <div className="flex-none px-3 py-2 bg-slate-50 border-b-2 border-black flex items-center justify-between">
        <h3 className="text-[13px] font-black tracking-tight text-slate-800">QUICK MEMO</h3>
        <div className="text-[10px] text-slate-400 font-medium">Double Click to Edit</div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            className="w-full h-full p-4 text-[14px] leading-relaxed text-slate-700 bg-emerald-50/30 focus:outline-none resize-none custom-scrollbar font-sans"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Type your quick notes here..."
          />
        ) : (
          <div className="w-full h-full p-4 overflow-y-auto custom-scrollbar group cursor-text">
            {value.trim() ? (
              <div className="whitespace-pre-wrap text-[14px] leading-relaxed text-slate-700 font-sans">
                {value}
              </div>
            ) : (
              <div className="text-slate-300 italic text-[14px] select-none">
                Empty memo. Double-click to start writing.
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.02] pointer-events-none transition-colors duration-200" />
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickMemoWidget;
