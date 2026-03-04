
import React, { useState, useRef } from 'react';
import { Tab } from '../types';
import EditableText from './EditableText';
import { useClickOutside } from '../hooks/useClickOutside';

interface FooterTabsProps {
  tabs: Tab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onAddTab: () => void;
  onRenameTab: (id: string, newName: string) => void;
  onDeleteTab: (id: string) => void;
  onToggleLockTab: (id: string) => void;
  onReorderTabs: (fromIndex: number, toIndex: number) => void;
  onNavigateToInbox: () => void;
  hasInbox: boolean;
  isBookmarkView: boolean;
  onToggleBookmarkView: () => void;
}

export const TAB_COLORS = [
  { bg: 'bg-[#F59E0B]', bgLight: 'bg-[#FEF3C7]', text: 'text-slate-900', textLight: 'text-[#92400E]', border: 'border-[#F59E0B]' },
  { bg: 'bg-[#3B82F6]', bgLight: 'bg-[#DBEAFE]', text: 'text-slate-900', textLight: 'text-[#1E3A8A]', border: 'border-[#3B82F6]' },
  { bg: 'bg-[#9333EA]', bgLight: 'bg-[#F3E8FF]', text: 'text-slate-900', textLight: 'text-[#581C87]', border: 'border-[#9333EA]' },
  { bg: 'bg-[#10B981]', bgLight: 'bg-[#D1FAE5]', text: 'text-slate-900', textLight: 'text-[#065F46]', border: 'border-[#10B981]' },
  { bg: 'bg-[#F43F5E]', bgLight: 'bg-[#FFE4E6]', text: 'text-slate-900', textLight: 'text-[#881337]', border: 'border-[#F43F5E]' },
  { bg: 'bg-[#06B6D4]', bgLight: 'bg-[#CFFAFE]', text: 'text-slate-900', textLight: 'text-[#164E63]', border: 'border-[#06B6D4]' },
  { bg: 'bg-[#8B5CF6]', bgLight: 'bg-[#EDE9FE]', text: 'text-slate-900', textLight: 'text-[#4C1D95]', border: 'border-[#8B5CF6]' },
  { bg: 'bg-[#F97316]', bgLight: 'bg-[#FFEDD5]', text: 'text-slate-900', textLight: 'text-[#7C2D12]', border: 'border-[#F97316]' },
];

export const getTabColor = (index: number) => TAB_COLORS[index % TAB_COLORS.length];


const FooterTabs: React.FC<FooterTabsProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onRenameTab,
  onDeleteTab,
  onToggleLockTab,
  onReorderTabs,
  onNavigateToInbox,
  hasInbox,
  isBookmarkView,
  onToggleBookmarkView,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ bottom: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useClickOutside(menuRef, () => setOpenMenuId(null));

  const handleDragStart = (e: React.DragEvent, index: number) => {
    const tab = tabs[index];
    if (tab.isLocked) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      onReorderTabs(draggedIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const trigger = triggerRefs.current[tabId];
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      setMenuPos({
        bottom: window.innerHeight - rect.top + 8,
        left: rect.left
      });
      setOpenMenuId(tabId);
    }
  };

  return (
    <div className="bg-white border-t border-slate-200 z-[100] h-16 shadow-[0_-2px_15px_rgba(0,0,0,0.08)] relative">
      <div className="w-full h-full flex items-center overflow-x-auto no-scrollbar whitespace-nowrap px-6 gap-1">
        {hasInbox && (
          <button
            onClick={onNavigateToInbox}
            className="md:hidden flex items-center justify-center w-8 h-8 text-lg leading-none hover:bg-blue-50 rounded-lg transition-all active:scale-95 flex-shrink-0"
            title="메인 페이지의 IN-BOX 섹션으로 이동"
          >
            📥
          </button>
        )}

        <div className="h-6 w-px bg-slate-200 flex-shrink-0" />

        {tabs.map((tab, index) => {
          const tabColor = getTabColor(index);
          const isActive = activeTabId === tab.id;
          const isDragged = draggedIndex === index;
          const isDragOver = dragOverIndex === index;
          const canDelete = tabs.length > 1;
          const isActuallyDeleteable = canDelete && !tab.isLocked;

          return (
            <div
              key={tab.id}
              ref={(el) => { triggerRefs.current[tab.id] = el; }}
              draggable={!tab.isLocked}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => onSelectTab(tab.id)}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
              className={`group flex items-center justify-center w-[82px] h-[52px] rounded-lg cursor-pointer transition-all border-2 border-black flex-shrink-0 relative ${isDragged ? 'opacity-50' : ''
                } ${isDragOver ? 'ring-2 ring-offset-1 ring-blue-400' : ''
                } ${!tab.isLocked ? 'hover:shadow-md' : ''
                } ${isActive
                  ? `${tabColor.bg} ${tabColor.text} shadow-sm`
                  : `${tabColor.bgLight} ${tabColor.textLight} hover:shadow-lg`
                } ${tab.isLocked ? 'cursor-default' : ''
                }`}
            >
              <div draggable={false} onDragStart={(e) => e.stopPropagation()} className="w-full h-full flex items-center justify-center px-0.5">
                <EditableText
                  value={tab.name}
                  onChange={(newName) => onRenameTab(tab.id, newName)}
                  className={`text-[13px] leading-[1.2] tracking-tighter text-center w-full line-clamp-2 overflow-hidden ${isActive ? 'font-black' : 'font-bold'}`}
                  placeholder="페이지"
                  compact
                />
              </div>

              {openMenuId === tab.id && (
                <div
                  ref={menuRef}
                  className="fixed bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] border border-slate-200 z-[999] py-1 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150 w-32"
                  style={{
                    bottom: `${menuPos.bottom}px`,
                    left: `${menuPos.left}px`
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      onToggleLockTab(tab.id);
                      setOpenMenuId(null);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-2"
                  >
                    <span className="text-sm leading-none">{tab.isLocked ? '🔓' : '🔒'}</span>
                    <span className="font-bold">{tab.isLocked ? '잠금 해제' : '잠금'}</span>
                  </button>

                  <button
                    disabled={!isActuallyDeleteable}
                    onClick={() => {
                      onDeleteTab(tab.id);
                      setOpenMenuId(null);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 border-t border-slate-50 ${isActuallyDeleteable
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-slate-300 cursor-not-allowed bg-slate-50'
                      }`}
                  >
                    <span className="text-sm leading-none">🗑️</span>
                    <span className="font-bold">삭제</span>
                  </button>

                  <button
                    onClick={() => setOpenMenuId(null)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-500 hover:bg-slate-100 transition-colors border-t border-slate-100 font-medium"
                  >
                    취소
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <div className="flex items-center ml-2 border-l border-slate-200 pl-4 flex-shrink-0 h-8">
          <button
            onClick={onAddTab}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all active:scale-95"
          >
            <span className="text-lg leading-none">+</span>
            <span>페이지 추가</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FooterTabs;
