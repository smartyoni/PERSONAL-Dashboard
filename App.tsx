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
import MemoEditorPanel from './components/MemoEditorPanel';
import { useSwipeGesture } from './hooks/useSwipeGesture';
import { useBackButton } from './hooks/useBackButton';

const App: React.FC = () => {
  // Core state & effects
  const {
    data, loading, error, updateData, safeData,
    sharedTextForInbox, handleClearSharedText,
    isOnline, isMobileLayout,
    modal, setModal,
    memoEditor, setMemoEditor, memoTextareaRef,
    calendarModal, setCalendarModal,
    handleParkingChange, handleTodoManagementChange, handleTodoManagement2Change, handleTodoManagement3Change, handleAddToCalendarClick, handleConfirmCalendar
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
    handleAddTab, handleRenameTab, handleToggleLockTab, handleToggleFavoriteTab,
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
    dragState, setDragState,
    handleAddSection, handleUpdateSection, handleUpdateInboxSection,
    handleDeleteSection,
    onSectionDragStart, onSectionDragOver, onSectionDrop, onSectionDragEnd,
    handleCrossSectionItemDrop, handleClearAll,
    handleMoveItem
  } = useSectionManagement(safeData, updateData, activeTab, setModal);

  // Phase 3: 메모 에디터 훅
  const {
    handleShowMemo, handleSwipeMemo, handleSaveMemo, handleDeleteItemFromModal,
    handleInsertSymbol, memoSymbols, handleChangePage
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
    handleNavigateFromTag, handleReturnToLastSection,
    handleOpenTagSelection, tagSelectionContext
  } = useNavigation(safeData, activeTab, handleSelectTab, setMemoEditor, handleMoveItem);

  // Phase 6: 뒤로가기 연동 훅
  useBackButton({
    memoEditor, setMemoEditor,
    modal, setModal,
    navigationMapOpen, setNavigationMapOpen,
    sectionMapOpen, setSectionMapOpen,
    tagSelectionModalOpen, setTagSelectionModalOpen,
    calendarModal, setCalendarModal,
    isBookmarkView, setIsBookmarkView
  });

  const isMainTab = activeTab.id === (safeData.tabs[0]?.id || '');

  // 메인 탭의 특수 섹션(개인, 업무루틴, 만드는것)에 5번째 카테고리 추가
  const autoAddRef = React.useRef(false);
  React.useEffect(() => {
    if (loading || !safeData || autoAddRef.current) return;
    
    let needsUpdate = false;
    const newTabs = [...safeData.tabs];
    const mainTab = { ...newTabs[0] };

    if (!mainTab) return;

    // 1. TodoManagementInfo (개인 섹션 등)
    if (!mainTab.todoManagementInfo.category5Title) {
        mainTab.todoManagementInfo = {
            ...mainTab.todoManagementInfo,
            category5Title: '항목 5',
            category5Items: [],
            category5Memos: {}
        };
        needsUpdate = true;
    }

    // 2. TodoManagementInfo2 (만드는것 섹션 등)
    if (!mainTab.todoManagementInfo2.category5Title) {
        mainTab.todoManagementInfo2 = {
            ...mainTab.todoManagementInfo2,
            category5Title: '항목 5',
            category5Items: [],
            category5Memos: {}
        };
        needsUpdate = true;
    }

    // 4. TodoManagementInfo3 (신규 추가된 할일관리 3)
    if (!mainTab.todoManagementInfo3 || !mainTab.todoManagementInfo3.category5Title) {
        mainTab.todoManagementInfo3 = {
            ...mainTab.todoManagementInfo3,
            title: mainTab.todoManagementInfo3?.title || '할일관리 3',
            category1Title: mainTab.todoManagementInfo3?.category1Title || '항목 1',
            category2Title: mainTab.todoManagementInfo3?.category2Title || '항목 2',
            category3Title: mainTab.todoManagementInfo3?.category3Title || '항목 3',
            category4Title: mainTab.todoManagementInfo3?.category4Title || '항목 4',
            category5Title: '항목 5',
            category1Items: mainTab.todoManagementInfo3?.category1Items || [],
            category2Items: mainTab.todoManagementInfo3?.category2Items || [],
            category3Items: mainTab.todoManagementInfo3?.category3Items || [],
            category4Items: mainTab.todoManagementInfo3?.category4Items || [],
            category5Items: [],
            category1Memos: mainTab.todoManagementInfo3?.category1Memos || {},
            category2Memos: mainTab.todoManagementInfo3?.category2Memos || {},
            category3Memos: mainTab.todoManagementInfo3?.category3Memos || {},
            category4Memos: mainTab.todoManagementInfo3?.category4Memos || {},
            category5Memos: {}
        };
        needsUpdate = true;
    }

    // 3. ParkingInfo (업무루틴 섹션 등)
    if (!mainTab.parkingInfo.category5Title) {
        mainTab.parkingInfo = {
            ...mainTab.parkingInfo,
            category5Title: '항목 5',
            category5Items: [],
            category5Memos: {}
        };
        needsUpdate = true;
    }

    if (needsUpdate) {
        autoAddRef.current = true;
        newTabs[0] = mainTab;
        updateData({ ...safeData, tabs: newTabs });
    }
  }, [loading, safeData, updateData]);

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

  const isDesktopMemoOpen = !isMobileLayout && !!memoEditor.id;

  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC] overflow-hidden text-slate-900">
      <div className="flex-1 flex flex-row overflow-hidden relative">
        <div className={`transition-all duration-300 overflow-hidden relative flex flex-col ${isDesktopMemoOpen ? 'w-[70%]' : 'w-full'}`}>
          <MainContent
        safeData={safeData} activeTab={activeTab} isMainTab={isMainTab}
        isBookmarkView={isBookmarkView} isMobileLayout={isMobileLayout}
        sharedTextForInbox={sharedTextForInbox} handleClearSharedText={handleClearSharedText}
        mainRef={mainRef}
        handleAddSection={handleAddSection} handleUpdateSection={handleUpdateSection}
        handleUpdateInboxSection={handleUpdateInboxSection}
        handleDeleteSection={handleDeleteSection} handleUpdateBookmarkSection={handleUpdateBookmarkSection}
        dragState={dragState} setDragState={setDragState}
        onSectionDragStart={onSectionDragStart} onSectionDragOver={onSectionDragOver}
        onSectionDrop={onSectionDrop} onSectionDragEnd={onSectionDragEnd}
        handleCrossSectionItemDrop={handleCrossSectionItemDrop}
        handleCrossBookmarkSectionDrop={handleCrossBookmarkSectionDrop}
        handleParkingChange={handleParkingChange}
        handleTodoManagementChange={handleTodoManagementChange}
        handleTodoManagement2Change={handleTodoManagement2Change}
        handleTodoManagement3Change={handleTodoManagement3Change}
        handleShowMemo={handleShowMemo}
        handleAddToCalendarClick={handleAddToCalendarClick}
        handleOpenTagSelection={handleOpenTagSelection}
        setNavigationMapOpen={setNavigationMapOpen} handleNavigateToInbox={handleNavigateToInbox}
        onToggleBookmarkView={handleToggleBookmarkView}
        highlightedSectionId={highlightedSectionId} activeTabColorConfig={activeTabColorConfig}
        lastSectionBeforeInbox={lastSectionBeforeInbox} handleReturnFromInbox={handleReturnFromInbox}
        handleGoToInbox={handleGoToInbox} setTagSelectionModalOpen={setTagSelectionModalOpen}
        focusQuickAddSectionId={focusQuickAddSectionId} setFocusQuickAddSectionId={setFocusQuickAddSectionId}
        isOnline={isOnline}
        onTocNavigate={handleNavigateFromMap}
        onTocNavigateAndFocus={handleNavigateAndFocusFromMap}
      />
        </div>
        
        {isDesktopMemoOpen && (
          <div className="w-[30%] bg-white border-l-2 border-slate-300 flex flex-col z-10 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.1)]">
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
              isDesktopSplit={true}
            />
          </div>
        )}
      </div>

      <div className="flex-none">
        <FooterTabs
          tabs={data.tabs} activeTabId={data.activeTabId}
          onSelectTab={handleSelectTab} onAddTab={handleAddTab}
          onRenameTab={handleRenameTab} onDeleteTab={handleDeleteTab}
          onToggleLockTab={handleToggleLockTab} onReorderTabs={handleReorderTabs}
          onNavigateToInbox={handleNavigateToInbox}
          hasInbox={!!safeData.tabs[0]?.inboxSection}
          isBookmarkView={isBookmarkView} onToggleBookmarkView={handleToggleBookmarkView}
          onToggleFavoriteTab={handleToggleFavoriteTab}
          isMobileLayout={isMobileLayout}
        />
      </div>

      <AppModals
        memoEditor={memoEditor} setMemoEditor={setMemoEditor}
        memoTextareaRef={memoTextareaRef}
        handleSaveMemo={handleSaveMemo}
        handleSwipeMemo={handleSwipeMemo}
        handleDeleteItemFromModal={handleDeleteItemFromModal}
        handleInsertSymbol={handleInsertSymbol} memoSymbols={memoSymbols}
        handleChangePage={handleChangePage}
        setNavigationMapOpen={setNavigationMapOpen} activeTab={activeTab}
        handleMoveItem={handleMoveItem} safeData={safeData}
        handleOpenTagSelection={handleOpenTagSelection}
        tagSelectionContext={tagSelectionContext}
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
