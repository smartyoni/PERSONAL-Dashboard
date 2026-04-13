import React, { useState } from 'react';
import { AppData, Section, Tab, MemoEditorState } from '../types';
import ConfirmModal from './ConfirmModal';
import SectionMapModal from './SectionMapModal';
import TagSelectionModal from './TagSelectionModal';
import AddToCalendarModal from './AddToCalendarModal';
import MemoEditorPanel from './MemoEditorPanel';
import SearchModal from './SearchModal';

interface AppModalsProps {
    // Memo editor
    memoEditor: MemoEditorState;
    setMemoEditor: React.Dispatch<React.SetStateAction<MemoEditorState>>;
    memoTextareaRef: React.RefObject<HTMLDivElement>;
    handleSaveMemo: (isAutoSave?: boolean, newValue?: string) => void;
    handleSwipeMemo: (direction: 'left' | 'right') => void;
    handleDeleteItemFromModal: () => void;
    handleOpenTagSelection: (context?: { itemId: string; sourceTabId: string; sourceSectionId: string; itemText: string }) => void;
    handleInsertSymbol: (symbol: string) => void;
    handleChangePage: (index: number) => void;
    handleUpdateTitle: (newTitle: string) => void;
    handleUpdatePageTitle: (index: number, newTitle: string) => void;
    handleUpdateItemText: (newText: string) => void;
    handleAddPage: () => void;
    handleDeletePage: () => void;
    handleReorderPages: (oldIndex: number, newIndex: number) => void;
    handleCopyAllPages: () => Promise<boolean>;
    handlePasteAllPages: () => Promise<boolean>;
    memoSymbols: { label: string; value: string; title: string }[];
    activeTab: Tab;
    tagSelectionContext: { itemId: string; sourceTabId: string; sourceSectionId: string; itemText: string } | null;
    safeData: AppData;
    // Confirm modal
    modal: { isOpen: boolean; title: string; message: string; onConfirm: () => void };
    setModal: React.Dispatch<React.SetStateAction<any>>;
    handleNavigateTo: (tabId: string, sectionId?: string, itemId?: string) => void;
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
    handleMoveItem: (itemId: string, sourceTabId: string, sourceSectionId: string, targetTabId: string, targetSectionId: string, switchTab?: boolean) => void;
    handleShowMemo: (id: string, type?: MemoEditorState['type'], sectionId?: string | null, initialValue?: string, tabId?: string | null, openedFromMap?: boolean, pageIndex?: number) => void;
    searchModalOpen: boolean;
    setSearchModalOpen: (open: boolean) => void;
}

const AppModals: React.FC<AppModalsProps> = ({
    memoEditor, setMemoEditor, memoTextareaRef,
    handleSaveMemo, handleSwipeMemo, handleDeleteItemFromModal, handleInsertSymbol, handleChangePage, handleUpdateTitle,
    handleUpdatePageTitle,
    handleUpdateItemText,
    handleAddPage,
    handleDeletePage,
    handleReorderPages,
    handleCopyAllPages,
    handlePasteAllPages,
    memoSymbols,
    activeTab,
    tagSelectionContext, handleOpenTagSelection, safeData,
    modal, setModal,
    handleNavigateTo,
    sectionMapOpen, setSectionMapOpen, handleNavigateFromSectionMap,
    tagSelectionModalOpen, setTagSelectionModalOpen, handleNavigateFromTag,
    isMobileLayout, lastSectionPos, handleReturnToLastSection, handleOpenSectionMap,
    handleNavigateToInbox, handleToggleBookmarkView, isBookmarkView,
    calendarModal, setCalendarModal, handleConfirmCalendar, handleMoveItem, handleShowMemo,
    searchModalOpen, setSearchModalOpen
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
                    handleUpdateTitle={handleUpdateTitle}
                    handleUpdatePageTitle={handleUpdatePageTitle}
                    handleUpdateItemText={handleUpdateItemText}
                    handleAddPage={handleAddPage}
                    handleDeletePage={handleDeletePage}
                    onReorderPages={handleReorderPages}
                    handleCopyAllPages={handleCopyAllPages}
                    handlePasteAllPages={handlePasteAllPages}
                    memoSymbols={memoSymbols}
                    activeTab={activeTab}
                    safeData={safeData}
                    isMobileLayout={isMobileLayout}
                    isDesktopSplit={false}
                    handleMoveItem={handleMoveItem}
                    handleShowMemo={handleShowMemo}
                />
            )}

            <ConfirmModal
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                onConfirm={modal.onConfirm}
                onCancel={() => setModal((prev: any) => ({ ...prev, isOpen: false }))}
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


            <AddToCalendarModal
                isOpen={calendarModal.isOpen}
                itemText={calendarModal.itemText}
                onClose={() => setCalendarModal({ isOpen: false, itemText: '' })}
                onConfirm={handleConfirmCalendar}
            />

            <SearchModal
                isOpen={searchModalOpen}
                onClose={() => setSearchModalOpen(false)}
                safeData={safeData}
                handleNavigate={handleNavigateTo}
                handleShowMemo={handleShowMemo}
                currentTabId={activeTab.id}
            />
        </>
    );
};

export default AppModals;
