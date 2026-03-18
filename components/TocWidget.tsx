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

const TocWidget: React.FC<TocWidgetProps> = ({
  tabs,
  activeTabId,
  onNavigate,
  onNavigateAndFocus,
}) => {
  const [expandedTabIds, setExpandedTabIds] = useState<Set<string>>(
    new Set([activeTabId])
  );

  const toggleTab = (tabId: string) => {
    setExpandedTabIds(prev => {
      const next = new Set(prev);
      if (next.has(tabId)) next.delete(tabId);
      else next.add(tabId);
      return next;
    });
  };

  return (
    <div className="bg-white border-2 border-black shadow-sm flex flex-col h-full">
      {/* Header — same style as SectionCard */}
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
            const allSections: Array<{ section: Section; isInbox: boolean }> = [
              ...(tab.inboxSection
                ? [{ section: tab.inboxSection, isInbox: true }]
                : []),
              ...tab.sections.map(s => ({ section: s, isInbox: false })),
            ];
            const isActive = tab.id === activeTabId;

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
                    {allSections.length}
                  </span>
                </button>

                {/* Children — smooth max-height tree animation */}
                <div
                  style={{
                    maxHeight: isExpanded
                      ? `${allSections.length * 44 + 8}px`
                      : '0px',
                    overflow: 'hidden',
                    transition: 'max-height 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {allSections.length === 0 ? (
                    <div className="ml-4 pl-4 py-1.5 text-[10px] text-slate-400 italic border-l-2 border-slate-150">
                      섹션 없음
                    </div>
                  ) : (
                    <div className="ml-4 border-l-2 border-slate-200 mb-1">
                      {allSections.map(({ section, isInbox }, index) => {
                        const isLast = index === allSections.length - 1;

                        return (
                          <div
                            key={section.id}
                            className="relative flex items-center group pl-3 py-0.5"
                          >
                            {/* 수평 연결선 */}
                            <div className="absolute left-0 top-1/2 w-3 h-0.5 bg-slate-200 -translate-y-1/2 flex-shrink-0" />
                            {/* 마지막 항목 수직선 하단 절단 */}
                            {isLast && (
                              <div
                                className="absolute left-[-2px] bottom-0 w-0.5 bg-white"
                                style={{ top: '50%' }}
                              />
                            )}

                            {/* 섹션 버튼 */}
                            <button
                              onClick={() => onNavigate(tab.id, section.id)}
                              className="flex-1 text-left px-2 py-1 rounded border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center gap-1.5 min-w-0"
                              title={section.title}
                            >
                              <span className="text-xs grayscale">
                                {isInbox ? '📥' : '📋'}
                              </span>
                              <span className="text-[11px] font-medium text-slate-700 truncate flex-1">
                                {section.title}
                              </span>
                              {section.isLocked && (
                                <span className="scale-75 flex-shrink-0">
                                  <LockIcon />
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 flex-shrink-0">
                                {section.items.length}
                              </span>
                            </button>

                            {/* 🚀 포커스 버튼 */}
                            <button
                              onClick={() =>
                                onNavigateAndFocus(tab.id, section.id)
                              }
                              className="ml-1 p-1 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 text-xs"
                              title="이동 후 입력하기"
                            >
                              🚀
                            </button>
                          </div>
                        );
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
