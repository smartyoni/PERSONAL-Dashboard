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
  const [expandedTabIds, setExpandedTabIds] = useState<Set<string>>(
    new Set([activeTabId])
  );

  const mainTabId = tabs[0]?.id;

  const toggleTab = (tabId: string) => {
    setExpandedTabIds(prev => {
      const next = new Set(prev);
      if (next.has(tabId)) next.delete(tabId);
      else next.add(tabId);
      return next;
    });
  };

  const buildDisplaySections = (tab: Tab): DisplaySection[] => {
    const isMainTab = tab.id === mainTabId;
    const result: DisplaySection[] = [];

    if (isMainTab) {
      // 목차 섹션 자체
      result.push({
        isVirtual: true,
        virtual: { id: 'toc-section', title: '목차', emoji: '📊', itemCount: tabs.length, isVirtual: true },
      });
    }

    // 인박스
    if (tab.inboxSection) {
      result.push({ section: tab.inboxSection, isInbox: true, isVirtual: false });
    }

    if (isMainTab) {
      // 오늘/주차 위젯
      const parkingCount =
        (tab.parkingInfo.checklistItems?.length ?? 0) +
        (tab.parkingInfo.shoppingListItems?.length ?? 0) +
        (tab.parkingInfo.remindersItems?.length ?? 0) +
        (tab.parkingInfo.todoItems?.length ?? 0) +
        (tab.parkingInfo.category5Items?.length ?? 0);
      result.push({
        isVirtual: true,
        virtual: {
          id: 'parking-section',
          title: tab.parkingInfo.title || '오늘 할 일',
          emoji: '🚗',
          itemCount: parkingCount,
          isVirtual: true,
        },
      });

      // 할일관리 1
      const todo1Count =
        (tab.todoManagementInfo.category1Items?.length ?? 0) +
        (tab.todoManagementInfo.category2Items?.length ?? 0) +
        (tab.todoManagementInfo.category3Items?.length ?? 0) +
        (tab.todoManagementInfo.category4Items?.length ?? 0) +
        (tab.todoManagementInfo.category5Items?.length ?? 0);
      result.push({
        isVirtual: true,
        virtual: {
          id: 'todo-section-1',
          title: tab.todoManagementInfo.title || '할일관리',
          emoji: '📋',
          itemCount: todo1Count,
          isVirtual: true,
        },
      });

      // 할일관리 2
      const todo2Count =
        (tab.todoManagementInfo2?.category1Items?.length ?? 0) +
        (tab.todoManagementInfo2?.category2Items?.length ?? 0) +
        (tab.todoManagementInfo2?.category3Items?.length ?? 0) +
        (tab.todoManagementInfo2?.category4Items?.length ?? 0) +
        (tab.todoManagementInfo2?.category5Items?.length ?? 0);
      result.push({
        isVirtual: true,
        virtual: {
          id: 'todo-section-2',
          title: tab.todoManagementInfo2?.title || '할일관리2',
          emoji: '📋',
          itemCount: todo2Count,
          isVirtual: true,
        },
      });

      // 할일관리 3
      const todo3Count =
        (tab.todoManagementInfo3?.category1Items?.length ?? 0) +
        (tab.todoManagementInfo3?.category2Items?.length ?? 0) +
        (tab.todoManagementInfo3?.category3Items?.length ?? 0) +
        (tab.todoManagementInfo3?.category4Items?.length ?? 0) +
        (tab.todoManagementInfo3?.category5Items?.length ?? 0);
      result.push({
        isVirtual: true,
        virtual: {
          id: 'todo-section-3',
          title: tab.todoManagementInfo3?.title || '할일관리3',
          emoji: '📋',
          itemCount: todo3Count,
          isVirtual: true,
        },
      });
    }

    // 일반 섹션들
    for (const s of tab.sections) {
      result.push({ section: s, isInbox: false, isVirtual: false });
    }

    return result;
  };

  return (
    <div className="bg-white border-2 border-black shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 flex-shrink-0 px-3 h-[48px] border-b-2 border-black bg-indigo-50">
        <MapIcon />
        <span className="text-sm font-bold text-indigo-900">목차</span>
        <span className="ml-auto text-[10px] text-slate-400 font-normal">
          {tabs.length}개 탭
        </span>
      </div>

      {/* Tree body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {tabs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-xs italic">
            탭이 없습니다.
          </div>
        ) : (
          tabs.map(tab => {
            const isExpanded = expandedTabIds.has(tab.id);
            const isActive = tab.id === activeTabId;
            const displaySections = buildDisplaySections(tab);

            return (
              <div key={tab.id} className="mb-0.5">
                {/* Tab row */}
                <button
                  onClick={() => toggleTab(tab.id)}
                  className={`w-full text-left px-2 py-1.5 rounded-md mb-0.5 transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-indigo-50 border border-indigo-300'
                      : 'hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <ChevronIcon isExpanded={isExpanded} />
                  <span className="text-sm">📑</span>
                  <span
                    className={`text-xs font-semibold truncate flex-1 ${
                      isActive ? 'text-indigo-800' : 'text-slate-700'
                    }`}
                  >
                    {tab.name}
                  </span>
                  {tab.isLocked && (
                    <span className="scale-75 flex-shrink-0">
                      <LockIcon />
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 flex-shrink-0">
                    {displaySections.length}
                  </span>
                </button>

                {/* Children */}
                <div
                  style={{
                    maxHeight: isExpanded
                      ? `${displaySections.length * 44 + 8}px`
                      : '0px',
                    overflow: 'hidden',
                    transition: 'max-height 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {displaySections.length === 0 ? (
                    <div className="ml-4 pl-4 py-1.5 text-[10px] text-slate-400 italic border-l-2 border-slate-200">
                      섹션 없음
                    </div>
                  ) : (
                    <div className="ml-4 border-l-2 border-slate-200 mb-1">
                      {displaySections.map((item, index) => {
                        const isLast = index === displaySections.length - 1;

                        if (item.isVirtual) {
                          const v = item.virtual;
                          return (
                            <div key={v.id} className="relative flex items-center group pl-3 py-0.5">
                              <div className="absolute left-0 top-1/2 w-3 h-0.5 bg-slate-200 -translate-y-1/2" />
                              {isLast && (
                                <div className="absolute left-[-2px] bottom-0 w-0.5 bg-white" style={{ top: '50%' }} />
                              )}
                              <button
                                onClick={() => onNavigate(tab.id, v.id)}
                                className="flex-1 text-left px-2 py-1 rounded border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center gap-1.5 min-w-0"
                                title={v.title}
                              >
                                <span className="text-xs">{v.emoji}</span>
                                <span className="text-[11px] font-medium text-slate-500 truncate flex-1 italic">
                                  {v.title}
                                </span>
                                <span className="text-[10px] text-slate-400 flex-shrink-0">
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
                          );
                        } else {
                          // 일반 섹션
                          const { section, isInbox } = item as { section: Section; isInbox: boolean };
                          return (
                            <div key={section.id} className="relative flex items-center group pl-3 py-0.5">
                              <div className="absolute left-0 top-1/2 w-3 h-0.5 bg-slate-200 -translate-y-1/2" />
                              {isLast && (
                                <div className="absolute left-[-2px] bottom-0 w-0.5 bg-white" style={{ top: '50%' }} />
                              )}
                              <button
                                onClick={() => onNavigate(tab.id, section.id)}
                                className="flex-1 text-left px-2 py-1 rounded border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center gap-1.5 min-w-0"
                                title={section.title}
                              >
                                <span className="text-xs grayscale">{isInbox ? '📥' : '📋'}</span>
                                <span className="text-[11px] font-medium text-slate-700 truncate flex-1">
                                  {section.title}
                                </span>
                                {section.isLocked && (
                                  <span className="scale-75 flex-shrink-0"><LockIcon /></span>
                                )}
                                <span className="text-[10px] text-slate-400 flex-shrink-0">
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
