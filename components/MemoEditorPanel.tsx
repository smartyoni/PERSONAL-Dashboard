import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AppData, Tab, MemoEditorState, TodoManagementInfo } from '../types';
import LinkifiedText from './LinkifiedText';
import { contentToHtml, htmlToContent, splitMetadata } from '../utils/memoEditorUtils';


export interface MemoEditorPanelProps {
    memoEditor: MemoEditorState;
    setMemoEditor: React.Dispatch<React.SetStateAction<MemoEditorState>>;
    memoTextareaRef: React.RefObject<HTMLDivElement>;
    handleSaveMemo: (isAutoSave?: boolean, newValue?: string) => void;
    handleSwipeMemo: (direction: 'left' | 'right') => void;
    handleDeleteItemFromModal: () => void;
    handleOpenTagSelection: (context?: { itemId: string; sourceTabId: string; sourceSectionId: string; itemText: string }) => void;
    handleInsertSymbol: (symbol: string) => void;
    handleChangePage: (index: number) => void;
    handleUpdateTitle: (title: string) => void;
    handleUpdateItemText: (newText: string) => void;
    handleAddPage: () => void;
    handleDeletePage: () => void;
    memoSymbols: { label: string; value: string; title: string }[];
    setNavigationMapOpen: (open: boolean) => void;
    handleMoveItem: (itemId: string, sourceTabId: string, sourceSectionId: string, targetTabId: string, targetSectionId: string, switchTab?: boolean) => void;
    activeTab: Tab;
    safeData: AppData; // Add safeData for cross-tab item lookup
    isMobileLayout: boolean;
    isDesktopSplit?: boolean; 
}


