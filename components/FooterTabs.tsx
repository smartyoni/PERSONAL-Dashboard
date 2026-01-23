
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

const TableIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const ArrowIcon = ({ direction }: { direction: 'left' | 'right' }) => (
  <svg className="w-3 h-3 text-slate-300 mx-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={direction === 'left' ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
  </svg>
);

const TabMenuItem: React.FC<{
  tab: Tab;
  onDelete: (id: string) => void;
  onToggleLock: (id: string) => void;
  canDelete: boolean;
  isActive: boolean;
}> = ({ tab, onDelete, onToggleLock, canDelete, isActive }) => {
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
            ? 'opacity-100 text-blue-500 hover:bg-blue-100' 
            : 'opacity-40 group-hover:opacity-100 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
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
      <div className="w-full h-full flex items-center overflow-x-auto no-scrollbar whitespace-nowrap px-6 gap-0">
        {tabs.map((tab, index) => (
          <React.Fragment key={tab.id}>
            <div
              onClick={() => onSelectTab(tab.id)}
              className={`tab-item-container group flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all border border-transparent flex-shrink-0 ${
                activeTabId === tab.id
                  ? 'bg-blue-50 text-blue-600 border-blue-100'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <span className={`transition-colors ${activeTabId === tab.id ? 'text-blue-500' : 'text-slate-400'}`}>
                {tab.isLocked ? '🔒' : <TableIcon />}
              </span>
              <EditableText
                value={tab.name}
                onChange={(newName) => onRenameTab(tab.id, newName)}
                className={`text-xs min-w-[50px] text-center ${activeTabId === tab.id ? 'font-bold' : 'font-medium'}`}
                placeholder="페이지 이름"
              />
              <TabMenuItem 
                tab={tab}
                onDelete={onDeleteTab}
                onToggleLock={onToggleLockTab}
                canDelete={tabs.length > 1}
                isActive={activeTabId === tab.id}
              />
            </div>
            
            {index < tabs.length - 1 && (
              <div className="flex items-center">
                <ArrowIcon direction="right" />
                <ArrowIcon direction="left" />
              </div>
            )}
          </React.Fragment>
        ))}

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
