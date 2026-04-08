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
    const allSections: { 
        section: { id: string, title: string }, 
        tabName: string, 
        tabId: string, 
        type: 'inbox' | 'general' | 'widget',
        groupName?: string 
    }[] = [];

    tabs.forEach((tab) => {
        // Inbox
        if (tab.inboxSection) {
            allSections.push({ section: tab.inboxSection, tabName: tab.name, tabId: tab.id, type: 'inbox' });
        }

        // 1. Parking Widgets (개인 루틴 등)
        if (tab.parkingInfo) {
            const pk = tab.parkingInfo;
            const groupName = '개인';
            allSections.push({ section: { id: 'checklist', title: pk.checklistTitle || '개인 루틴' }, tabName: tab.name, tabId: tab.id, type: 'widget', groupName });
            allSections.push({ section: { id: 'shopping', title: pk.shoppingTitle || '구매 예정' }, tabName: tab.name, tabId: tab.id, type: 'widget', groupName });
            allSections.push({ section: { id: 'reminders', title: pk.remindersTitle || '기억 확인' }, tabName: tab.name, tabId: tab.id, type: 'widget', groupName });
            allSections.push({ section: { id: 'todo', title: pk.todoTitle || '개인 할일' }, tabName: tab.name, tabId: tab.id, type: 'widget', groupName });
            allSections.push({ section: { id: 'parkingCat5', title: pk.category5Title || '기타 개인' }, tabName: tab.name, tabId: tab.id, type: 'widget', groupName });
        }

        // 2. Todo Widgets (업무 1, 2, 3 등)
        // Todo 1
        if (tab.todoManagementInfo) {
            const td = tab.todoManagementInfo;
            const groupName = td.title || '업무';
            allSections.push({ section: { id: 'todoCat1', title: td.category1Title || '항목 1' }, tabName: tab.name, tabId: tab.id, type: 'widget', groupName });
            allSections.push({ section: { id: 'todoCat2', title: td.category2Title || '항목 2' }, tabName: tab.name, tabId: tab.id, type: 'widget', groupName });
            allSections.push({ section: { id: 'todoCat3', title: td.category3Title || '항목 3' }, tabName: tab.name, tabId: tab.id, type: 'widget', groupName });
            allSections.push({ section: { id: 'todoCat4', title: td.category4Title || '항목 4' }, tabName: tab.name, tabId: tab.id, type: 'widget', groupName });
            allSections.push({ section: { id: 'todoCat5', title: td.category5Title || '항목 5' }, tabName: tab.name, tabId: tab.id, type: 'widget', groupName });
        }

        // Todo 2
        if (tab.todoManagementInfo2) {
            const td = tab.todoManagementInfo2;
            const groupName = td.title || '업무 2';
            allSections.push({ section: { id: 'todo2Cat1', title: td.category1Title || '항목 1' }, tabName: tab.name, tabId: tab.id, type: 'widget', groupName });
            allSections.push({ section: { id: 'todo2Cat2', title: td.category2Title || '항목 2' }, tabName: tab.name, tabId: tab.id, type: 'widget', groupName });
            allSections.push({ section: { id: 'todo2Cat3', title: td.category3Title || '항목 3' }, tabName: tab.name, tabId: tab.id, type: 'widget', groupName });
            allSections.push({ section: { id: 'todo2Cat4', title: td.category4Title || '항목 4' }, tabName: tab.name, tabId: tab.id, type: 'widget', groupName });
            allSections.push({ section: { id: 'todo2Cat5', title: td.category5Title || '항목 5' }, tabName: tab.name, tabId: tab.id, type: 'widget', groupName });
        }

        // Todo 3
        if (tab.todoManagementInfo3) {
            const td = tab.todoManagementInfo3;
            const groupName = td.title || '업무 3';
            allSections.push({ section: { id: 'todo3Cat1', title: td.category1Title || '항목 1' }, tabName: tab.name, tabId: tab.id, type: 'widget', groupName });
            allSections.push({ section: { id: 'todo3Cat2', title: td.category2Title || '항목 2' }, tabName: tab.name, tabId: tab.id, type: 'widget', groupName });
            allSections.push({ section: { id: 'todo3Cat3', title: td.category3Title || '항목 3' }, tabName: tab.name, tabId: tab.id, type: 'widget', groupName });
            allSections.push({ section: { id: 'todo3Cat4', title: td.category4Title || '항목 4' }, tabName: tab.name, tabId: tab.id, type: 'widget', groupName });
            allSections.push({ section: { id: 'todo3Cat5', title: td.category5Title || '항목 5' }, tabName: tab.name, tabId: tab.id, type: 'widget', groupName });
        }

        // General Sections
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
                className="bg-white w-full md:max-w-[700px] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 h-[85vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 mb-1" />

                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">문서 이동</h2>
                        <p className="text-xs text-slate-400 font-medium">항목을 이동할 대상 섹션을 선택하세요</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 custom-scrollbar pb-12 bg-white">
                    {tabs.map(tab => {
                        const tabSections = allSections.filter(s => s.tabId === tab.id);
                        if (tabSections.length === 0) return null;

                        const widgetSections = tabSections.filter(s => s.type === 'widget');
                        const generalSections = tabSections.filter(s => s.type !== 'widget');

                        // 위젯 섹션을 groupName별로 그룹화
                        const widgetGroups: Record<string, typeof widgetSections> = {};
                        widgetSections.forEach(s => {
                            const group = s.groupName || '기타';
                            if (!widgetGroups[group]) widgetGroups[group] = [];
                            widgetGroups[group].push(s);
                        });

                        return (
                            <div key={tab.id} className="space-y-4">
                                <div className="flex items-center gap-3 px-2">
                                    <div className="h-px flex-1 bg-slate-100"></div>
                                    <h3 className="text-[11px] font-black text-slate-400 underline decoration-indigo-200 decoration-2 underline-offset-4 uppercase tracking-[0.2em]">
                                        {tab.name}
                                    </h3>
                                    <div className="h-px flex-1 bg-slate-100"></div>
                                </div>

                                {Object.entries(widgetGroups).map(([groupName, sections]) => (
                                    <div key={groupName} className="space-y-2 px-1">
                                        <div className="px-2 flex items-center gap-1.5 justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                                    groupName === '개인' 
                                                    ? 'text-green-600 bg-green-50 border-green-100' 
                                                    : 'text-sky-600 bg-sky-50 border-sky-100'
                                                }`}>
                                                    {groupName} 위젯
                                                </span>
                                            </div>
                                            <div className="h-px flex-1 bg-slate-50 ml-2"></div>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                            {sections.map(({ section }) => {
                                                const isCurrent = context?.sourceSectionId === section.id && context?.sourceTabId === tab.id;
                                                
                                                // 그룹별 클래스 매핑
                                                const activeClass = groupName === '개인' 
                                                    ? 'bg-green-500 text-white border-green-600 shadow-lg shadow-green-100 ring-2 ring-green-200' 
                                                    : 'bg-sky-500 text-white border-sky-600 shadow-lg shadow-sky-100 ring-2 ring-sky-200';
                                                
                                                const inactiveClass = groupName === '개인'
                                                    ? 'bg-white hover:bg-green-50 text-slate-600 border-slate-200 hover:border-green-200 hover:text-green-700'
                                                    : 'bg-white hover:bg-sky-50 text-slate-600 border-slate-200 hover:border-sky-200 hover:text-sky-700';

                                                const iconBgClass = isCurrent 
                                                    ? 'bg-white/20' 
                                                    : (groupName === '개인' ? 'bg-slate-50 group-hover:bg-green-100' : 'bg-slate-50 group-hover:bg-sky-100');

                                                return (
                                                    <button
                                                        key={section.id}
                                                        onClick={() => onNavigate(section.id, tab.id)}
                                                        className={`px-3 py-2.5 text-xs font-bold rounded-xl transition-all border flex items-center gap-2 group ${isCurrent ? activeClass : inactiveClass}`}
                                                    >
                                                        <span className={`w-5 h-5 flex items-center justify-center rounded-lg text-[10px] transition-colors ${iconBgClass}`}>⚙️</span>
                                                        <span className="truncate">{section.title}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                {generalSections.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="px-2 flex items-center gap-1.5">
                                            <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">SECTIONS</span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                            {generalSections.map(({ section, type }) => {
                                                const isCurrent = context?.sourceSectionId === section.id && context?.sourceTabId === tab.id;
                                                return (
                                                    <button
                                                        key={section.id}
                                                        onClick={() => onNavigate(section.id, tab.id)}
                                                        className={`px-3 py-2.5 text-xs font-bold rounded-xl transition-all border flex items-center gap-2 group ${
                                                            isCurrent 
                                                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-100 ring-2 ring-indigo-200' 
                                                            : 'bg-white hover:bg-indigo-50 text-slate-600 border-slate-200 hover:border-indigo-200 hover:text-indigo-700'
                                                        }`}
                                                    >
                                                        <span className={`w-5 h-5 flex items-center justify-center rounded-lg text-[10px] transition-colors ${
                                                            isCurrent ? 'bg-white/20' : 'bg-slate-50 group-hover:bg-indigo-100'
                                                        }`}>{type === 'inbox' ? '📥' : '#'}</span>
                                                        <span className="truncate">{section.title}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default TagSelectionModal;
