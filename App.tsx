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
    handleInsertSymbol, memoSymbols, handleChangePage, handleUpdateTitle,
    handleUpdateItemText,
    handleAddPage,
    handleDeletePage
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
            title: mainTab.todoManagementInfo3?.title || '업무 2',
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
        <div className="transition-all duration-300 overflow-hidden relative flex flex-col w-full">
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
        // 상세 화면 관련 프롭스 추가
        memoEditor={memoEditor}
        setMemoEditor={setMemoEditor}
        memoTextareaRef={memoTextareaRef}
        handleSaveMemo={handleSaveMemo}
        handleSwipeMemo={handleSwipeMemo}
        handleDeleteItemFromModal={handleDeleteItemFromModal}
        handleOpenTagSelectionFromMain={handleOpenTagSelection}
        handleInsertSymbol={handleInsertSymbol}
        handleChangePage={handleChangePage}
        handleUpdateTitle={handleUpdateTitle}
        handleUpdateItemText={handleUpdateItemText}
        handleAddPage={handleAddPage}
        handleDeletePage={handleDeletePage}
        memoSymbols={memoSymbols}
        handleMoveItem={handleMoveItem}
        onOpenItemMemoAtPage={(itemId, pageIndex, highlightText) => {
          // 1. 일반 섹션 탐색
          const allSections = [activeTab.inboxSection, ...activeTab.sections];
          const foundSection = allSections.find(s => s?.items.some(i => i.id === itemId));
          
          if (foundSection) {
            handleShowMemo(itemId, 'section', foundSection.id, undefined, activeTab.id);
          } else {
            // 2. 특수 위젯 탐색 (Parking, Todo)
            const pk = activeTab.parkingInfo;
            const td1 = activeTab.todoManagementInfo;
            const td2 = activeTab.todoManagementInfo2;
            const td3 = activeTab.todoManagementInfo3;

            let type: any = null;
            let sectionId: string | null = null;

            if (pk.checklistItems?.some(i => i.id === itemId)) { type = 'checklist'; sectionId = 'checklist'; }
            else if (pk.shoppingListItems?.some(i => i.id === itemId)) { type = 'shopping'; sectionId = 'shopping'; }
            else if (pk.remindersItems?.some(i => i.id === itemId)) { type = 'reminders'; sectionId = 'reminders'; }
            else if (pk.todoItems?.some(i => i.id === itemId)) { type = 'todo'; sectionId = 'todo'; }
            else if (pk.category5Items?.some(i => i.id === itemId)) { type = 'parkingCat5'; sectionId = 'parkingCat5'; }
            
            else if (td1.category1Items?.some(i => i.id === itemId)) { type = 'todoCat1'; sectionId = 'todoCat1'; }
            else if (td1.category2Items?.some(i => i.id === itemId)) { type = 'todoCat2'; sectionId = 'todoCat2'; }
            else if (td1.category3Items?.some(i => i.id === itemId)) { type = 'todoCat3'; sectionId = 'todoCat3'; }
            else if (td1.category4Items?.some(i => i.id === itemId)) { type = 'todoCat4'; sectionId = 'todoCat4'; }
            else if (td1.category5Items?.some(i => i.id === itemId)) { type = 'todoCat5'; sectionId = 'todoCat5'; }

            else if (td2.category1Items?.some(i => i.id === itemId)) { type = 'todo2Cat1'; sectionId = 'todo2Cat1'; }
            else if (td2.category2Items?.some(i => i.id === itemId)) { type = 'todo2Cat2'; sectionId = 'todo2Cat2'; }
            else if (td2.category3Items?.some(i => i.id === itemId)) { type = 'todo2Cat3'; sectionId = 'todo2Cat3'; }
            else if (td2.category4Items?.some(i => i.id === itemId)) { type = 'todo2Cat4'; sectionId = 'todo2Cat4'; }
            else if (td2.category5Items?.some(i => i.id === itemId)) { type = 'todo2Cat5'; sectionId = 'todo2Cat5'; }

            else if (td3?.category1Items?.some(i => i.id === itemId)) { type = 'todo3Cat1'; sectionId = 'todo3Cat1'; }
            else if (td3?.category2Items?.some(i => i.id === itemId)) { type = 'todo3Cat2'; sectionId = 'todo3Cat2'; }
            else if (td3?.category3Items?.some(i => i.id === itemId)) { type = 'todo3Cat3'; sectionId = 'todo3Cat3'; }
            else if (td3?.category4Items?.some(i => i.id === itemId)) { type = 'todo3Cat4'; sectionId = 'todo3Cat4'; }
            else if (td3?.category5Items?.some(i => i.id === itemId)) { type = 'todo3Cat5'; sectionId = 'todo3Cat5'; }

            if (type && sectionId) {
              handleShowMemo(itemId, type, sectionId, undefined, activeTab.id);
            }
          }

          setTimeout(() => {
            handleChangePage(pageIndex);
            if (highlightText) {
              setMemoEditor(prev => ({ ...prev, highlightText }));
            }
          }, 60);
        }}
      />
        </div>
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
          isMobileLayout={isMobileLayout}
          onNavigateToSection={handleNavigateFromMap}
          onOpenToc={() => {
            const mainTabId = safeData.tabs[0]?.id;
            if (mainTabId) handleNavigateFromMap(mainTabId, 'toc-section');
          }}
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
        handleUpdateTitle={handleUpdateTitle}
        handleUpdateItemText={handleUpdateItemText}
        handleAddPage={handleAddPage}
        handleDeletePage={handleDeletePage}
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