const MemoEditorPanel: React.FC<MemoEditorPanelProps> = ({
    memoEditor, setMemoEditor, memoTextareaRef,
    handleSaveMemo, handleSwipeMemo, handleDeleteItemFromModal,
    handleOpenTagSelection, handleInsertSymbol, handleChangePage, handleUpdateTitle, handleUpdateItemText,
    handleAddPage, handleDeletePage,
    memoSymbols, setNavigationMapOpen, activeTab, safeData, isMobileLayout, isDesktopSplit
}) => {
    const touchStart = useRef<number | null>(null);
    const touchEnd = useRef<number | null>(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [showCopyToast, setShowCopyToast] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingHeader, setIsEditingHeader] = useState(false);
    const [headerValue, setHeaderValue] = useState("");
    const [showToC, setShowToC] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [highlightText, setHighlightText] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);


    const onInsertSymbol = useCallback((symbol: string) => {
        const textarea = memoTextareaRef.current as unknown as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value; // Use current value directly
        const scrollParent = textarea.parentElement;
        const scrollTop = scrollParent ? scrollParent.scrollTop : 0;
        
        let insertVal = symbol;
        if (symbol === '\n---divider---\n') {
            insertVal = '\n---divider---\n';
        }

        const newValue = text.substring(0, start) + insertVal + text.substring(end);
        setMemoEditor(prev => ({ ...prev, value: newValue }));

        // Selection and scroll restoration after state update
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + insertVal.length, start + insertVal.length);
            if (scrollParent) {
                scrollParent.scrollTop = scrollTop;
            }
        }, 0);
    }, [setMemoEditor, memoTextareaRef]);

    useEffect(() => {
        if (memoEditor.isEditing && memoTextareaRef.current) {
            const textarea = memoTextareaRef.current as unknown as HTMLTextAreaElement;
            if (textarea.tagName === 'TEXTAREA') {
                const scrollParent = textarea.parentElement;
                const scrollTop = scrollParent ? scrollParent.scrollTop : 0;
                
                textarea.style.height = 'auto';
                textarea.style.height = `${textarea.scrollHeight}px`;
                
                if (scrollParent) {
                    scrollParent.scrollTop = scrollTop;
                }
            }
        }
    }, [memoEditor.value, memoEditor.isEditing]);

    // Handle initial focus
    useEffect(() => {
        if (memoEditor.isEditing && memoTextareaRef.current) {
            const textarea = memoTextareaRef.current as unknown as HTMLTextAreaElement;
            textarea.focus();
        }
    }, [memoEditor.isEditing]);

    // 외부에서 memoEditor.highlightText가 주입될 때 로컬 state로 동기화
    useEffect(() => {
        if (memoEditor.highlightText) {
            setHighlightText(memoEditor.highlightText);
            // 동기화 후 memoEditor에서 초기화 (중복 트리거 방지)
            setMemoEditor(prev => ({ ...prev, highlightText: null }));
        }
    }, [memoEditor.highlightText]);

    const prevIsEditing = useRef(memoEditor.isEditing);
    const prevActivePage = useRef(memoEditor.activePageIndex);

    // Sync state when entering edit mode or changing page
    useEffect(() => {
        if ((memoEditor.isEditing && !prevIsEditing.current) || (memoEditor.isEditing && memoEditor.activePageIndex !== prevActivePage.current)) {
            // No longer splitting metadata, just use the raw value
            setMemoEditor(prev => ({ ...prev, value: prev.value }));
        }
        prevIsEditing.current = memoEditor.isEditing;
        prevActivePage.current = memoEditor.activePageIndex;
    }, [memoEditor.isEditing, memoEditor.activePageIndex, memoEditor.value]);

    // 하이라이트된 텍스트로 스크롤
    useEffect(() => {
        if (highlightText && contentRef.current) {
            const timer = setTimeout(() => {
                const mark = contentRef.current?.querySelector('mark');
                if (mark) {
                    mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
            
            const clearTimer = setTimeout(() => {
                setHighlightText(null);
            }, 5000);
            
            return () => {
                clearTimeout(timer);
                clearTimeout(clearTimer);
            };
        }
    }, [highlightText]);

    const handleCopy = () => {
        navigator.clipboard.writeText(memoEditor.value);
        setShowCopyToast(true);
        setTimeout(() => setShowCopyToast(false), 2000);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStart.current = e.targetTouches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEnd.current = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (!touchStart.current || !touchEnd.current) return;
        const distance = touchStart.current - touchEnd.current;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe) handleSwipeMemo('left');
        if (isRightSwipe) handleSwipeMemo('right');

        touchStart.current = null;
        touchEnd.current = null;
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!memoEditor.id || memoEditor.isEditing) return;

            if (e.key === 'ArrowLeft') {
                handleSwipeMemo('right'); 
            } else if (e.key === 'ArrowRight') {
                handleSwipeMemo('left'); 
            } else if (e.key === 'Escape') {
                setMemoEditor(prev => ({ ...prev, id: null, sectionId: null }));
            } else if (e.key === 'Enter') {
                setMemoEditor(prev => ({ ...prev, isEditing: true }));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [memoEditor.id, memoEditor.isEditing, handleSwipeMemo, setMemoEditor]);

    // 단축키 처리 (Ctrl+Enter, Cmd+Enter, Shift+Enter로 저장)
    useEffect(() => {
        if (!memoEditor.isEditing || !memoEditor.id) return;

        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || e.shiftKey)) {
                const activeEl = document.activeElement;
                const isTitleInput = activeEl?.tagName === 'INPUT';
                const isContentEditor = activeEl?.getAttribute('contenteditable') === 'true' || activeEl?.closest('[contenteditable="true"]');
                
                if (isTitleInput || isContentEditor) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSaveMemo();
                }
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown, true);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown, true);
    }, [memoEditor.isEditing, memoEditor.id, handleSaveMemo]);

    useEffect(() => {
        const vv = window.visualViewport;
        if (!vv) return;
        const onResize = () => {
            const kbHeight = window.innerHeight - vv.height - vv.offsetTop;
            setKeyboardHeight(kbHeight > 0 ? kbHeight : 0);
        };
        vv.addEventListener('resize', onResize);
        vv.addEventListener('scroll', onResize);
        return () => {
            vv.removeEventListener('resize', onResize);
            vv.removeEventListener('scroll', onResize);
        };
    }, []);
    
    // 이모지 컨텍스트 메뉴 핸들러
    const handleContextMenu = (e: React.MouseEvent) => {
        if (!memoEditor.isEditing) return;
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
    };

    useEffect(() => {
        const handleCloseMenu = (e: MouseEvent | KeyboardEvent) => {
            if (e instanceof KeyboardEvent && e.key !== 'Escape') return;
            setContextMenu(null);
        };
        window.addEventListener('click', handleCloseMenu);
        window.addEventListener('keydown', handleCloseMenu);
        return () => {
            window.removeEventListener('click', handleCloseMenu);
            window.removeEventListener('keydown', handleCloseMenu);
        };
    }, []);

    useEffect(() => {
        if (memoEditor.isEditing && memoTextareaRef.current && memoTextareaRef.current.tagName === 'DIV') {
            const element = memoTextareaRef.current;
            const html = contentToHtml(memoEditor.value);
            if (element.innerHTML !== html) {
                element.innerHTML = html;
            }
        }
    }, [memoEditor.isEditing, memoEditor.activePageIndex]);

    const targetTab = React.useMemo(() => {
        if (!memoEditor.tabId) return activeTab;
        return (safeData.tabs as any[]).find(t => t.id === memoEditor.tabId) || activeTab;
    }, [memoEditor.tabId, safeData.tabs, activeTab]);

    const currentItem = React.useMemo(() => {
        if (!memoEditor.id) return null;
        const { type, sectionId, id } = memoEditor;

        // 1. Parking sections
        if (type === 'checklist') return targetTab.parkingInfo.checklistItems.find(i => i.id === id);
        if (type === 'shopping') return targetTab.parkingInfo.shoppingListItems.find(i => i.id === id);
        if (type === 'reminders') return targetTab.parkingInfo.remindersItems.find(i => i.id === id);
        if (type === 'todo') return targetTab.parkingInfo.todoItems.find(i => i.id === id);
        if (type === 'parkingCat5') return targetTab.parkingInfo.category5Items.find(i => i.id === id);

        // 2. Todo Management sections (Categorized)
        if (type.includes('Cat')) {
            const catMatch = type.match(/cat(\d+)$/i);
            const num = catMatch ? catMatch[1] : '1';
            const itemsKey = `category${num}Items` as keyof TodoManagementInfo;
            
            let info;
            if (type.startsWith('todo2Cat')) info = targetTab.todoManagementInfo2;
            else if (type.startsWith('todo3Cat')) info = targetTab.todoManagementInfo3;
            else if (type.startsWith('todoCat')) info = targetTab.todoManagementInfo;
            
            if (info) return (info[itemsKey] as any[])?.find((i: any) => i.id === id);
        }

        // 3. Custom sections & IN-BOX
        const section = [targetTab.inboxSection, ...targetTab.sections].find(s => s?.id === sectionId);
        return section?.items.find(i => i.id === id);
    }, [memoEditor.id, memoEditor.type, memoEditor.sectionId, targetTab]);

    const sectionName = React.useMemo(() => {
        if (!memoEditor.id) return '';
        const { type, sectionId } = memoEditor;
        
        // 1. Parking sections
        if (type === 'checklist') return targetTab.parkingInfo.checklistTitle || '업무루틴';
        if (type === 'shopping') return targetTab.parkingInfo.shoppingTitle || '장바구니';
        if (type === 'reminders') return targetTab.parkingInfo.remindersTitle || '챙겨야할 것';
        if (type === 'todo') return targetTab.parkingInfo.todoTitle || '잊지말고 할일';
        if (type === 'parkingCat5') return targetTab.parkingInfo.category5Title || '기타';

        // 2. Todo Management sections
        if (type.includes('Cat')) {
            const catMatch = type.match(/cat(\d+)$/i);
            const num = catMatch ? catMatch[1] : '1';
            const catKey = `category${num}Title` as keyof TodoManagementInfo;
            
            if (type.startsWith('todo2Cat')) return (targetTab.todoManagementInfo2 as any)[catKey] || '할일';
            if (type.startsWith('todo3Cat')) return (targetTab.todoManagementInfo3 as any)[catKey] || '할일';
            if (type.startsWith('todoCat')) return (targetTab.todoManagementInfo as any)[catKey] || '할일';
        }

        // 3. Custom sections & IN-BOX
        const section = [targetTab.inboxSection, ...targetTab.sections].find(s => s?.id === sectionId);
        return section?.title || '미분류';
    }, [memoEditor.id, memoEditor.sectionId, memoEditor.type, targetTab]);

    const headerTitle = React.useMemo(() => {
        return currentItem?.text || '제목 없음';
    }, [currentItem]);

    if (!memoEditor.id) {
        if (isDesktopSplit) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gradient-to-b from-slate-50 to-white h-full">
                    <div className="w-24 h-24 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(79,70,229,0.1)] flex items-center justify-center mb-8 text-indigo-500 animate-pulse-subtle">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </div>
                    <h3 className="text-slate-800 font-extrabold text-xl mb-3 tracking-tight">상세 메모 편집기</h3>
                    <p className="text-slate-500 text-sm leading-relaxed max-w-[240px]">
                        왼쪽 또는 오른쪽 섹션의 항목을<br/>
                        <span className="text-indigo-600 font-bold">더블클릭</span>하거나 선택하여<br/>
                        상세 내용을 기록해 보세요.
                    </p>
                </div>
            );
        }
        return null;
    }

    const PanelContent = (
        <div
            onClick={(e) => e.stopPropagation()}
            onTouchStart={isMobileLayout && !memoEditor.isEditing ? handleTouchStart : undefined}
            onTouchMove={isMobileLayout && !memoEditor.isEditing ? handleTouchMove : undefined}
            onTouchEnd={isMobileLayout && !memoEditor.isEditing ? handleTouchEnd : undefined}
            className="bg-white flex flex-col relative w-full h-full group"
        >
            <style>{`
                @keyframes pulse-subtle {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.02); }
                }
                .animate-pulse-subtle {
                    animation: pulse-subtle 3s infinite ease-in-out;
                }
                .memo-editor-textarea {
                    width: 100%;
                    height: 100%;
                    padding: 0 1.5rem 1.5rem 12px;
                    border: none;
                    outline: none;
                    font-size: 15px;
                    line-height: 28px;
                    font-family: inherit;
                    resize: none;
                    background: transparent;
                    white-space: pre-wrap;
                    word-break: break-all;
                }
                .prose p, .prose li, .prose div, .prose h1, .prose h2, .prose h3, .prose h4 {
                    margin-top: 0px !important;
                    margin-bottom: 0px !important;
                    line-height: 28px !important;
                    min-height: 28px;
                }
                .prose ul, .prose ol {
                    margin-top: 0px !important;
                    margin-bottom: 0px !important;
                    padding-left: 1.25rem !important;
                }
                .regal-pad-bg {
                    background-color: white;
                    background-image: 
                        linear-gradient(90deg, transparent 27px, #ffb3b3 27px, #ffb3b3 28px, transparent 28px, transparent 30px, #ffb3b3 30px, #ffb3b3 31px, transparent 31px),
                        repeating-linear-gradient(transparent, transparent 27px, rgba(59, 130, 246, 0.2) 27px, rgba(59, 130, 246, 0.2) 28px);
                    background-size: 100% 100%, 100% 28px;
                }
            `}</style>
            {currentItem && (
                <>
                    <div 
                        className="flex-none px-4 py-3 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between border-b min-h-[56px] shadow-sm" 
                        style={{ borderColor: 'rgba(99, 102, 241, 0.1)' }}
                        onClick={() => {
                            if (isMobileLayout && !isEditingHeader) {
                                setHeaderValue(headerTitle);
                                setIsEditingHeader(true);
                            }
                        }}
                        onDoubleClick={() => {
                            if (!isEditingHeader) {
                                setHeaderValue(headerTitle);
                                setIsEditingHeader(true);
                            }
                        }}
                    >
                        <div className="flex-1 flex items-center mr-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center mr-3 flex-none border border-indigo-100 shadow-sm">
                                <span className="text-sm">📌</span>
                            </div>
                            {isEditingHeader ? (
                                <textarea
                                    autoFocus
                                    className="w-full text-sm font-bold bg-white border border-purple-400 rounded px-2 py-1 outline-none shadow-sm text-left resize-none leading-snug"
                                    rows={2}
                                    value={headerValue}
                                    onBlur={() => {
                                        handleUpdateItemText(headerValue);
                                        setIsEditingHeader(false);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleUpdateItemText(headerValue);
                                            setIsEditingHeader(false);
                                        }
                                        if (e.key === 'Escape') {
                                            setIsEditingHeader(false);
                                        }
                                    }}
                                    onChange={(e) => setHeaderValue(e.target.value)}
                                />
                            ) : (
                                <span className="text-sm font-bold text-slate-700 line-clamp-2 leading-snug break-all">
                                    {headerTitle}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-red-500 uppercase tracking-wider">{sectionName}</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDeleteConfirm(!showDeleteConfirm);
                                }}
                                className={`p-1 transition-colors rounded ${showDeleteConfirm ? 'bg-red-100 text-red-600' : 'text-slate-400 hover:text-red-500'}`}
                                title="삭제"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>

                            {/* Local Delete Confirmation */}
                            {showDeleteConfirm && (
                                <>
                                    <div className="fixed inset-0 z-[1100]" onClick={() => setShowDeleteConfirm(false)} />
                                    <div className="absolute right-4 top-12 z-[1110] bg-white border border-red-100 shadow-2xl rounded-2xl p-3 w-48 animate-in zoom-in-95 fade-in duration-200">
                                        <p className="text-[11px] font-bold text-slate-700 mb-2 leading-tight">정말로 이 항목을{'\n'}삭제하시겠습니까?</p>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setShowDeleteConfirm(false)}
                                                className="flex-1 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-200 transition-colors"
                                            >취소</button>
                                            <button 
                                                onClick={() => {
                                                    handleDeleteItemFromModal();
                                                    setShowDeleteConfirm(false);
                                                }}
                                                className="flex-1 py-1.5 bg-red-500 text-white text-[10px] font-bold rounded-lg hover:bg-red-600 shadow-sm transition-colors"
                                            >삭제</button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    {/* Page Sub-title Input */}
                    <div 
                        className="flex-none px-4 py-2.5 border-b bg-gradient-to-r from-slate-50 to-white flex items-center group cursor-text transition-all duration-200 hover:bg-slate-100/50 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]"
                        style={{ borderBottomColor: 'rgba(99, 102, 241, 0.15)' }} // Subtle indigo border
                        onClick={() => isMobileLayout && setIsEditingTitle(true)}
                        onDoubleClick={() => setIsEditingTitle(true)}
                    >
                        {isEditingTitle ? (
                            <input 
                                autoFocus
                                className="w-full text-sm font-bold bg-white border border-blue-400 rounded px-2 py-0.5 outline-none shadow-sm text-left"
                                value={memoEditor.title}
                                placeholder={`목차${memoEditor.activePageIndex + 1}`}
                                onChange={(e) => handleUpdateTitle(e.target.value)}
                                onBlur={() => {
                                    setIsEditingTitle(false);
                                    handleSaveMemo(false);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setIsEditingTitle(false);
                                        handleSaveMemo(false);
                                    }
                                    if (e.key === 'Escape') setIsEditingTitle(false);
                                }}
                        />
                        ) : (
                            <span className={`text-sm truncate flex-1 text-left ${memoEditor.title ? 'text-slate-600 font-semibold' : 'text-slate-300 font-medium'}`}>
                                {memoEditor.title || `목차${memoEditor.activePageIndex + 1}`}
                            </span>
                        )}
                        {!isEditingTitle && (
                            <div className="flex items-center ml-2 bg-slate-100/80 rounded-lg border border-slate-200/60 p-0.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]">
                                {/* Page Navigation Segment */}
                                <div className="flex items-center">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (memoEditor.activePageIndex > 0) handleChangePage(memoEditor.activePageIndex - 1);
                                        }}
                                        disabled={memoEditor.activePageIndex === 0}
                                        className={`p-1.5 transition-all rounded-md ${memoEditor.activePageIndex === 0 ? 'text-slate-300' : 'text-slate-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm'}`}
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
                                    </button>
                                    <span className="text-[10px] font-bold text-slate-600 min-w-[28px] text-center tabular-nums">
                                        {memoEditor.activePageIndex + 1}<span className="text-slate-300 mx-0.5">/</span>{memoEditor.allValues.length}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (memoEditor.activePageIndex < memoEditor.allValues.length - 1) handleChangePage(memoEditor.activePageIndex + 1);
                                        }}
                                        disabled={memoEditor.activePageIndex === memoEditor.allValues.length - 1}
                                        className={`p-1.5 transition-all rounded-md ${memoEditor.activePageIndex === memoEditor.allValues.length - 1 ? 'text-slate-300' : 'text-slate-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm'}`}
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                                    </button>
                                </div>
                                
                                {/* Vertical Divider */}
                                <div className="w-px h-3 bg-slate-300/50 mx-0.5" />
                                
                                {/* ToC & Page Actions */}
                                <div className="flex items-center gap-0.5">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowToC(true);
                                        }}
                                        className="px-2.5 py-1.5 text-emerald-600 text-[10px] font-bold rounded-md transition-all hover:bg-white hover:text-emerald-700 hover:shadow-sm"
                                    >목차</button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddPage();
                                        }}
                                        className="p-1 text-blue-600 hover:bg-white rounded-md transition-all hover:shadow-sm"
                                        title="페이지 추가"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                                    </button>
                                    {memoEditor.allValues.length > 5 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeletePage();
                                            }}
                                            className="p-1 text-red-500 hover:bg-white rounded-md transition-all hover:shadow-sm"
                                            title="현재 페이지 삭제"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Mobile Editing Toolbar - Moved to Top */}
                    {isMobileLayout && memoEditor.isEditing && (
                        <div className="flex-none px-3 py-2 bg-slate-50 border-b border-slate-200">
                            <div className="flex bg-slate-200/60 p-1 rounded-xl gap-1 border border-slate-300/30">
                                {['•', ':', '→', '■', '◆'].map((sym, idx) => (
                                    <button
                                        key={idx}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            onInsertSymbol(sym);
                                        }}
                                        className="flex-1 py-1.5 text-base font-bold rounded-lg transition-all bg-white shadow-sm border border-slate-200 text-slate-700 active:bg-slate-100"
                                    >
                                        {sym}
                                    </button>
                                ))}
                                <div className="w-px h-4 bg-slate-300/50 mx-1 self-center" />
                                <button
                                    onClick={() => {
                                        handleSaveMemo(true, memoEditor.value || '');
                                    }}
                                    className="flex-none px-4 py-1.5 bg-green-500 text-white text-[11px] font-bold rounded-lg hover:bg-green-600 shadow-sm active:scale-95 transition-all border border-green-600"
                                >저장</button>
                                <button
                                    onClick={() => {
                                        let originalMemo = '';
                                        if (memoEditor.type === 'checklist') {
                                            originalMemo = activeTab.parkingInfo.checklistMemos?.[memoEditor.id!] || '';
                                        } else if (memoEditor.type === 'shopping') {
                                            originalMemo = activeTab.parkingInfo.shoppingListMemos?.[memoEditor.id!] || '';
                                        } else {
                                            originalMemo = activeTab.memos?.[memoEditor.id!] || '';
                                        }
                                        if (originalMemo) {
                                            setMemoEditor(prev => ({ ...prev, value: originalMemo, isEditing: false }));
                                        } else {
                                            setMemoEditor(prev => ({ ...prev, id: null, value: '', type: 'section' as const, isEditing: false }));
                                        }
                                    }}
                                    className="flex-none px-3 py-1.5 bg-white text-slate-500 text-[11px] font-bold rounded-lg border border-slate-200"
                                >취소</button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ToC Context Menu */}
            {showToC && (
                <>
                    <div 
                        className="fixed inset-0 z-[1090]"
                        onClick={() => setShowToC(false)}
                    />
                    <div 
                        className="absolute z-[1100] bg-white rounded-xl shadow-2xl border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-200 right-[2.5%] left-[2.5%] md:left-auto md:right-4 w-auto md:w-[455px] max-h-[90vh] md:max-h-[80vh] overflow-y-auto custom-scrollbar top-[84px]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-1.5 space-y-0.5">
                            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">목차 이동</div>
                            {memoEditor.allTitles.map((title, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setHighlightText(null);
                                        handleChangePage(idx);
                                        setShowToC(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-3 ${
                                        memoEditor.activePageIndex === idx 
                                        ? 'bg-indigo-50 text-indigo-600 font-bold' 
                                        : 'hover:bg-slate-50 text-slate-900 font-bold'
                                    }`}
                                >
                                    <span className={`text-[9px] w-4 h-4 flex-none flex items-center justify-center rounded-full ${
                                        memoEditor.activePageIndex === idx ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                                    }`}>{idx + 1}</span>
                                    <span className="text-sm truncate flex-1">{splitMetadata(title).text.trim() || '목차없음'}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {memoEditor.isEditing ? (
                <div className="flex flex-col flex-1 overflow-hidden relative regal-pad-bg">
                    <div className="flex-1 w-full overflow-y-auto custom-scrollbar relative">
                        <textarea
                            ref={memoTextareaRef as any}
                            className="memo-editor-textarea"
                            value={memoEditor.value || ''}
                            onChange={(e) => {
                                const newVal = e.target.value;
                                setMemoEditor(prev => ({ 
                                    ...prev, 
                                    value: newVal 
                                }));
                            }}
                            placeholder="여기에 메모를 작성하세요..."
                            onBlur={() => {
                                handleSaveMemo(false, memoEditor.value || '');
                            }}
                            style={{ 
                                paddingBottom: keyboardHeight > 0 ? `${64 + keyboardHeight}px` : '48px',
                                paddingLeft: '42px' // Match view mode padding for the pad lines
                            }}
                        />
                    </div>


                    {/* Emoji Context Menu Overlay */}
                    {contextMenu && (
                        <div 
                            className="emoji-context-menu fixed z-[2000] bg-blue-600/90 backdrop-blur-md rounded-2xl shadow-2xl border border-blue-400/20 p-2 flex flex-wrap gap-1.5 animate-in zoom-in-95 fade-in duration-200"
                            style={{ 
                                left: `${Math.min(contextMenu.x, window.innerWidth - 220)}px`, 
                                top: `${Math.min(contextMenu.y, window.innerHeight - 100)}px`,
                                width: '210px'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {memoSymbols.map((sym) => (
                                <button
                                    key={sym.label}
                                    title={sym.title}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        onInsertSymbol(sym.value);
                                        setContextMenu(null);
                                    }}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 text-slate-700 text-xl font-medium transition-all shadow-[2px_2px_0_0_rgba(15,23,42,0.05)] border border-slate-200 hover:border-indigo-200"
                                >{sym.label}</button>
                            ))}
                            <button
                                title="취소"
                                onMouseDown={(e) => { 
                                    e.preventDefault(); 
                                    setContextMenu(null);
                                }}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-slate-500 text-[10px] font-extrabold transition-all shadow-[2px_2px_0_0_rgba(15,23,42,0.05)] border border-slate-200 hover:border-slate-300"
                            >취소</button>
                            <button
                                title="붙여넣기"
                                onMouseDown={async (e) => {
                                    e.preventDefault();
                                    try {
                                        const text = await navigator.clipboard.readText();
                                        if (text) onInsertSymbol(text);
                                    } catch (err) {
                                        console.error('Failed to paste:', err);
                                    }
                                    setContextMenu(null);
                                }}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white hover:bg-orange-50 hover:text-orange-600 active:scale-95 text-slate-700 text-[10px] font-bold transition-all shadow-[2px_2px_0_0_rgba(15,23,42,0.05)] border border-slate-200 hover:border-orange-200"
                            >붙여넣기</button>
                            <button
                                title="복사"
                                onMouseDown={async (e) => {
                                    e.preventDefault();
                                    const selection = window.getSelection();
                                    const selectedText = selection?.toString();
                                    if (selectedText) {
                                        await navigator.clipboard.writeText(selectedText);
                                    } else {
                                        await navigator.clipboard.writeText(memoEditor.value);
                                    }
                                    setContextMenu(null);
                                }}
                                className="flex-1 h-10 px-3 flex items-center justify-center rounded-xl bg-white hover:bg-emerald-50 hover:text-emerald-600 active:scale-95 text-slate-700 text-xs font-bold transition-all shadow-[2px_2px_0_0_rgba(15,23,42,0.05)] border border-slate-200 hover:border-emerald-200"
                            >복사</button>
                        </div>
                    )}

                    {!isMobileLayout && (
                        <div className="p-3 bg-slate-50 border-t border-slate-200">
                            {/* Editing Mode Action Bar - Symbols (Desktop Only) */}
                            <div className="flex bg-slate-200/50 p-1 rounded-2xl gap-1 border border-slate-200/40">
                                {['•', '※', '#', '→', '■', '◆'].map((sym, idx) => (
                                    <button
                                        key={idx}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            onInsertSymbol(sym);
                                        }}
                                        className="flex-1 py-1.5 text-base md:text-lg font-bold rounded-xl transition-all hover:bg-white/80 active:bg-white text-slate-700 shadow-sm border border-transparent hover:border-slate-300/50"
                                    >
                                        {sym}
                                    </button>
                                ))}
                                <div className="w-px h-4 bg-slate-300/50 mx-1 self-center" />
                                <button
                                    onClick={() => {
                                        let originalMemo = '';
                                        if (memoEditor.type === 'checklist') {
                                            originalMemo = activeTab.parkingInfo.checklistMemos?.[memoEditor.id!] || '';
                                        } else if (memoEditor.type === 'shopping') {
                                            originalMemo = activeTab.parkingInfo.shoppingListMemos?.[memoEditor.id!] || '';
                                        } else {
                                            originalMemo = activeTab.memos?.[memoEditor.id!] || '';
                                        }
                                        if (originalMemo) {
                                            setMemoEditor(prev => ({ ...prev, value: originalMemo, isEditing: false }));
                                        } else {
                                            setMemoEditor(prev => ({ ...prev, id: null, value: '', type: 'section' as const, isEditing: false }));
                                        }
                                    }}
                                    className="flex-none px-4 py-1.5 bg-white text-slate-500 text-[11px] font-bold rounded-xl hover:bg-slate-100 transition-all shadow-sm border border-slate-200"
                                >취소</button>
                                <button
                                    onClick={() => handleSaveMemo(true, memoEditor.value || '')}
                                    className="flex-none px-6 py-1.5 bg-green-500 text-white text-[11px] font-bold rounded-xl hover:bg-green-600 shadow-[2px_2px_0_0_#15803d] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all border border-green-600"
                                >저장</button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* 보기 모드 */
                <>
                    <div
                        ref={contentRef}
                        onDoubleClick={() => setMemoEditor(prev => ({ ...prev, isEditing: true }))}
                        className="flex-1 w-full overflow-y-auto custom-scrollbar regal-pad-bg text-slate-700 text-base whitespace-pre-wrap break-words p-0 cursor-text hover:bg-slate-50 transition-colors duration-200 relative"
                        style={{ paddingLeft: '42px' }}
                    >
                        {/* Margin Symbol Overlay for Viewer */}
                        <div className="absolute left-0 top-0 bottom-0 w-[42px] z-10 select-none pointer-events-none">
                            {memoEditor.value.split('\n').map((line, idx) => {
                                // Only show bullet points, not ToC markers (#, ※)
                                const symbolMatch = line.match(/^([•\-])\s/);
                                const symbol = symbolMatch ? symbolMatch[1] : '';
                                return (
                                    <div 
                                        key={idx} 
                                        className="h-[28px] flex items-center justify-center text-slate-800 font-black text-sm pr-[11px]" // Pr to center in the 31px area before red lines
                                    >
                                        {symbol}
                                    </div>
                                );
                            })}
                        </div>
                        
                        {memoEditor.value ? (
                            <div className="prose prose-sm max-w-none select-text">
                                <LinkifiedText text={memoEditor.value} highlightText={highlightText} />
                            </div>
                        ) : (
                            <p className="text-slate-400 italic">메모가 없습니다.</p>
                        )}
                    </div>
                    <div className="p-3 bg-slate-50 border-t border-slate-200">
                        {/* Viewing Mode Action Bar */}
                        <div className="flex bg-slate-200/50 p-1 rounded-2xl gap-1 border border-slate-200/40">
                            {memoEditor.allValues.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleChangePage(idx)}
                                    className={`flex-1 py-1.5 text-xs md:text-sm font-bold rounded-xl transition-all ${
                                        memoEditor.activePageIndex === idx 
                                        ? 'bg-white text-indigo-600 shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                            <div className="w-px h-4 bg-slate-300/50 mx-1 self-center" />
                            <button 
                                onClick={() => handleOpenTagSelection({
                                    itemId: memoEditor.id!,
                                    sourceTabId: activeTab.id,
                                    sourceSectionId: memoEditor.sectionId!,
                                    itemText: headerTitle
                                })}
                                className="flex-none px-3 py-1.5 text-[10px] md:text-xs font-bold text-indigo-600 bg-white shadow-sm rounded-xl hover:bg-indigo-50 transition-all border border-indigo-100"
                            >태그</button>
                            <button
                                onClick={() => setMemoEditor(prev => ({ ...prev, isEditing: true }))}
                                className="flex-none px-3 py-1.5 text-[10px] md:text-xs font-bold text-blue-600 bg-white shadow-sm rounded-xl hover:bg-blue-50 transition-all border border-blue-100"
                            >수정</button>
                            <button 
                                onClick={() => {
                                    setMemoEditor(prev => ({ ...prev, id: null, sectionId: null }));
                                    if (memoEditor.openedFromMap) setNavigationMapOpen(true);
                                }}
                                className="flex-none px-3 py-1.5 text-[10px] md:text-xs font-bold text-slate-500 bg-white shadow-sm rounded-xl hover:bg-red-50 hover:text-red-500 transition-all border border-slate-200"
                            >닫기</button>
                        </div>
                    </div>
                </>
            )}

            {/* Page Navigation Arrows (Desktop & Mobile) */}
            <>
                {memoEditor.activePageIndex > 0 && (
                    <button
                        onClick={() => handleChangePage(memoEditor.activePageIndex - 1)}
                        className={`absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-9 h-14 md:w-10 md:h-10 rounded-r-xl md:rounded-full bg-white/40 md:bg-white/50 backdrop-blur-sm border border-slate-200/50 md:border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-lg transition-all z-10 flex items-center justify-center group/nav ${isMobileLayout ? 'shadow-sm active:bg-white active:scale-95 opacity-80' : 'md:opacity-0 group-hover:opacity-100'}`}
                        title="이전 페이지"
                    >
                        <svg className="w-6 h-6 transform group-hover/nav:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
                    </button>
                )}
                {memoEditor.activePageIndex < memoEditor.allValues.length - 1 && (
                    <button
                        onClick={() => handleChangePage(memoEditor.activePageIndex + 1)}
                        className={`absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-9 h-14 md:w-10 md:h-10 rounded-l-xl md:rounded-full bg-white/40 md:bg-white/50 backdrop-blur-sm border border-slate-200/50 md:border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-lg transition-all z-10 flex items-center justify-center group/nav ${isMobileLayout ? 'shadow-sm active:bg-white active:scale-95 opacity-80' : 'md:opacity-0 group-hover:opacity-100'}`}
                        title="다음 페이지"
                    >
                        <svg className="w-6 h-6 transform group-hover/nav:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                    </button>
                )}
            </>
            
            {showCopyToast && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs md:text-sm px-4 py-2 rounded-full shadow-xl z-[2000] animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-none whitespace-nowrap">
                    ✅ 복사되었습니다
                </div>
            )}
        </div>
    );

    if (isDesktopSplit) {
        return <div className="w-full h-full animate-in slide-in-from-right-4 duration-300">{PanelContent}</div>;
    }

    return (
        <div
            onClick={() => {
                setMemoEditor({ 
                    id: null, 
                    value: '', 
                    type: 'section', 
                    isEditing: false, 
                    sectionId: null,
                    title: '',
                    allValues: [],
                    allTitles: [],
                    activePageIndex: 0
                });
                if (memoEditor.openedFromMap) {
                    setNavigationMapOpen(true);
                }
            }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
        >
            {PanelContent}
        </div>
    );
};

export default MemoEditorPanel;
