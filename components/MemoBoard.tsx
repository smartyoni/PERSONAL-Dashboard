
import React, { useState } from 'react';
import { SideNote } from '../types';

interface MemoBoardProps {
  notes: SideNote[];
  onChange: (newNotes: SideNote[]) => void;
}

const MemoBoard: React.FC<MemoBoardProps> = ({ notes, onChange }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [tempContent, setTempContent] = useState('');

  // 항상 16개의 메모 슬롯을 유지하도록 보장
  const memoList: SideNote[] = Array.from({ length: 16 }, (_, i) => notes[i] || { title: '', content: '' });

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setTempTitle(memoList[index].title);
    setTempContent(memoList[index].content);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null) {
      const newNotes = [...memoList];
      newNotes[editingIndex] = { title: tempTitle, content: tempContent };
      onChange(newNotes);
      setEditingIndex(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col py-2 px-2 gap-1 overflow-hidden">
      {memoList.map((note, index) => (
        <div key={index} className="flex-1 min-h-0 w-full">
          <button
            onClick={() => handleStartEdit(index)}
            className="w-full h-full px-2 py-1 rounded-lg border border-slate-200/60 text-[11px] font-bold transition-all active:scale-95 flex flex-col items-center justify-center hover:brightness-95 hover:shadow-sm text-slate-700 overflow-hidden leading-tight bg-[#FBF3DB]"
          >
            <span className="line-clamp-2 text-center break-all">
              {note.title || (note.content ? note.content.substring(0, 10) : `메모 ${index + 1}`)}
            </span>
          </button>
        </div>
      ))}

      {/* Memo Edit Modal - 70% Height & Bezel-less UI */}
      {editingIndex !== null && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl h-[70vh] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in duration-200 flex flex-col">
            {/* Header: Title Input instead of static text */}
            <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-4 bg-white shrink-0">
              <div className="flex-1 flex items-center gap-2">
                <span className="text-xl">📝</span>
                <input
                  type="text"
                  autoFocus
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  placeholder="메모 제목을 입력하세요..."
                  className="w-full text-lg font-extrabold text-slate-800 placeholder:text-slate-300 focus:outline-none bg-transparent"
                />
              </div>
              <button 
                onClick={() => setEditingIndex(null)} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body: Bezel-less TextArea */}
            <div className="flex-1 overflow-hidden">
              <textarea
                value={tempContent}
                onChange={(e) => setTempContent(e.target.value)}
                className="w-full h-full p-8 bg-transparent text-slate-700 text-base resize-none focus:outline-none custom-scrollbar font-medium leading-relaxed placeholder:text-slate-200"
                placeholder="내용을 자유롭게 입력하세요..."
              />
            </div>

            {/* Footer */}
            <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setEditingIndex(null)}
                className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all"
              >
                취소
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-10 py-2.5 text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoBoard;
