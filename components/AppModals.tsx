import React, { useState } from 'react';
import { AppData, Section, Tab, MemoEditorState } from '../types';
import ConfirmModal from './ConfirmModal';
import NavigationMapModal from './NavigationMapModal';
import SectionMapModal from './SectionMapModal';
import TagSelectionModal from './TagSelectionModal';
import AddToCalendarModal from './AddToCalendarModal';
import MemoEditorPanel from './MemoEditorPanel';

interface AppModalsProps {
    // Memo editor
    memoEditor: MemoEditorState;
    setMemoEditor: React.Dispatch<React.SetStateAction<MemoEditorState>>;
    memoTextareaRef: React.RefObject<HTMLDivElement>;
    handleSaveMemo: () => void;
    handleSwipeMemo: (direction: 'left' | 'right') => void;
    handleDeleteItemFromModal: () => void;
    handleOpenTagSelection: (context?: { itemId: string; sourceTabId: string; sourceSectionId: string; itemText: string }) => void;
    handleInsertSymbol: (symbol: string) => void;
    handleChangePage: (index: number) => void;
    memoSymbols: { label: string; value: string; title: string }[];
    setNavigationMapOpen: (open: boolean) => void;
    activeTab: Tab;
    tagSelectionContext: { itemId: string; sourceTabId: string; sourceSectionId: string; itemText: string } | null;
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
    handleNavigateToInbox: () => void;
    handleToggleBookmarkView: () => void;
    isBookmarkView: boolean;
    // Calendar
    calendarModal: { isOpen: boolean; itemText: string };
    setCalendarModal: React.Dispatch<React.SetStateAction<{ isOpen: boolean; itemText: string }>>;
    handleConfirmCalendar: (startDate: string, endDate: string, isAllDay: boolean) => void;
}

const AppModals: React.FC<AppModalsProps> = ({
    memoEditor, setMemoEditor, memoTextareaRef,
    handleSaveMemo, handleSwipeMemo, handleDeleteItemFromModal, handleInsertSymbol, handleChangePage, memoSymbols,
    setNavigationMapOpen, activeTab,
    tagSelectionContext, handleOpenTagSelection, safeData,
    modal, setModal,
    navigationMapOpen, handleNavigateFromMap, handleShowMemoFromMap, handleNavigateAndFocusFromMap,
    sectionMapOpen, setSectionMapOpen, handleNavigateFromSectionMap,
    tagSelectionModalOpen, setTagSelectionModalOpen, handleNavigateFromTag,
    isMobileLayout, lastSectionPos, handleReturnToLastSection, handleOpenSectionMap,
    handleNavigateToInbox, handleToggleBookmarkView, isBookmarkView,
    calendarModal, setCalendarModal, handleConfirmCalendar
}) => {
    const [isFabExpanded, setIsFabExpanded] = useState(false);

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: `
                [contenteditable]:empty:before {
                    content: attr(placeholder);
                    color: #94a3b8;
                    font-style: italic;
                    pointer-events: none;
                }
                [contenteditable] hr {
                    cursor: default;
                }
            `}} />
            
            {/* 오직 모바일 화면일 때만 모달로 띄움 */}
            {memoEditor.id && isMobileLayout && (
                <MemoEditorPanel
                    memoEditor={memoEditor} setMemoEditor={setMemoEditor}
                    memoTextareaRef={memoTextareaRef}
                    handleSaveMemo={handleSaveMemo} handleSwipeMemo={handleSwipeMemo}
                    handleDeleteItemFromModal={handleDeleteItemFromModal}
                    handleOpenTagSelection={handleOpenTagSelection}
                    handleInsertSymbol={handleInsertSymbol}
                    handleChangePage={handleChangePage}
                    memoSymbols={memoSymbols}
                    setNavigationMapOpen={setNavigationMapOpen}
                    activeTab={activeTab}
                    isMobileLayout={isMobileLayout}
                    isDesktopSplit={false}
                />
            )}

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
                    context={tagSelectionContext}
                />
            )}

            {isMobileLayout && (
                <div className="fixed bottom-24 right-6 z-[200] flex flex-col items-end gap-3">
                    {/* 확장된 메뉴 버튼들 */}
                    {isFabExpanded && (
                        <div className="flex flex-col gap-3 mb-2 animate-in slide-in-from-bottom-4 duration-300">
                            {/* 목차(App Map) 버튼 */}
                            <button
                                onClick={() => {
                                    const mainTabId = safeData.tabs[0]?.id;
                                    if (mainTabId) handleNavigateFromMap(mainTabId, 'toc-section');
                                    setIsFabExpanded(false);
                                }}
                                className="w-12 h-12 bg-white border-2 border-black text-black rounded-full shadow-lg flex items-center justify-center text-sm font-bold active:scale-95 transition-all"
                                title="목차 섹션으로 이동"
                            >목차</button>

                            {/* 인박스 바로가기 버튼 */}
                            <button
                                onClick={() => { handleNavigateToInbox(); setIsFabExpanded(false); }}
                                className="w-12 h-12 bg-white border-2 border-black text-black rounded-full shadow-lg flex items-center justify-center text-sm font-bold active:scale-95 transition-all"
                                title="인박스로 이동"
                            >인박스</button>

                            {/* 북마크 버튼 */}
                            <button
                                onClick={() => { handleToggleBookmarkView(); setIsFabExpanded(false); }}
                                className={`w-12 h-12 border-2 border-black rounded-full shadow-lg flex items-center justify-center text-sm font-bold active:scale-95 transition-all ${isBookmarkView ? 'bg-sky-400 text-white' : 'bg-white text-black'}`}
                                title="북마크 뷰 전환"
                            >북마크</button>
                        </div>
                    )}

                    {/* 메인 제어 버튼들 (항상 노출되는 중요 버튼들) */}
                    <div className="flex flex-col gap-3">
                        {lastSectionPos && (
                            <button
                                onClick={handleReturnToLastSection}
                                className="w-14 h-14 bg-white border-2 border-slate-800 text-slate-800 rounded-full shadow-xl flex items-center justify-center text-2xl active:scale-95 transition-all"
                                title="이전 섹션으로 되돌아가기"
                            >↩️</button>
                        )}

                        {/* 메인 토글 FAB */}
                        <button
                            onClick={() => setIsFabExpanded(!isFabExpanded)}
                            className={`w-14 h-14 border-2 border-black text-white rounded-full shadow-xl flex items-center justify-center text-2xl active:scale-95 transition-all transform ${isFabExpanded ? 'bg-slate-800 rotate-45' : 'bg-indigo-600'}`}
                            title="빠른 메뉴"
                        >
                            {isFabExpanded ? '＋' : '🚀'}
                        </button>
                    </div>
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
