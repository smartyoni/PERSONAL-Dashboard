
import React, { useState, useRef } from 'react';
import { Tab } from '../types';
import EditableText from './EditableText';
import { MenuIcon } from './Icons';
import { useClickOutside } from '../hooks/useClickOutside';

interface FooterTabsProps {
  tabs: Tab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onAddTab: () => void;
  onRenameTab: (id: string, newName: string) => void;
  onDeleteTab: (id: string) => void;
  onToggleLockTab: (id: string) => void;
}

const TAB_COLORS = [
  { bg: 'bg-[#F59E0B]', bgLight: 'bg-[#FEF3C7]', text: 'text-[#92400E]', textLight: 'text-[#D97706]', border: 'border-[#F59E0B]' },
  { bg: 'bg-[#3B82F6]', bgLight: 'bg-[#DBEAFE]', text: 'text-[#1E3A8A]', textLight: 'text-[#3B82F6]', border: 'border-[#3B82F6]' },
  { bg: 'bg-[#9333EA]', bgLight: 'bg-[#F3E8FF]', text: 'text-[#581C87]', textLight: 'text-[#9333EA]', border: 'border-[#9333EA]' },
  { bg: 'bg-[#10B981]', bgLight: 'bg-[#D1FAE5]', text: 'text-[#065F46]', textLight: 'text-[#10B981]', border: 'border-[#10B981]' },
  { bg: 'bg-[#F43F5E]', bgLight: 'bg-[#FFE4E6]', text: 'text-[#881337]', textLight: 'text-[#F43F5E]', border: 'border-[#F43F5E]' },
  { bg: 'bg-[#06B6D4]', bgLight: 'bg-[#CFFAFE]', text: 'text-[#164E63]', textLight: 'text-[#06B6D4]', border: 'border-[#06B6D4]' },
  { bg: 'bg-[#8B5CF6]', bgLight: 'bg-[#EDE9FE]', text: 'text-[#4C1D95]', textLight: 'text-[#8B5CF6]', border: 'border-[#8B5CF6]' },
  { bg: 'bg-[#F97316]', bgLight: 'bg-[#FFEDD5]', text: 'text-[#7C2D12]', textLight: 'text-[#F97316]', border: 'border-[#F97316]' },
];

const getTabColor = (index: number) => TAB_COLORS[index % TAB_COLORS.length];

const TabMenuItem: React.FC<{
  tab: Tab;
  onDelete: (id: string) => void;
  onToggleLock: (id: string) => void;
  canDelete: boolean;
  isActive: boolean;
  tabColor: { text: string; textLight: string };
}> = ({ tab, onDelete, onToggleLock, canDelete, isActive, tabColor }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ bottom: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setShowMenu(false));

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPos({
        bottom: window.innerHeight - rect.top + 8,
        left: rect.left
      });
    }
    setShowMenu(!showMenu);
  };

  const isActuallyDeleteable = canDelete && !tab.isLocked;

  return (
    <div className="relative ml-1">
      <button
        ref={triggerRef}
        onClick={toggleMenu}
        className={`p-1 rounded-full transition-all flex items-center justify-center ${
          isActive
            ? `opacity-100 ${tabColor.text} hover:bg-black/5`
            : `opacity-40 group-hover:opacity-100 ${tabColor.textLight} hover:bg-black/5`
        }`}
        title="페이지 메뉴"
      >
        <MenuIcon />
      </button>

      {showMenu && (
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
              onToggleLock(tab.id);
              setShowMenu(false);
            }}
            className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-2"
          >
            <span className="text-sm leading-none">{tab.isLocked ? '🔓' : '🔒'}</span>
            <span className="font-bold">{tab.isLocked ? '잠금 해제' : '잠금'}</span>
          </button>
          
          <button
            disabled={!isActuallyDeleteable}
            onClick={() => {
              onDelete(tab.id);
              setShowMenu(false);
            }}
            className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 border-t border-slate-50 ${
              isActuallyDeleteable 
                ? 'text-red-600 hover:bg-red-50' 
                : 'text-slate-300 cursor-not-allowed bg-slate-50'
            }`}
          >
            <span className="text-sm leading-none">🗑️</span>
            <span className="font-bold">삭제</span>
          </button>
          
          <button
            onClick={() => setShowMenu(false)}
            className="w-full text-left px-3 py-2 text-xs text-slate-500 hover:bg-slate-100 transition-colors border-t border-slate-100 font-medium"
          >
            취소
          </button>
        </div>
      )}
    </div>
  );
};

const FooterTabs: React.FC<FooterTabsProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onRenameTab,
  onDeleteTab,
  onToggleLockTab
}) => {
  return (
    <div className="bg-white border-t border-slate-200 z-[100] h-12 shadow-[0_-2px_15px_rgba(0,0,0,0.08)] relative">
      <div className="w-full h-full flex items-center overflow-x-auto no-scrollbar whitespace-nowrap px-6 gap-1">
        {tabs.map((tab, index) => {
          const tabColor = getTabColor(index);
          const isActive = activeTabId === tab.id;

          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all border flex-shrink-0 ${
                isActive
                  ? `${tabColor.bg} ${tabColor.text} ${tabColor.border} shadow-sm`
                  : `${tabColor.bgLight} ${tabColor.textLight} border-transparent hover:${tabColor.border}`
              }`}
            >
              <EditableText
                value={tab.name}
                onChange={(newName) => onRenameTab(tab.id, newName)}
                className={`text-xs min-w-[40px] text-center ${isActive ? 'font-bold' : 'font-medium'}`}
                placeholder="페이지 이름"
              />
              <TabMenuItem
                tab={tab}
                onDelete={onDeleteTab}
                onToggleLock={onToggleLockTab}
                canDelete={tabs.length > 1}
                isActive={isActive}
                tabColor={tabColor}
              />
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
