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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // 항상 16개의 메모 슬롯을 유지하도록 보장
  const memoList: SideNote[] = Array.from({ length: 16 }, (_, i) => notes[i] || { title: '', content: '' });

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newNotes = [...memoList];
    const draggedItem = newNotes[draggedIndex];
    const targetItem = newNotes[dropIndex];

    // 스왑 방식으로 위치 변경
    newNotes[draggedIndex] = targetItem;
    newNotes[dropIndex] = draggedItem;

    onChange(newNotes);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

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

  const handleResetMemo = () => {
    if (editingIndex !== null) {
      const newNotes = [...memoList];
      newNotes[editingIndex] = { title: '', content: '' };

      // 메모 초기화 시: 내용이 있는 메모들은 위로, 빈 메모들은 아래로 정렬 (기존 순서 유지)
      newNotes.sort((a, b) => {
        const aHas = !!(a.title || a.content);
        const bHas = !!(b.title || b.content);
        if (aHas === bHas) return 0;
        return aHas ? -1 : 1;
      });

      onChange(newNotes);
      setEditingIndex(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col py-2 px-2 gap-1 overflow-hidden">
      {memoList.map((note, index) => {
        const hasMemo = note.title || note.content;
        return (
          <div
            key={index}
            className={`flex-1 min-h-0 w-full flex items-stretch gap-0.5 ${draggedIndex === index ? 'opacity-40' : ''}`}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
          >
            {/* 드래그 핸들 */}
            <div
              className={`w-5 flex-none flex items-center justify-center cursor-grab active:cursor-grabbing rounded-l-lg border-y border-l select-none transition-colors ${hasMemo
                ? 'bg-green-600 border-green-700 text-white'
                : 'bg-slate-200 border-slate-300 text-slate-400'
                }`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="9" cy="5" r="1.5" />
                <circle cx="15" cy="5" r="1.5" />
                <circle cx="9" cy="12" r="1.5" />
                <circle cx="15" cy="12" r="1.5" />
                <circle cx="9" cy="19" r="1.5" />
                <circle cx="15" cy="19" r="1.5" />
              </svg>
            </div>

            {/* 내용 버튼 */}
            <button
              onClick={() => handleStartEdit(index)}
              className={`flex-1 min-w-0 px-2 py-1 rounded-r-lg border-y border-r transition-all active:scale-95 flex flex-col items-center justify-center hover:brightness-95 hover:shadow-sm overflow-hidden leading-tight ${hasMemo
                ? 'bg-green-400 text-black text-[14px] font-normal border-green-600'
                : 'bg-[#FBF3DB] text-slate-700 text-[12px] font-bold border-slate-200/60'
                }`}
            >
              <span className="line-clamp-2 text-center break-all">
                {note.title || (note.content ? note.content.substring(0, 10) : '미생성 메모장')}
              </span>
            </button>
          </div>
        );
      })}

      {/* Memo Edit Modal - 70% Height & Bezel-less UI */}
      {editingIndex !== null && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setEditingIndex(null)}>
          <div className="bg-white w-full max-w-3xl h-[70vh] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in duration-200 flex flex-col" onClick={(e) => e.stopPropagation()}>
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
            <div className="px-6 py-2 bg-slate-50 border-t border-black flex justify-between gap-3 shrink-0">
              <button
                onClick={handleResetMemo}
                className="px-6 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all active:scale-95"
              >
                초기화
              </button>
              <div className="flex gap-3">
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
        </div>
      )}
    </div>
  );
};

export default MemoBoard;
