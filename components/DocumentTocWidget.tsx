import React, { useMemo } from 'react';
import { MemoEditorState } from '../types';

interface DocumentTocWidgetProps {
    memoEditor: MemoEditorState;
    onChangePage: (index: number) => void;
    onUpdatePageTitle: (index: number, title: string) => void;
    onAddPage: () => void;
    onClose?: () => void;
    onScrollToLine?: (lineIndex: number, pageIndex: number) => void;
    isMobileLayout?: boolean;
}

const DocumentTocWidget: React.FC<DocumentTocWidgetProps> = ({
    memoEditor,
    onChangePage,
    onUpdatePageTitle,
    onAddPage,
    onClose,
    onScrollToLine,
    isMobileLayout
}) => {
    const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
    const [tempTitle, setTempTitle] = React.useState("");
    const [expandedPages, setExpandedPages] = React.useState<Record<number, boolean>>(() => {
        // Default the active page to expanded
        if (memoEditor.activePageIndex !== null) {
            return { [memoEditor.activePageIndex]: true };
        }
        return {};
    });

    React.useEffect(() => {
        // Auto-expand the newly active page if it hasn't been set yet
        setExpandedPages(prev => {
            if (memoEditor.activePageIndex !== null && prev[memoEditor.activePageIndex] === undefined) {
                return { ...prev, [memoEditor.activePageIndex]: true };
            }
            return prev;
        });
    }, [memoEditor.activePageIndex]);

    const toggleExpand = (idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedPages(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    // 1. 모든 페이지의 헤더(#) 와 굵은 불렛(●) 추출
    const allHeadings = useMemo(() => {
        const result: Record<number, { text: string; level: number; lineIndex: number }[]> = {};
        
        memoEditor.allValues.forEach((content, pageIdx) => {
            // 활성화된 페이지는 수정 중인 memoEditor.value를 최우선으로 사용
            const targetContent = (pageIdx === memoEditor.activePageIndex && memoEditor.value !== undefined) 
                ? memoEditor.value 
                : content;
                
            if (!targetContent) {
                result[pageIdx] = [];
                return;
            }
            
            const lines = targetContent.split('\n');
            const headings: { text: string; level: number; lineIndex: number }[] = [];
            
            lines.forEach((line, index) => {
                const headingMatch = line.match(/^(#{1,3})\s+(.*)/);
                if (headingMatch) {
                    headings.push({
                        level: headingMatch[1].length,
                        text: headingMatch[2].trim(),
                        lineIndex: index
                    });
                    return;
                }

                const bulletMatch = line.match(/^●\s+(.*)/);
                if (bulletMatch) {
                    headings.push({
                        level: 2,
                        text: bulletMatch[1].trim(),
                        lineIndex: index
                    });
                }
            });
            result[pageIdx] = headings;
        });
        
        return result;
    }, [memoEditor.allValues, memoEditor.value, memoEditor.activePageIndex]);

    if (!memoEditor.id) {
        return (
            <div className="h-full bg-white border-2 border-black rounded-2xl p-6 flex items-center justify-center text-slate-400 font-serif italic text-sm text-center">
                문서를 선택하면<br/>목차가 나타납니다.
            </div>
        );
    }

    const handleEditStart = (idx: number, currentTitle: string) => {
        setEditingIndex(idx);
        setTempTitle(currentTitle);
    };

    const handleEditSubmit = (idx: number) => {
        onUpdatePageTitle(idx, tempTitle);
        setEditingIndex(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
        if (e.key === 'Enter') {
            handleEditSubmit(idx);
        } else if (e.key === 'Escape') {
            setEditingIndex(null);
        }
    };

    return (
        <div className={`h-full bg-white flex flex-col overflow-hidden shadow-sm ${!isMobileLayout ? 'border-2 border-black rounded-2xl' : 'border-b-2 border-black'}`}>
            {/* Header */}
            <div className="text-sm font-black text-slate-900 bg-slate-50 flex items-center justify-between px-4 h-[48px] border-b-2 border-black flex-shrink-0">
                <div className="flex items-center gap-2">
                    <span className="font-serif text-[17px]">상세목차</span>
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={onAddPage}
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500 hover:text-indigo-600"
                        title="새 페이지 추가"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                    
                    {isMobileLayout && onClose && (
                        <button 
                            onClick={onClose}
                            className="p-1 px-3 py-1 bg-slate-900 text-white rounded-lg text-[12px] font-bold"
                        >
                            닫기
                        </button>
                    )}
                </div>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1 bg-[#fdfdfd]">
                {/* 1. Pages (Chapters) */}
                <div className="mb-4">
                    <div className="flex items-center justify-between px-2 mb-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chapters</p>
                        <button 
                            onClick={onAddPage}
                            className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
                            title="새 챕터 추가"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                    {memoEditor.allTitles.map((title, idx) => {
                        const isActive = memoEditor.activePageIndex === idx;
                        const isEditing = editingIndex === idx;
                        const displayIndex = String(idx + 1).padStart(2, '0');

                        return (
                            <div key={`page-${idx}`}>
                                <div
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-all group flex items-center gap-3 ${
                                        isActive 
                                            ? 'bg-slate-100 text-slate-900' 
                                            : 'hover:bg-slate-50 text-slate-600'
                                    }`}
                                >
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditStart(idx, title);
                                            }}
                                            className="text-[10px] text-slate-300 hover:text-indigo-500 hover:scale-110 transition-all flex-shrink-0"
                                            title="제목 수정"
                                        >
                                            ●
                                        </button>
                                    
                                    {isEditing ? (
                                        <div className="flex-1 flex items-center gap-1">
                                            <input
                                                autoFocus
                                                type="text"
                                                value={tempTitle}
                                                onChange={(e) => setTempTitle(e.target.value)}
                                                onBlur={() => handleEditSubmit(idx)}
                                                onKeyDown={(e) => handleKeyDown(e, idx)}
                                                className="flex-1 bg-white border border-indigo-300 rounded px-2 py-0.5 text-[15px] font-serif outline-none focus:ring-2 focus:ring-indigo-100"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditSubmit(idx);
                                                }}
                                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <span 
                                            onClick={() => onChangePage(idx)}
                                            className={`font-serif text-[15px] flex-1 truncate min-w-0 cursor-pointer ${isActive ? 'font-bold text-emerald-600' : 'font-medium'}`}
                                        >
                                            {title || `Page ${idx + 1}`}
                                        </span>
                                    )}

                                    {/* Toggle Button for Sub-headings */}
                                    {allHeadings[idx]?.length > 0 && (
                                        <button 
                                            onClick={(e) => toggleExpand(idx, e)}
                                            className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            <svg 
                                                className={`w-4 h-4 transition-transform duration-200 ${expandedPages[idx] ? 'rotate-180' : ''}`} 
                                                fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                {/* 2. Internal Headings */}
                                {expandedPages[idx] && allHeadings[idx]?.length > 0 && (
                                    <div className="mt-1 space-y-0.5 border-l border-slate-100 ml-4">
                                        {allHeadings[idx].map((heading, hIdx) => {
                                            const subIndex = String(hIdx + 1).padStart(2, '0');
                                            // Indent based on level (H1: 4px, H2: 12px, H3: 20px)
                                            const paddingLeft = heading.level === 1 ? '0.5rem' : heading.level === 2 ? '1.25rem' : '2rem';
                                            
                                            return (
                                                <div 
                                                    key={`heading-${hIdx}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (onScrollToLine) {
                                                            onScrollToLine(heading.lineIndex, idx);
                                                        }
                                                    }}
                                                    className="flex items-baseline gap-2 py-1 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer group"
                                                    style={{ paddingLeft }}
                                                >
                                                    <span className="text-[10px] text-slate-300 group-hover:text-slate-400 flex-shrink-0">
                                                        ○
                                                    </span>
                                                    <span className={`font-serif truncate min-w-0 flex-1 ${heading.level === 1 ? 'text-[13px] font-bold text-slate-700' : 'text-[12px]'}`}>
                                                        {heading.text}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {/* Footer / Status */}
            <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter font-serif">
                        Local Draft Syncing
                    </span>
                </div>
            </div>
        </div>
    );
};

export default DocumentTocWidget;
