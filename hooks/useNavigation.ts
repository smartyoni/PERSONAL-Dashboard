import { useState } from 'react';
import { AppData, Tab, MemoEditorState } from '../types';

export const useNavigation = (
    safeData: AppData,
    activeTab: Tab,
    handleSelectTab: (id: string) => void,
    setMemoEditor: React.Dispatch<React.SetStateAction<MemoEditorState>>,
    handleMoveItem: (itemId: string, sourceTabId: string, sourceSectionId: string, targetTabId: string, targetSectionId: string, switchTab?: boolean) => void
) => {
    const [navigationMapOpen, setNavigationMapOpen] = useState(false);
    const [sectionMapOpen, setSectionMapOpen] = useState(false);
    const [tagSelectionModalOpen, setTagSelectionModalOpen] = useState(false);
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [lastSectionPos, setLastSectionPos] = useState<{ tabId: string; sectionId: string } | null>(null);
    const [lastSectionBeforeInbox, setLastSectionBeforeInbox] = useState<{ tabId: string; sectionId: string } | null>(null);
    const [highlightedSectionId, setHighlightedSectionId] = useState<string | null>(null);
    const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
    const [focusQuickAddSectionId, setFocusQuickAddSectionId] = useState<string | null>(null);
    const [tagSelectionContext, setTagSelectionContext] = useState<{
        itemId: string;
        sourceTabId: string;
        sourceSectionId: string;
        itemText: string;
    } | null>(null);

    const handleNavigateFromMap = (tabId: string, sectionId?: string, itemId?: string) => {
        if (tabId !== safeData.activeTabId) {
            handleSelectTab(tabId);
        }
        
        // 하이라이트 타이머 관리
        if (sectionId) {
            setHighlightedSectionId(sectionId);
            setTimeout(() => setHighlightedSectionId(null), 3000);
        }
        if (itemId) {
            setHighlightedItemId(itemId);
            setTimeout(() => setHighlightedItemId(null), 3000);
        }

        // 스크롤 로직
        setTimeout(() => {
            if (itemId) {
                // 특정 아이템으로 스크롤 (중앙에 맞춤)
                const itemEl = document.querySelector(`[data-item-id="${itemId}"]`);
                if (itemEl) {
                    itemEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                    return;
                }
            }
            
            if (sectionId) {
                // 섹션으로 스크롤
                const el = document.querySelector(`[data-section-id="${sectionId}"]`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
                }
            }
        }, 150);

        setNavigationMapOpen(false);
    };

    const handleNavigateToInbox = () => {
        const mainTab = safeData.tabs[0];
        if (!mainTab?.inboxSection) return;
        const mainTabId = mainTab.id;
        const inboxSectionId = mainTab.inboxSection.id;

        if (mainTabId !== safeData.activeTabId) {
            handleSelectTab(mainTabId);
        }
        setTimeout(() => {
            const el = document.querySelector(`[data-section-id="${inboxSectionId}"]`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
            }
        }, 100);
        setHighlightedSectionId(inboxSectionId);
        setTimeout(() => setHighlightedSectionId(null), 3000);
    };

    const handleGoToInbox = (tabId: string, sectionId: string) => {
        setLastSectionBeforeInbox({ tabId, sectionId });
        handleNavigateToInbox();
    };

    const handleReturnFromInbox = () => {
        if (lastSectionBeforeInbox) {
            handleNavigateFromMap(lastSectionBeforeInbox.tabId, lastSectionBeforeInbox.sectionId);
            setLastSectionBeforeInbox(null);
        }
    };

    const handleOpenSectionMap = () => {
        setSectionMapOpen(true);
    };

    const handleNavigateFromSectionMap = (sectionId: string) => {
        setLastSectionPos({ tabId: safeData.activeTabId, sectionId: highlightedSectionId || activeTab.sections[0]?.id || '' });
        handleNavigateFromMap(safeData.activeTabId, sectionId);
        setSectionMapOpen(false);
    };

    const handleShowMemoFromMap = (tabId: string, sectionId: string, itemId: string, type?: MemoEditorState['type']) => {
        handleSelectTab(tabId);
        const tab = safeData.tabs.find(t => t.id === tabId);
        if (tab) {
            let loadedValue = '';
            const activeType = type || 'section';
            
            // 메모 값 가져오기 로직 (useMemoEditor.ts와 동기화)
            if (activeType === 'checklist') {
                loadedValue = tab.parkingInfo?.checklistMemos?.[itemId] || '';
            } else if (activeType === 'shopping') {
                loadedValue = tab.parkingInfo?.shoppingListMemos?.[itemId] || '';
            } else if (activeType === 'reminders') {
                loadedValue = tab.parkingInfo?.remindersMemos?.[itemId] || '';
            } else if (activeType === 'todo') {
                loadedValue = tab.parkingInfo?.todoMemos?.[itemId] || '';
            } else if (activeType === 'parkingCat5') {
                loadedValue = tab.parkingInfo?.category5Memos?.[itemId] || '';
            } else if (activeType === 'todoCat1') {
                loadedValue = tab.todoManagementInfo?.category1Memos?.[itemId] || '';
            } else if (activeType === 'todoCat2') {
                loadedValue = tab.todoManagementInfo?.category2Memos?.[itemId] || '';
            } else if (activeType === 'todoCat3') {
                loadedValue = tab.todoManagementInfo?.category3Memos?.[itemId] || '';
            } else if (activeType === 'todoCat4') {
                loadedValue = tab.todoManagementInfo?.category4Memos?.[itemId] || '';
            } else if (activeType === 'todoCat5') {
                loadedValue = tab.todoManagementInfo?.category5Memos?.[itemId] || '';
            } else if (activeType === 'todo2Cat1') {
                loadedValue = (tab as any).todoManagementInfo2?.category1Memos?.[itemId] || '';
            } else if (activeType === 'todo2Cat2') {
                loadedValue = (tab as any).todoManagementInfo2?.category2Memos?.[itemId] || '';
            } else if (activeType === 'todo2Cat3') {
                loadedValue = (tab as any).todoManagementInfo2?.category3Memos?.[itemId] || '';
            } else if (activeType === 'todo2Cat4') {
                loadedValue = (tab as any).todoManagementInfo2?.category4Memos?.[itemId] || '';
            } else if (activeType === 'todo2Cat5') {
                loadedValue = (tab as any).todoManagementInfo2?.category5Memos?.[itemId] || '';
            } else if (activeType === 'todo3Cat1') {
                loadedValue = (tab as any).todoManagementInfo3?.category1Memos?.[itemId] || '';
            } else if (activeType === 'todo3Cat2') {
                loadedValue = (tab as any).todoManagementInfo3?.category2Memos?.[itemId] || '';
            } else if (activeType === 'todo3Cat3') {
                loadedValue = (tab as any).todoManagementInfo3?.category3Memos?.[itemId] || '';
            } else if (activeType === 'todo3Cat4') {
                loadedValue = (tab as any).todoManagementInfo3?.category4Memos?.[itemId] || '';
            } else if (activeType === 'todo3Cat5') {
                loadedValue = (tab as any).todoManagementInfo3?.category5Memos?.[itemId] || '';
            } else {
                loadedValue = (tab.memos as any)[itemId] || '';
            }

            setMemoEditor({
                id: itemId,
                value: loadedValue,
                allValues: ['', '', '', '', ''],
                allTitles: ['', '', '', '', ''],
                title: '',
                activePageIndex: 0,
                type: activeType,
                isEditing: false,
                openedFromMap: true,
                sectionId: sectionId,
                tabId: tabId
            });
            
            // 하이라이트 및 스크롤 처리 추가
            handleNavigateFromMap(tabId, sectionId, itemId);
            // 모달 닫기 추가
            setNavigationMapOpen(false);
        }
    };

    const handleNavigateAndFocusFromMap = (tabId: string, sectionId: string) => {
        handleNavigateFromMap(tabId, sectionId);
        setNavigationMapOpen(false);
        setFocusQuickAddSectionId(sectionId);
    };

    const handleOpenTagSelection = (context?: { itemId: string; sourceTabId: string; sourceSectionId: string; itemText: string }) => {
        setTagSelectionContext(context || null);
        setTagSelectionModalOpen(true);
    };

    const handleNavigateFromTag = (sectionId: string, tabId: string) => {
        if (tagSelectionContext) {
            const isCrossTab = tabId !== tagSelectionContext.sourceTabId;

            handleMoveItem(
                tagSelectionContext.itemId,
                tagSelectionContext.sourceTabId,
                tagSelectionContext.sourceSectionId,
                tabId,
                sectionId,
                isCrossTab
            );
            
            // 만약 현재 열려있는 메모 모달의 아이템을 이동한 것이라면 메모 모달을 닫습니다.
            setMemoEditor((prev: any) => 
                prev.id === tagSelectionContext.itemId 
                    ? { 
                        id: null, value: '', allValues: ['', '', '', '', ''], 
                        allTitles: ['', '', '', '', ''], title: '', 
                        activePageIndex: 0, type: 'section', isEditing: false, sectionId: null, tabId: null 
                    } 
                    : prev
            );
            
            setTagSelectionContext(null);
        } else {
            handleNavigateFromMap(tabId, sectionId);
        }
        setTagSelectionModalOpen(false);
    };

    const handleReturnToLastSection = () => {
        if (lastSectionPos) {
            handleNavigateFromMap(lastSectionPos.tabId, lastSectionPos.sectionId);
            setLastSectionPos(null);
        }
    };

    return {
        navigationMapOpen,
        setNavigationMapOpen,
        sectionMapOpen,
        setSectionMapOpen,
        tagSelectionModalOpen,
        setTagSelectionModalOpen,
        searchModalOpen,
        setSearchModalOpen,
        lastSectionBeforeInbox,
        highlightedSectionId,
        highlightedItemId,
        setHighlightedItemId,
        lastSectionPos,
        focusQuickAddSectionId,
        setFocusQuickAddSectionId,
        handleNavigateFromMap,
        handleNavigateToInbox,
        handleGoToInbox,
        handleReturnFromInbox,
        handleOpenSectionMap,
        handleNavigateFromSectionMap,
        handleShowMemoFromMap,
        handleNavigateAndFocusFromMap,
        handleNavigateFromTag,
        handleOpenTagSelection,
        handleReturnToLastSection,
        tagSelectionContext
    };
};
