
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

  const pinnedItems = getPinnedItems();

  return (
    <div className="fixed bottom-1 left-6 z-[100] flex items-end gap-3 pointer-events-none">
      {/* 1. Specialized Utilities Pill (Desktop Only) */}
      {!isMobileLayout && (
        <div className="flex items-center gap-1 bg-white/80 backdrop-blur-xl border border-white/20 p-1.5 rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] pointer-events-auto">
          {hasInbox && (
            <button
              onClick={onNavigateToInbox}
              className="flex items-center justify-center w-9 h-9 text-lg hover:bg-slate-200/50 rounded-full transition-all active:scale-90"
              title="메인 인박스"
            >
              📥
            </button>
          )}
          <button
            onClick={onToggleBookmarkView}
            className={`flex items-center justify-center w-9 h-9 text-lg rounded-full transition-all active:scale-90 ${
              isBookmarkView ? 'bg-blue-500 text-white shadow-lg' : 'hover:bg-slate-200/50'
            }`}
            title="북마크"
          >
            🔖
          </button>
        </div>
      )}

      {/* 2. Main Tabs Segmented Control Pill */}
      <div className={`flex items-center bg-white/80 backdrop-blur-xl border border-white/20 p-1.5 rounded-[22px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] pointer-events-auto relative ${isMobileLayout ? 'max-w-[calc(100vw-48px)] overflow-x-auto no-scrollbar' : ''}`}>
        
        {/* Desktop Active Indicator Layer */}
        {!isMobileLayout && (
          <div 
            className="absolute h-9 bg-slate-900 rounded-[14px] transition-all duration-300 ease-out shadow-lg"
            style={{
              width: '82px',
              left: `${tabs.findIndex(t => t.id === activeTabId) * 83 + 6}px`,
              opacity: isBookmarkView ? 0 : 1,
              transform: isBookmarkView ? 'scale(0.9)' : 'scale(1)'
            }}
          />
        )}

        <div className="flex items-center gap-1 relative">
          {isMobileLayout ? (
            /* Mobile Rainbow Bar remains functional but refined as a floating element */
            <div className="flex items-center gap-1 px-1">
              {[0, 1, 2, 3, 4, 5, 6].map((index) => {
                if (index === 0) return (
                  <button key="toc" onClick={onOpenToc} className={`w-11 h-11 rounded-xl flex items-center justify-center ${RAINBOW_COLORS[0]} shadow-sm active:scale-95 font-bold text-[11px] border border-black/10`}>📊</button>
                );
                if (index === 6) return (
                  <button key="book" onClick={onToggleBookmarkView} className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${isBookmarkView ? 'bg-blue-600 ring-2 ring-blue-300 border-2 border-white' : `${RAINBOW_COLORS[6]} border border-black/10`} shadow-sm active:scale-95 font-bold text-[11px]`}>🔖</button>
                );
                const item = pinnedItems[index - 1];
                if (item) return (
                  <button key={item.id} onClick={() => onNavigateToSection?.(item.tabId, item.id)} className={`w-11 h-11 rounded-xl flex items-center justify-center ${RAINBOW_COLORS[index]} shadow-sm active:scale-95 font-bold text-[10px] border border-black/10`}>
                    {formatSectionTitle(item.title)}
                  </button>
                );
                return <div key={index} className="w-11 h-11 rounded-xl bg-slate-100/50 border border-dashed border-slate-300" />;
              })}
            </div>
          ) : (
            /* Desktop Segmented Tabs */
            tabs.map((tab, idx) => {
              const isActive = activeTabId === tab.id && !isBookmarkView;
              const originalIndex = tabs.findIndex(t => t.id === tab.id);

              return (
                <div
                  key={tab.id}
                  ref={(el) => { triggerRefs.current[tab.id] = el; }}
                  draggable={!tab.isLocked}
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onSelectTab(tab.id)}
                  onContextMenu={(e) => handleContextMenu(e, tab.id)}
                  className={`relative w-[82px] h-9 flex items-center justify-center cursor-pointer select-none transition-all duration-300 ${
                    isActive ? 'text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <div draggable={false} onDragStart={(e) => e.stopPropagation()} className="w-full flex items-center justify-center pointer-events-none">
                    <EditableText
                      value={tab.name}
                      onChange={(newName) => onRenameTab(tab.id, newName)}
                      className={`text-[12px] text-center w-full px-1 line-clamp-1 truncate pointer-events-auto ${isActive ? 'font-black' : 'font-bold'}`}
                      placeholder="페이지"
                      compact
                    />
                  </div>
                  {tab.isLocked && !isActive && <span className="absolute -top-1 -right-1 text-[8px] opacity-40">🔒</span>}
                  
                  {/* Context Menu (Integrated) */}
                  {openMenuId === tab.id && (
                    <div
                      ref={menuRef}
                      className="fixed bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] border border-slate-100 z-[999] py-1.5 w-36 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                      style={{ bottom: `${menuPos.bottom}px`, left: `${menuPos.left}px` }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button onClick={() => { onToggleLockTab(tab.id); setOpenMenuId(null); }} className="w-full text-left px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2">
                        <span>{tab.isLocked ? '🔓' : '🔒'}</span>
                        <span className="font-bold">{tab.isLocked ? '잠금 해제' : '잠금'}</span>
                      </button>
                      <button 
                        disabled={tabs.length <= 1 || tab.isLocked} 
                        onClick={() => { onDeleteTab(tab.id); setOpenMenuId(null); }} 
                        className={`w-full text-left px-4 py-2 text-[13px] transition-colors flex items-center gap-2 border-t border-slate-50 ${
                          tabs.length > 1 && !tab.isLocked ? 'text-red-500 hover:bg-red-50' : 'text-slate-300 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <span>🗑️</span>
                        <span className="font-bold">삭제</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 3. Add Tab Button (Integrated inside Pill) */}
        {!isMobileLayout && (
          <button
            onClick={onAddTab}
            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-full transition-all active:scale-90 ml-0.5"
            title="새 페이지 추가"
          >
            <span className="text-xl font-light leading-none">+</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default FooterTabs;
