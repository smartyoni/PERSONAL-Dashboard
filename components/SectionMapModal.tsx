import React from 'react';
import { Tab, Section } from '../types';
import { LockIcon } from './Icons';

interface SectionMapModalProps {
    isOpen: boolean;
    activeTab: Tab;
    tabs: Tab[];
    onClose: () => void;
    onNavigate: (sectionId: string) => void;
}

const SectionMapModal: React.FC<SectionMapModalProps> = ({
    isOpen,
    activeTab,
    tabs,
    onClose,
    onNavigate
}) => {
    if (!isOpen) return null;

    const isMainTab = activeTab.id === (tabs[0]?.id || '');

    const sections: Section[] = [];
    if (isMainTab) {
        if (activeTab.inboxSection) sections.push(activeTab.inboxSection);
        // QuotesSection might not be in the general sections array depending on implementation
        if (activeTab.quotesSection) sections.push(activeTab.quotesSection);
    }
    sections.push(...activeTab.sections);

    return (
        <div
            className="fixed inset-0 z-[300] flex items-end justify-center bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
        >
            <div
                className="bg-white w-full rounded-t-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 max-h-[70vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Handle for dragging feel */}
                <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 mb-1" />

                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <span className="text-blue-500">📑</span> {activeTab.name} 섹션 이동
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 p-1"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 pb-10">
                    {sections.map((section, idx) => {
                        const isInbox = section.id === activeTab.inboxSection?.id;
                        const isQuotes = section.id === activeTab.quotesSection?.id;

                        return (
                            <button
                                key={section.id}
                                onClick={() => onNavigate(section.id)}
                                className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 active:bg-blue-50 active:border-blue-200 transition-all text-left"
                            >
                                <span className="text-2xl flex-shrink-0">
                                    {isInbox ? '📥' : isQuotes ? '📜' : '📋'}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-slate-800 truncate">{section.title}</p>
                                        {section.isLocked && <div className="scale-75 text-red-400"><LockIcon /></div>}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {section.items.length}개 항목
                                    </p>
                                </div>
                                <div className="text-slate-300">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default SectionMapModal;
