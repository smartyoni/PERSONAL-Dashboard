import React, { useState, useEffect } from 'react';
import { Tab, Section } from '../types';
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

const NavigationMapModal: React.FC<NavigationMapModalProps & { onShowItemMemo: (tabId: string, sectionId: string, itemId: string) => void, onNavigateAndFocus: (tabId: string, sectionId: string) => void }> = ({
  isOpen,
  tabs,
  activeTabId,
  onClose,
  onNavigate,
  onShowItemMemo,
  onNavigateAndFocus
}) => {
  const [expandedTabIds, setExpandedTabIds] = useState<Set<string>>(new Set([activeTabId]));
  const [selectedSection, setSelectedSection] = useState<{ tabId: string, section: Section } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileActivePanel, setMobileActivePanel] = useState<'nav' | 'items'>('nav');

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      setExpandedTabIds(new Set([activeTabId]));
      setMobileActivePanel('nav');
      // Select first section of active tab by default
      const activeTab = tabs.find(t => t.id === activeTabId);
      if (activeTab) {
        if (activeTab.sections.length > 0) {
          setSelectedSection({ tabId: activeTab.id, section: activeTab.sections[0] });
        } else if (activeTab.inboxSection) {
          setSelectedSection({ tabId: activeTab.id, section: activeTab.inboxSection });
        }
      }
    }
  }, [isOpen, activeTabId, tabs]);

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
      } else {
        newSet.add(tabId);
      }
      return newSet;
    });
  };

  const handleSectionSelect = (tabId: string, section: Section) => {
    setSelectedSection({ tabId, section });
    // On mobile, auto-switch to items panel when a section is selected
    if (isMobile) {
      setMobileActivePanel('items');
    }
  };

  // --- Shared sub-components ---

  const renderLeftPanel = () => (
    <div className={`${isMobile ? 'flex-1' : 'w-1/2 border-r border-slate-200'} overflow-y-auto custom-scrollbar p-4 sm:p-6 bg-white`}>
      {tabs.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="italic">탭이 없습니다.</p>
        </div>
      ) : (
        tabs.map((tab) => (
          <div key={tab.id} className="mb-px">
            {/* Tab Row - Accordion Header */}
            <button
              onClick={() => toggleTab(tab.id)}
              className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-all ${tab.id === activeTabId
                ? 'bg-blue-50 border-2 border-blue-400'
                : 'hover:bg-slate-100 border border-slate-300'
                }`}
            >
              <div className="flex items-center gap-2">
                <ChevronIcon isExpanded={expandedTabIds.has(tab.id)} />
                <span className="text-lg">📑</span>
                <span className="font-semibold text-slate-800">{tab.name}</span>
                {tab.isLocked && <LockIcon />}
                <span className="text-xs text-slate-400 ml-auto font-normal">
                  {getSectionCount(tab)}개 섹션
                </span>
              </div>
            </button>

            {/* Sections Container - Accordion Content */}
            {expandedTabIds.has(tab.id) && (
              <div className="pl-4 sm:pl-6 space-y-px">
                {/* IN-BOX 섹션 (고정) */}
                {tab.inboxSection && (
                  <div className="flex items-center group">
                    <button
                      onClick={() => handleSectionSelect(tab.id, tab.inboxSection!)}
                      className={`flex-1 text-left px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 ${selectedSection?.section.id === tab.inboxSection.id
                        ? 'bg-blue-100 border-blue-300'
                        : 'hover:bg-slate-50 border-slate-200'
                        }`}
                    >
                      <span className="text-sm grayscale transition-all">📥</span>
                      <span className={`text-sm font-medium ${selectedSection?.section.id === tab.inboxSection.id ? 'text-blue-800' : 'text-slate-700'}`}>
                        {tab.inboxSection.title}
                      </span>
                      {tab.inboxSection.isLocked && <div className="scale-75"><LockIcon /></div>}
                      <span className="text-[11px] text-slate-400 ml-auto font-normal">
                        {tab.inboxSection.items.length}개 항목
                      </span>
                    </button>
                    <button
                      onClick={() => onNavigateAndFocus(tab.id, tab.inboxSection!.id)}
                      className={`ml-2 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      title="이 섹션으로 이동 후 입력하기"
                    >
                      🚀
                    </button>
                  </div>
                )}

                {/* 일반 섹션들 */}
                {tab.sections.length === 0 && !tab.inboxSection ? (
                  <div className="pl-10 py-2 text-xs text-slate-400 italic">
                    추가 섹션이 없습니다
                  </div>
                ) : (
                  tab.sections.map((section) => (
                    <div key={section.id} className="flex items-center group">
                      <button
                        onClick={() => handleSectionSelect(tab.id, section)}
                        className={`flex-1 text-left px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 ${selectedSection?.section.id === section.id
                          ? 'bg-blue-100 border-blue-300'
                          : 'hover:bg-slate-50 border-slate-200'
                          }`}
                      >
                        <span className="text-sm grayscale transition-all">📋</span>
                        <span className={`text-sm font-medium ${selectedSection?.section.id === section.id ? 'text-blue-800' : 'text-slate-700'}`}>
                          {section.title}
                        </span>
                        {section.isLocked && <div className="scale-75"><LockIcon /></div>}
                        <span className="text-[11px] text-slate-400 ml-auto font-normal">
                          {section.items.length}개 항목
                        </span>
                      </button>
                      <button
                        onClick={() => onNavigateAndFocus(tab.id, section.id)}
                        className={`ml-2 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        title="이 섹션으로 이동 후 입력하기"
                      >
                        🚀
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  const renderRightPanel = () => (
    <div className={`${isMobile ? 'flex-1' : 'w-1/2'} bg-slate-50 p-4 sm:p-6 overflow-y-auto custom-scrollbar`}>
      {selectedSection ? (
        <div className="h-full flex flex-col">
          <div className="flex items-center mb-4 pb-3 border-b border-slate-200">
            <h3
              onClick={() => onNavigateAndFocus(selectedSection.tabId, selectedSection.section.id)}
              className="text-lg sm:text-xl font-bold text-slate-800 break-all min-w-0 cursor-pointer hover:text-blue-600 transition-colors"
              title="클릭하면 이 섹션으로 이동합니다"
            >
              🚀 {selectedSection.section.title} 항목
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {selectedSection.section.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 italic">
                등록된 체크리스트 항목이 없습니다.
              </div>
            ) : (
              <div className="space-y-1.5">
                {selectedSection.section.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => onShowItemMemo(selectedSection.tabId, selectedSection.section.id, item.id)}
                    className="w-full text-left bg-white px-4 py-3 border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition-all flex items-start gap-3 group"
                  >
                    <div className="h-5 flex items-center justify-center flex-shrink-0 w-5">
                      <span className="text-3xl leading-none text-red-400">•</span>
                    </div>
                    <span className="text-sm flex-1 break-all text-slate-700 group-hover:text-blue-700">
                      {item.text}
                    </span>
                    <span className="text-[10px] text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pt-1">
                      메모 보기
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-slate-400">
          <p className="italic">항목을 볼 섹션을 선택해주세요.</p>
        </div>
      )}
    </div>
  );

  // --- Mobile Layout ---
  if (isMobile) {
    return (
      <div
        className="fixed inset-0 z-[250] flex flex-col bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Header */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <MapIcon />
            <h2 className="text-lg font-bold text-slate-800">목차</h2>
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

        {/* Mobile Tab Bar */}
        <div className="flex border-b border-slate-200 bg-white flex-shrink-0">
          <button
            onClick={() => setMobileActivePanel('nav')}
            className={`flex-1 py-3 text-sm font-semibold text-center transition-all relative ${mobileActivePanel === 'nav'
              ? 'text-blue-600'
              : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <span>📑</span>
              <span>탭 · 섹션</span>
            </div>
            {mobileActivePanel === 'nav' && (
              <div className="absolute bottom-0 left-4 right-4 h-[3px] bg-blue-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setMobileActivePanel('items')}
            className={`flex-1 py-3 text-sm font-semibold text-center transition-all relative ${mobileActivePanel === 'items'
              ? 'text-blue-600'
              : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <span>📋</span>
              <span>
                {selectedSection ? selectedSection.section.title : '항목 목록'}
              </span>
            </div>
            {mobileActivePanel === 'items' && (
              <div className="absolute bottom-0 left-4 right-4 h-[3px] bg-blue-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {mobileActivePanel === 'nav' ? renderLeftPanel() : renderRightPanel()}
        </div>

        {/* Mobile Footer */}
        <div className="px-4 py-2.5 border-t border-slate-200 bg-white flex-shrink-0 text-xs text-slate-500 text-center">
          전체 {tabs.length}개 탭, {getTotalSections()}개 섹션, {getTotalItems()}개 항목
        </div>
      </div>
    );
  }

  // --- Desktop Layout (unchanged) ---
  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-6xl max-h-[85vh] h-[85vh] rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <MapIcon />
            <h2 className="text-lg font-bold text-slate-800">목차</h2>
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

        {/* Content - 2 Columns */}
        <div className="flex-1 flex overflow-hidden">
          {renderLeftPanel()}
          {renderRightPanel()}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex-shrink-0 text-xs text-slate-500 text-center">
          전체 {tabs.length}개 탭, {getTotalSections()}개 섹션, {getTotalItems()}개 항목
        </div>
      </div>
    </div>
  );
};

export default NavigationMapModal;
