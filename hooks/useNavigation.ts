import { useState } from 'react';
import { AppData, Tab, MemoEditorState } from '../types';

export const useNavigation = (
    safeData: AppData,
    activeTab: Tab,
    handleSelectTab: (id: string) => void,
    setMemoEditor: React.Dispatch<React.SetStateAction<MemoEditorState>>,
    handleMoveItem: (itemId: string, sourceTabId: string, sourceSectionId: string, targetTabId: string, targetSectionId: string, switchTab?: boolean) => void
) => {
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

    const handleNavigateTo = (tabId: string, sectionId?: string, itemId?: string) => {
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
            handleNavigateTo(lastSectionBeforeInbox.tabId, lastSectionBeforeInbox.sectionId);
            setLastSectionBeforeInbox(null);
        }
    };

    const handleOpenSectionMap = () => {
        setSectionMapOpen(true);
    };

    const handleNavigateFromSectionMap = (sectionId: string) => {
        setLastSectionPos({ tabId: safeData.activeTabId, sectionId: highlightedSectionId || activeTab.sections[0]?.id || '' });
        handleNavigateTo(safeData.activeTabId, sectionId);
        setSectionMapOpen(false);
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
        }
        setTagSelectionModalOpen(false);
    };

    const handleReturnToLastSection = () => {
        if (lastSectionPos) {
            handleNavigateTo(lastSectionPos.tabId, lastSectionPos.sectionId);
            setLastSectionPos(null);
        }
    };

    return {
        handleNavigateTo,
        handleNavigateToInbox,
        handleGoToInbox,
        handleReturnFromInbox,
        handleOpenSectionMap,
        handleNavigateFromSectionMap,
        handleNavigateFromTag,
        handleOpenTagSelection,
        handleReturnToLastSection,
        tagSelectionContext
    };
};
