import React, { useMemo } from 'react';
import { Section, AppData, DragState, ParkingInfo, Tab, TodoManagementInfo, MemoEditorState, ListItem } from '../types';
import SectionCard from './SectionCard';
import ParkingWidget from './ParkingWidget';
import TodoWidget from './TodoWidget';
import TocWidget from './TocWidget';
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
    handleCrossSectionItemDrop: (draggedItemId: string, sourceSectionId: string, targetSectionId: string, targetItemId?: string | null) => void;
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
    activeTabColorConfig: { text: string; bgLight: string };
    lastSectionBeforeInbox: { tabId: string; sectionId: string } | null;
    handleReturnFromInbox: () => void;
    handleGoToInbox: (tabId: string, sectionId: string) => void;
    setTagSelectionModalOpen: (open: boolean) => void;
    focusQuickAddSectionId: string | null;
    setFocusQuickAddSectionId: (id: string | null) => void;
    isOnline: boolean;
    onTocNavigate: (tabId: string, sectionId: string) => void;
    onTocNavigateAndFocus: (tabId: string, sectionId: string) => void;
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
    highlightedSectionId, activeTabColorConfig,
    lastSectionBeforeInbox, handleReturnFromInbox, handleGoToInbox,
    handleTodoManagementChange,
    handleTodoManagement2Change,
    handleTodoManagement3Change,
    setTagSelectionModalOpen, focusQuickAddSectionId, setFocusQuickAddSectionId,
    isOnline,
    onTocNavigate,
    onTocNavigateAndFocus,
}) => {

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
                    <div className="flex-none bg-[#F8FAFC]">
                        <Header
                            onAddSection={handleAddSection}
                            onOpenNavigationMap={() => setNavigationMapOpen(true)}
                            onNavigateToInbox={handleNavigateToInbox}
                            isBookmarkView={isBookmarkView}
                            onToggleBookmarkView={onToggleBookmarkView}
                            parkingInfo={activeTab.parkingInfo}
                            onParkingChange={handleParkingChange}
                        />
                    </div>

                    <main className="flex-1 overflow-y-auto custom-scrollbar px-0 md:px-2 pb-20">
                        {isBookmarkView ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1 md:gap-2 pt-1" style={{ gridAutoRows: 'auto' }}>
                                {(safeData.bookmarkSections || []).map((section) => (
                                    <div key={section.id} className="h-[480px] lg:h-[calc(100vh-160px)]">
                                        <SectionCard
                                            section={section}
                                            itemMemos={{}}
                                            onUpdateSection={handleUpdateBookmarkSection}
                                            onDeleteSection={() => { }}
                                            onShowItemMemo={(id, initialValue) => handleShowMemo(id, 'section', section.id, initialValue, activeTab.id)}
                                            onMoveItem={() => { }}
                                            onAddToCalendar={handleAddToCalendarClick}
                                            dragState={dragState}
                                            setDragState={setDragState}
                                            onSectionDragStart={() => { }}
                                            onSectionDragOver={() => { }}
                                            onSectionDrop={() => { }}
                                            onSectionDragEnd={() => { }}
                                            isHighlighted={false}
                                            isInboxSection={true}
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
                            <div className={`grid gap-1 h-full ${isMobileLayout
                                ? 'grid-cols-1'
                                : 'grid-cols-1 md:grid-cols-2 md:gap-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
                                }`} style={{ gridAutoRows: 'auto' }}>
                                {isMainTab && (
                                    <>
                                        <div data-section-id="toc-section" className="h-[calc(100vh-160px)]">
                                            <TocWidget
                                                tabs={safeData.tabs}
                                                activeTabId={activeTab.id}
                                                onNavigate={onTocNavigate}
                                                onNavigateAndFocus={onTocNavigateAndFocus}
                                            />
                                        </div>

                                        <div className="h-[calc(100vh-160px)] xl:col-span-1">
                                            <SectionCard
                                                section={activeTab.inboxSection}
                                                itemMemos={activeTab.memos}
                                                onUpdateSection={handleUpdateInboxSection}
                                                onDeleteSection={() => { }}
                                                onShowItemMemo={(id, initialValue) => handleShowMemo(id, 'section', activeTab.inboxSection.id, initialValue, activeTab.id)}
                                                onMoveItem={() => { }}
                                                onAddToCalendar={handleAddToCalendarClick}
                                                dragState={dragState}
                                                setDragState={setDragState}
                                                onSectionDragStart={() => { }}
                                                onSectionDragOver={() => { }}
                                                onSectionDrop={() => { }}
                                                onSectionDragEnd={() => { }}
                                                onCrossSectionDrop={handleCrossSectionItemDrop}
                                                onReturnFromInbox={handleReturnFromInbox}
                                                isReturnVisible={!!lastSectionBeforeInbox}
                                                isHighlighted={activeTab.inboxSection.id === highlightedSectionId}
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

                                        <div data-section-id="parking-section" className="h-[calc(100vh-160px)]">
                                            <ParkingWidget
                                                info={activeTab.parkingInfo}
                                                onChange={handleParkingChange}
                                                onShowChecklistMemo={(id) => handleShowMemo(id, 'checklist', 'checklist', undefined, activeTab.id)}
                                                onShowShoppingMemo={(id) => handleShowMemo(id, 'shopping', 'shopping', undefined, activeTab.id)}
                                                onShowRemindersMemo={(id) => handleShowMemo(id, 'reminders', 'reminders', undefined, activeTab.id)}
                                                onShowTodoMemo={(id) => handleShowMemo(id, 'todo', 'todo', undefined, activeTab.id)}
                                                onShowCategory5Memo={(id) => handleShowMemo(id, 'parkingCat5', 'parkingCat5', undefined, activeTab.id)}
                                                onAddToCalendar={handleAddToCalendarClick}
                                            />
                                        </div>

                                        <div data-section-id="todo-section-1" className="h-[calc(100vh-160px)]">
                                            <TodoWidget
                                                info={activeTab.todoManagementInfo}
                                                onChange={handleTodoManagementChange}
                                                onShowTodoCat1Memo={(id) => handleShowMemo(id, 'todoCat1', 'todoCat1', undefined, activeTab.id)}
                                                onShowTodoCat2Memo={(id) => handleShowMemo(id, 'todoCat2', 'todoCat2', undefined, activeTab.id)}
                                                onShowTodoCat3Memo={(id) => handleShowMemo(id, 'todoCat3', 'todoCat3', undefined, activeTab.id)}
                                                onShowTodoCat4Memo={(id) => handleShowMemo(id, 'todoCat4', 'todoCat4', undefined, activeTab.id)}
                                                onShowTodoCat5Memo={(id) => handleShowMemo(id, 'todoCat5', 'todoCat5', undefined, activeTab.id)}
                                                onAddToCalendar={handleAddToCalendarClick}
                                                mainHeaderClass="text-sm font-black text-orange-900 bg-orange-100 flex items-center gap-2 flex-shrink-0 px-2 h-[48px] -mx-2 -mt-2 mb-2 border-b-2 border-black"
                                                subHeaderClass="text-[17px] font-bold text-blue-600"
                                                todoTagClass="text-[10px] font-normal text-orange-600 font-mono"
                                            />
                                        </div>

                                        <div data-section-id="todo-section-2" className="h-[calc(100vh-160px)]">
                                            <TodoWidget
                                                info={activeTab.todoManagementInfo2}
                                                onChange={handleTodoManagement2Change}
                                                onShowTodoCat1Memo={(id) => handleShowMemo(id, 'todo2Cat1', 'todo2Cat1', undefined, activeTab.id)}
                                                onShowTodoCat2Memo={(id) => handleShowMemo(id, 'todo2Cat2', 'todo2Cat2', undefined, activeTab.id)}
                                                onShowTodoCat3Memo={(id) => handleShowMemo(id, 'todo2Cat3', 'todo2Cat3', undefined, activeTab.id)}
                                                onShowTodoCat4Memo={(id) => handleShowMemo(id, 'todo2Cat4', 'todo2Cat4', undefined, activeTab.id)}
                                                onShowTodoCat5Memo={(id) => handleShowMemo(id, 'todo2Cat5', 'todo2Cat5', undefined, activeTab.id)}
                                                onAddToCalendar={handleAddToCalendarClick}
                                            />
                                        </div>
                                    </>
                                )}

                                {activeTab.sections.map(section => (
                                    <div key={section.id} className="h-[calc(100vh-160px)]">
                                        <SectionCard
                                            section={section}
                                            itemMemos={activeTab.memos}
                                            onUpdateSection={handleUpdateSection}
                                            onDeleteSection={handleDeleteSection}
                                            onShowItemMemo={(id, initialValue) => handleShowMemo(id, 'section', section.id, initialValue, activeTab.id)}
                                            onMoveItem={() => { }}
                                            onAddToCalendar={handleAddToCalendarClick}
                                            dragState={dragState}
                                            setDragState={setDragState}
                                            onSectionDragStart={() => onSectionDragStart(section.id)}
                                            onSectionDragOver={(e) => onSectionDragOver(e, section.id)}
                                            onSectionDrop={(e) => onSectionDrop(e, section.id)}
                                            onSectionDragEnd={onSectionDragEnd}
                                            isHighlighted={section.id === highlightedSectionId}
                                            isFullHeight={!isMainTab}
                                            tabColorText={activeTabColorConfig.text}
                                            tabColorBg={activeTabColorConfig.bgLight}
                                            onCrossSectionDrop={handleCrossSectionItemDrop}
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

                                {activeTab.sections.length === 0 && (!isMainTab || activeTab.sections.length === 0) && (
                                    <div className="col-span-full text-center py-16 text-slate-400">
                                        <p className="text-sm italic">
                                            {isMainTab && activeTab.sections.length === 0 ? '추가된 섹션이 없습니다. "+항목" 버튼을 눌러 섹션을 추가하세요.' :
                                                activeTab.sections.length === 0 ? '이 페이지는 비어있습니다. 새로운 섹션을 추가해 보세요.' : ''}
                                        </p>
                                    </div>
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
