
import React, { useState, useEffect } from 'react';
import { PlusIcon, MapIcon, InboxIcon } from './Icons';
import { ParkingInfo } from '../types';

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
  parkingInfo?: ParkingInfo;
  onParkingChange?: (newInfo: ParkingInfo) => void;
}

const Header: React.FC<HeaderProps> = ({
  onAddSection,
  onOpenNavigationMap,
  onNavigateToInbox,
  isBookmarkView,
  onToggleBookmarkView,
  parkingInfo,
  onParkingChange
}) => {
  const [dateTime, setDateTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      const dateStr = now.toLocaleDateString('ko-KR', dateOptions);
      const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
      const dayOfWeek = weekdays[now.getDay()];
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setDateTime(`${dateStr} (${dayOfWeek}) ${hours}:${minutes}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="w-full px-6 flex flex-col md:flex-row md:items-end justify-between gap-2 md:gap-4 pt-3 pb-4 md:py-6">
      <div className="flex-1">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mt-1">
          <div className="flex items-center gap-3">
            <p className="hidden md:block text-red-600 font-medium whitespace-nowrap text-xs sm:text-sm">{dateTime}</p>

            <div className="flex bg-slate-200/50 p-1 rounded-xl items-center gap-1 shadow-inner ml-1 sm:ml-2 md:inline-flex hidden">
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

          {/* 층수 선택 (주차 섹션에서 이동) */}
          {parkingInfo && onParkingChange && (
            <div className="flex gap-1 items-center bg-slate-100/50 p-1 rounded-xl shadow-inner md:ml-2">
              <div className="flex gap-0.5">
                {['B1', 'B2', 'B3', 'B4', 'B5'].map(floor => (
                  <button
                    key={floor}
                    onClick={() => onParkingChange({ ...parkingInfo, text: floor })}
                    className={`px-2 sm:px-3 h-7 sm:h-8 text-[10px] sm:text-xs font-black rounded-lg border transition-all ${parkingInfo.text === floor
                      ? 'bg-green-500 text-white border-green-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                      }`}
                  >
                    {floor}
                  </button>
                ))}
              </div>
              <input
                type="text"
                maxLength={12}
                placeholder="기타"
                value={['B1', 'B2', 'B3', 'B4', 'B5'].includes(parkingInfo.text) ? '' : parkingInfo.text}
                onChange={(e) => onParkingChange({ ...parkingInfo, text: e.target.value })}
                className={`w-36 sm:w-48 h-7 sm:h-8 px-2 text-[10px] sm:text-xs font-black rounded-lg border text-center transition-all focus:outline-none ${!['B1', 'B2', 'B3', 'B4', 'B5'].includes(parkingInfo.text) && parkingInfo.text !== ''
                  ? 'bg-green-50 border-green-500 ring-1 ring-green-500'
                  : 'bg-white border-slate-200 focus:border-slate-400'
                  }`}
              />
              <button
                onClick={onAddSection}
                className="md:hidden flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-indigo-600 text-white rounded-lg shadow-sm border border-indigo-700 active:scale-95 transition-all ml-1"
                title="섹션 추가"
              >
                <PlusIcon />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

