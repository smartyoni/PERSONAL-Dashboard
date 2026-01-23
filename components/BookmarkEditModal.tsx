
import React, { useState, useEffect } from 'react';
import { Bookmark } from '../types';

interface BookmarkEditModalProps {
  isOpen: boolean;
  bookmark: Bookmark;
  onClose: () => void;
  onSave: (updated: Bookmark) => void;
}

// Notion Style Palette
const PRESET_COLORS = [
  '#F1F1EF', // Gray
  '#F4EEEE', // Brown
  '#FBECDD', // Orange
  '#FBF3DB', // Yellow
  '#EDF3EC', // Green
  '#E7F3F8', // Blue
  '#F3F0F5', // Purple
  '#F9F0F4', // Pink
  '#FDEBEC', // Red
  '#FFFFFF', // White
  '#E1E1E1', // Darker Gray
  '#D3D3D3', // Silver
  '#E9E5E3', // Subtle Brown
  '#F7F6F3', // Off White
  '#FAF9F6', // Alabaster
  '#F1F5F9', // Slate Light
  '#F0FDF4', // Emerald Light
  '#EFF6FF', // Blue Light
  '#F5F3FF', // Violet Light
  '#FDF2F8', // Pink Light
  '#FFFBEB', // Amber Light
  '#FFF1F2', // Rose Light
  '#FEFCE8', // Yellow Light
  '#F0FDFA', // Teal Light
];

const BookmarkEditModal: React.FC<BookmarkEditModalProps> = ({ isOpen, bookmark, onClose, onSave }) => {
  const [formData, setFormData] = useState<Bookmark>({ ...bookmark });

  useEffect(() => {
    if (isOpen) {
      setFormData({ ...bookmark });
    }
  }, [isOpen, bookmark]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(formData);
  };

  const isHexColor = (color: string) => color.startsWith('#');

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]">
      <div className="bg-[#F7F6F3] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">북마크 수정</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-[#3B82F6] text-white text-sm font-bold rounded shadow-sm hover:brightness-95 active:scale-95 transition-all"
            >
              저장
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#F1B116] text-white text-sm font-bold rounded shadow-sm hover:brightness-95 active:scale-95 transition-all"
            >
              취소
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col md:flex-row gap-12">
          {/* Left Column: Inputs */}
          <div className="flex-1 space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-tight">이름</label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-tight">URL</label>
              <input
                type="text"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-medium"
              />
            </div>
          </div>

          {/* Right Column: Colors */}
          <div className="flex-1">
            <label className="block text-sm font-bold text-slate-400 mb-4 text-center md:text-left uppercase tracking-tight">노션 스타일 색상</label>
            <div className="grid grid-cols-6 gap-2 mb-8">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setFormData({ ...formData, color: `bg-[${color}]` })}
                  className={`w-10 h-10 rounded-lg border transition-all hover:scale-110 ${
                    formData.color === `bg-[${color}]` ? 'border-blue-500 shadow-md scale-110 ring-2 ring-blue-100' : 'border-slate-200'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-tight">커스텀 색상</label>
              <div className="flex items-center gap-2">
                <div 
                  className="w-12 h-10 rounded border border-slate-300 relative overflow-hidden"
                  style={{ backgroundColor: isHexColor(formData.color.replace('bg-[', '').replace(']', '')) ? formData.color.replace('bg-[', '').replace(']', '') : '#FFFFFF' }}
                >
                  <input 
                    type="color" 
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    value={isHexColor(formData.color.replace('bg-[', '').replace(']', '')) ? formData.color.replace('bg-[', '').replace(']', '') : '#FFFFFF'}
                    onChange={(e) => setFormData({ ...formData, color: `bg-[${e.target.value.toUpperCase()}]` })}
                  />
                </div>
                <input
                  type="text"
                  value={formData.color.replace('bg-[', '').replace(']', '')}
                  onChange={(e) => setFormData({ ...formData, color: `bg-[${e.target.value.toUpperCase()}]` })}
                  className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none text-slate-700 font-mono"
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookmarkEditModal;
