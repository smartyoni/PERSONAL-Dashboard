import React, { useState, useRef } from 'react';
import { AppData, Section, Tab, MemoEditorState } from '../types';
import MoveItemModal from './MoveItemModal';
import ConfirmModal from './ConfirmModal';
import NavigationMapModal from './NavigationMapModal';
import SectionMapModal from './SectionMapModal';
import TagSelectionModal from './TagSelectionModal';
import AddToCalendarModal from './AddToCalendarModal';
import LinkifiedText from './LinkifiedText';

interface AppModalsProps {
    // Memo editor
    memoEditor: MemoEditorState;
    setMemoEditor: React.Dispatch<React.SetStateAction<MemoEditorState>>;
    memoTextareaRef: React.RefObject<HTMLTextAreaElement>;
    handleSaveMemo: () => void;
    handleSwipeMemo: (direction: 'left' | 'right') => void;
    handleDeleteItemFromModal: () => void;
    handleInsertSymbol: (symbol: string) => void;
    memoSymbols: { label: string; value: string; title: string }[];
    setNavigationMapOpen: (open: boolean) => void;
    activeTab: Tab;
    // Move item modal
    moveItemModal: { isOpen: boolean; itemText: string; sourceTabId: string; sourceSectionId: string };
    setMoveItemModal: React.Dispatch<React.SetStateAction<any>>;
    handleMoveItem: (targetTabId: string, targetSectionId: string) => void;
    safeData: AppData;
    // Confirm modal
    modal: { isOpen: boolean; title: string; message: string; onConfirm: () => void };
    setModal: React.Dispatch<React.SetStateAction<any>>;
    // Navigation map
    navigationMapOpen: boolean;
    handleNavigateFromMap: (tabId: string, sectionId?: string) => void;
    handleShowMemoFromMap: (tabId: string, sectionId: string, itemId: string) => void;
    handleNavigateAndFocusFromMap: (tabId: string, sectionId: string) => void;
    // Section map
    sectionMapOpen: boolean;
    setSectionMapOpen: (open: boolean) => void;
    handleNavigateFromSectionMap: (sectionId: string) => void;
    // Tag selection
    tagSelectionModalOpen: boolean;
    setTagSelectionModalOpen: (open: boolean) => void;
    handleNavigateFromTag: (sectionId: string, tabId: string) => void;
    // Mobile FAB
    isMobileLayout: boolean;
    lastSectionPos: { tabId: string; sectionId: string } | null;
    handleReturnToLastSection: () => void;
    handleOpenSectionMap: () => void;
    // Calendar
    calendarModal: { isOpen: boolean; itemText: string };
    setCalendarModal: React.Dispatch<React.SetStateAction<{ isOpen: boolean; itemText: string }>>;
    handleConfirmCalendar: (startDate: string, endDate: string, isAllDay: boolean) => void;
}

