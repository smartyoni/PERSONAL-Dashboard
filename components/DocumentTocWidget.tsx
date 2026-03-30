import React, { useMemo } from 'react';
import { MemoEditorState } from '../types';

interface DocumentTocWidgetProps {
    memoEditor: MemoEditorState;
    onChangePage: (index: number) => void;
    isMobileLayout?: boolean;
}

const DocumentTocWidget: React.FC<DocumentTocWidgetProps> = ({
    memoEditor,
    onChangePage,
    isMobileLayout
}) => {
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

    return (
        <div className="h-full bg-white border-2 border-black rounded-2xl flex flex-col overflow-hidden shadow-sm">
            {/* Header */}
            <div className="text-sm font-black text-slate-900 bg-slate-50 flex items-center gap-2 px-4 h-[48px] border-b-2 border-black flex-shrink-0">
                <span className="font-serif text-[17px]">상세목차</span>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1 bg-[#fdfdfd]">
                {/* 1. Pages (Chapters) */}
                <div className="mb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Chapters</p>
                    {memoEditor.allTitles.map((title, idx) => {
                        const isActive = memoEditor.activePageIndex === idx;
                        const displayIndex = String(idx + 1).padStart(2, '0');

                        return (
                            <div key={`page-${idx}`}>
                                <button
                                    onClick={() => onChangePage(idx)}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-all group flex items-baseline gap-3 ${
                                        isActive 
                                            ? 'bg-slate-100 text-slate-900' 
                                            : 'hover:bg-slate-50 text-slate-600'
                                    }`}
                                >
                                    <span className="font-mono text-[11px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors">
                                        {displayIndex}.
                                    </span>
                                    <span className={`font-serif text-[15px] flex-1 truncate ${isActive ? 'font-bold' : 'font-medium'}`}>
                                        {title || `Page ${idx + 1}`}
                                    </span>
                                </button>

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
