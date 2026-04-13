import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppData, Tab, MemoEditorState, TITLE_SEPARATOR } from '../types';
import { SearchIcon, MemoIcon } from './Icons';

interface SearchResult {
    id: string;
    type: 'tab' | 'section' | 'item' | 'memo-page';
    title: string;
    content?: string;
    breadcrumb: string;
    tabId: string;
    sectionId?: string;
    itemId?: string;
    pageIndex?: number;
    memoType?: MemoEditorState['type'];
}

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    safeData: AppData;
    handleNavigate: (tabId: string, sectionId?: string, itemId?: string) => void;
    handleShowMemo: (id: string, type?: MemoEditorState['type'], sectionId?: string | null, initialValue?: string, tabId?: string | null, openedFromMap?: boolean, pageIndex?: number) => void;
    currentTabId: string;
}

const SearchModal: React.FC<SearchModalProps> = ({ 
    isOpen, onClose, safeData, handleNavigate, handleShowMemo, currentTabId 
}) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    // Indexing everything
    const searchableItems = useMemo(() => {
        const items: SearchResult[] = [];
        
        safeData.tabs.forEach((tab, tabIdx) => {
            const isBaseTab = tabIdx === 0;



            // Index Inbox Section
            if (tab.inboxSection) {
                const section = tab.inboxSection;
                const pathPrefix = isBaseTab ? '인박스' : `${tab.name} > 인박스`;
                
                section.items.forEach(item => {
                    items.push({
                        id: item.id,
                        type: 'item',
                        title: item.text,
                        breadcrumb: pathPrefix,
                        tabId: tab.id,
                        sectionId: section.id,
                        itemId: item.id,
                        memoType: 'section'
                    });

                    // Inbox memo
                    const memoValue = tab.memos[item.id];
                    if (memoValue) {
                        const pages = memoValue.split('\n===page-break===\n');
                        pages.forEach((page, idx) => {
                            let pageTitle = '';
                            let content = page;
                            const sepIdx = page.indexOf(TITLE_SEPARATOR);
                            if (sepIdx !== -1) {
                                pageTitle = page.substring(0, sepIdx).replace(/<[^>]+>/g, '').trim();
                                content = page.substring(sepIdx + TITLE_SEPARATOR.length);
                            }

                            const resultTitle = isBaseTab 
                                ? `${item.text} > ${pageTitle || '메모'}`
                                : (pageTitle || item.text);

                            items.push({
                                id: `${item.id}-page-${idx}`,
                                type: 'memo-page',
                                title: resultTitle + (pages.length > 1 ? ` (${idx + 1}P)` : ''),
                                content: content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' '),
                                breadcrumb: pathPrefix,
                                tabId: tab.id,
                                sectionId: section.id,
                                itemId: item.id,
                                pageIndex: idx,
                                memoType: 'section'
                            });
                        });
                    }
                });
            }

            tab.sections.forEach(section => {
                const pathPrefix = isBaseTab ? section.title : `${tab.name} > ${section.title}`;
                


                section.items.forEach(item => {
                    // Item result
                    items.push({
                        id: item.id,
                        type: 'item',
                        title: item.text,
                        breadcrumb: pathPrefix,
                        tabId: tab.id,
                        sectionId: section.id,
                        itemId: item.id,
                        memoType: 'section'
                    });

                    // Memo content indexing
                    const memoValue = tab.memos[item.id];
                    if (memoValue) {
                        const pages = memoValue.split('\n===page-break===\n');
                        pages.forEach((page, idx) => {
                            let pageTitle = '';
                            let content = page;

                            // Split title and content if separator exists
                            const sepIdx = page.indexOf(TITLE_SEPARATOR);
                            if (sepIdx !== -1) {
                                pageTitle = page.substring(0, sepIdx).replace(/<[^>]+>/g, '').trim();
                                content = page.substring(sepIdx + TITLE_SEPARATOR.length);
                            }

                            const resultTitle = isBaseTab 
                                ? `${item.text} > ${pageTitle || '메모'}`
                                : (pageTitle || item.text);

                            items.push({
                                id: `${item.id}-page-${idx}`,
                                type: 'memo-page',
                                title: resultTitle + (pages.length > 1 ? ` (${idx + 1}P)` : ''),
                                content: content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' '),
                                breadcrumb: pathPrefix,
                                tabId: tab.id,
                                sectionId: section.id,
                                itemId: item.id,
                                pageIndex: idx,
                                memoType: 'section'
                            });
                        });
                    }
                });
            });

            // Indexing Special Sections (Parking, TodoManagement 1, 2, 3)
            const indexSpecialInfo = (info: any, baseBreadcrumb: string, typePrefix: string) => {
                if (!info) return;
                
                const categories = [
                    { items: info.checklistItems || info.category1Items, memos: info.checklistMemos || info.category1Memos, title: info.category1Title || '업무루틴', type: (typePrefix === 'parking' ? 'checklist' : `${typePrefix}Cat1`) },
                    { items: info.shoppingListItems || info.category2Items, memos: info.shoppingListMemos || info.category2Memos, title: info.category2Title || '쇼핑', type: (typePrefix === 'parking' ? 'shopping' : `${typePrefix}Cat2`) },
                    { items: info.remindersItems || info.category3Items, memos: info.remindersMemos || info.category3Memos, title: info.category3Title || '챙길것', type: (typePrefix === 'parking' ? 'reminders' : `${typePrefix}Cat3`) },
                    { items: info.todoItems || info.category4Items, memos: info.todoMemos || info.category4Memos, title: info.category4Title || '할일', type: (typePrefix === 'parking' ? 'todo' : `${typePrefix}Cat4`) },
                    { items: info.category5Items, memos: info.category5Memos, title: info.category5Title || '항목 5', type: (typePrefix === 'parking' ? 'parkingCat5' : `${typePrefix}Cat5`) }
                ];

                categories.forEach(cat => {
                    if (!cat.items || cat.items.length === 0) return;
                    
                    const catPath = isBaseTab ? `${baseBreadcrumb} > ${cat.title}` : `${tab.name} > ${baseBreadcrumb} > ${cat.title}`;

                    cat.items.forEach((item: any) => {
                        items.push({
                            id: item.id,
                            type: 'item',
                            title: item.text,
                            breadcrumb: catPath,
                            tabId: tab.id,
                            sectionId: cat.type,
                            itemId: item.id,
                            memoType: cat.type as any
                        });

                        const m = cat.memos?.[item.id];
                        if (m) {
                            const pages = m.split('\n===page-break===\n');
                            pages.forEach((page: string, idx: number) => {
                                let pageTitle = '';
                                let content = page;
                                const sepIdx = page.indexOf(TITLE_SEPARATOR);
                                if (sepIdx !== -1) {
                                    pageTitle = page.substring(0, sepIdx).replace(/<[^>]+>/g, '').trim();
                                    content = page.substring(sepIdx + TITLE_SEPARATOR.length);
                                }

                                const resultTitle = isBaseTab 
                                    ? `${item.text} > ${pageTitle || '메모'}`
                                    : (pageTitle || item.text);

                                items.push({
                                    id: `${item.id}-page-${idx}`,
                                    type: 'memo-page',
                                    title: resultTitle + (pages.length > 1 ? ` (${idx + 1}P)` : ''),
                                    content: content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' '),
                                    breadcrumb: catPath,
                                    tabId: tab.id,
                                    sectionId: cat.type,
                                    itemId: item.id,
                                    pageIndex: idx,
                                    memoType: cat.type as any
                                });
                            });
                        }
                    });
                });
            };

            if (tab.parkingInfo) indexSpecialInfo(tab.parkingInfo, '주차', 'parking');
            if (tab.todoManagementInfo) indexSpecialInfo(tab.todoManagementInfo, '개인', 'todo');
            if (tab.todoManagementInfo2) indexSpecialInfo(tab.todoManagementInfo2, '만드는것', 'todo2');
            if (tab.todoManagementInfo3) indexSpecialInfo(tab.todoManagementInfo3, '업무', 'todo3');
        });

        return items;
    }, [safeData]);

    const filteredResults = useMemo(() => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        return searchableItems.filter(item => 
            item.title.toLowerCase().includes(q) || 
            (item.content && item.content.toLowerCase().includes(q))
        ).slice(0, 30); // Limit results for performance
    }, [searchableItems, query]);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredResults.length));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredResults.length) % Math.max(1, filteredResults.length));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredResults[selectedIndex]) {
                onSelect(filteredResults[selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    const onSelect = (result: SearchResult) => {
        onClose();
        
        // 1. 네비게이션
        if (result.type === 'tab') {
            handleNavigate(result.id);
        } else if (result.type === 'section') {
            handleNavigate(result.tabId, result.id);
        } else if (result.type === 'item') {
            handleNavigate(result.tabId, result.sectionId, result.id);
            
            // 2. 메모 상세 열기
            setTimeout(() => {
                handleShowMemo(result.id, result.memoType || 'section', result.sectionId, undefined, result.tabId, false, 0);
            }, 200);
        } else if (result.type === 'memo-page') {
            // 네비게이션 및 스크롤
            handleNavigate(result.tabId, result.sectionId, result.itemId);
            
            // 2. 메모 상세 열기 (특정 페이지)
            setTimeout(() => {
                handleShowMemo(result.itemId!, result.memoType || 'section', result.sectionId, undefined, result.tabId, false, result.pageIndex);
            }, 200);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[70vh] animate-in fade-in zoom-in duration-200">
                {/* Search Input */}
                <div className="flex items-center px-4 py-4 border-b border-slate-100 bg-slate-50/50">
                    <SearchIcon className="w-5 h-5 text-slate-400 mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 bg-transparent border-none outline-none text-slate-800 text-lg placeholder:text-slate-400 font-medium"
                        placeholder="무엇을 찾으시나요? (탭, 섹션, 할 일, 메모...)"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Esc</span>
                    </div>
                </div>

                {/* Results List */}
                <div 
                    ref={resultsRef}
                    className="flex-1 overflow-y-auto py-2 custom-scrollbar"
                >
                    {query.trim() === '' ? (
                        <div className="px-6 py-12 text-center">
                            <p className="text-slate-400 text-sm">검색어를 입력하여 모든 데이터를 찾아보세요.</p>
                            <div className="mt-4 flex flex-wrap justify-center gap-2">
                                <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded">#프로젝트</span>
                                <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded">#아이디어</span>
                                <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded">#회의내용</span>
                            </div>
                        </div>
                    ) : filteredResults.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <p className="text-slate-400 text-sm">찾으시는 결과가 없습니다: <span className="font-bold text-slate-600">"{query}"</span></p>
                        </div>
                    ) : (
                        <div className="flex flex-col px-2">
                            {filteredResults.map((result, index) => (
                                <button
                                    key={result.id}
                                    className={`flex items-start gap-3 w-full px-3 py-3 rounded-xl text-left transition-all ${
                                        index === selectedIndex 
                                        ? 'bg-indigo-50 ring-1 ring-indigo-200 shadow-sm' 
                                        : 'hover:bg-slate-50'
                                    }`}
                                    onClick={() => onSelect(result)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                >
                                    <div className={`mt-0.5 p-2 rounded-lg ${
                                        result.type === 'memo-page' ? 'bg-orange-100 text-orange-600' :
                                        result.type === 'tab' ? 'bg-blue-100 text-blue-600' :
                                        result.type === 'section' ? 'bg-purple-100 text-purple-600' :
                                        'bg-emerald-100 text-emerald-600'
                                    }`}>
                                        {result.type === 'memo-page' ? <MemoIcon /> : 
                                         result.type === 'tab' ? <span className="text-xs">📁</span> :
                                         result.type === 'section' ? <span className="text-xs">🗂️</span> :
                                         <span className="text-xs">✅</span>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className={`font-bold text-sm truncate ${index === selectedIndex ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                {result.title}
                                            </span>
                                            {result.type === 'memo-page' && (
                                                <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded border border-orange-100">MEMO</span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-wider">
                                            {result.breadcrumb}
                                        </div>
                                        {result.content && (
                                            <p className="mt-1.5 text-xs text-slate-500 line-clamp-1 italic">
                                                ...{result.content.substring(Math.max(0, result.content.toLowerCase().indexOf(query.toLowerCase()) - 20), result.content.toLowerCase().indexOf(query.toLowerCase()) + 60)}...
                                            </p>
                                        )}
                                    </div>
                                    {index === selectedIndex && (
                                        <div className="self-center text-indigo-400 animate-pulse">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Tips */}
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600 shadow-sm">Enter</kbd> 선택
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600 shadow-sm">↑↓</kbd> 이동
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        전체 데이터에서 <span className="text-indigo-500 font-bold">{searchableItems.length}개</span>의 항목 인덱싱됨
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchModal;
