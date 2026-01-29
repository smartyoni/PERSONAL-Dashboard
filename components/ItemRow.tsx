import React, { useState, useRef } from 'react';
import { ListItem, DragState } from '../types';
import { DragHandleIcon, MenuIcon } from './Icons';
import EditableText from './EditableText';
import LinkifiedText from './LinkifiedText';
import { useClickOutside } from '../hooks/useClickOutside';

interface ItemRowProps {
  item: ListItem;
  sectionId: string;
  memo?: string;
  onToggle: () => void;
  onUpdateText: (newText: string) => void;
  onDelete: () => void;
  onAddMemo: () => void;
  dragState: DragState;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

const ItemRow: React.FC<ItemRowProps> = ({
  item,
  sectionId,
  memo,
  onToggle,
  onUpdateText,
  onDelete,
  onAddMemo,
  dragState,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setShowMenu(false));

  const isDragging = dragState.draggedItemId === item.id;
  const isDragOver = dragState.dragOverItemId === item.id;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`group flex items-center gap-2 py-1.5 px-2 rounded transition-all cursor-move relative min-h-0 ${
        isDragging ? 'opacity-50 bg-slate-100' :
        isDragOver ? 'bg-blue-50 border-l-2 border-blue-400' : 'hover:bg-slate-50'
      }`}
    >
      {/* 1. Checkbox - Increased size (w-5 h-5) */}
      <input
        type="checkbox"
        checked={item.completed}
        onChange={onToggle}
        className="w-5 h-5 rounded border-slate-300 text-slate-700 focus:ring-slate-500 cursor-pointer flex-shrink-0"
      />

      {/* 2. Text Area & Memo Preview - text-sm (reduced from text-base) */}
      <div className="flex-1 min-w-0">
        <div className={`text-sm leading-snug font-medium ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
          <EditableText
            value={item.text}
            onChange={onUpdateText}
            placeholder="항목을 입력하세요..."
            className="text-sm"
            compact
          />
        </div>
        {memo && (
          <div
            onClick={(e) => { e.stopPropagation(); onAddMemo(); }}
            className="text-xs text-green-600 truncate cursor-pointer hover:text-green-700 transition-colors mt-0.5 pl-1 font-medium"
            title={memo}
          >
            <LinkifiedText text={memo} />
          </div>
        )}
      </div>

      {/* 4. Menu Button */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-slate-600 transition-opacity p-1.5 rounded"
          title="메뉴"
        >
          <MenuIcon />
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-50 py-1.5">
            <button
              onClick={() => { onAddMemo(); setShowMenu(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
            >
              📝 메모 수정/추가
            </button>
            <button
              onClick={() => { onDelete(); setShowMenu(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              🗑️ 삭제
            </button>
            <button
              onClick={() => setShowMenu(false)}
              className="w-full text-left px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-100 transition-colors border-t border-slate-200"
            >
              취소
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemRow;