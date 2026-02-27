
import React, { useState, useEffect } from 'react';
import { PlusIcon, ResetIcon, MapIcon } from './Icons';
import HeaderGoals from './HeaderGoals';

interface HeaderProps {
  onAddSection: () => void;
  onOpenNavigationMap: () => void;
  headerGoals?: {
    goal1: string;
    goal2: string;
  };
  onHeaderGoalsChange?: (goals: { goal1: string; goal2: string }) => void;
}

const Header: React.FC<HeaderProps> = ({
  onAddSection,
  onOpenNavigationMap,
  headerGoals,
  onHeaderGoalsChange
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
    <header className="w-full px-6 flex flex-col md:flex-row md:items-end justify-between gap-4 py-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          최영현 대시보드
        </h1>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-red-600 font-medium whitespace-nowrap text-sm">{dateTime}</p>

          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={onOpenNavigationMap}
              className="text-slate-900 hover:text-black p-1.5 rounded-lg transition-colors bg-white border border-slate-200 shadow-sm"
              title="전체 구조 보기"
            >
              <MapIcon />
            </button>

            <button
              onClick={onAddSection}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 border border-yellow-500 text-yellow-950 text-xs font-bold rounded-lg hover:bg-yellow-500 transition-all shadow-sm"
              title="섹션 추가"
            >
              <PlusIcon />
              <span className="hidden sm:inline">섹션추가</span>
            </button>
          </div>
        </div>
      </div>

      {headerGoals && onHeaderGoalsChange && (
        <div className="flex-1 hidden lg:flex items-end justify-end">
          <div className="w-[90%]">
            <HeaderGoals
              goal1={headerGoals.goal1}
              goal2={headerGoals.goal2}
              onGoal1Change={(value) => onHeaderGoalsChange({ ...headerGoals, goal1: value })}
              onGoal2Change={(value) => onHeaderGoalsChange({ ...headerGoals, goal2: value })}
            />
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
