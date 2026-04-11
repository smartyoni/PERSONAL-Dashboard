import React, { useMemo } from 'react';
import { Section, AppData, DragState, ParkingInfo, Tab, TodoManagementInfo, MemoEditorState, ListItem } from '../types';
import SectionCard from './SectionCard';
import TodoWidget from './TodoWidget';
import TocWidget from './TocWidget';
import DocumentTocWidget from './DocumentTocWidget';
import MemoEditorPanel from './MemoEditorPanel';
import Header from './Header';

interface MainContentProps {
    safeData: AppData;
    activeTab: Tab;
    isMainTab: boolean;
    isBookmarkView: boolean;
    isMobileLayout: boolean;
    sharedTextForInbox: string;
    handleClearSharedText: () => void;
    mainRef: React.RefObject<HTMLDivElement>;
    // Section handlers
    handleAddSection: () => void;
    handleUpdateSection: (updated: Section, newMemos?: { [key: string]: string }) => void;
    handleUpdateInboxSection: (updated: Section, newMemos?: { [key: string]: string }) => void;
    handleDeleteSection: (id: string) => void;
    handleUpdateBookmarkSection: (updated: Section, newMemos?: { [key: string]: string }) => void;
    // Drag
    dragState: DragState;
    setDragState: React.Dispatch<React.SetStateAction<DragState>>;
    onSectionDragStart: (id: string) => void;
    onSectionDragOver: (e: React.DragEvent, id: string) => void;
    onSectionDrop: (e: React.DragEvent, id: string) => void;
    onSectionDragEnd: () => void;
    handleCrossSectionItemDrop: (draggedItemId: string, sourceSectionId: string, targetSectionId: string, sourceTabId: string, targetTabId: string, targetItemId?: string | null) => void;
    handleCrossBookmarkSectionDrop: (draggedItemId: string, sourceSectionId: string, targetSectionId: string, targetItemId?: string | null) => void;
    // Parking
    handleParkingChange: (newInfo: ParkingInfo) => void;
    handleTodoManagementChange: (newInfo: TodoManagementInfo) => void;
    handleTodoManagement2Change: (newInfo: TodoManagementInfo) => void;
    handleTodoManagement3Change: (newInfo: TodoManagementInfo) => void;
    // Memo & Calendar
    handleShowMemo: (id: string, type?: MemoEditorState['type'], sectionId?: string | null, initialValue?: string, tabId?: string | null) => void;
    handleAddToCalendarClick: (itemText: string) => void;
    handleOpenTagSelection: (context?: { itemId: string; sourceTabId: string; sourceSectionId: string; itemText: string }) => void;
    // Navigation
    setNavigationMapOpen: (open: boolean) => void;
    handleNavigateToInbox: () => void;
    onToggleBookmarkView: () => void;
    highlightedSectionId: string | null;
    highlightedItemId?: string | null;
    activeTabColorConfig: { text: string; bgLight: string };
    lastSectionBeforeInbox: { tabId: string; sectionId: string } | null;
    handleReturnFromInbox: () => void;
    handleGoToInbox: (tabId: string, sectionId: string) => void;
    setTagSelectionModalOpen: (open: boolean) => void;
    focusQuickAddSectionId: string | null;
    setFocusQuickAddSectionId: (id: string | null) => void;
    isOnline: boolean;
    onTocNavigate: (tabId: string, sectionId?: string, itemId?: string) => void;
    onTocNavigateAndFocus: (tabId: string, sectionId?: string) => void;
    onOpenSearch?: () => void;
    onOpenItemMemoAtPage?: (itemId: string, pageIndex: number, highlightText?: string) => void;

    // Memo Editor Panel Props
    memoEditor: MemoEditorState;
    setMemoEditor: React.Dispatch<React.SetStateAction<MemoEditorState>>;
    memoTextareaRef: React.RefObject<HTMLDivElement>;
    handleSaveMemo: (isAutoSave?: boolean, newValue?: string) => void;
    handleSwipeMemo: (direction: 'left' | 'right') => void;
    handleDeleteItemFromModal: () => void;
    handleOpenTagSelectionFromMain: (context?: { itemId: string; sourceTabId: string; sourceSectionId: string; itemText: string }) => void;
    handleInsertSymbol: (symbol: string) => void;
    handleChangePage: (index: number) => void;
    handleUpdateTitle: (title: string) => void;
    handleUpdatePageTitle: (index: number, title: string) => void;
    handleUpdateItemText: (newText: string) => void;
    handleAddPage: () => void;
    handleDeletePage: () => void;
    handleReorderPages: (oldIndex: number, newIndex: number) => void;
    memoSymbols: { label: string; value: string; title: string }[];
    handleMoveItem: (itemId: string, sourceTabId: string, sourceSectionId: string, targetTabId: string, targetSectionId: string, switchTab?: boolean) => void;
}

