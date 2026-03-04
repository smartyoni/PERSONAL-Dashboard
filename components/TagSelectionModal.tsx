import React from 'react';
import { Tab, Section } from '../types';

interface TagSelectionModalProps {
    isOpen: boolean;
    tabs: Tab[];
    onClose: () => void;
    onNavigate: (sectionId: string, tabId: string) => void;
}

const TagSelectionModal: React.FC<TagSelectionModalProps> = ({
    isOpen,
    tabs,
    onClose,
    onNavigate
}) => {
    if (!isOpen) return null;

    // 모든 탭의 모든 섹션을 수집합니다.
    const allSections: { section: Section, tabName: string, tabId: string, type: 'inbox' | 'quotes' | 'general' }[] = [];

    tabs.forEach((tab, index) => {
        const isMainTab = index === 0;

        if (isMainTab && tab.inboxSection) {
            allSections.push({ section: tab.inboxSection, tabName: tab.name, tabId: tab.id, type: 'inbox' });
        }
        if (isMainTab && tab.quotesSection) {
            allSections.push({ section: tab.quotesSection, tabName: tab.name, tabId: tab.id, type: 'quotes' });
        }

        tab.sections.forEach(sec => {
            allSections.push({ section: sec, tabName: tab.name, tabId: tab.id, type: 'general' });
        });
    });

    return (
        <div
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
            onClick={onClose}
        >
            <div
                className="bg-white w-full md:max-w-[600px] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 h-[80vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Handle for dragging feel */}
                <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 mb-1" />

                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <span className="text-purple-500">🏷️</span> 태그(섹션) 이동
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar pb-10">
                    {/* 일반 탭 그룹별로 표시, 메인부터 먼저 */}
                    {tabs.map(tab => {
                        const tabSections = allSections.filter(s => s.tabId === tab.id);
                        if (tabSections.length === 0) return null;

                        return (
                            <div key={tab.id} className="space-y-2">
                                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-2 border-b border-slate-100 pb-1">
                                    {tab.name}
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {tabSections.map(({ section, type }) => (
                                        <button
                                            key={section.id}
                                            onClick={() => onNavigate(section.id, tab.id)}
                                            className="px-3 py-1.5 bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-700 text-sm font-medium rounded-full transition-colors border border-slate-200 hover:border-purple-300 flex items-center gap-1.5"
                                        >
                                            <span className="text-xs opacity-70">
                                                {type === 'inbox' ? '📥' : type === 'quotes' ? '📜' : '#'}
                                            </span>
                                            {section.title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default TagSelectionModal;
