import React from 'react';
import { Tab, Section } from '../types';

interface TagSelectionModalProps {
    isOpen: boolean;
    tabs: Tab[];
    onClose: () => void;
    onNavigate: (sectionId: string, tabId: string) => void;
    context?: { itemId: string; sourceTabId: string; sourceSectionId: string; itemText: string } | null;
}

const TagSelectionModal: React.FC<TagSelectionModalProps> = ({
    isOpen,
    tabs,
    onClose,
    onNavigate,
    context = null
}) => {
    if (!isOpen) return null;

    // 모든 탭의 모든 섹션을 수집합니다.
    const allSections: { section: { id: string, title: string }, tabName: string, tabId: string, type: 'inbox' | 'general' | 'special' }[] = [];

    tabs.forEach((tab, index) => {
        const isMainTab = index === 0;

        if (isMainTab && tab.inboxSection) {
            allSections.push({ section: tab.inboxSection, tabName: tab.name, tabId: tab.id, type: 'inbox' });
        }

        tab.sections.forEach(sec => {
            allSections.push({ section: sec, tabName: tab.name, tabId: tab.id, type: 'general' });
        });

    });

    return (
        <div
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
            onClick={onClose}
        >
            <div
                className="bg-white w-full md:max-w-[600px] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 h-[80vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Handle for dragging feel */}
                <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 mb-1" />

                {/* Header and Placeholder removed as requested */}

                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 wide-scrollbar pb-10">
                    {/* 일반 탭 그룹별로 표시, 메인부터 먼저 */}
                    {tabs.map(tab => {
                        const tabSections = allSections.filter(s => s.tabId === tab.id);
                        if (tabSections.length === 0) return null;

                        return (
                            <div key={tab.id} className="space-y-2">
                                <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider pl-2 border-b border-slate-100 pb-1">
                                    {tab.name}
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {tabSections.map(({ section, type }) => {
                                        const isCurrent = context?.sourceSectionId === section.id && context?.sourceTabId === tab.id;
                                        return (
                                            <button
                                                key={section.id}
                                                onClick={() => onNavigate(section.id, tab.id)}
                                                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors border flex items-center gap-1.5 ${
                                                    isCurrent 
                                                    ? 'bg-purple-600 text-white border-purple-700 shadow-md ring-2 ring-purple-300' 
                                                    : 'bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-700 border-slate-200 hover:border-purple-300'
                                                }`}
                                            >
                                                <span className="text-xs opacity-70">
                                                    {isCurrent ? '📍' : (type === 'inbox' ? '📥' : '#')}
                                                </span>
                                                {section.title}
                                            </button>
                                        );
                                    })}
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
