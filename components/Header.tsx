
import React, { useState, useEffect } from 'react';
import { PlusIcon, ResetIcon, MapIcon, InboxIcon } from './Icons';

interface HeaderProps {
  onAddSection: () => void;
  onOpenNavigationMap: () => void;
  onNavigateToInbox?: () => void;
  isBookmarkView?: boolean;
  onToggleBookmarkView?: () => void;
  headerGoals?: {
    goal1: string;
    goal2: string;
  };
  onHeaderGoalsChange?: (goals: { goal1: string; goal2: string }) => void;
}

const Header: React.FC<HeaderProps> = ({
  onAddSection,
  onOpenNavigationMap,
  onNavigateToInbox,
  isBookmarkView,
  onToggleBookmarkView
}) => {
  const [dateTime, setDateTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      };
      const dateStr = now.toLocaleDateString('ko-KR', dateOptions);
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setDateTime(`${dateStr} ${hours}:${minutes}:${seconds}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="w-full px-6 flex flex-col md:flex-row md:items-end justify-between gap-2 md:gap-4 pt-3 pb-4 md:py-6">
      <div>

        <div className="flex items-center gap-3 mt-1">
          <p className="text-red-600 font-medium whitespace-nowrap text-xs sm:text-sm">{dateTime}</p>

          <div className="flex bg-slate-200/50 p-1 rounded-xl items-center gap-1 shadow-inner ml-1 sm:ml-2">
            {onNavigateToInbox && (
              <button
                onClick={onNavigateToInbox}
                className="flex items-center justify-center w-9 h-8 sm:w-10 sm:h-9 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-all shadow-sm border border-slate-200"
                title="인박스"
              >
                <InboxIcon />
              </button>
            )}
            {onToggleBookmarkView && (
              <button
                onClick={onToggleBookmarkView}
                className={`flex items-center justify-center px-2.5 sm:px-3 h-8 sm:h-9 rounded-lg transition-all text-[10px] sm:text-xs font-bold border shadow-sm ${isBookmarkView
                  ? 'bg-blue-500 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                title="북마크"
              >
                북마크
              </button>
            )}
            <button
              onClick={onOpenNavigationMap}
              className="px-2.5 sm:px-3 h-8 sm:h-9 bg-white hover:bg-slate-50 text-slate-700 text-[10px] sm:text-xs font-bold rounded-lg border border-slate-200 transition-all shadow-sm flex items-center justify-center"
              title="목차"
            >
              목차
            </button>

            <button
              onClick={onAddSection}
              className="flex items-center gap-1 px-2.5 sm:px-3 h-8 sm:h-9 bg-white hover:bg-slate-50 text-slate-700 text-[10px] sm:text-xs font-bold rounded-lg border border-slate-200 transition-all shadow-sm"
              title="섹션 추가"
            >
              <PlusIcon />
              <span className="hidden xs:inline">섹션추가</span>
            </button>
          </div>
        </div>
      </div>


    </header>
  );
};

export default Header;
