import React, { useMemo } from 'react';
import { AppData, Tab } from '../types';
import { getTabColor } from '../components/FooterTabs';

interface ConfirmModal {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
}

export const useTabManagement = (
    safeData: AppData,
    updateData: (data: AppData) => void,
    setIsBookmarkView: React.Dispatch<React.SetStateAction<boolean>>,
    setModal: React.Dispatch<React.SetStateAction<ConfirmModal>>
) => {
    const activeTab = useMemo(() => {
        const found = safeData.tabs.find(t => t.id === safeData.activeTabId);
        return found || safeData.tabs[0];
    }, [safeData.tabs, safeData.activeTabId]);

    const currentTabIndex = useMemo(() => {
        return safeData.tabs.findIndex(t => t.id === safeData.activeTabId);
    }, [safeData.tabs, safeData.activeTabId]);

    const activeTabColorConfig = useMemo(() => getTabColor(currentTabIndex), [currentTabIndex]);

    const handleAddTab = () => {
        const newId = Math.random().toString(36).substr(2, 9);
        const quotesSectionId = Math.random().toString(36).substr(2, 9);
        const newTab: Tab = {
            id: newId,
            name: `새 페이지 ${safeData.tabs.length + 1}`,
            sections: [],
            memos: {},
            parkingInfo: { text: '', checklistItems: [], shoppingListItems: [], checklistMemos: {}, shoppingListMemos: {} },
            quotesSection: {
                id: quotesSectionId,
                title: '명언',
                items: [],
                color: 'slate',
                isLocked: false
            },
            isLocked: false
        };

        updateData({
            ...safeData,
            tabs: [...safeData.tabs, newTab],
            activeTabId: newId
        });
    };

    const handleRenameTab = (id: string, newName: string) => {
        updateData({
            ...safeData,
            tabs: safeData.tabs.map(t => t.id === id ? { ...t, name: newName } : t)
        });
    };

    const handleToggleLockTab = (id: string) => {
        updateData({
            ...safeData,
            tabs: safeData.tabs.map(t => t.id === id ? { ...t, isLocked: !t.isLocked } : t)
        });
    };

    const handleReorderTabs = (fromIndex: number, toIndex: number) => {
        const newTabs = [...safeData.tabs];
        const [movedTab] = newTabs.splice(fromIndex, 1);
        newTabs.splice(toIndex, 0, movedTab);
        updateData({
            ...safeData,
            tabs: newTabs
        });
    };

    const handleDeleteTab = (id: string) => {
        const tabToDelete = safeData.tabs.find(t => t.id === id);
        if (!tabToDelete || tabToDelete.isLocked || safeData.tabs.length <= 1) return;

        setModal({
            isOpen: true,
            title: '페이지 삭제',
            message: `'${tabToDelete.name}' 페이지의 모든 데이터가 영구적으로 삭제됩니다. 계속하시겠습니까?`,
            onConfirm: () => {
                const newTabs = safeData.tabs.filter(t => t.id !== id);
                const newActiveTabId = safeData.activeTabId === id ? newTabs[0].id : safeData.activeTabId;
                updateData({
                    ...safeData,
                    tabs: newTabs,
                    activeTabId: newActiveTabId
                });
                setModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleSelectTab = (id: string) => {
        setIsBookmarkView(false);
        updateData({ ...safeData, activeTabId: id });
    };

    const handleSwipeLeft = () => {
        const nextIndex = currentTabIndex + 1;
        if (nextIndex < safeData.tabs.length) {
            handleSelectTab(safeData.tabs[nextIndex].id);
        }
    };

    const handleSwipeRight = () => {
        const prevIndex = currentTabIndex - 1;
        if (prevIndex >= 0) {
            handleSelectTab(safeData.tabs[prevIndex].id);
        }
    };

    return {
        activeTab,
        currentTabIndex,
        activeTabColorConfig,
        handleAddTab,
        handleRenameTab,
        handleToggleLockTab,
        handleReorderTabs,
        handleDeleteTab,
        handleSelectTab,
        handleSwipeLeft,
        handleSwipeRight
    };
};
