import React, { useState, useEffect } from 'react';
import { Tab } from '../types';
import { MapIcon, LockIcon } from './Icons';

interface NavigationMapModalProps {
  isOpen: boolean;
  tabs: Tab[];
  activeTabId: string;
  onClose: () => void;
  onNavigate: (tabId: string, sectionId?: string) => void;
}

const ChevronIcon: React.FC<{ isExpanded: boolean }> = ({ isExpanded }) => (
  <span
    className="text-slate-500 font-bold transition-transform duration-200 inline-block text-xs flex-shrink-0"
    style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
  >
    ▶
  </span>
);

const NavigationMapModal: React.FC<NavigationMapModalProps> = ({
  isOpen,
  tabs,
  activeTabId,
  onClose,
  onNavigate
}) => {
  const [expandedTabIds, setExpandedTabIds] = useState<Set<string>>(new Set([activeTabId]));
  const [expandedSectionIds, setExpandedSectionIds] = useState<Set<string>>(new Set());

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      setExpandedTabIds(new Set([activeTabId]));
      setExpandedSectionIds(new Set());
    }
  }, [isOpen, activeTabId]);

  if (!isOpen) return null;

  // Helper functions
  const getSectionCount = (tab: Tab) => tab.sections.length + (tab.inboxSection ? 1 : 0);
  const getItemCount = (tab: Tab) =>
    tab.sections.reduce((sum, s) => sum + s.items.length, 0) +
    (tab.inboxSection?.items.length || 0);
  const getTotalSections = () =>
    tabs.reduce((sum, t) => sum + getSectionCount(t), 0);
  const getTotalItems = () =>
    tabs.reduce((sum, t) => sum + getItemCount(t), 0);

  // Toggle handlers
  const toggleTab = (tabId: string) => {
    setExpandedTabIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tabId)) {
        newSet.delete(tabId);
        // When collapsing a tab, also collapse all its sections
        const tab = tabs.find(t => t.id === tabId);
        if (tab) {
          setExpandedSectionIds(prevSections => {
            const newSections = new Set(prevSections);
            if (tab.inboxSection) {
              newSections.delete(tab.inboxSection.id);
            }
            tab.sections.forEach(s => newSections.delete(s.id));
            return newSections;
          });
        }
      } else {
        newSet.add(tabId);
      }
      return newSet;
    });
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSectionIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleItemClick = (tabId: string, sectionId: string) => {
    onNavigate(tabId, sectionId);
  };

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-4xl max-h-[80vh] rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <MapIcon />
            <h2 className="text-lg font-bold text-slate-800">전체 구조 보기</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg transition-colors"
            title="닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {tabs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="italic">탭이 없습니다.</p>
            </div>
          ) : (
            tabs.map((tab) => (
              <div key={tab.id} className="mb-4">
                {/* Tab Row - Accordion Header */}
                <button
                  onClick={() => toggleTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-all ${
                    tab.id === activeTabId
                      ? 'bg-blue-50 border-2 border-blue-400'
                      : 'hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ChevronIcon isExpanded={expandedTabIds.has(tab.id)} />
                    <span className="text-lg">📑</span>
                    <span className="font-semibold text-slate-800">{tab.name}</span>
                    {tab.isLocked && <LockIcon />}
                    <span className="text-xs text-slate-400 ml-auto">
                      {getSectionCount(tab)}개 섹션, {getItemCount(tab)}개 항목
                    </span>
                  </div>
                </button>

                {/* Sections Container - Accordion Content */}
                {expandedTabIds.has(tab.id) && (
                  <div className="pl-6 space-y-2">
                    {/* IN-BOX 섹션 (고정) */}
                    {tab.inboxSection && (
                      <div>
                        <button
                          onClick={() => toggleSection(tab.inboxSection!.id)}
                          className="w-full text-left px-4 py-2 rounded-lg hover:bg-slate-100 transition-all flex items-center gap-2"
                        >
                          <ChevronIcon isExpanded={expandedSectionIds.has(tab.inboxSection.id)} />
                          <span className="text-base">📥</span>
                          <span className="text-sm font-medium text-slate-700">
                            {tab.inboxSection.title}
                          </span>
                          {tab.inboxSection.isLocked && <div className="scale-75"><LockIcon /></div>}
                          <span className="text-xs text-slate-400 ml-auto">
                            {tab.inboxSection.items.length}개 항목
                          </span>
                        </button>

                        {/* IN-BOX Items */}
                        {expandedSectionIds.has(tab.inboxSection.id) && (
                          <div className="pl-8 space-y-1 mt-1">
                            {tab.inboxSection.items.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => handleItemClick(tab.id, tab.inboxSection!.id)}
                                className="w-full text-left px-3 py-1.5 rounded hover:bg-blue-50 transition-all text-xs text-slate-600 hover:text-slate-800 flex items-center gap-2"
                              >
                                <span className="flex-shrink-0">
                                  {item.completed ? '☑' : '☐'}
                                </span>
                                <span className={`truncate ${item.completed ? 'line-through text-slate-400' : ''}`}>
                                  {item.text || '(빈 항목)'}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 일반 섹션들 */}
                    {tab.sections.length === 0 && !tab.inboxSection ? (
                      <div className="pl-10 py-2 text-xs text-slate-400 italic">
                        추가 섹션이 없습니다
                      </div>
                    ) : (
                      tab.sections.map((section) => (
                        <div key={section.id}>
                          {/* Section Row - Accordion Header */}
                          <button
                            onClick={() => toggleSection(section.id)}
                            className="w-full text-left px-4 py-2 rounded-lg hover:bg-slate-100 transition-all flex items-center gap-2"
                          >
                            <ChevronIcon isExpanded={expandedSectionIds.has(section.id)} />
                            <span className="text-base">📋</span>
                            <span className="text-sm font-medium text-slate-700">
                              {section.title}
                            </span>
                            {section.isLocked && <div className="scale-75"><LockIcon /></div>}
                            <span className="text-xs text-slate-400 ml-auto">
                              {section.items.length}개 항목
                            </span>
                          </button>

                          {/* Section Items - Accordion Content */}
                          {expandedSectionIds.has(section.id) && (
                            <div className="pl-8 space-y-1 mt-1">
                              {section.items.map((item) => (
                                <button
                                  key={item.id}
                                  onClick={() => handleItemClick(tab.id, section.id)}
                                  className="w-full text-left px-3 py-1.5 rounded hover:bg-blue-50 transition-all text-xs text-slate-600 hover:text-slate-800 flex items-center gap-2"
                                >
                                  <span className="flex-shrink-0">
                                    {item.completed ? '☑' : '☐'}
                                  </span>
                                  <span className={`truncate ${item.completed ? 'line-through text-slate-400' : ''}`}>
                                    {item.text || '(빈 항목)'}
                                  </span>
                                </button>
                              ))}
                              {section.items.length === 0 && (
                                <div className="pl-3 py-1.5 text-xs text-slate-400 italic">
                                  항목이 없습니다
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 text-center">
          전체 {tabs.length}개 탭, {getTotalSections()}개 섹션, {getTotalItems()}개 항목
        </div>
      </div>
    </div>
  );
};

export default NavigationMapModal;
