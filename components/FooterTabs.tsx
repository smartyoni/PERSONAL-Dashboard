
import React, { useState, useRef } from 'react';
import { Tab, Section } from '../types';
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
  isMobileLayout?: boolean;
  onNavigateToSection?: (tabId: string, sectionId: string) => void;
  onOpenToc?: () => void;
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
  isMobileLayout,
  onNavigateToSection,
  onOpenToc,
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

  const getPinnedItems = () => {
    const pinned: Array<{ tabId: string, id: string, title: string }> = [];
    tabs.forEach((tab, idx) => {
      const isSubTabInFooter = idx === 1 || tab.name === '업무게시판' || tab.name === '서브' || tab.name === '개인게시판';
      
      // 1. Inbox
      if (tab.inboxSection?.isPinned) {
        pinned.push({ tabId: tab.id, id: tab.inboxSection.id, title: tab.inboxSection.title || '📥 인박스' });
      }
      // 2. Sections
      if (tab.sections) {
        tab.sections.forEach(s => {
          if (s.isPinned) {
            pinned.push({ tabId: tab.id, id: s.id, title: s.title });
          }
        });
      }
      
      // 4. Todo Widgets
      if (tab.todoManagementInfo?.isPinned) {
        pinned.push({ 
          tabId: tab.id, 
          id: isSubTabInFooter ? 'sub-todo-widget-1' : 'todo-widget-1', 
          title: tab.todoManagementInfo.title || '✅ 할일 1' 
        });
      }
      if (tab.todoManagementInfo2?.isPinned) {
        pinned.push({ 
          tabId: tab.id, 
          id: isSubTabInFooter ? 'sub-todo-widget-2' : 'todo-widget-2', 
          title: tab.todoManagementInfo2.title || '✅ 할일 2' 
        });
      }
      if (tab.todoManagementInfo3?.isPinned) {
        pinned.push({ 
          tabId: tab.id, 
          id: isSubTabInFooter ? 'sub-todo-widget-3' : 'todo-widget-3', 
          title: tab.todoManagementInfo3.title || '✅ 할일 3' 
        });
      }
    });
    return pinned.slice(0, 5); // Limit back to 5 to make room for ToC and Bookmark buttons
  };

  const formatSectionTitle = (title: string) => {
    if (title.length <= 3) return title;
    const line1 = title.substring(0, 3);
    const line2 = title.substring(3, 6);
    const suffix = title.length > 6 ? '..' : ''; // '..' to save space for 7 tabs
    return (
      <div className="flex flex-col items-center leading-[1.0] text-[11.5px] tracking-[0.7px]">
        <span>{line1}</span>
        <span>{line2}{suffix}</span>
      </div>
    );
  };

  const RAINBOW_COLORS = [
    'bg-[#F87171] text-white', // 0: Soft Red
    'bg-[#FB923C] text-white', // 1: Soft Orange
    'bg-[#FBBF24] text-white', // 2: Soft Yellow
    'bg-[#4ADE80] text-white', // 3: Soft Green
    'bg-[#60A5FA] text-white', // 4: Soft Blue
    'bg-[#818CF8] text-white', // 5: Soft Indigo
    'bg-[#A78BFA] text-white', // 6: Soft Purple
  ];

  const visibleTabs = tabs;
  const pinnedItems = getPinnedItems();

  return (
    <div className="bg-white border-t border-slate-200 z-[100] h-16 shadow-[0_-2px_15px_rgba(0,0,0,0.08)] relative">
      <div className={`w-full h-full flex items-center overflow-x-auto no-scrollbar whitespace-nowrap ${isMobileLayout ? 'px-1' : 'px-6 gap-1'}`}>
        {hasInbox && !isMobileLayout && (
          <button
            onClick={onNavigateToInbox}
            className="flex items-center justify-center w-8 h-8 text-lg leading-none hover:bg-blue-50 rounded-lg transition-all active:scale-95 flex-shrink-0"
            title="메인 페이지의 IN-BOX 섹션으로 이동"
          >
            📥
          </button>
        )}

        {!isMobileLayout && (
          <div className="h-6 w-px bg-slate-200 flex-shrink-0" />
        )}

        <div className={`flex flex-1 h-full items-center ${isMobileLayout ? '' : 'gap-1'}`}>
          {isMobileLayout ? (
            <div className="flex w-full items-center justify-center h-full">
              <div className="flex w-[96%] bg-slate-100 rounded-lg p-0.5 border border-slate-200 shadow-sm overflow-hidden gap-[1.5px]">
                {[0, 1, 2, 3, 4, 5, 6].map((index) => {
                  if (index === 0) {
                    // 1st Slot: Table of Contents (ToC)
                    return (
                      <button
                        key="toc-button"
                        onClick={onOpenToc}
                        className={`flex-1 h-11 rounded-md flex flex-col items-center justify-center transition-all ${RAINBOW_COLORS[0]} shadow-sm active:scale-95 font-bold text-[11.5px] px-0.5 border border-black/20`}
                      >
                        <div className="flex flex-col items-center leading-[1.0] text-[11.5px] tracking-[0.7px]">
                          <span>목</span>
                          <span>차</span>
                        </div>
                      </button>
                    );
                  }

                  if (index === 6) {
                    // 7th Slot: Bookmark Button
                    return (
                      <button
                        key="bookmark-button"
                        onClick={onToggleBookmarkView}
                        className={`flex-1 h-11 rounded-md flex flex-col items-center justify-center transition-all ${RAINBOW_COLORS[6]} shadow-sm active:scale-95 font-bold text-[11.5px] px-0.5 border-2 ${isBookmarkView ? 'border-blue-600 ring-2 ring-blue-300 ring-inset ring-opacity-50' : 'border-black/20'}`}
                      >
                        <div className="flex flex-col items-center leading-[1.0] text-[11.5px] tracking-[0.7px]">
                          <span>북마</span>
                          <span>크</span>
                        </div>
                      </button>
                    );
                  }

                  // Slots 1-5 (Indices 1, 2, 3, 4, 5): Pinned Items 0-4
                  const pinnedIndex = index - 1;
                  const item = pinnedItems[pinnedIndex];
                  const colorClass = RAINBOW_COLORS[index];

                  if (item) {
                    const { tabId, id, title } = item;
                    return (
                      <button
                        key={`${tabId}-${id}`}
                        onClick={() => onNavigateToSection?.(tabId, id)}
                        className={`flex-1 h-11 rounded-md flex flex-col items-center justify-center transition-all ${colorClass} shadow-sm active:scale-95 font-bold text-[11.5px] px-0.5 border border-black/20`}
                      >
                        {formatSectionTitle(title)}
                      </button>
                    );
                  }
                  return (
                    <div
                      key={`empty-${index}`}
                      className="flex-1 h-11 rounded-md border border-dashed border-slate-300 bg-white/50 flex items-center justify-center"
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            visibleTabs.map((tab) => {
            const originalIndex = tabs.findIndex(t => t.id === tab.id);
            const tabColor = getTabColor(originalIndex);
            const isActive = activeTabId === tab.id;
            const isDragged = draggedIndex === originalIndex;
            const isDragOver = dragOverIndex === originalIndex;
            const canDelete = tabs.length > 1;
            const isActuallyDeleteable = canDelete && !tab.isLocked;

            return (
              <div
                key={tab.id}
                ref={(el) => { triggerRefs.current[tab.id] = el; }}
                draggable={!tab.isLocked && !isMobileLayout}
                onDragStart={(e) => handleDragStart(e, originalIndex)}
                onDragOver={(e) => handleDragOver(e, originalIndex)}
                onDrop={(e) => handleDrop(e, originalIndex)}
                onDragEnd={handleDragEnd}
                onClick={() => onSelectTab(tab.id)}
                onContextMenu={(e) => handleContextMenu(e, tab.id)}
                className={`group flex items-center justify-center ${isMobileLayout ? 'flex-1 h-12 max-w-[80px]' : 'w-[82px] h-[52px]'} rounded-lg cursor-pointer transition-all border-2 border-black flex-shrink-0 relative ${isDragged ? 'opacity-50' : ''
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
          }))}
        </div>

        {!isMobileLayout && (
          <div className="flex items-center ml-2 border-l border-slate-200 pl-4 flex-shrink-0 h-8">
            <button
              onClick={onAddTab}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all active:scale-95"
            >
              <span className="text-lg leading-none">+</span>
              <span>페이지 추가</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FooterTabs;
