import React, { useMemo } from 'react';
import { MemoEditorState } from '../types';

interface DocumentTocWidgetProps {
    memoEditor: MemoEditorState;
    onChangePage: (index: number) => void;
    onUpdatePageTitle: (index: number, title: string) => void;
    onAddPage: () => void;
    onClose?: () => void;
    isMobileLayout?: boolean;
}

const DocumentTocWidget: React.FC<DocumentTocWidgetProps> = ({
    memoEditor,
    onChangePage,
    onUpdatePageTitle,
    onAddPage,
    onClose,
    isMobileLayout
}) => {
    const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
    const [tempTitle, setTempTitle] = React.useState("");

    // 1. 현재 페이지의 헤더(#) 추출
    const internalHeadings = useMemo(() => {
        if (!memoEditor.value) return [];
        
        const lines = memoEditor.value.split('\n');
        const headings: { text: string; level: number; lineIndex: number }[] = [];
        
        lines.forEach((line, index) => {
            const match = line.match(/^(#{1,3})\s+(.*)/);
            if (match) {
                headings.push({
                    level: match[1].length,
                    text: match[2].trim(),
                    lineIndex: index
                });
            }
        });
        
        return headings;
    }, [memoEditor.value]);

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
                                        className="font-mono text-[11px] font-bold text-slate-400 hover:text-indigo-500 hover:scale-110 transition-all flex-shrink-0"
                                        title="제목 수정"
                                    >
                                        {displayIndex}.
                                    </button>
                                    
                                    {isEditing ? (
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
                                    ) : (
                                        <span 
                                            onClick={() => onChangePage(idx)}
                                            className={`font-serif text-[15px] flex-1 truncate cursor-pointer ${isActive ? 'font-bold' : 'font-medium'}`}
                                        >
                                            {title || `Page ${idx + 1}`}
                                        </span>
                                    )}
                                </div>

                                {/* 2. Internal Headings (only for active page) */}
                                {isActive && internalHeadings.length > 0 && (
                                    <div className="ml-8 mt-1 space-y-0.5 border-l border-slate-100 pl-2">
                                        {internalHeadings.map((heading, hIdx) => {
                                            const subIndex = String(hIdx + 1).padStart(2, '0');
                                            return (
                                                <div 
                                                    key={`heading-${hIdx}`}
                                                    className="flex items-baseline gap-2 py-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer group"
                                                >
                                                    <span className="font-mono text-[10px] text-slate-300 group-hover:text-slate-400">
                                                        {displayIndex}.{subIndex}
                                                    </span>
                                                    <span className="font-serif text-[13px] truncate">
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
