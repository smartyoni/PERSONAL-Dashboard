import React, { useState } from 'react';
import { AppData, Section, DragState, Tab, ListItem } from '../types';

interface ConfirmModal {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
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
        // 고정 로직 처리
        const currentPinnedSections = safeData.tabs.reduce((acc, tab) => {
            const pinnedInTab = tab.sections.filter(s => s.isPinned);
            const pinnedInbox = tab.inboxSection?.isPinned ? [tab.inboxSection] : [];
            return [...acc, ...pinnedInTab, ...pinnedInbox];
        }, [] as Section[]);

        const wasPinned = safeData.tabs.some(t => t.sections.some(s => s.id === updated.id && s.isPinned) || (t.inboxSection?.id === updated.id && t.inboxSection.isPinned));
        
        if (updated.isPinned && !wasPinned && currentPinnedSections.length >= 5) {
            alert('고정 섹션은 최대 5개까지만 설정할 수 있습니다.');
            return;
        }

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
        // Inbox 고정 로직 처리
        const currentPinnedSections = safeData.tabs.reduce((acc, tab) => {
            const pinnedInTab = tab.sections.filter(s => s.isPinned);
            const pinnedInbox = tab.inboxSection?.isPinned ? [tab.inboxSection] : [];
            return [...acc, ...pinnedInTab, ...pinnedInbox];
        }, [] as Section[]);

        const wasPinned = safeData.tabs.some(t => t.inboxSection?.id === updated.id && t.inboxSection.isPinned);

        if (updated.isPinned && !wasPinned && currentPinnedSections.length >= 6) {
            alert('고정 섹션은 최대 6개까지만 설정할 수 있습니다.');
            return;
        }

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