const MainContent: React.FC<MainContentProps> = ({
    safeData, activeTab, isMainTab, isBookmarkView, isMobileLayout,
    sharedTextForInbox, handleClearSharedText, mainRef,
    handleAddSection, handleUpdateSection, handleUpdateInboxSection,
    handleDeleteSection, handleUpdateBookmarkSection,
    dragState, setDragState,
    onSectionDragStart, onSectionDragOver, onSectionDrop, onSectionDragEnd,
    handleCrossSectionItemDrop, handleCrossBookmarkSectionDrop,
    handleParkingChange, handleShowMemo, handleAddToCalendarClick,
    handleOpenTagSelection, setNavigationMapOpen, handleNavigateToInbox,
    onToggleBookmarkView,
    highlightedSectionId, highlightedItemId, activeTabColorConfig,
    lastSectionBeforeInbox, handleReturnFromInbox, handleGoToInbox,
    handleTodoManagementChange,
    handleTodoManagement2Change,
    handleTodoManagement3Change,
    setTagSelectionModalOpen, focusQuickAddSectionId, setFocusQuickAddSectionId,
    isOnline,
    onOpenSearch,
    onTocNavigate,
    onTocNavigateAndFocus,
    onOpenItemMemoAtPage,
    // New Props
    memoEditor, setMemoEditor, memoTextareaRef,
    handleSaveMemo, handleSwipeMemo, handleDeleteItemFromModal,
    handleOpenTagSelectionFromMain, handleInsertSymbol, handleChangePage,
    handleUpdateTitle, handleUpdatePageTitle, handleUpdateItemText, handleAddPage, handleDeletePage,
    handleReorderPages,
    memoSymbols, handleMoveItem,
}) => {
    const isSubTab = activeTab.name === '서브';
    const isBookmarkTab = activeTab.id === 'bookmarks';

    return (
        <>
            {/* 오프라인 배너 */}
            {!isOnline && (
                <div className="flex-none bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium">
                    <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>오프라인 상태 - 네트워크 연결을 확인하세요</span>
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-row overflow-hidden">
                <div ref={mainRef} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-none bg-[#F8FAFC] pb-1 md:pb-0">
                        <Header
                            onAddSection={handleAddSection}
                            onOpenNavigationMap={() => setNavigationMapOpen(true)}
                            onNavigateToInbox={handleNavigateToInbox}
                            isBookmarkView={isBookmarkView}
                            onToggleBookmarkView={onToggleBookmarkView}
                            parkingInfo={activeTab.parkingInfo}
                            onParkingChange={handleParkingChange}
                            onOpenSearch={onOpenSearch}
                        />
                    </div>

                    <main className="flex-1 overflow-y-auto custom-scrollbar px-0 md:px-0.5 pb-24 pt-1 md:pt-0">
                        {isBookmarkView ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-0.5 md:gap-1 pt-1" style={{ gridAutoRows: 'auto' }}>
                                {(safeData.bookmarkSections || []).map((section) => (
                                    <div key={section.id} className={isMobileLayout ? "h-[250px]" : "h-[480px] lg:h-[calc(100vh-160px)]"}>
                                        <SectionCard
                                            section={section}
                                            itemMemos={{}}
                                            onUpdateSection={handleUpdateBookmarkSection}
                                            onDeleteSection={() => { }}
                                            onShowItemMemo={(id, initialValue) => handleShowMemo(id, 'section', section.id, initialValue, activeTab.id)}
                                            onOpenItemMemoAtPage={onOpenItemMemoAtPage}
                                            onMoveItem={() => { }}
                                            onAddToCalendar={handleAddToCalendarClick}
                                            dragState={dragState}
                                            setDragState={setDragState}
                                            onSectionDragStart={() => { }}
                                            onSectionDragOver={() => { }}
                                            onSectionDrop={() => { }}
                                            onSectionDragEnd={() => { }}
                                            isHighlighted={false}
                                            isInboxSection={false}
                                            isBookmarkTab={true}
                                            tabColorBg={'bg-sky-100'}
                                            onCrossSectionDrop={handleCrossBookmarkSectionDrop}
                                            onItemDoubleClick={() => setTagSelectionModalOpen(true)}
                                            onItemTagClick={(itemId, itemText) => handleOpenTagSelection({ itemId, itemText, sourceSectionId: section.id, sourceTabId: activeTab.id })}
                                            isMobileLayout={isMobileLayout}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={`grid gap-1 md:gap-1.5 ${isMobileLayout ? 'h-auto grid-cols-1' : (isMainTab ? 'h-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-[0.9fr_1.2fr_0.8fr_1.5fr_1.2fr]' : 'h-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-[1.2fr_1.2fr_0.8fr_1.5fr_1.2fr]')}`} style={{ gridAutoRows: 'auto' }}>
                                {isMainTab ? (
                                    <>
                                        {/* 0. 전체 목차 (TocWidget) */}
                                        <div data-section-id="toc-section" className={isMobileLayout ? "h-auto" : "h-[calc(100vh-160px)]"}>
                                            <TocWidget
                                                tabs={safeData.tabs}
                                                activeTabId={activeTab.id}
                                                onNavigate={onTocNavigate}
                                                onNavigateAndFocus={onTocNavigateAndFocus}
                                            />
                                        </div>

                                        {/* 1. 업무 위젯 (TodoWidget) - 기존 5번 컬럼 (다시 2번으로 복귀) */}
                                        <div className={isMobileLayout ? "h-[850px]" : "h-[calc(100vh-160px)]"}>
                                            <TodoWidget
                                                info={activeTab.todoManagementInfo}
                                                onChange={handleTodoManagementChange}
                                                onAddToCalendar={handleAddToCalendarClick}
                                                mainHeaderClass="text-sm font-black text-orange-900 bg-orange-100 flex items-center gap-2 flex-shrink-0 px-2 h-[48px] -mx-2 -mt-2 mb-2 border-b-2 border-black"
                                                subHeaderClass="text-[17px] font-bold text-blue-600"
                                                todoTagClass="text-[10px] font-normal text-orange-600 font-mono"
                                                onOpenItemMemoAtPage={onOpenItemMemoAtPage}
                                                dragState={dragState}
                                                setDragState={setDragState}
                                                onCrossSectionDrop={(draggedId, srcId, tgtId, tgtItem) => handleCrossSectionItemDrop(draggedId, srcId, tgtId, activeTab.id, activeTab.id, tgtItem)}
                                                onItemTagClick={(itemId, sectionId, itemText) => handleOpenTagSelection({ itemId, itemText, sourceSectionId: sectionId, sourceTabId: activeTab.id })}
                                                dataSectionId="todo-widget-1"
                                                activeTabId={activeTab.id}
                                                highlightedItemId={highlightedItemId}
                                            />
                                        </div>

                                        {/* 2. 문서 목차 (Document ToC) */}
                                        <div className={isMobileLayout ? "hidden" : "h-[calc(100vh-160px)] min-w-0"}>
                                            <DocumentTocWidget
                                                memoEditor={memoEditor}
                                                onChangePage={handleChangePage}
                                                onUpdatePageTitle={handleUpdatePageTitle}
                                                onReorderPages={handleReorderPages}
                                                onAddPage={handleAddPage}
                                                onScrollToLine={(lineIndex: number, pageIndex: number) => {
                                                    window.dispatchEvent(new CustomEvent('editor-scroll-to-line', {
                                                        detail: { lineIndex, pageIndex }
                                                    }));
                                                }}
                                            />
                                        </div>

                                        {/* 3. 상세 화면 (MemoEditorPanel) */}
                                        <div className={isMobileLayout ? "hidden" : "h-[calc(100vh-160px)] bg-white border-2 border-black rounded-2xl overflow-hidden shadow-sm"}>
                                            <MemoEditorPanel
                                                memoEditor={memoEditor}
                                                setMemoEditor={setMemoEditor}
                                                memoTextareaRef={memoTextareaRef}
                                                handleSaveMemo={handleSaveMemo}
                                                handleSwipeMemo={handleSwipeMemo}
                                                handleDeleteItemFromModal={handleDeleteItemFromModal}
                                                handleOpenTagSelection={handleOpenTagSelectionFromMain}
                                                handleInsertSymbol={handleInsertSymbol}
                                                handleChangePage={handleChangePage}
                                                handleUpdateTitle={handleUpdateTitle}
                                                handleUpdatePageTitle={handleUpdatePageTitle}
                                                handleUpdateItemText={handleUpdateItemText}
                                                handleAddPage={handleAddPage}
                                                handleDeletePage={handleDeletePage}
                                                onReorderPages={handleReorderPages}
                                                memoSymbols={memoSymbols}
                                                setNavigationMapOpen={setNavigationMapOpen}
                                                activeTab={activeTab}
                                                safeData={safeData}
                                                isMobileLayout={isMobileLayout}
                                                isDesktopSplit={true}
                                                handleMoveItem={handleMoveItem}
                                                handleShowMemo={handleShowMemo}
                                            />
                                        </div>

                                        {/* 4. 나머지 섹션들 + 5. IN-BOX (하나의 컬럼으로 통합) - 기존 2번 컬럼 (다시 5번으로 복귀) */}
                                        <div className={`flex flex-col gap-1.5 ${isMobileLayout ? 'h-auto' : 'h-full'}`}>
                                            {activeTab.sections.map((section, idx) => (
                                                <div key={section.id} className={isMobileLayout ? "h-[250px]" : "h-[calc(100vh-160px)]"}>
                                                    <SectionCard
                                                        bgIndex={idx + 1}
                                                        section={section}
                                                        itemMemos={activeTab.memos}
                                                        onUpdateSection={handleUpdateSection}
                                                        onDeleteSection={handleDeleteSection}
                                                        onShowItemMemo={(id, initialValue) => handleShowMemo(id, 'section', section.id, initialValue, activeTab.id)}
                                                        onOpenItemMemoAtPage={onOpenItemMemoAtPage}
                                                        onMoveItem={() => { }}
                                                        onAddToCalendar={handleAddToCalendarClick}
                                                        dragState={dragState}
                                                        setDragState={setDragState}
                                                        onSectionDragStart={() => onSectionDragStart(section.id)}
                                                        onSectionDragOver={(e) => onSectionDragOver(e, section.id)}
                                                        onSectionDrop={(e) => onSectionDrop(e, section.id)}
                                                        onSectionDragEnd={onSectionDragEnd}
                                                        isHighlighted={section.id === highlightedSectionId}
                                                        highlightedItemId={highlightedItemId}
                                                        isFullHeight={true}
                                                        tabColorText={activeTabColorConfig.text}
                                                        tabColorBg={activeTabColorConfig.bgLight}
                                                        onCrossSectionDrop={(draggedId, srcId, tgtId, tgtItem) => handleCrossSectionItemDrop(draggedId, srcId, tgtId, activeTab.id, activeTab.id, tgtItem)}
                                                        onGoToInbox={() => handleGoToInbox(activeTab.id, section.id)}
                                                        onItemDoubleClick={() => setTagSelectionModalOpen(true)}
                                                        onItemTagClick={(itemId, itemText) => handleOpenTagSelection({ itemId, itemText, sourceSectionId: section.id, sourceTabId: activeTab.id })}
                                                        isReturnVisible={lastSectionBeforeInbox?.tabId === activeTab.id && lastSectionBeforeInbox?.sectionId === section.id}
                                                        onReturnFromInbox={handleReturnFromInbox}
                                                        autoFocusQuickAdd={focusQuickAddSectionId === section.id}
                                                        onClearFocus={() => setFocusQuickAddSectionId(null)}
                                                        isMobileLayout={isMobileLayout}
                                                    />
                                                </div>
                                            ))}

                                            {/* IN-BOX 섹션 */}
                                            <div className={isMobileLayout ? "h-[635px]" : "h-[calc(100vh-160px)]"}>
                                                <SectionCard
                                                    bgIndex={0}
                                                    section={activeTab.inboxSection}
                                                    itemMemos={activeTab.memos}
                                                    onUpdateSection={handleUpdateInboxSection}
                                                    onDeleteSection={() => { }}
                                                    onShowItemMemo={(id, initialValue) => handleShowMemo(id, 'section', activeTab.inboxSection.id, initialValue, activeTab.id)}
                                                    onOpenItemMemoAtPage={onOpenItemMemoAtPage}
                                                    onMoveItem={() => { }}
                                                    onAddToCalendar={handleAddToCalendarClick}
                                                    dragState={dragState}
                                                    setDragState={setDragState}
                                                    onSectionDragStart={() => { }}
                                                    onSectionDragOver={() => { }}
                                                    onSectionDrop={() => { }}
                                                    onSectionDragEnd={() => { }}
                                                    onCrossSectionDrop={(draggedId, srcId, tgtId, tgtItem) => handleCrossSectionItemDrop(draggedId, srcId, tgtId, activeTab.id, activeTab.id, tgtItem)}
                                                    onReturnFromInbox={handleReturnFromInbox}
                                                    isReturnVisible={!!lastSectionBeforeInbox}
                                                    isHighlighted={activeTab.inboxSection.id === highlightedSectionId}
                                                    highlightedItemId={highlightedItemId}
                                                    isInboxSection={true}
                                                    isFullHeight={true}
                                                    tabColorText={activeTabColorConfig.text}
                                                    tabColorBg={activeTabColorConfig.bgLight}
                                                    initialQuickAddValue={sharedTextForInbox}
                                                    onQuickAddValuePopulated={handleClearSharedText}
                                                    onItemDoubleClick={() => setTagSelectionModalOpen(true)}
                                                    onItemTagClick={(itemId, itemText) => handleOpenTagSelection({ itemId, itemText, sourceSectionId: activeTab.inboxSection.id, sourceTabId: activeTab.id })}
                                                    autoFocusQuickAdd={focusQuickAddSectionId === activeTab.inboxSection.id}
                                                    onClearFocus={() => setFocusQuickAddSectionId(null)}
                                                    isMobileLayout={isMobileLayout}
                                                />
                                            </div>
                                        </div>

                                    </>
                                ) : isSubTab ? (
                                    /* 서브 탭 레이아웃 - 3개 할일 관리 + 목차 + 상세 화면 */
                                    <>
                                        {/* 컬럼 1: 할일 관리 1 */}
                                        <div className={isMobileLayout ? "h-[850px]" : "h-[calc(100vh-160px)]"}>
                                            <TodoWidget
                                                info={activeTab.todoManagementInfo}
                                                onChange={handleTodoManagementChange}
                                                onAddToCalendar={handleAddToCalendarClick}
                                                mainHeaderClass="text-sm font-black text-emerald-900 bg-emerald-100 flex items-center gap-2 flex-shrink-0 px-2 h-[48px] -mx-2 -mt-2 mb-2 border-b-2 border-black"
                                                subHeaderClass="text-[17px] font-bold text-rose-600"
                                                todoTagClass="text-[10px] font-normal text-rose-600 font-mono"
                                                onOpenItemMemoAtPage={onOpenItemMemoAtPage}
                                                dragState={dragState}
                                                setDragState={setDragState}
                                                onCrossSectionDrop={handleCrossSectionItemDrop}
                                                onItemTagClick={(itemId, sectionId, itemText) => handleOpenTagSelection({ itemId, itemText, sourceSectionId: sectionId, sourceTabId: activeTab.id })}
                                                dataSectionId="sub-todo-widget-1"
                                                activeTabId={activeTab.id}
                                                highlightedItemId={highlightedItemId}
                                                maxCategories={3}
                                            />
                                        </div>

                                        {/* 컬럼 2: 할일 관리 2 */}
                                        <div className={isMobileLayout ? "h-[850px]" : "h-[calc(100vh-160px)]"}>
                                            <TodoWidget
                                                info={activeTab.todoManagementInfo2}
                                                onChange={handleTodoManagement2Change}
                                                onAddToCalendar={handleAddToCalendarClick}
                                                mainHeaderClass="text-sm font-black text-emerald-900 bg-emerald-100 flex items-center gap-2 flex-shrink-0 px-2 h-[48px] -mx-2 -mt-2 mb-2 border-b-2 border-black"
                                                subHeaderClass="text-[17px] font-bold text-emerald-600"
                                                todoTagClass="text-[10px] font-normal text-emerald-600 font-mono"
                                                onOpenItemMemoAtPage={onOpenItemMemoAtPage}
                                                dragState={dragState}
                                                setDragState={setDragState}
                                                onCrossSectionDrop={handleCrossSectionItemDrop}
                                                onItemTagClick={(itemId, sectionId, itemText) => handleOpenTagSelection({ itemId, itemText, sourceSectionId: sectionId, sourceTabId: activeTab.id })}
                                                dataSectionId="sub-todo-widget-2"
                                                activeTabId={activeTab.id}
                                                highlightedItemId={highlightedItemId}
                                                maxCategories={3}
                                            />
                                        </div>

                                        {/* 컬럼 3: 문서 목차 (Document ToC) */}
                                        <div className={isMobileLayout ? "hidden" : "h-[calc(100vh-160px)] min-w-0"}>
                                            <DocumentTocWidget
                                                memoEditor={memoEditor}
                                                onChangePage={handleChangePage}
                                                onUpdatePageTitle={handleUpdatePageTitle}
                                                onReorderPages={handleReorderPages}
                                                onAddPage={handleAddPage}
                                                onScrollToLine={(lineIndex: number, pageIndex: number) => {
                                                    window.dispatchEvent(new CustomEvent('editor-scroll-to-line', {
                                                        detail: { lineIndex, pageIndex }
                                                    }));
                                                }}
                                            />
                                        </div>

                                        {/* 컬럼 4: 상세 화면 (MemoEditorPanel) */}
                                        <div className={isMobileLayout ? "hidden" : "h-[calc(100vh-160px)] bg-white border-2 border-black rounded-2xl overflow-hidden shadow-sm"}>
                                            <MemoEditorPanel
                                                memoEditor={memoEditor}
                                                setMemoEditor={setMemoEditor}
                                                memoTextareaRef={memoTextareaRef}
                                                handleSaveMemo={handleSaveMemo}
                                                handleSwipeMemo={handleSwipeMemo}
                                                handleDeleteItemFromModal={handleDeleteItemFromModal}
                                                handleOpenTagSelection={handleOpenTagSelectionFromMain}
                                                handleInsertSymbol={handleInsertSymbol}
                                                handleChangePage={handleChangePage}
                                                handleUpdateTitle={handleUpdateTitle}
                                                handleUpdatePageTitle={handleUpdatePageTitle}
                                                handleUpdateItemText={handleUpdateItemText}
                                                handleAddPage={handleAddPage}
                                                handleDeletePage={handleDeletePage}
                                                onReorderPages={handleReorderPages}
                                                memoSymbols={memoSymbols}
                                                setNavigationMapOpen={setNavigationMapOpen}
                                                activeTab={activeTab}
                                                safeData={safeData}
                                                isMobileLayout={isMobileLayout}
                                                isDesktopSplit={true}
                                                handleMoveItem={handleMoveItem}
                                                handleShowMemo={handleShowMemo}
                                            />
                                        </div>

                                        {/* 컬럼 5: 할일 관리 3 */}
                                        <div className={isMobileLayout ? "h-[850px]" : "h-[calc(100vh-160px)]"}>
                                            <TodoWidget
                                                info={activeTab.todoManagementInfo3}
                                                onChange={handleTodoManagement3Change}
                                                onAddToCalendar={handleAddToCalendarClick}
                                                mainHeaderClass="text-sm font-black text-emerald-900 bg-emerald-100 flex items-center gap-2 flex-shrink-0 px-2 h-[48px] -mx-2 -mt-2 mb-2 border-b-2 border-black"
                                                subHeaderClass="text-[17px] font-bold text-indigo-600"
                                                todoTagClass="text-[10px] font-normal text-indigo-600 font-mono"
                                                onOpenItemMemoAtPage={onOpenItemMemoAtPage}
                                                dragState={dragState}
                                                setDragState={setDragState}
                                                onCrossSectionDrop={handleCrossSectionItemDrop}
                                                onItemTagClick={(itemId, sectionId, itemText) => handleOpenTagSelection({ itemId, itemText, sourceSectionId: sectionId, sourceTabId: activeTab.id })}
                                                dataSectionId="sub-todo-widget-3"
                                                activeTabId={activeTab.id}
                                                highlightedItemId={highlightedItemId}
                                                maxCategories={3}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    /* 일반 탭 레이아웃 - 3개 섹션 + 목차 + 상세 화면 */
                                    <>
                                        {/* 컬럼 1: 기존 첫 번째 섹션 */}
                                        {activeTab.sections.slice(0, 1).map((section, idx) => (
                                            <div key={section.id} className={isMobileLayout ? "h-[250px]" : "h-[calc(100vh-160px)]"}>
                                                <SectionCard
                                                    bgIndex={idx + 1}
                                                    section={section}
                                                    itemMemos={activeTab.memos}
                                                    onUpdateSection={handleUpdateSection}
                                                    onDeleteSection={handleDeleteSection}
                                                    onShowItemMemo={(id, initialValue) => handleShowMemo(id, 'section', section.id, initialValue, activeTab.id)}
                                                    onOpenItemMemoAtPage={onOpenItemMemoAtPage}
                                                    onMoveItem={() => { }}
                                                    onAddToCalendar={handleAddToCalendarClick}
                                                    dragState={dragState}
                                                    setDragState={setDragState}
                                                    onSectionDragStart={() => onSectionDragStart(section.id)}
                                                    onSectionDragOver={(e) => onSectionDragOver(e, section.id)}
                                                    onSectionDrop={(e) => onSectionDrop(e, section.id)}
                                                    onSectionDragEnd={onSectionDragEnd}
                                                    isHighlighted={section.id === highlightedSectionId}
                                                    isFullHeight={true}
                                                    tabColorText={activeTabColorConfig.text}
                                                    tabColorBg={activeTabColorConfig.bgLight}
                                                    onCrossSectionDrop={(draggedId, srcId, tgtId, tgtItem) => handleCrossSectionItemDrop(draggedId, srcId, tgtId, activeTab.id, activeTab.id, tgtItem)}
                                                    onGoToInbox={() => handleGoToInbox(activeTab.id, section.id)}
                                                    onItemDoubleClick={() => setTagSelectionModalOpen(true)}
                                                    onItemTagClick={(itemId, itemText) => handleOpenTagSelection({ itemId, itemText, sourceSectionId: section.id, sourceTabId: activeTab.id })}
                                                    isReturnVisible={lastSectionBeforeInbox?.tabId === activeTab.id && lastSectionBeforeInbox?.sectionId === section.id}
                                                    onReturnFromInbox={handleReturnFromInbox}
                                                    autoFocusQuickAdd={focusQuickAddSectionId === section.id}
                                                    onClearFocus={() => setFocusQuickAddSectionId(null)}
                                                    isMobileLayout={isMobileLayout}
                                                />
                                            </div>
                                        ))}

                                         {/* 컬럼 2: 두 번째 섹션 */}
                                        {activeTab.sections.slice(1, 2).map((section, idx) => (
                                            <div key={section.id} className={isMobileLayout ? "h-[250px]" : "h-[calc(100vh-160px)]"}>
                                                <SectionCard
                                                    bgIndex={idx + 2}
                                                    section={section}
                                                    itemMemos={activeTab.memos}
                                                    onUpdateSection={handleUpdateSection}
                                                    onDeleteSection={handleDeleteSection}
                                                    onShowItemMemo={(id, initialValue) => handleShowMemo(id, 'section', section.id, initialValue, activeTab.id)}
                                                    onOpenItemMemoAtPage={onOpenItemMemoAtPage}
                                                    onMoveItem={() => { }}
                                                    onAddToCalendar={handleAddToCalendarClick}
                                                    dragState={dragState}
                                                    setDragState={setDragState}
                                                    onSectionDragStart={() => onSectionDragStart(section.id)}
                                                    onSectionDragOver={(e) => onSectionDragOver(e, section.id)}
                                                    onSectionDrop={(e) => onSectionDrop(e, section.id)}
                                                    onSectionDragEnd={onSectionDragEnd}
                                                    isHighlighted={section.id === highlightedSectionId}
                                                    isFullHeight={true}
                                                    tabColorText={activeTabColorConfig.text}
                                                    tabColorBg={activeTabColorConfig.bgLight}
                                                    onCrossSectionDrop={(draggedId, srcId, tgtId, tgtItem) => handleCrossSectionItemDrop(draggedId, srcId, tgtId, activeTab.id, activeTab.id, tgtItem)}
                                                    onGoToInbox={() => handleGoToInbox(activeTab.id, section.id)}
                                                    onItemDoubleClick={() => setTagSelectionModalOpen(true)}
                                                    onItemTagClick={(itemId, itemText) => handleOpenTagSelection({ itemId, itemText, sourceSectionId: section.id, sourceTabId: activeTab.id })}
                                                    isReturnVisible={lastSectionBeforeInbox?.tabId === activeTab.id && lastSectionBeforeInbox?.sectionId === section.id}
                                                    onReturnFromInbox={handleReturnFromInbox}
                                                    autoFocusQuickAdd={focusQuickAddSectionId === section.id}
                                                    onClearFocus={() => setFocusQuickAddSectionId(null)}
                                                    isMobileLayout={isMobileLayout}
                                                />
                                            </div>
                                        ))}

                                        {/* 컬럼 3: 문서 목차 (Document ToC) */}
                                        <div className={isMobileLayout ? "hidden" : "h-[calc(100vh-160px)] min-w-0"}>
                                            <DocumentTocWidget
                                                memoEditor={memoEditor}
                                                onChangePage={handleChangePage}
                                                onUpdatePageTitle={handleUpdatePageTitle}
                                                onReorderPages={handleReorderPages}
                                                onAddPage={handleAddPage}
                                                headerBgClass={activeTabColorConfig.bgLight}
                                                onScrollToLine={(lineIndex: number, pageIndex: number) => {
                                                    window.dispatchEvent(new CustomEvent('editor-scroll-to-line', {
                                                        detail: { lineIndex, pageIndex }
                                                    }));
                                                }}
                                            />
                                        </div>

                                        {/* 컬럼 4: 상세 화면 (MemoEditorPanel) */}
                                        <div className={isMobileLayout ? "hidden" : "h-[calc(100vh-160px)] bg-white border-2 border-black rounded-2xl overflow-hidden shadow-sm"}>
                                            <MemoEditorPanel
                                                memoEditor={memoEditor}
                                                setMemoEditor={setMemoEditor}
                                                memoTextareaRef={memoTextareaRef}
                                                handleSaveMemo={handleSaveMemo}
                                                handleSwipeMemo={handleSwipeMemo}
                                                handleDeleteItemFromModal={handleDeleteItemFromModal}
                                                handleOpenTagSelection={handleOpenTagSelectionFromMain}
                                                handleInsertSymbol={handleInsertSymbol}
                                                handleChangePage={handleChangePage}
                                                handleUpdateTitle={handleUpdateTitle}
                                                handleUpdatePageTitle={handleUpdatePageTitle}
                                                handleUpdateItemText={handleUpdateItemText}
                                                handleAddPage={handleAddPage}
                                                handleDeletePage={handleDeletePage}
                                                onReorderPages={handleReorderPages}
                                                memoSymbols={memoSymbols}
                                                setNavigationMapOpen={setNavigationMapOpen}
                                                activeTab={activeTab}
                                                safeData={safeData}
                                                isMobileLayout={isMobileLayout}
                                                isDesktopSplit={true}
                                                handleMoveItem={handleMoveItem}
                                                handleShowMemo={handleShowMemo}
                                                headerBgClass={activeTabColorConfig.bgLight}
                                            />
                                        </div>

                                        {/* 컬럼 5: 나머지 모든 섹션들 (3번째부터) */}
                                        <div className={`flex flex-col gap-1.5 ${isMobileLayout ? '' : 'h-full'}`}>
                                            {activeTab.sections.slice(2).map((section, idx) => (
                                                <div key={section.id} className={isMobileLayout ? "h-[250px]" : "h-[calc(100vh-160px)]"}>
                                                    <SectionCard
                                                        bgIndex={idx + 3}
                                                        section={section}
                                                        itemMemos={activeTab.memos}
                                                        onUpdateSection={handleUpdateSection}
                                                        onDeleteSection={handleDeleteSection}
                                                        onShowItemMemo={(id, initialValue) => handleShowMemo(id, 'section', section.id, initialValue, activeTab.id)}
                                                        onOpenItemMemoAtPage={onOpenItemMemoAtPage}
                                                        onMoveItem={() => { }}
                                                        onAddToCalendar={handleAddToCalendarClick}
                                                        dragState={dragState}
                                                        setDragState={setDragState}
                                                        onSectionDragStart={() => onSectionDragStart(section.id)}
                                                        onSectionDragOver={(e) => onSectionDragOver(e, section.id)}
                                                        onSectionDrop={(e) => onSectionDrop(e, section.id)}
                                                        onSectionDragEnd={onSectionDragEnd}
                                                        isHighlighted={section.id === highlightedSectionId}
                                                        isFullHeight={true}
                                                        tabColorText={activeTabColorConfig.text}
                                                        tabColorBg={activeTabColorConfig.bgLight}
                                                        onCrossSectionDrop={(draggedId, srcId, tgtId, tgtItem) => handleCrossSectionItemDrop(draggedId, srcId, tgtId, activeTab.id, activeTab.id, tgtItem)}
                                                        onGoToInbox={() => handleGoToInbox(activeTab.id, section.id)}
                                                        onItemDoubleClick={() => setTagSelectionModalOpen(true)}
                                                        onItemTagClick={(itemId, itemText) => handleOpenTagSelection({ itemId, itemText, sourceSectionId: section.id, sourceTabId: activeTab.id })}
                                                        isReturnVisible={lastSectionBeforeInbox?.tabId === activeTab.id && lastSectionBeforeInbox?.sectionId === section.id}
                                                        onReturnFromInbox={handleReturnFromInbox}
                                                        autoFocusQuickAdd={focusQuickAddSectionId === section.id}
                                                        onClearFocus={() => setFocusQuickAddSectionId(null)}
                                                        isMobileLayout={isMobileLayout}
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                    </>
                                )}
                            </div>
                        )}

                    </main>
                </div>
            </div>
        </>
    );
};

export default MainContent;
