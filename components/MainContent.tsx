import React from 'react';
import { Section, AppData, DragState, ParkingInfo, Tab } from '../types';
import SectionCard from './SectionCard';
import ParkingWidget from './ParkingWidget';
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
    handleUpdateQuotesSection: (updated: Section, newMemos?: { [key: string]: string }) => void;
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
    // Memo & Calendar
    handleShowMemo: (id: string, type?: 'checklist' | 'shopping') => void;
    handleAddToCalendarClick: (itemText: string) => void;
    handleOpenMoveItemModal: (itemId: string, sectionId: string) => void;
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
}

const MainContent: React.FC<MainContentProps> = ({
    safeData, activeTab, isMainTab, isBookmarkView, isMobileLayout,
    sharedTextForInbox, handleClearSharedText, mainRef,
    handleAddSection, handleUpdateSection, handleUpdateInboxSection,
    handleUpdateQuotesSection, handleDeleteSection, handleUpdateBookmarkSection,
    dragState, setDragState,
    onSectionDragStart, onSectionDragOver, onSectionDrop, onSectionDragEnd,
    handleCrossSectionItemDrop, handleCrossBookmarkSectionDrop,
    handleParkingChange, handleShowMemo, handleAddToCalendarClick,
    handleOpenMoveItemModal, setNavigationMapOpen, handleNavigateToInbox,
    onToggleBookmarkView,
    highlightedSectionId, activeTabColorConfig,
    lastSectionBeforeInbox, handleReturnFromInbox, handleGoToInbox,
    setTagSelectionModalOpen, focusQuickAddSectionId, setFocusQuickAddSectionId,
    isOnline
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
                        />
                    </div>

                    <main className="flex-1 overflow-y-auto custom-scrollbar px-0 md:px-6 pb-20">
                        {isBookmarkView ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 pt-2" style={{ gridAutoRows: 'auto' }}>
                                {(safeData.bookmarkSections || []).map((section) => (
                                    <div key={section.id} className="h-[480px] lg:h-[calc(100vh-160px)]">
                                        <SectionCard
                                            section={section}
                                            itemMemos={{}}
                                            onUpdateSection={handleUpdateBookmarkSection}
                                            onDeleteSection={() => { }}
                                            onShowItemMemo={() => { }}
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
                                            isMobileLayout={isMobileLayout}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={`grid gap-3 h-full ${isMobileLayout
                                ? 'grid-cols-1'
                                : 'grid-cols-1 md:grid-cols-2 md:gap-6 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5'
                                }`} style={{ gridAutoRows: 'auto' }}>
                                {isMainTab && (
                                    <>
                                        <div className="h-[calc(100vh-160px)]">
                                            <ParkingWidget
                                                info={activeTab.parkingInfo}
                                                onChange={handleParkingChange}
                                                onShowChecklistMemo={(id) => handleShowMemo(id, 'checklist', 'checklist')}
                                                onShowShoppingMemo={(id) => handleShowMemo(id, 'shopping', 'shopping')}
                                                onShowRemindersMemo={(id) => handleShowMemo(id, 'reminders', 'reminders')}
                                                onShowTodoMemo={(id) => handleShowMemo(id, 'todo', 'todo')}
                                                onAddToCalendar={handleAddToCalendarClick}
                                            />
                                        </div>

                                        <div className="h-[calc(100vh-160px)] xl:col-span-2">
                                            <SectionCard
                                                section={activeTab.inboxSection}
                                                itemMemos={activeTab.memos}
                                                onUpdateSection={handleUpdateInboxSection}
                                                onDeleteSection={() => { }}
                                                onShowItemMemo={(id) => handleShowMemo(id, 'section', activeTab.inboxSection.id)}
                                                onMoveItem={(itemId) => handleOpenMoveItemModal(itemId, activeTab.inboxSection.id)}
                                                onAddToCalendar={handleAddToCalendarClick}
                                                dragState={dragState}
                                                setDragState={setDragState}
                                                onSectionDragStart={() => { }}
                                                onSectionDragOver={() => { }}
                                                onSectionDrop={() => { }}
                                                onSectionDragEnd={() => { }}
                                                isHighlighted={activeTab.inboxSection.id === highlightedSectionId}
                                                isInboxSection={true}
                                                isFullHeight={true}
                                                tabColorText={activeTabColorConfig.text}
                                                tabColorBg={activeTabColorConfig.bgLight}
                                                initialQuickAddValue={sharedTextForInbox}
                                                onQuickAddValuePopulated={handleClearSharedText}
                                                onCrossSectionDrop={handleCrossSectionItemDrop}
                                                onReturnFromInbox={handleReturnFromInbox}
                                                isReturnVisible={!!lastSectionBeforeInbox}
                                                onItemDoubleClick={() => setTagSelectionModalOpen(true)}
                                                autoFocusQuickAdd={focusQuickAddSectionId === activeTab.inboxSection.id}
                                                onClearFocus={() => setFocusQuickAddSectionId(null)}
                                                isMobileLayout={isMobileLayout}
                                            />
                                        </div>

                                        <div className="h-[calc(100vh-160px)]">
                                            <SectionCard
                                                section={activeTab.quotesSection}
                                                itemMemos={activeTab.memos}
                                                onUpdateSection={handleUpdateQuotesSection}
                                                onDeleteSection={() => { }}
                                                onShowItemMemo={(id) => handleShowMemo(id, 'section', activeTab.quotesSection.id)}
                                                onMoveItem={(itemId) => handleOpenMoveItemModal(itemId, activeTab.quotesSection.id)}
                                                onAddToCalendar={handleAddToCalendarClick}
                                                dragState={dragState}
                                                setDragState={setDragState}
                                                onSectionDragStart={() => { }}
                                                onSectionDragOver={() => { }}
                                                onSectionDrop={() => { }}
                                                onSectionDragEnd={() => { }}
                                                isHighlighted={activeTab.quotesSection.id === highlightedSectionId}
                                                isInboxSection={true}
                                                tabColorText={activeTabColorConfig.text}
                                                tabColorBg={activeTabColorConfig.bgLight}
                                                onCrossSectionDrop={handleCrossSectionItemDrop}
                                                onGoToInbox={() => handleGoToInbox(activeTab.id, activeTab.quotesSection.id)}
                                                onItemDoubleClick={() => setTagSelectionModalOpen(true)}
                                                isReturnVisible={lastSectionBeforeInbox?.tabId === activeTab.id && lastSectionBeforeInbox?.sectionId === activeTab.quotesSection.id}
                                                onReturnFromInbox={handleReturnFromInbox}
                                                autoFocusQuickAdd={focusQuickAddSectionId === activeTab.quotesSection.id}
                                                onClearFocus={() => setFocusQuickAddSectionId(null)}
                                                isMobileLayout={isMobileLayout}
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
                                            onShowItemMemo={(id) => handleShowMemo(id, 'section', section.id)}
                                            onMoveItem={(itemId) => handleOpenMoveItemModal(itemId, section.id)}
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
