
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
          <p className="text-red-600 font-medium whitespace-nowrap text-sm">{dateTime}</p>

          <div className="flex items-center gap-2 ml-2">
            {onNavigateToInbox && (
              <button
                onClick={onNavigateToInbox}
                className="hidden md:flex items-center justify-center px-3 py-1.5 h-8 rounded-lg transition-colors bg-white border border-slate-200 shadow-sm text-slate-900 hover:text-black"
                title="인박스로 바로가기"
              >
                <InboxIcon />
              </button>
            )}
            {onToggleBookmarkView && (
              <button
                onClick={onToggleBookmarkView}
                className={`flex items-center justify-center px-3 py-1.5 h-8 rounded-lg transition-all border shadow-sm flex-shrink-0 text-xs font-bold ${isBookmarkView
                  ? 'bg-blue-500 text-white border-blue-600'
                  : 'bg-white text-slate-900 border-slate-200 hover:text-blue-600 hover:border-blue-200 hover:shadow-md'
                  }`}
                title="북마크 페이지"
              >
                북마크
              </button>
            )}
            <button
              onClick={onOpenNavigationMap}
              className="px-3 py-1.5 h-8 bg-emerald-500 border border-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 hover:shadow-md transition-all shadow-sm flex items-center justify-center font-bold"
              title="목차"
            >
              목차
            </button>

            <button
              onClick={onAddSection}
              className="flex items-center gap-1.5 px-3 py-1.5 h-8 bg-yellow-400 border border-yellow-500 text-yellow-950 text-xs font-bold rounded-lg hover:bg-yellow-500 transition-all shadow-sm"
              title="섹션 추가"
            >
              <PlusIcon />
              <span className="hidden sm:inline">섹션추가</span>
            </button>
          </div>
        </div>
      </div>


    </header>
  );
};

export default Header;