const AppModals: React.FC<AppModalsProps> = ({
    memoEditor, setMemoEditor, memoTextareaRef,
    handleSaveMemo, handleSwipeMemo, handleDeleteItemFromModal, handleInsertSymbol, memoSymbols,
    setNavigationMapOpen, activeTab,
    moveItemModal, setMoveItemModal, handleMoveItem, safeData,
    modal, setModal,
    navigationMapOpen, handleNavigateFromMap, handleShowMemoFromMap, handleNavigateAndFocusFromMap,
    sectionMapOpen, setSectionMapOpen, handleNavigateFromSectionMap,
    tagSelectionModalOpen, setTagSelectionModalOpen, handleNavigateFromTag,
    isMobileLayout, lastSectionPos, handleReturnToLastSection, handleOpenSectionMap,
    calendarModal, setCalendarModal, handleConfirmCalendar
}) => {
    const touchStart = useRef<number | null>(null);
    const touchEnd = useRef<number | null>(null);

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

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!memoEditor.id || memoEditor.isEditing) return;

            if (e.key === 'ArrowLeft') {
                handleSwipeMemo('right'); // 물리적으로 왼쪽 키는 '이전' 항목 (오른쪽 스와이프와 동일)
            } else if (e.key === 'ArrowRight') {
                handleSwipeMemo('left'); // 물리적으로 오른쪽 키는 '다음' 항목 (왼쪽 스와이프와 동일)
            } else if (e.key === 'Escape') {
                setMemoEditor({ ...memoEditor, id: null, sectionId: null });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [memoEditor.id, memoEditor.isEditing, handleSwipeMemo, setMemoEditor]);

    const currentItem = React.useMemo(() => {
        if (!memoEditor.id) return null;
        if (memoEditor.type === 'checklist') return activeTab.parkingInfo.checklistItems.find(i => i.id === memoEditor.id);
        if (memoEditor.type === 'shopping') return activeTab.parkingInfo.shoppingListItems.find(i => i.id === memoEditor.id);
        const section = [activeTab.inboxSection, activeTab.quotesSection, ...activeTab.sections].find(s => s?.id === memoEditor.sectionId);
        return section?.items.find(i => i.id === memoEditor.id);
    }, [memoEditor.id, memoEditor.sectionId, activeTab]);

    return (
        <>
            {memoEditor.id && (
                <div
                    onClick={() => {
                        setMemoEditor({ id: null, value: '', type: 'section', isEditing: false, sectionId: null });
                        if (memoEditor.openedFromMap) {
                            setNavigationMapOpen(true);
                        }
                    }}
                    className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={memoEditor.isEditing ? undefined : handleTouchStart}
                        onTouchMove={memoEditor.isEditing ? undefined : handleTouchMove}
                        onTouchEnd={memoEditor.isEditing ? undefined : handleTouchEnd}
                        className="bg-white w-full max-w-2xl md:max-w-[800px] h-[90vh] shadow-2xl border-[1.5px] md:border-2 border-black flex flex-col relative"
                    >
                        {/* 헤더 부분에 제목 추가 */}
                        {!memoEditor.isEditing && currentItem && (
                            <div className="flex-none px-4 py-2 bg-slate-100 border-b border-black flex items-center justify-between">
                                <span className="text-sm font-bold truncate max-w-[80%] text-slate-700">📌 {currentItem.text}</span>
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                </div>
                            </div>
                        )}

                        {/* 읽기 모드 */}
                        {!memoEditor.isEditing && (
                            <>
                                <div
                                    onDoubleClick={() => setMemoEditor({ ...memoEditor, isEditing: true })}
                                    className="flex-1 w-full overflow-y-auto custom-scrollbar bg-slate-50 text-slate-700 text-base whitespace-pre-wrap break-words p-4 cursor-text hover:bg-slate-100 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-200"
                                >
                                    {memoEditor.value ? (
                                        <div className="prose prose-sm max-w-none select-text">
                                            <LinkifiedText text={memoEditor.value} />
                                        </div>
                                    ) : (
                                        <p className="text-slate-400 italic">메모가 없습니다.</p>
                                    )}
                                </div>
                                <div className="border-t border-slate-300 px-4 py-3 flex justify-end gap-3 flex-wrap bg-white">
                                    <button
                                        onClick={() => navigator.clipboard.writeText(memoEditor.value)}
                                        className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white font-medium border-2 border-black transition-colors"
                                    >📋 복사</button>
                                    {memoEditor.openedFromMap && (
                                        <button
                                            onClick={() => {
                                                setMemoEditor({ id: null, value: '', type: 'section', isEditing: false, sectionId: null });
                                                setNavigationMapOpen(true);
                                            }}
                                            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium border-2 border-indigo-200 transition-colors mr-auto"
                                        >🔙 목차로 돌아가기</button>
                                    )}
                                    <button
                                        onClick={() => setMemoEditor({ ...memoEditor, id: null, sectionId: null })}
                                        className="px-4 py-2 border-2 border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                                    >닫기</button>
                                    <button
                                        onClick={() => setMemoEditor({ ...memoEditor, isEditing: true })}
                                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium border-2 border-black transition-colors"
                                    >✏️ 수정</button>
                                    <button
                                        onClick={handleDeleteItemFromModal}
                                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium border-2 border-black transition-colors"
                                    >🗑️ 삭제</button>
                                </div>
                            </>
                        )}

                        {/* 편집 모드 */}
                        {memoEditor.isEditing && (
                            <>
                                <textarea
                                    ref={memoTextareaRef}
                                    autoFocus
                                    value={memoEditor.value}
                                    onChange={(e) => setMemoEditor({ ...memoEditor, value: e.target.value })}
                                    onBlur={(e) => {
                                        if (e.relatedTarget && (e.relatedTarget as HTMLElement).closest('.memo-symbol-toolbar')) return;
                                        handleSaveMemo();
                                    }}
                                    className="flex-1 w-full overflow-y-auto custom-scrollbar focus:outline-none text-slate-700 text-base resize-none p-4"
                                    placeholder="여기에 메모를 작성하세요..."
                                />
                                <div className="memo-symbol-toolbar flex-none flex items-center gap-1 px-2 py-1.5 bg-slate-100 border-t border-slate-200 overflow-x-auto">
                                    {memoSymbols.map((sym, idx) => (
                                        <button
                                            key={sym.label}
                                            title={sym.title}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                handleInsertSymbol(sym.value);
                                            }}
                                            className={`flex-none flex items-center justify-center rounded hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-medium transition-colors select-none ${idx < 3 ? 'w-10 h-10 text-2xl' : 'w-8 h-8 text-base'}`}
                                        >{sym.label}</button>
                                    ))}
                                    <div className="w-px h-5 bg-slate-300 mx-1 flex-none" />
                                    <button
                                        title="들여쓰기"
                                        onMouseDown={(e) => { e.preventDefault(); handleInsertSymbol('  '); }}
                                        className="flex-none px-2 h-8 flex items-center justify-center rounded hover:bg-slate-200 active:bg-slate-300 text-slate-500 text-xs font-medium transition-colors select-none"
                                    >Tab</button>
                                </div>
                                <div className="px-4 py-3 flex justify-end gap-3 pb-6">
                                    {memoEditor.openedFromMap && (
                                        <button
                                            onClick={() => {
                                                handleSaveMemo();
                                                setMemoEditor({ id: null, value: '', type: 'section', isEditing: false });
                                                setNavigationMapOpen(true);
                                            }}
                                            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium border-2 border-indigo-200 transition-colors mr-auto"
                                        >🔙 목차로 돌아가기</button>
                                    )}
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
                                                setMemoEditor({ ...memoEditor, value: originalMemo, isEditing: false });
                                            } else {
                                                setMemoEditor({ id: null, value: '', type: 'section', isEditing: false });
                                            }
                                        }}
                                        className="px-4 py-2 border-2 border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                                    >취소</button>
                                    <button
                                        onClick={handleSaveMemo}
                                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium border-2 border-black transition-colors"
                                    >💾 저장</button>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(memoEditor.value)}
                                        className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white font-medium border-2 border-black transition-colors"
                                    >📋 복사</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <MoveItemModal
                isOpen={moveItemModal.isOpen}
                itemText={moveItemModal.itemText}
                currentTabId={moveItemModal.sourceTabId}
                currentSectionId={moveItemModal.sourceSectionId}
                tabs={safeData.tabs}
                onMove={handleMoveItem}
                onCancel={() => setMoveItemModal((prev: any) => ({ ...prev, isOpen: false }))}
            />

            <ConfirmModal
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                onConfirm={modal.onConfirm}
                onCancel={() => setModal((prev: any) => ({ ...prev, isOpen: false }))}
            />

            <NavigationMapModal
                isOpen={navigationMapOpen}
                tabs={safeData.tabs}
                activeTabId={safeData.activeTabId}
                onClose={() => setNavigationMapOpen(false)}
                onNavigate={handleNavigateFromMap}
                onShowItemMemo={handleShowMemoFromMap}
                onNavigateAndFocus={handleNavigateAndFocusFromMap}
            />

            <SectionMapModal
                isOpen={sectionMapOpen}
                activeTab={activeTab}
                tabs={safeData.tabs}
                onClose={() => setSectionMapOpen(false)}
                onNavigate={handleNavigateFromSectionMap}
            />

            {tagSelectionModalOpen && (
                <TagSelectionModal
                    isOpen={tagSelectionModalOpen}
                    tabs={safeData.tabs}
                    onClose={() => setTagSelectionModalOpen(false)}
                    onNavigate={handleNavigateFromTag}
                />
            )}

            {isMobileLayout && (
                <div className="fixed bottom-24 right-6 z-[200] flex flex-col gap-3">
                    {lastSectionPos && (
                        <button
                            onClick={handleReturnToLastSection}
                            className="w-14 h-14 bg-white border-2 border-slate-800 text-slate-800 rounded-full shadow-xl flex items-center justify-center text-2xl active:scale-95 transition-all animate-in fade-in slide-in-from-left-4"
                            title="이전 섹션으로 되돌아가기"
                        >↩️</button>
                    )}
                    <button
                        onClick={handleOpenSectionMap}
                        className="w-14 h-14 bg-yellow-400 border-2 border-black text-black rounded-full shadow-xl flex items-center justify-center text-2xl active:scale-95 transition-all"
                        title="섹션 이동 맵 열기"
                    >📋</button>
                </div>
            )}

            <AddToCalendarModal
                isOpen={calendarModal.isOpen}
                itemText={calendarModal.itemText}
                onClose={() => setCalendarModal({ isOpen: false, itemText: '' })}
                onConfirm={handleConfirmCalendar}
            />
        </>
    );
};

export default AppModals;