    const handleMoveItem = (
        itemId: string,
        sourceTabId: string,
        sourceSectionId: string,
        targetTabId: string,
        targetSectionId: string,
        switchTab: boolean = false
    ) => {
        if (!itemId) return;

        if (sourceTabId === targetTabId && sourceSectionId === targetSectionId) {
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
            const t2 = sourceTab.todoManagementInfo2;
            const t3 = sourceTab.todoManagementInfo3;

            if (sourceSectionId === 'checklist') { sourceItems = p.checklistItems; sourceMemo = p.checklistMemos[itemId] || ''; isSpecialSource = true; }
            else if (sourceSectionId === 'shopping') { sourceItems = p.shoppingListItems; sourceMemo = p.shoppingListMemos[itemId] || ''; isSpecialSource = true; }
            else if (sourceSectionId === 'reminders') { sourceItems = p.remindersItems; sourceMemo = p.remindersMemos[itemId] || ''; isSpecialSource = true; }
            else if (sourceSectionId === 'todo') { sourceItems = p.todoItems; sourceMemo = p.todoMemos[itemId] || ''; isSpecialSource = true; }
            else if (sourceSectionId === 'parkingCat5') { sourceItems = p.category5Items; sourceMemo = p.category5Memos[itemId] || ''; isSpecialSource = true; }
            else if (sourceSectionId === 'todoCat1') { sourceItems = t.category1Items; sourceMemo = t.category1Memos[itemId] || ''; isSpecialSource = true; }
            else if (sourceSectionId === 'todoCat2') { sourceItems = t.category2Items; sourceMemo = t.category2Memos[itemId] || ''; isSpecialSource = true; }
            else if (sourceSectionId === 'todoCat3') { sourceItems = t.category3Items; sourceMemo = t.category3Memos[itemId] || ''; isSpecialSource = true; }
            else if (sourceSectionId === 'todoCat4') { sourceItems = t.category4Items; sourceMemo = t.category4Memos[itemId] || ''; isSpecialSource = true; }
            else if (sourceSectionId === 'todoCat5') { sourceItems = t.category5Items; sourceMemo = t.category5Memos[itemId] || ''; isSpecialSource = true; }
            else if (sourceSectionId === 'todo2Cat1') { sourceItems = t2.category1Items; sourceMemo = t2.category1Memos[itemId] || ''; isSpecialSource = true; }
            else if (sourceSectionId === 'todo2Cat2') { sourceItems = t2.category2Items; sourceMemo = t2.category2Memos[itemId] || ''; isSpecialSource = true; }
            else if (sourceSectionId === 'todo2Cat3') { sourceItems = t2.category3Items; sourceMemo = t2.category3Memos[itemId] || ''; isSpecialSource = true; }
            else if (sourceSectionId === 'todo2Cat4') { sourceItems = t2.category4Items; sourceMemo = t2.category4Memos[itemId] || ''; isSpecialSource = true; }
            else if (sourceSectionId === 'todo2Cat5') { sourceItems = t2.category5Items; sourceMemo = t2.category5Memos[itemId] || ''; isSpecialSource = true; }
            else if (sourceSectionId === 'todo3Cat1') { sourceItems = t3.category1Items; sourceMemo = t3.category1Memos[itemId] || ''; isSpecialSource = true; }
            else if (sourceSectionId === 'todo3Cat2') { sourceItems = t3.category2Items; sourceMemo = t3.category2Memos[itemId] || ''; isSpecialSource = true; }
            else if (sourceSectionId === 'todo3Cat3') { sourceItems = t3.category3Items; sourceMemo = t3.category3Memos[itemId] || ''; isSpecialSource = true; }
            else if (sourceSectionId === 'todo3Cat4') { sourceItems = t3.category4Items; sourceMemo = t3.category4Memos[itemId] || ''; isSpecialSource = true; }
            else if (sourceSectionId === 'todo3Cat5') { sourceItems = t3.category5Items; sourceMemo = t3.category5Memos[itemId] || ''; isSpecialSource = true; }
        }

        const itemToMove = sourceItems.find(i => i.id === itemId);
        if (!itemToMove) return;

        const targetTab = safeData.tabs.find(t => t.id === targetTabId);
        if (!targetTab) return;

        let targetSection = targetTab.sections.find(s => s.id === targetSectionId);
        let isSpecialTarget = false;
        if (!targetSection && targetTab.inboxSection?.id === targetSectionId) {
            targetSection = targetTab.inboxSection;
        }
        if (!targetSection) {
            // 특수 섹션(주차, 할일관리) 체크
            const specialSectionIds = [
                'checklist', 'shopping', 'reminders', 'todo', 'parkingCat5',
                'todoCat1', 'todoCat2', 'todoCat3', 'todoCat4', 'todoCat5',
                'todo2Cat1', 'todo2Cat2', 'todo2Cat3', 'todo2Cat4', 'todo2Cat5',
                'todo3Cat1', 'todo3Cat2', 'todo3Cat3', 'todo3Cat4', 'todo3Cat5'
            ];
            if (specialSectionIds.includes(targetSectionId)) {
                isSpecialTarget = true;
            }
        }

        if (!targetSection && !isSpecialTarget) return;

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
                        const t2 = tab.todoManagementInfo2;
                        const t3 = tab.todoManagementInfo3;
                        if (sourceSectionId === 'checklist') {
                            updatedTab.parkingInfo = { ...p, checklistItems: p.checklistItems.filter(i => i.id !== itemId), checklistMemos: (() => { const { [itemId]: r, ...rest } = p.checklistMemos; return rest; })() };
                        } else if (sourceSectionId === 'shopping') {
                            updatedTab.parkingInfo = { ...p, shoppingListItems: p.shoppingListItems.filter(i => i.id !== itemId), shoppingListMemos: (() => { const { [itemId]: r, ...rest } = p.shoppingListMemos; return rest; })() };
                        } else if (sourceSectionId === 'reminders') {
                            updatedTab.parkingInfo = { ...p, remindersItems: p.remindersItems.filter(i => i.id !== itemId), remindersMemos: (() => { const { [itemId]: r, ...rest } = p.remindersMemos; return rest; })() };
                        } else if (sourceSectionId === 'todo') {
                            updatedTab.parkingInfo = { ...p, todoItems: p.todoItems.filter(i => i.id !== itemId), todoMemos: (() => { const { [itemId]: r, ...rest } = p.todoMemos; return rest; })() };
                        } else if (sourceSectionId === 'parkingCat5') {
                            updatedTab.parkingInfo = { ...p, category5Items: p.category5Items.filter(i => i.id !== itemId), category5Memos: (() => { const { [itemId]: r, ...rest } = p.category5Memos; return rest; })() };
                        } else if (sourceSectionId === 'todoCat1') {
                            updatedTab.todoManagementInfo = { ...t, category1Items: t.category1Items.filter(i => i.id !== itemId), category1Memos: (() => { const { [itemId]: r, ...rest } = t.category1Memos; return rest; })() };
                        } else if (sourceSectionId === 'todoCat2') {
                            updatedTab.todoManagementInfo = { ...t, category2Items: t.category2Items.filter(i => i.id !== itemId), category2Memos: (() => { const { [itemId]: r, ...rest } = t.category2Memos; return rest; })() };
                        } else if (sourceSectionId === 'todoCat3') {
                            updatedTab.todoManagementInfo = { ...t, category3Items: t.category3Items.filter(i => i.id !== itemId), category3Memos: (() => { const { [itemId]: r, ...rest } = t.category3Memos; return rest; })() };
                        } else if (sourceSectionId === 'todoCat4') {
                            updatedTab.todoManagementInfo = { ...t, category4Items: t.category4Items.filter(i => i.id !== itemId), category4Memos: (() => { const { [itemId]: r, ...rest } = t.category4Memos; return rest; })() };
                        } else if (sourceSectionId === 'todoCat5') {
                            updatedTab.todoManagementInfo = { ...t, category5Items: t.category5Items.filter(i => i.id !== itemId), category5Memos: (() => { const { [itemId]: r, ...rest } = t.category5Memos; return rest; })() };
                        } else if (sourceSectionId === 'todo2Cat1') {
                            updatedTab.todoManagementInfo2 = { ...t2, category1Items: t2.category1Items.filter(i => i.id !== itemId), category1Memos: (() => { const { [itemId]: r, ...rest } = t2.category1Memos; return rest; })() };
                        } else if (sourceSectionId === 'todo2Cat2') {
                            updatedTab.todoManagementInfo2 = { ...t2, category2Items: t2.category2Items.filter(i => i.id !== itemId), category2Memos: (() => { const { [itemId]: r, ...rest } = t2.category2Memos; return rest; })() };
                        } else if (sourceSectionId === 'todo2Cat3') {
                            updatedTab.todoManagementInfo2 = { ...t2, category3Items: t2.category3Items.filter(i => i.id !== itemId), category3Memos: (() => { const { [itemId]: r, ...rest } = t2.category3Memos; return rest; })() };
                        } else if (sourceSectionId === 'todo2Cat4') {
                            updatedTab.todoManagementInfo2 = { ...t2, category4Items: t2.category4Items.filter(i => i.id !== itemId), category4Memos: (() => { const { [itemId]: r, ...rest } = t2.category4Memos; return rest; })() };
                        } else if (sourceSectionId === 'todo2Cat5') {
                            updatedTab.todoManagementInfo2 = { ...t2, category5Items: t2.category5Items.filter(i => i.id !== itemId), category5Memos: (() => { const { [itemId]: r, ...rest } = t2.category5Memos; return rest; })() };
                        } else if (sourceSectionId === 'todo3Cat1') {
                            updatedTab.todoManagementInfo3 = { ...t3, category1Items: t3.category1Items.filter(i => i.id !== itemId), category1Memos: (() => { const { [itemId]: r, ...rest } = t3.category1Memos; return rest; })() };
                        } else if (sourceSectionId === 'todo3Cat2') {
                            updatedTab.todoManagementInfo3 = { ...t3, category2Items: t3.category2Items.filter(i => i.id !== itemId), category2Memos: (() => { const { [itemId]: r, ...rest } = t3.category2Memos; return rest; })() };
                        } else if (sourceSectionId === 'todo3Cat3') {
                            updatedTab.todoManagementInfo3 = { ...t3, category3Items: t3.category3Items.filter(i => i.id !== itemId), category3Memos: (() => { const { [itemId]: r, ...rest } = t3.category3Memos; return rest; })() };
                        } else if (sourceSectionId === 'todo3Cat4') {
                            updatedTab.todoManagementInfo3 = { ...t3, category4Items: t3.category4Items.filter(i => i.id !== itemId), category4Memos: (() => { const { [itemId]: r, ...rest } = t3.category4Memos; return rest; })() };
                        } else if (sourceSectionId === 'todo3Cat5') {
                            updatedTab.todoManagementInfo3 = { ...t3, category5Items: t3.category5Items.filter(i => i.id !== itemId), category5Memos: (() => { const { [itemId]: r, ...rest } = t3.category5Memos; return rest; })() };
                        }
                    }

