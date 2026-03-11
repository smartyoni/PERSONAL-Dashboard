import React, { useState } from 'react';
import { AppData, Section, DragState, Tab, ListItem } from '../types';

interface ConfirmModal {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
}

interface MoveItemModal {
    isOpen: boolean;
    itemId: string | null;
    itemText: string;
    sourceTabId: string;
    sourceSectionId: string;
}

export const useSectionManagement = (
    safeData: AppData,
    updateData: (data: AppData) => void,
    activeTab: Tab,
    setModal: React.Dispatch<React.SetStateAction<ConfirmModal>>
) => {
    const [dragState, setDragState] = useState<DragState>({
        draggedItemId: null,
        dragOverItemId: null,
        sourceSectionId: null,
        draggedSectionId: null,
        dragOverSectionId: null
    });

    const [moveItemModal, setMoveItemModal] = useState<MoveItemModal>({
        isOpen: false,
        itemId: null,
        itemText: '',
        sourceTabId: '',
        sourceSectionId: ''
    });

    const handleAddSection = () => {
        const newSection: Section = {
            id: Math.random().toString(36).substr(2, 9),
            title: '새 섹션',
            items: [],
            color: 'slate',
            isLocked: false
        };

        updateData({
            ...safeData,
            tabs: safeData.tabs.map(t => t.id === safeData.activeTabId
                ? { ...t, sections: [...t.sections, newSection] }
                : t
            )
        });
    };

    const handleUpdateSection = (updated: Section, newMemos?: { [key: string]: string }) => {
        updateData({
            ...safeData,
            tabs: safeData.tabs.map(t => t.id === safeData.activeTabId
                ? {
                    ...t,
                    sections: t.sections.map(s => s.id === updated.id ? updated : s),
                    memos: newMemos ? { ...t.memos, ...newMemos } : t.memos
                }
                : t
            )
        });
    };

    const handleUpdateInboxSection = (updated: Section, newMemos?: { [key: string]: string }) => {
        updateData({
            ...safeData,
            tabs: safeData.tabs.map(t => t.id === safeData.activeTabId
                ? {
                    ...t,
                    inboxSection: updated,
                    memos: newMemos ? { ...t.memos, ...newMemos } : t.memos
                }
                : t
            )
        });
    };

    const handleUpdateQuotesSection = (updated: Section, newMemos?: { [key: string]: string }) => {
        updateData({
            ...safeData,
            tabs: safeData.tabs.map(t => t.id === safeData.activeTabId
                ? {
                    ...t,
                    quotesSection: updated,
                    memos: newMemos ? { ...t.memos, ...newMemos } : t.memos
                }
                : t
            )
        });
    };

    const handleDeleteSection = (id: string) => {
        const sectionToDelete = activeTab?.sections.find(s => s.id === id);
        if (sectionToDelete?.isLocked) return;

        setModal({
            isOpen: true,
            title: '섹션 삭제',
            message: '해당 섹션을 삭제하시겠습니까?',
            onConfirm: () => {
                updateData({
                    ...safeData,
                    tabs: safeData.tabs.map(t => t.id === safeData.activeTabId
                        ? { ...t, sections: t.sections.filter(s => s.id !== id) }
                        : t
                    )
                });
                setModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const onSectionDragStart = (sectionId: string) => {
        setDragState(prev => ({ ...prev, draggedSectionId: sectionId }));
    };

    const onSectionDragOver = (e: React.DragEvent, sectionId: string) => {
        e.preventDefault();
        if (dragState.draggedSectionId && dragState.draggedSectionId !== sectionId) {
            setDragState(prev => ({ ...prev, dragOverSectionId: sectionId }));
        }
    };

    const onSectionDrop = (e: React.DragEvent, targetSectionId: string) => {
        e.preventDefault();
        const { draggedSectionId } = dragState;
        if (!draggedSectionId || draggedSectionId === targetSectionId) return;

        updateData({
            ...safeData,
            tabs: safeData.tabs.map(t => {
                if (t.id !== safeData.activeTabId) return t;
                const newSections = [...t.sections];
                const draggedIdx = newSections.findIndex(s => s.id === draggedSectionId);
                const targetIdx = newSections.findIndex(s => s.id === targetSectionId);
                if (draggedIdx !== -1 && targetIdx !== -1) {
                    const [draggedSection] = newSections.splice(draggedIdx, 1);
                    newSections.splice(targetIdx, 0, draggedSection);
                }
                return { ...t, sections: newSections };
            })
        });
    };

    const onSectionDragEnd = () => {
        setDragState(prev => ({ ...prev, draggedSectionId: null, dragOverSectionId: null }));
    };

    // 섹션 간 아이템 이동 (Trello style)
    const handleCrossSectionItemDrop = (
        draggedItemId: string,
        sourceSectionId: string,
        targetSectionId: string,
        targetItemId?: string | null
    ) => {
        if (sourceSectionId === targetSectionId) return;

        const getAllSections = (tab: typeof activeTab) => {
            const all: Section[] = [];
            if (tab.inboxSection) all.push(tab.inboxSection);
            if (tab.quotesSection) all.push(tab.quotesSection);
            all.push(...tab.sections);
            return all;
        };

        updateData({
            ...safeData,
            tabs: safeData.tabs.map(t => {
                if (t.id !== safeData.activeTabId) return t;

                const allSections = getAllSections(t);
                const sourceSection = allSections.find(s => s.id === sourceSectionId);
                const targetSection = allSections.find(s => s.id === targetSectionId);
                if (!sourceSection || !targetSection) return t;

                const draggedItem = sourceSection.items.find(i => i.id === draggedItemId);
                if (!draggedItem) return t;

                const newSourceItems = sourceSection.items.filter(i => i.id !== draggedItemId);
                let newTargetItems = [...targetSection.items];

                if (targetItemId) {
                    const targetIdx = newTargetItems.findIndex(i => i.id === targetItemId);
                    if (targetIdx !== -1) {
                        newTargetItems.splice(targetIdx, 0, draggedItem);
                    } else {
                        newTargetItems.unshift(draggedItem);
                    }
                } else {
                    newTargetItems.unshift(draggedItem);
                }

                const updateSec = (sec: Section) => {
                    if (sec.id === sourceSectionId) return { ...sec, items: newSourceItems };
                    if (sec.id === targetSectionId) return { ...sec, items: newTargetItems };
                    return sec;
                };

                return {
                    ...t,
                    inboxSection: t.inboxSection ? updateSec(t.inboxSection) : t.inboxSection,
                    quotesSection: updateSec(t.quotesSection),
                    sections: t.sections.map(updateSec),
                };
            })
        });
    };

    const handleClearAll = () => {
        if (!activeTab.sections.some(s => s.items.some(i => i.completed))) return;
        updateData({
            ...safeData,
            tabs: safeData.tabs.map(t => t.id === safeData.activeTabId
                ? { ...t, sections: t.sections.map(s => ({ ...s, items: s.items.map(i => ({ ...i, completed: false })) })) }
                : t
            )
        });
    };

    const handleOpenMoveItemModal = (itemId: string, sectionId: string) => {
        let itemText = '';
        let found = false;

        // 1. 일반 섹션 및 인박스에서 찾기
        let section = activeTab.sections.find(s => s.id === sectionId);
        if (!section && activeTab.inboxSection?.id === sectionId) {
            section = activeTab.inboxSection;
        }
        if (section) {
            const item = section.items.find(i => i.id === itemId);
            if (item) {
                itemText = item.text;
                found = true;
            }
        }

        // 2. 주차/할일관리 특수 섹션에서 찾기
        if (!found) {
            const parking = activeTab.parkingInfo;
            const todo = activeTab.todoManagementInfo;
            let pItem;
            if (sectionId === 'checklist') pItem = parking.checklistItems.find(i => i.id === itemId);
            else if (sectionId === 'shopping') pItem = parking.shoppingListItems.find(i => i.id === itemId);
            else if (sectionId === 'reminders') pItem = parking.remindersItems.find(i => i.id === itemId);
            else if (sectionId === 'todo') pItem = parking.todoItems.find(i => i.id === itemId);
            else if (sectionId === 'todoCat1') pItem = todo.category1Items.find(i => i.id === itemId);
            else if (sectionId === 'todoCat2') pItem = todo.category2Items.find(i => i.id === itemId);
            else if (sectionId === 'todoCat3') pItem = todo.category3Items.find(i => i.id === itemId);
            else if (sectionId === 'todoCat4') pItem = todo.category4Items.find(i => i.id === itemId);

            if (pItem) {
                itemText = pItem.text;
                found = true;
            }
        }

        if (!found) return;

        setMoveItemModal({
            isOpen: true,
            itemId: itemId,
            itemText: itemText,
            sourceTabId: safeData.activeTabId,
            sourceSectionId: sectionId
        });
    };

    const handleMoveItem = (targetTabId: string, targetSectionId: string) => {
        const { itemId, sourceTabId, sourceSectionId } = moveItemModal;
        if (!itemId) return;

        if (sourceTabId === targetTabId && sourceSectionId === targetSectionId) {
            setMoveItemModal(prev => ({ ...prev, isOpen: false }));
            return;
        }

        const sourceTab = safeData.tabs.find(t => t.id === sourceTabId);
        if (!sourceTab) return;

        // 소스 영역 찾기
        let sourceItems: ListItem[] = [];
        let sourceMemo = '';
        let isSpecialSource = false;

        let sourceSection = sourceTab.sections.find(s => s.id === sourceSectionId);
        if (!sourceSection && sourceTab.inboxSection?.id === sourceSectionId) {
            sourceSection = sourceTab.inboxSection;
        }

        if (sourceSection) {
            sourceItems = sourceSection.items;
            sourceMemo = sourceTab.memos[itemId] || '';
        } else {
            // 주차/할일관리에서 찾기
            const p = sourceTab.parkingInfo;
            const t = sourceTab.todoManagementInfo;
            if (sourceSectionId === 'checklist') { sourceItems = p.checklistItems; sourceMemo = p.checklistMemos[itemId] || ''; isSpecialSource = true; }
            else if (sourceSectionId === 'shopping') { sourceItems = p.shoppingListItems; sourceMemo = p.shoppingListMemos[itemId] || ''; isSpecialSource = true; }
            else if (sourceSectionId === 'reminders') { sourceItems = p.remindersItems; sourceMemo = p.remindersMemos[itemId] || ''; isSpecialSource = true; }
            else if (sourceSectionId === 'todo') { sourceItems = p.todoItems; sourceMemo = p.todoMemos[itemId] || ''; isSpecialSource = true; }
            else if (sourceSectionId === 'todoCat1') { sourceItems = t.category1Items; sourceMemo = t.category1Memos[itemId] || ''; isSpecialSource = true; }
            else if (sourceSectionId === 'todoCat2') { sourceItems = t.category2Items; sourceMemo = t.category2Memos[itemId] || ''; isSpecialSource = true; }
            else if (sourceSectionId === 'todoCat3') { sourceItems = t.category3Items; sourceMemo = t.category3Memos[itemId] || ''; isSpecialSource = true; }
            else if (sourceSectionId === 'todoCat4') { sourceItems = t.category4Items; sourceMemo = t.category4Memos[itemId] || ''; isSpecialSource = true; }
        }

        const itemToMove = sourceItems.find(i => i.id === itemId);
        if (!itemToMove) return;

        const targetTab = safeData.tabs.find(t => t.id === targetTabId);
        if (!targetTab) return;

        let targetSection = targetTab.sections.find(s => s.id === targetSectionId);
        if (!targetSection && targetTab.inboxSection?.id === targetSectionId) {
            targetSection = targetTab.inboxSection;
        }
        if (!targetSection) return;



        updateData({
            ...safeData,
            tabs: safeData.tabs.map(tab => {
                // 1. 소스 탭 처리
                if (tab.id === sourceTabId) {
                    let updatedTab = { ...tab };
                    // 소스에서 아이템 제거
                    if (sourceSection) {
                        if (sourceSection.id === tab.inboxSection?.id) {
                            updatedTab.inboxSection = { ...tab.inboxSection!, items: tab.inboxSection!.items.filter(i => i.id !== itemId) };
                        } else {
                            updatedTab.sections = tab.sections.map(s => s.id === sourceSectionId ? { ...s, items: s.items.filter(i => i.id !== itemId) } : s);
                        }
                        const { [itemId]: removed, ...rest } = updatedTab.memos;
                        updatedTab.memos = rest;
                    } else if (isSpecialSource) {
                        const p = tab.parkingInfo;
                        const t = tab.todoManagementInfo;
                        if (sourceSectionId === 'checklist') {
                            updatedTab.parkingInfo = { ...p, checklistItems: p.checklistItems.filter(i => i.id !== itemId), checklistMemos: (() => { const { [itemId]: r, ...rest } = p.checklistMemos; return rest; })() };
                        } else if (sourceSectionId === 'shopping') {
                            updatedTab.parkingInfo = { ...p, shoppingListItems: p.shoppingListItems.filter(i => i.id !== itemId), shoppingListMemos: (() => { const { [itemId]: r, ...rest } = p.shoppingListMemos; return rest; })() };
                        } else if (sourceSectionId === 'reminders') {
                            updatedTab.parkingInfo = { ...p, remindersItems: p.remindersItems.filter(i => i.id !== itemId), remindersMemos: (() => { const { [itemId]: r, ...rest } = p.remindersMemos; return rest; })() };
                        } else if (sourceSectionId === 'todo') {
                            updatedTab.parkingInfo = { ...p, todoItems: p.todoItems.filter(i => i.id !== itemId), todoMemos: (() => { const { [itemId]: r, ...rest } = p.todoMemos; return rest; })() };
                        } else if (sourceSectionId === 'todoCat1') {
                            updatedTab.todoManagementInfo = { ...t, category1Items: t.category1Items.filter(i => i.id !== itemId), category1Memos: (() => { const { [itemId]: r, ...rest } = t.category1Memos; return rest; })() };
                        } else if (sourceSectionId === 'todoCat2') {
                            updatedTab.todoManagementInfo = { ...t, category2Items: t.category2Items.filter(i => i.id !== itemId), category2Memos: (() => { const { [itemId]: r, ...rest } = t.category2Memos; return rest; })() };
                        } else if (sourceSectionId === 'todoCat3') {
                            updatedTab.todoManagementInfo = { ...t, category3Items: t.category3Items.filter(i => i.id !== itemId), category3Memos: (() => { const { [itemId]: r, ...rest } = t.category3Memos; return rest; })() };
                        } else if (sourceSectionId === 'todoCat4') {
                            updatedTab.todoManagementInfo = { ...t, category4Items: t.category4Items.filter(i => i.id !== itemId), category4Memos: (() => { const { [itemId]: r, ...rest } = t.category4Memos; return rest; })() };
                        }
                    }

                    // 같은 탭 내 이동이면 타겟 처리도 여기서
                    if (sourceTabId === targetTabId) {
                        if (targetSection!.id === updatedTab.inboxSection?.id) {
                            updatedTab.inboxSection = { ...updatedTab.inboxSection!, items: [...updatedTab.inboxSection!.items, itemToMove] };
                        } else {
                            updatedTab.sections = updatedTab.sections.map(s => s.id === targetSectionId ? { ...s, items: [...s.items, itemToMove] } : s);
                        }
                        if (sourceMemo) {
                            updatedTab.memos = { ...updatedTab.memos, [itemId]: sourceMemo };
                        }
                    }
                    return updatedTab;
                }
                // 2. 다른 탭 타겟 처리
                if (sourceTabId !== targetTabId && tab.id === targetTabId) {
                    let updatedTab = { ...tab };
                    if (targetSection!.id === tab.inboxSection?.id) {
                        updatedTab.inboxSection = { ...tab.inboxSection!, items: [...tab.inboxSection!.items, itemToMove] };
                    } else {
                        updatedTab.sections = tab.sections.map(s => s.id === targetSectionId ? { ...s, items: [...s.items, itemToMove] } : s);
                    }
                    if (sourceMemo) {
                        updatedTab.memos = { ...tab.memos, [itemId]: sourceMemo };
                    }
                    return updatedTab;
                }
                return tab;
            })
        });

        setMoveItemModal({ isOpen: false, itemId: null, itemText: '', sourceTabId: '', sourceSectionId: '' });
    };

    return {
        dragState,
        setDragState,
        moveItemModal,
        setMoveItemModal,
        handleAddSection,
        handleUpdateSection,
        handleUpdateInboxSection,
        handleUpdateQuotesSection,
        handleDeleteSection,
        onSectionDragStart,
        onSectionDragOver,
        onSectionDrop,
        onSectionDragEnd,
        handleCrossSectionItemDrop,
        handleClearAll,
        handleOpenMoveItemModal,
        handleMoveItem
    };
};
