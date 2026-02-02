import React from 'react';
import { Tab } from '../types';
import { MapIcon, LockIcon } from './Icons';

interface NavigationMapModalProps {
  isOpen: boolean;
  tabs: Tab[];
  activeTabId: string;
  onClose: () => void;
  onNavigate: (tabId: string, sectionId?: string) => void;
}

const NavigationMapModal: React.FC<NavigationMapModalProps> = ({
  isOpen,
  tabs,
  activeTabId,
  onClose,
  onNavigate
}) => {
  if (!isOpen) return null;

  // Helper functions
  const getSectionCount = (tab: Tab) => tab.sections.length + 1; // +1: inboxSection
  const getItemCount = (tab: Tab) =>
    tab.sections.reduce((sum, s) => sum + s.items.length, 0) +
    (tab.inboxSection?.items.length || 0);
  const getTotalSections = () =>
    tabs.reduce((sum, t) => sum + t.sections.length + 1, 0); // +1: inboxSection
  const getTotalItems = () =>
    tabs.reduce((sum, t) => sum + getItemCount(t), 0);

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
                {/* Tab Row */}
                <button
                  onClick={() => onNavigate(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-all ${
                    tab.id === activeTabId
                      ? 'bg-blue-50 border-2 border-blue-400 font-bold'
                      : 'hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📑</span>
                    <span className="font-semibold text-slate-800">{tab.name}</span>
                    {tab.isLocked && <LockIcon />}
                    <span className="text-xs text-slate-400 ml-auto">
                      {getSectionCount(tab)}개 섹션, {getItemCount(tab)}개 항목
                    </span>
                  </div>
                </button>

                {/* Sections */}
                {/* IN-BOX 섹션 (고정) */}
                {tab.inboxSection && (
                  <div className="mb-2">
                    <button
                      onClick={() => onNavigate(tab.id, tab.inboxSection.id)}
                      className="w-full text-left pl-6 px-4 py-2 rounded-lg hover:bg-slate-100 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">📥</span>
                        <span className="text-sm font-medium text-slate-700">
                          {tab.inboxSection.title}
                        </span>
                        {tab.inboxSection.isLocked && <div className="scale-75"><LockIcon /></div>}
                        <span className="text-xs text-slate-400 ml-auto">
                          {tab.inboxSection.items.length}개 항목
                        </span>
                      </div>
                    </button>
                  </div>
                )}

                {/* 일반 섹션들 */}
                {tab.sections.length === 0 ? (
                  <div className="pl-6 py-2 text-xs text-slate-400 italic">
                    추가 섹션이 없습니다
                  </div>
                ) : (
                  tab.sections.map((section) => (
                    <div key={section.id} className="mb-2">
                      {/* Section Row */}
                      <button
                        onClick={() => onNavigate(tab.id, section.id)}
                        className="w-full text-left pl-6 px-4 py-2 rounded-lg hover:bg-slate-100 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">📋</span>
                          <span className="text-sm font-medium text-slate-700">
                            {section.title}
                          </span>
                          {section.isLocked && <div className="scale-75"><LockIcon /></div>}
                          <span className="text-xs text-slate-400 ml-auto">
                            {section.items.length}개 항목
                          </span>
                        </div>
                      </button>
                    </div>
                  ))
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