                    // 같은 탭 내 이동이면 타겟 처리도 여기서
                    if (sourceTabId === targetTabId) {
                        if (targetSection) {
                            if (targetSection.id === updatedTab.inboxSection?.id) {
                                updatedTab.inboxSection = { ...updatedTab.inboxSection!, items: [...updatedTab.inboxSection!.items, itemToMove] };
                            } else {
                                updatedTab.sections = updatedTab.sections.map(s => s.id === targetSectionId ? { ...s, items: [...s.items, itemToMove] } : s);
                            }
                        } else if (isSpecialTarget) {
                            if (targetSectionId === 'checklist') updatedTab.parkingInfo = { ...updatedTab.parkingInfo, checklistItems: [...updatedTab.parkingInfo.checklistItems, itemToMove] };
                            else if (targetSectionId === 'shopping') updatedTab.parkingInfo = { ...updatedTab.parkingInfo, shoppingListItems: [...updatedTab.parkingInfo.shoppingListItems, itemToMove] };
                            else if (targetSectionId === 'reminders') updatedTab.parkingInfo = { ...updatedTab.parkingInfo, remindersItems: [...updatedTab.parkingInfo.remindersItems, itemToMove] };
                            else if (targetSectionId === 'todo') updatedTab.parkingInfo = { ...updatedTab.parkingInfo, todoItems: [...updatedTab.parkingInfo.todoItems, itemToMove] };
                            else if (targetSectionId === 'parkingCat5') updatedTab.parkingInfo = { ...updatedTab.parkingInfo, category5Items: [...updatedTab.parkingInfo.category5Items, itemToMove] };
                            else if (targetSectionId === 'todoCat1') updatedTab.todoManagementInfo = { ...updatedTab.todoManagementInfo, category1Items: [...updatedTab.todoManagementInfo.category1Items, itemToMove] };
                            else if (targetSectionId === 'todoCat2') updatedTab.todoManagementInfo = { ...updatedTab.todoManagementInfo, category2Items: [...updatedTab.todoManagementInfo.category2Items, itemToMove] };
                            else if (targetSectionId === 'todoCat3') updatedTab.todoManagementInfo = { ...updatedTab.todoManagementInfo, category3Items: [...updatedTab.todoManagementInfo.category3Items, itemToMove] };
                            else if (targetSectionId === 'todoCat4') updatedTab.todoManagementInfo = { ...updatedTab.todoManagementInfo, category4Items: [...updatedTab.todoManagementInfo.category4Items, itemToMove] };
                            else if (targetSectionId === 'todoCat5') updatedTab.todoManagementInfo = { ...updatedTab.todoManagementInfo, category5Items: [...updatedTab.todoManagementInfo.category5Items, itemToMove] };
                            else if (targetSectionId === 'todo2Cat1') updatedTab.todoManagementInfo2 = { ...updatedTab.todoManagementInfo2, category1Items: [...updatedTab.todoManagementInfo2.category1Items, itemToMove] };
                            else if (targetSectionId === 'todo2Cat2') updatedTab.todoManagementInfo2 = { ...updatedTab.todoManagementInfo2, category2Items: [...updatedTab.todoManagementInfo2.category2Items, itemToMove] };
                            else if (targetSectionId === 'todo2Cat3') updatedTab.todoManagementInfo2 = { ...updatedTab.todoManagementInfo2, category3Items: [...updatedTab.todoManagementInfo2.category3Items, itemToMove] };
                            else if (targetSectionId === 'todo2Cat4') updatedTab.todoManagementInfo2 = { ...updatedTab.todoManagementInfo2, category4Items: [...updatedTab.todoManagementInfo2.category4Items, itemToMove] };
                            else if (targetSectionId === 'todo2Cat5') updatedTab.todoManagementInfo2 = { ...updatedTab.todoManagementInfo2, category5Items: [...updatedTab.todoManagementInfo2.category5Items, itemToMove] };
                            else if (targetSectionId === 'todo3Cat1') updatedTab.todoManagementInfo3 = { ...updatedTab.todoManagementInfo3, category1Items: [...updatedTab.todoManagementInfo3.category1Items, itemToMove] };
                            else if (targetSectionId === 'todo3Cat2') updatedTab.todoManagementInfo3 = { ...updatedTab.todoManagementInfo3, category2Items: [...updatedTab.todoManagementInfo3.category2Items, itemToMove] };
                            else if (targetSectionId === 'todo3Cat3') updatedTab.todoManagementInfo3 = { ...updatedTab.todoManagementInfo3, category3Items: [...updatedTab.todoManagementInfo3.category3Items, itemToMove] };
                            else if (targetSectionId === 'todo3Cat4') updatedTab.todoManagementInfo3 = { ...updatedTab.todoManagementInfo3, category4Items: [...updatedTab.todoManagementInfo3.category4Items, itemToMove] };
                            else if (targetSectionId === 'todo3Cat5') updatedTab.todoManagementInfo3 = { ...updatedTab.todoManagementInfo3, category5Items: [...updatedTab.todoManagementInfo3.category5Items, itemToMove] };
                        }

                        if (sourceMemo) {
                            if (targetSection) updatedTab.memos = { ...updatedTab.memos, [itemId]: sourceMemo };
                            else if (isSpecialTarget) {
                                if (targetSectionId === 'checklist') updatedTab.parkingInfo = { ...updatedTab.parkingInfo, checklistMemos: { ...updatedTab.parkingInfo.checklistMemos, [itemId]: sourceMemo } };
                                else if (targetSectionId === 'shopping') updatedTab.parkingInfo = { ...updatedTab.parkingInfo, shoppingListMemos: { ...updatedTab.parkingInfo.shoppingListMemos, [itemId]: sourceMemo } };
                                else if (targetSectionId === 'reminders') updatedTab.parkingInfo = { ...updatedTab.parkingInfo, remindersMemos: { ...updatedTab.parkingInfo.remindersMemos, [itemId]: sourceMemo } };
                                else if (targetSectionId === 'todo') updatedTab.parkingInfo = { ...updatedTab.parkingInfo, todoMemos: { ...updatedTab.parkingInfo.todoMemos, [itemId]: sourceMemo } };
                                else if (targetSectionId === 'parkingCat5') updatedTab.parkingInfo = { ...updatedTab.parkingInfo, category5Memos: { ...updatedTab.parkingInfo.category5Memos, [itemId]: sourceMemo } };
                                else if (targetSectionId === 'todoCat1') updatedTab.todoManagementInfo = { ...updatedTab.todoManagementInfo, category1Memos: { ...updatedTab.todoManagementInfo.category1Memos, [itemId]: sourceMemo } };
                                else if (targetSectionId === 'todoCat2') updatedTab.todoManagementInfo = { ...updatedTab.todoManagementInfo, category2Memos: { ...updatedTab.todoManagementInfo.category2Memos, [itemId]: sourceMemo } };
                                else if (targetSectionId === 'todoCat3') updatedTab.todoManagementInfo = { ...updatedTab.todoManagementInfo, category3Memos: { ...updatedTab.todoManagementInfo.category3Memos, [itemId]: sourceMemo } };
                                else if (targetSectionId === 'todoCat4') updatedTab.todoManagementInfo = { ...updatedTab.todoManagementInfo, category4Memos: { ...updatedTab.todoManagementInfo.category4Memos, [itemId]: sourceMemo } };
                                else if (targetSectionId === 'todoCat5') updatedTab.todoManagementInfo = { ...updatedTab.todoManagementInfo, category5Memos: { ...updatedTab.todoManagementInfo.category5Memos, [itemId]: sourceMemo } };
                                else if (targetSectionId === 'todo2Cat1') updatedTab.todoManagementInfo2 = { ...updatedTab.todoManagementInfo2, category1Memos: { ...updatedTab.todoManagementInfo2.category1Memos, [itemId]: sourceMemo } };
                                else if (targetSectionId === 'todo2Cat2') updatedTab.todoManagementInfo2 = { ...updatedTab.todoManagementInfo2, category2Memos: { ...updatedTab.todoManagementInfo2.category2Memos, [itemId]: sourceMemo } };
                                else if (targetSectionId === 'todo2Cat3') updatedTab.todoManagementInfo2 = { ...updatedTab.todoManagementInfo2, category3Memos: { ...updatedTab.todoManagementInfo2.category3Memos, [itemId]: sourceMemo } };
                                else if (targetSectionId === 'todo2Cat4') updatedTab.todoManagementInfo2 = { ...updatedTab.todoManagementInfo2, category4Memos: { ...updatedTab.todoManagementInfo2.category4Memos, [itemId]: sourceMemo } };
                                else if (targetSectionId === 'todo2Cat5') updatedTab.todoManagementInfo2 = { ...updatedTab.todoManagementInfo2, category5Memos: { ...updatedTab.todoManagementInfo2.category5Memos, [itemId]: sourceMemo } };
                                else if (targetSectionId === 'todo3Cat1') updatedTab.todoManagementInfo3 = { ...updatedTab.todoManagementInfo3, category1Memos: { ...updatedTab.todoManagementInfo3.category1Memos, [itemId]: sourceMemo } };
                                else if (targetSectionId === 'todo3Cat2') updatedTab.todoManagementInfo3 = { ...updatedTab.todoManagementInfo3, category2Memos: { ...updatedTab.todoManagementInfo3.category2Memos, [itemId]: sourceMemo } };
                                else if (targetSectionId === 'todo3Cat3') updatedTab.todoManagementInfo3 = { ...updatedTab.todoManagementInfo3, category3Memos: { ...updatedTab.todoManagementInfo3.category3Memos, [itemId]: sourceMemo } };
                                else if (targetSectionId === 'todo3Cat4') updatedTab.todoManagementInfo3 = { ...updatedTab.todoManagementInfo3, category4Memos: { ...updatedTab.todoManagementInfo3.category4Memos, [itemId]: sourceMemo } };
                                else if (targetSectionId === 'todo3Cat5') updatedTab.todoManagementInfo3 = { ...updatedTab.todoManagementInfo3, category5Memos: { ...updatedTab.todoManagementInfo3.category5Memos, [itemId]: sourceMemo } };
                            }
                        }
                    }
                    return updatedTab;
                }
                // 2. 다른 탭 타겟 처리
                if (sourceTabId !== targetTabId && tab.id === targetTabId) {
                    let updatedTab = { ...tab };
                    if (targetSection) {
                        if (targetSection.id === tab.inboxSection?.id) {
                            updatedTab.inboxSection = { ...tab.inboxSection!, items: [...tab.inboxSection!.items, itemToMove] };
                        } else {
                            updatedTab.sections = tab.sections.map(s => s.id === targetSectionId ? { ...s, items: [...s.items, itemToMove] } : s);
                        }
                    } else if (isSpecialTarget) {
                        if (targetSectionId === 'checklist') updatedTab.parkingInfo = { ...tab.parkingInfo, checklistItems: [...tab.parkingInfo.checklistItems, itemToMove] };
                        else if (targetSectionId === 'shopping') updatedTab.parkingInfo = { ...tab.parkingInfo, shoppingListItems: [...tab.parkingInfo.shoppingListItems, itemToMove] };
                        else if (targetSectionId === 'reminders') updatedTab.parkingInfo = { ...tab.parkingInfo, remindersItems: [...tab.parkingInfo.remindersItems, itemToMove] };
                        else if (targetSectionId === 'todo') updatedTab.parkingInfo = { ...tab.parkingInfo, todoItems: [...tab.parkingInfo.todoItems, itemToMove] };
                        else if (targetSectionId === 'parkingCat5') updatedTab.parkingInfo = { ...tab.parkingInfo, category5Items: [...tab.parkingInfo.category5Items, itemToMove] };
                        else if (targetSectionId === 'todoCat1') updatedTab.todoManagementInfo = { ...tab.todoManagementInfo, category1Items: [...tab.todoManagementInfo.category1Items, itemToMove] };
                        else if (targetSectionId === 'todoCat2') updatedTab.todoManagementInfo = { ...tab.todoManagementInfo, category2Items: [...tab.todoManagementInfo.category2Items, itemToMove] };
                        else if (targetSectionId === 'todoCat3') updatedTab.todoManagementInfo = { ...tab.todoManagementInfo, category3Items: [...tab.todoManagementInfo.category3Items, itemToMove] };
                        else if (targetSectionId === 'todoCat4') updatedTab.todoManagementInfo = { ...tab.todoManagementInfo, category4Items: [...tab.todoManagementInfo.category4Items, itemToMove] };
                        else if (targetSectionId === 'todoCat5') updatedTab.todoManagementInfo = { ...tab.todoManagementInfo, category5Items: [...tab.todoManagementInfo.category5Items, itemToMove] };
                        else if (targetSectionId === 'todo2Cat1') updatedTab.todoManagementInfo2 = { ...tab.todoManagementInfo2, category1Items: [...tab.todoManagementInfo2.category1Items, itemToMove] };
                        else if (targetSectionId === 'todo2Cat2') updatedTab.todoManagementInfo2 = { ...tab.todoManagementInfo2, category2Items: [...tab.todoManagementInfo2.category2Items, itemToMove] };
                        else if (targetSectionId === 'todo2Cat3') updatedTab.todoManagementInfo2 = { ...tab.todoManagementInfo2, category3Items: [...tab.todoManagementInfo2.category3Items, itemToMove] };
                        else if (targetSectionId === 'todo2Cat4') updatedTab.todoManagementInfo2 = { ...tab.todoManagementInfo2, category4Items: [...tab.todoManagementInfo2.category4Items, itemToMove] };
                        else if (targetSectionId === 'todo2Cat5') updatedTab.todoManagementInfo2 = { ...tab.todoManagementInfo2, category5Items: [...tab.todoManagementInfo2.category5Items, itemToMove] };
                        else if (targetSectionId === 'todo3Cat1') updatedTab.todoManagementInfo3 = { ...tab.todoManagementInfo3, category1Items: [...tab.todoManagementInfo3.category1Items, itemToMove] };
                        else if (targetSectionId === 'todo3Cat2') updatedTab.todoManagementInfo3 = { ...tab.todoManagementInfo3, category2Items: [...tab.todoManagementInfo3.category2Items, itemToMove] };
                        else if (targetSectionId === 'todo3Cat3') updatedTab.todoManagementInfo3 = { ...tab.todoManagementInfo3, category3Items: [...tab.todoManagementInfo3.category3Items, itemToMove] };
                        else if (targetSectionId === 'todo3Cat4') updatedTab.todoManagementInfo3 = { ...tab.todoManagementInfo3, category4Items: [...tab.todoManagementInfo3.category4Items, itemToMove] };
                        else if (targetSectionId === 'todo3Cat5') updatedTab.todoManagementInfo3 = { ...tab.todoManagementInfo3, category5Items: [...tab.todoManagementInfo3.category5Items, itemToMove] };
                    }

                    if (sourceMemo) {
                        if (targetSection) updatedTab.memos = { ...tab.memos, [itemId]: sourceMemo };
                        else if (isSpecialTarget) {
                            if (targetSectionId === 'checklist') updatedTab.parkingInfo = { ...updatedTab.parkingInfo, checklistMemos: { ...tab.parkingInfo.checklistMemos, [itemId]: sourceMemo } };
                            else if (targetSectionId === 'shopping') updatedTab.parkingInfo = { ...updatedTab.parkingInfo, shoppingListMemos: { ...tab.parkingInfo.shoppingListMemos, [itemId]: sourceMemo } };
                            else if (targetSectionId === 'reminders') updatedTab.parkingInfo = { ...updatedTab.parkingInfo, remindersMemos: { ...tab.parkingInfo.remindersMemos, [itemId]: sourceMemo } };
                            else if (targetSectionId === 'todo') updatedTab.parkingInfo = { ...updatedTab.parkingInfo, todoMemos: { ...tab.parkingInfo.todoMemos, [itemId]: sourceMemo } };
                            else if (targetSectionId === 'parkingCat5') updatedTab.parkingInfo = { ...updatedTab.parkingInfo, category5Memos: { ...tab.parkingInfo.category5Memos, [itemId]: sourceMemo } };
                            else if (targetSectionId === 'todoCat1') updatedTab.todoManagementInfo = { ...updatedTab.todoManagementInfo, category1Memos: { ...tab.todoManagementInfo.category1Memos, [itemId]: sourceMemo } };
                            else if (targetSectionId === 'todoCat2') updatedTab.todoManagementInfo = { ...updatedTab.todoManagementInfo, category2Memos: { ...tab.todoManagementInfo.category2Memos, [itemId]: sourceMemo } };
                            else if (targetSectionId === 'todoCat3') updatedTab.todoManagementInfo = { ...updatedTab.todoManagementInfo, category3Memos: { ...tab.todoManagementInfo.category3Memos, [itemId]: sourceMemo } };
                            else if (targetSectionId === 'todoCat4') updatedTab.todoManagementInfo = { ...updatedTab.todoManagementInfo, category4Memos: { ...tab.todoManagementInfo.category4Memos, [itemId]: sourceMemo } };
                            else if (targetSectionId === 'todoCat5') updatedTab.todoManagementInfo = { ...updatedTab.todoManagementInfo, category5Memos: { ...tab.todoManagementInfo.category5Memos, [itemId]: sourceMemo } };
                            else if (targetSectionId === 'todo2Cat1') updatedTab.todoManagementInfo2 = { ...updatedTab.todoManagementInfo2, category1Memos: { ...tab.todoManagementInfo2.category1Memos, [itemId]: sourceMemo } };
                            else if (targetSectionId === 'todo2Cat2') updatedTab.todoManagementInfo2 = { ...updatedTab.todoManagementInfo2, category2Memos: { ...tab.todoManagementInfo2.category2Memos, [itemId]: sourceMemo } };
                            else if (targetSectionId === 'todo2Cat3') updatedTab.todoManagementInfo2 = { ...updatedTab.todoManagementInfo2, category3Memos: { ...tab.todoManagementInfo2.category3Memos, [itemId]: sourceMemo } };
                            else if (targetSectionId === 'todo2Cat4') updatedTab.todoManagementInfo2 = { ...updatedTab.todoManagementInfo2, category4Memos: { ...tab.todoManagementInfo2.category4Memos, [itemId]: sourceMemo } };
                            else if (targetSectionId === 'todo2Cat5') updatedTab.todoManagementInfo2 = { ...updatedTab.todoManagementInfo2, category5Memos: { ...tab.todoManagementInfo2.category5Memos, [itemId]: sourceMemo } };
                            else if (targetSectionId === 'todo3Cat1') updatedTab.todoManagementInfo3 = { ...updatedTab.todoManagementInfo3, category1Memos: { ...tab.todoManagementInfo3.category1Memos, [itemId]: sourceMemo } };
                            else if (targetSectionId === 'todo3Cat2') updatedTab.todoManagementInfo3 = { ...updatedTab.todoManagementInfo3, category2Memos: { ...tab.todoManagementInfo3.category2Memos, [itemId]: sourceMemo } };
                            else if (targetSectionId === 'todo3Cat3') updatedTab.todoManagementInfo3 = { ...updatedTab.todoManagementInfo3, category3Memos: { ...tab.todoManagementInfo3.category3Memos, [itemId]: sourceMemo } };
                            else if (targetSectionId === 'todo3Cat4') updatedTab.todoManagementInfo3 = { ...updatedTab.todoManagementInfo3, category4Memos: { ...tab.todoManagementInfo3.category4Memos, [itemId]: sourceMemo } };
                            else if (targetSectionId === 'todo3Cat5') updatedTab.todoManagementInfo3 = { ...updatedTab.todoManagementInfo3, category5Memos: { ...tab.todoManagementInfo3.category5Memos, [itemId]: sourceMemo } };
                        }
                    }
                    return updatedTab;
                }
                return tab;
            }),
            activeTabId: switchTab ? targetTabId : safeData.activeTabId
        });

    };

    return {
        dragState,
        setDragState,
        handleAddSection,
        handleUpdateSection,
        handleUpdateInboxSection,
        handleDeleteSection,
        onSectionDragStart,
        onSectionDragOver,
        onSectionDrop,
        onSectionDragEnd,
        handleCrossSectionItemDrop,
        handleClearAll,
        handleMoveItem
    };
};
