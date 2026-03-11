import React, { useState } from 'react';
import { AppData, Tab } from '../types';

interface MemoEditorState {
    id: string | null;
    value: string;
    type: 'section' | 'checklist' | 'shopping' | 'memoBoard';
    isEditing: boolean;
    openedFromMap?: boolean;
}

export const useNavigation = (
    safeData: AppData,
    activeTab: Tab,
    handleSelectTab: (id: string) => void,
    setMemoEditor: React.Dispatch<React.SetStateAction<MemoEditorState>>,
    handleMoveItem: (itemId: string, sourceTabId: string, sourceSectionId: string, targetTabId: string, targetSectionId: string) => void
) => {
    const [navigationMapOpen, setNavigationMapOpen] = useState(false);
    const [sectionMapOpen, setSectionMapOpen] = useState(false);
    const [tagSelectionModalOpen, setTagSelectionModalOpen] = useState(false);
    const [lastSectionPos, setLastSectionPos] = useState<{ tabId: string; sectionId: string } | null>(null);
    const [lastSectionBeforeInbox, setLastSectionBeforeInbox] = useState<{ tabId: string; sectionId: string } | null>(null);
    const [highlightedSectionId, setHighlightedSectionId] = useState<string | null>(null);
    const [focusQuickAddSectionId, setFocusQuickAddSectionId] = useState<string | null>(null);
    const [tagSelectionContext, setTagSelectionContext] = useState<{
        itemId: string;
        sourceTabId: string;
        sourceSectionId: string;
        itemText: string;
    } | null>(null);

    const handleNavigateFromMap = (tabId: string, sectionId?: string) => {
        if (tabId !== safeData.activeTabId) {
            handleSelectTab(tabId);
        }
        if (sectionId) {
            setTimeout(() => {
                const el = document.querySelector(`[data-section-id="${sectionId}"]`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
                }
            }, 100);
            setHighlightedSectionId(sectionId);
            setTimeout(() => setHighlightedSectionId(null), 3000);
        }
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

    const handleShowMemoFromMap = (tabId: string, sectionId: string, itemId: string) => {
        handleSelectTab(tabId);
        const tab = safeData.tabs.find(t => t.id === tabId);
        if (tab) {
            const memoValue = tab.memos[itemId] || '';
            setMemoEditor({
                id: itemId,
                value: memoValue,
                type: 'section',
                isEditing: false,
                openedFromMap: true,
                sectionId: sectionId,
                tabId: tabId
            });
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
            handleMoveItem(
                tagSelectionContext.itemId,
                tagSelectionContext.sourceTabId,
                tagSelectionContext.sourceSectionId,
                tabId,
                sectionId
            );
            setTagSelectionContext(null);
        }
        handleNavigateFromMap(tabId, sectionId);
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
        lastSectionBeforeInbox,
        highlightedSectionId,
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
