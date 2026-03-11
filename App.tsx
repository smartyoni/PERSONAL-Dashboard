import React from 'react';
import { useAppState } from './hooks/useAppState';
import { useTabManagement } from './hooks/useTabManagement';
import { useSectionManagement } from './hooks/useSectionManagement';
import { useMemoEditor } from './hooks/useMemoEditor';
import { useNavigation } from './hooks/useNavigation';
import { useBookmarks } from './hooks/useBookmarks';
import FooterTabs from './components/FooterTabs';
import MainContent from './components/MainContent';
import AppModals from './components/AppModals';
import { useSwipeGesture } from './hooks/useSwipeGesture';

const App: React.FC = () => {
  // Core state & effects
  const {
    data, loading, error, updateData, safeData,
    sharedTextForInbox, handleClearSharedText,
    isOnline, isMobileLayout,
    modal, setModal,
    memoEditor, setMemoEditor, memoTextareaRef,
    calendarModal, setCalendarModal,
    handleParkingChange, handleTodoManagementChange, handleAddToCalendarClick, handleConfirmCalendar
  } = useAppState();

  // Phase 5: 북마크 훅
  const {
    isBookmarkView, setIsBookmarkView,
    handleToggleBookmarkView,
    handleUpdateBookmarkSection,
    handleCrossBookmarkSectionDrop
  } = useBookmarks(safeData, updateData);

  // Phase 1: 탭 관리 훅
  const {
    activeTab, currentTabIndex, activeTabColorConfig,
    handleAddTab, handleRenameTab, handleToggleLockTab,
    handleReorderTabs, handleDeleteTab, handleSelectTab,
    handleSwipeLeft, handleSwipeRight
  } = useTabManagement(safeData, updateData, setIsBookmarkView, setModal);

  const mainRef = useSwipeGesture({
    onSwipeLeft: memoEditor.id || modal.isOpen ? undefined : handleSwipeLeft,
    onSwipeRight: memoEditor.id || modal.isOpen ? undefined : handleSwipeRight,
    minSwipeDistance: 50,
    minSwipeVelocity: 0.3,
    maxVerticalMovement: 80
  });

  // Phase 2: 섹션 관리 훅
  const {
    dragState, setDragState, moveItemModal, setMoveItemModal,
    handleAddSection, handleUpdateSection, handleUpdateInboxSection,
    handleUpdateQuotesSection, handleDeleteSection,
    onSectionDragStart, onSectionDragOver, onSectionDrop, onSectionDragEnd,
    handleCrossSectionItemDrop, handleClearAll,
    handleOpenMoveItemModal, handleMoveItem
  } = useSectionManagement(safeData, updateData, activeTab, setModal);

  // Phase 3: 메모 에디터 훅
  const {
    handleShowMemo, handleSwipeMemo, handleSaveMemo, handleDeleteItemFromModal,
    handleInsertSymbol, memoSymbols
  } = useMemoEditor(safeData, updateData, activeTab, memoEditor, setMemoEditor, memoTextareaRef, setModal);

  // Phase 4: 네비게이션 훅
  const {
    navigationMapOpen, setNavigationMapOpen,
    sectionMapOpen, setSectionMapOpen,
    tagSelectionModalOpen, setTagSelectionModalOpen,
    lastSectionBeforeInbox, highlightedSectionId, lastSectionPos,
    focusQuickAddSectionId, setFocusQuickAddSectionId,
    handleNavigateFromMap, handleNavigateToInbox,
    handleGoToInbox, handleReturnFromInbox,
    handleOpenSectionMap, handleNavigateFromSectionMap,
    handleShowMemoFromMap, handleNavigateAndFocusFromMap,
    handleNavigateFromTag, handleReturnToLastSection
  } = useNavigation(safeData, activeTab, handleSelectTab, setMemoEditor);

  const isMainTab = activeTab.id === (safeData.tabs[0]?.id || '');

  // 로딩 상태
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-slate-800 mb-2">데이터 로드 실패</h2>
          <p className="text-sm text-slate-600 mb-4">{error.message}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">다시 시도</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC] overflow-hidden text-slate-900">
      <MainContent
        safeData={safeData} activeTab={activeTab} isMainTab={isMainTab}
        isBookmarkView={isBookmarkView} isMobileLayout={isMobileLayout}
        sharedTextForInbox={sharedTextForInbox} handleClearSharedText={handleClearSharedText}
        mainRef={mainRef}
        handleAddSection={handleAddSection} handleUpdateSection={handleUpdateSection}
        handleUpdateInboxSection={handleUpdateInboxSection} handleUpdateQuotesSection={handleUpdateQuotesSection}
        handleDeleteSection={handleDeleteSection} handleUpdateBookmarkSection={handleUpdateBookmarkSection}
        dragState={dragState} setDragState={setDragState}
        onSectionDragStart={onSectionDragStart} onSectionDragOver={onSectionDragOver}
        onSectionDrop={onSectionDrop} onSectionDragEnd={onSectionDragEnd}
        handleCrossSectionItemDrop={handleCrossSectionItemDrop}
        handleCrossBookmarkSectionDrop={handleCrossBookmarkSectionDrop}
        handleParkingChange={handleParkingChange}
        handleTodoManagementChange={handleTodoManagementChange}
        handleShowMemo={handleShowMemo}
        handleAddToCalendarClick={handleAddToCalendarClick} handleOpenMoveItemModal={handleOpenMoveItemModal}
        setNavigationMapOpen={setNavigationMapOpen} handleNavigateToInbox={handleNavigateToInbox}
        onToggleBookmarkView={handleToggleBookmarkView}
        highlightedSectionId={highlightedSectionId} activeTabColorConfig={activeTabColorConfig}
        lastSectionBeforeInbox={lastSectionBeforeInbox} handleReturnFromInbox={handleReturnFromInbox}
        handleGoToInbox={handleGoToInbox} setTagSelectionModalOpen={setTagSelectionModalOpen}
        focusQuickAddSectionId={focusQuickAddSectionId} setFocusQuickAddSectionId={setFocusQuickAddSectionId}
        isOnline={isOnline}
      />

      <div className="flex-none">
        <FooterTabs
          tabs={data.tabs} activeTabId={data.activeTabId}
          onSelectTab={handleSelectTab} onAddTab={handleAddTab}
          onRenameTab={handleRenameTab} onDeleteTab={handleDeleteTab}
          onToggleLockTab={handleToggleLockTab} onReorderTabs={handleReorderTabs}
          onNavigateToInbox={handleNavigateToInbox}
          hasInbox={!!safeData.tabs[0]?.inboxSection}
          isBookmarkView={isBookmarkView} onToggleBookmarkView={handleToggleBookmarkView}
        />
      </div>

      <AppModals
        memoEditor={memoEditor} setMemoEditor={setMemoEditor}
        memoTextareaRef={memoTextareaRef}
        handleSaveMemo={handleSaveMemo}
        handleSwipeMemo={handleSwipeMemo}
        handleDeleteItemFromModal={handleDeleteItemFromModal}
        handleOpenMoveItemModal={handleOpenMoveItemModal}
        handleInsertSymbol={handleInsertSymbol} memoSymbols={memoSymbols}
        setNavigationMapOpen={setNavigationMapOpen} activeTab={activeTab}
        moveItemModal={moveItemModal} setMoveItemModal={setMoveItemModal}
        handleMoveItem={handleMoveItem} safeData={safeData}
        modal={modal} setModal={setModal}
        navigationMapOpen={navigationMapOpen}
        handleNavigateFromMap={handleNavigateFromMap}
        handleShowMemoFromMap={handleShowMemoFromMap}
        handleNavigateAndFocusFromMap={handleNavigateAndFocusFromMap}
        sectionMapOpen={sectionMapOpen} setSectionMapOpen={setSectionMapOpen}
        handleNavigateFromSectionMap={handleNavigateFromSectionMap}
        tagSelectionModalOpen={tagSelectionModalOpen} setTagSelectionModalOpen={setTagSelectionModalOpen}
        handleNavigateFromTag={handleNavigateFromTag}
        isMobileLayout={isMobileLayout}
        lastSectionPos={lastSectionPos} handleReturnToLastSection={handleReturnToLastSection}
        handleOpenSectionMap={handleOpenSectionMap}
        handleNavigateToInbox={handleNavigateToInbox}
        handleToggleBookmarkView={handleToggleBookmarkView}
        isBookmarkView={isBookmarkView}
        calendarModal={calendarModal} setCalendarModal={setCalendarModal}
        handleConfirmCalendar={handleConfirmCalendar}
      />
    </div>
  );
};

export default App;
