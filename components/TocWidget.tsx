import React, { useState } from 'react';
import { Tab, Section } from '../types';
import { LockIcon, MapIcon } from './Icons';

interface TocWidgetProps {
  tabs: Tab[];
  activeTabId: string;
  onNavigate: (tabId: string, sectionId: string) => void;
  onNavigateAndFocus: (tabId: string, sectionId: string) => void;
}

const ChevronIcon: React.FC<{ isExpanded: boolean }> = ({ isExpanded }) => (
  <span
    className="text-slate-400 font-bold transition-transform duration-200 inline-block text-[10px] flex-shrink-0"
    style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
  >
    ▶
  </span>
);

/** 가상 섹션 항목 (메인탭 고정 위젯용) */
interface VirtualSection {
  id: string;        // data-section-id 값 (스크롤 타겟)
  title: string;
  emoji: string;
  itemCount: number;
  isVirtual: true;
  categories?: string[]; // 추가: 하위 항목박스 타이틀
}

type DisplaySection =
  | { section: Section; isInbox: boolean; isVirtual: false }
  | { virtual: VirtualSection; isVirtual: true };

const TocWidget: React.FC<TocWidgetProps> = ({
  tabs,
  activeTabId,
  onNavigate,
  onNavigateAndFocus,
}) => {
  const [expandedTabId, setExpandedTabId] = useState<string | null>(null);

  const mainTabId = tabs[0]?.id;

  const toggleTab = (tabId: string) => {
    setExpandedTabId(prev => (prev === tabId ? null : tabId));
  };

  const buildDisplaySections = (tab: Tab): DisplaySection[] => {
    const isMainTab = tab.id === mainTabId;
    const isSubTab = tab.name === '업무게시판' || tab.name === '개인게시판' || tab.id === tabs[1]?.id; // MainContent와 동일한 로직 
    const isDailyTab = tab.name === '일일게시판';
    const isSpecialTab = isMainTab || isSubTab || isDailyTab;

    const result: DisplaySection[] = [];

    if (isMainTab) {
      // 목차 섹션 자체
      result.push({
        isVirtual: true,
        virtual: { id: 'toc-section', title: '목차', emoji: '📊', itemCount: tabs.length, isVirtual: true },
      });
    }

    // 1. 할일관리 1 (메인탭 또는 특수탭 공통)
    if (isSpecialTab) {
      const todo1Count =
        (tab.todoManagementInfo.category1Items?.length ?? 0) +
        (tab.todoManagementInfo.category2Items?.length ?? 0) +
        (tab.todoManagementInfo.category3Items?.length ?? 0) +
        (tab.todoManagementInfo.category4Items?.length ?? 0) +
        (tab.todoManagementInfo.category5Items?.length ?? 0);
      
      const categories: string[] = [];
      if (tab.todoManagementInfo.category1Title) categories.push(tab.todoManagementInfo.category1Title);
      if (tab.todoManagementInfo.category2Title) categories.push(tab.todoManagementInfo.category2Title);
      if (tab.todoManagementInfo.category3Title) categories.push(tab.todoManagementInfo.category3Title);

      result.push({
        isVirtual: true,
        virtual: {
          id: (isSubTab || isDailyTab) ? 'sub-todo-widget-1' : 'todo-widget-1',
          title: tab.todoManagementInfo.title || '업무 1',
          emoji: '📋',
          itemCount: todo1Count,
          isVirtual: true,
          categories,
        },
      });
    }

    // 2. 할일관리 2 (서브탭 전 전용 - 컬럼 2)
    if (isSubTab) {
      const todo2Count =
        (tab.todoManagementInfo2.category1Items?.length ?? 0) +
        (tab.todoManagementInfo2.category2Items?.length ?? 0) +
        (tab.todoManagementInfo2.category3Items?.length ?? 0) +
        (tab.todoManagementInfo2.category4Items?.length ?? 0) +
        (tab.todoManagementInfo2.category5Items?.length ?? 0);
      
      const categories2: string[] = [];
      if (tab.todoManagementInfo2.category1Title) categories2.push(tab.todoManagementInfo2.category1Title);
      if (tab.todoManagementInfo2.category2Title) categories2.push(tab.todoManagementInfo2.category2Title);
      if (tab.todoManagementInfo2.category3Title) categories2.push(tab.todoManagementInfo2.category3Title);

      result.push({
        isVirtual: true,
        virtual: {
          id: 'sub-todo-widget-2',
          title: tab.todoManagementInfo2.title || '업무 2',
          emoji: '📋',
          itemCount: todo2Count,
          isVirtual: true,
          categories: categories2,
        },
      });
    }

    // 3. 인박스 (컬럼 3 - 공통)
    if (tab.inboxSection) {
      result.push({ section: tab.inboxSection, isInbox: true, isVirtual: false });
    }

    // 기타 일반 섹션들 (목록 하단)
    for (const s of tab.sections) {
      result.push({ section: s, isInbox: false, isVirtual: false });
    }

    return result;
  };

  return (
    <div className="bg-white border-2 border-black flex flex-col h-full font-serif overflow-hidden shadow-sm rounded-2xl">
      {/* Header */}
      <div className="flex items-center gap-2 flex-shrink-0 px-4 h-[48px] border-b-2 border-black bg-white">
        <MapIcon />
        <span className="text-[17px] font-black text-slate-800">전체목차</span>
        <span className="ml-auto text-[10px] text-slate-400 font-normal opacity-70">
          INDEX
        </span>
      </div>

      {/* Tree body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
        {tabs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-xs italic">
            탭이 없습니다.
          </div>
        ) : (
          tabs.map(tab => {
            const isExpanded = expandedTabId === tab.id;
            const isActive = tab.id === activeTabId;
            const displaySections = buildDisplaySections(tab);

            return (
              <div key={tab.id} className="border-b border-slate-50 last:border-b-0">
                {/* Tab row */}
                <button
                  onClick={() => toggleTab(tab.id)}
                  className={`w-full text-left px-3 py-3 transition-all flex items-center gap-2.5 ${
                    isActive
                      ? 'bg-slate-50'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <ChevronIcon isExpanded={isExpanded} />
                  <span className="text-[11px] font-serif font-black italic text-slate-400 flex-shrink-0 w-8">
                    {(tabs.indexOf(tab) + 1).toString().padStart(2, '0')}.
                  </span>
                  <span
                    className={`text-[15px] font-black truncate flex-1 ${
                      isActive ? 'text-slate-800' : 'text-slate-700'
                    }`}
                  >
                    {tab.name}
                  </span>
                  {tab.isLocked && (
                    <span className="scale-75 flex-shrink-0">
                      <LockIcon />
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400 flex-shrink-0">
                    {displaySections.length}
                  </span>
                </button>

                {/* Children */}
                <div
                  style={{
                    maxHeight: isExpanded
                      ? `2000px`
                      : '0px',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease-in-out',
                  }}
                  className="bg-white"
                >
                  {displaySections.length === 0 ? (
                    <div className="px-8 py-3 text-[11px] text-slate-300 italic">
                      섹션 없음
                    </div>
                  ) : (
                    <div className="mb-1">
                      {displaySections.map((item, sIndex) => {
                        const displayNumber = `${(tabs.indexOf(tab) + 1).toString().padStart(2, '0')}.${(sIndex + 1).toString().padStart(2, '0')}`;

                        if (item.isVirtual) {
                          const v = item.virtual;
                          return (
                            <div key={v.id} className="border-b border-slate-50 last:border-b-0">
                              <div className="relative flex items-center group pl-8 py-0.5">
                                <button
                                  onClick={() => onNavigate(tab.id, v.id)}
                                  className="flex-1 text-left px-2 py-1.5 hover:bg-slate-50 transition-all flex items-center gap-2 min-w-0"
                                  title={v.title}
                                >
                                  <span className="text-[10px] font-serif italic text-slate-300 flex-shrink-0 w-10">
                                    {displayNumber}
                                  </span>
                                  <span className="text-[14px] font-bold text-orange-700 truncate flex-1 italic opacity-95">
                                    {v.title}
                                  </span>
                                  <span className="text-[10px] text-slate-300 flex-shrink-0">
                                    {v.itemCount}
                                  </span>
                                </button>
                                <button
                                  onClick={() => onNavigateAndFocus(tab.id, v.id)}
                                  className="ml-1 p-1 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 text-xs"
                                  title="이동 후 입력하기"
                                >
                                  🚀
                                </button>
                              </div>

                              {/* 추가: 하위 항목박스(카테고리) 표시 */}
                              {v.categories && v.categories.length > 0 && (
                                <div className="pb-1">
                                  {v.categories.map((catTitle, cIndex) => (
                                    <button
                                      key={`${v.id}-cat-${cIndex}`}
                                      onClick={() => onNavigate(tab.id, v.id)}
                                      className="w-full text-left pl-14 py-1 pr-4 hover:bg-slate-50 transition-all flex items-center gap-2 group/cat"
                                    >
                                      <span className="text-[9px] font-serif italic text-slate-300 flex-shrink-0 w-6">
                                        L{cIndex + 1}
                                      </span>
                                      <span className="text-[13px] font-bold text-emerald-700 truncate flex-1 hover:text-emerald-900 transition-colors">
                                        {catTitle}
                                      </span>
                                      <span className="text-[10px] opacity-0 group-hover/cat:opacity-100 text-slate-300 transform transition-transform group-hover/cat:translate-x-1">
                                        →
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        } else {
                          // 일반 섹션
                          const { section } = item as { section: Section; isInbox: boolean };
                          return (
                            <div key={section.id} className="relative flex items-center group pl-8 py-0.5 border-b border-slate-50 last:border-b-0">
                              <button
                                onClick={() => onNavigate(tab.id, section.id)}
                                className="flex-1 text-left px-2 py-1.5 hover:bg-slate-50 transition-all flex items-center gap-2 min-w-0"
                                title={section.title}
                              >
                                <span className="text-[10px] font-serif italic text-slate-300 flex-shrink-0 w-10">
                                  {displayNumber}
                                </span>
                                <span className="text-[14px] font-bold text-orange-700 truncate flex-1">
                                  {section.title}
                                </span>
                                {section.isLocked && (
                                  <span className="scale-75 flex-shrink-0 opacity-50"><LockIcon /></span>
                                )}
                                <span className="text-[10px] text-slate-300 flex-shrink-0">
                                  {section.items.length}
                                </span>
                              </button>
                              <button
                                onClick={() => onNavigateAndFocus(tab.id, section.id)}
                                className="ml-1 p-1 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 text-xs"
                                title="이동 후 입력하기"
                              >
                                🚀
                              </button>
                            </div>
                          );
                        }
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TocWidget;
