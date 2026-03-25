import React, { useState } from 'react';
import { AppData, Section, DragState, Tab, ListItem, ParkingInfo, TodoManagementInfo } from '../types';

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
        sourceTabId: null,
        draggedSectionId: null,
        dragOverSectionId: null,
        dragOverTabId: null
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

    // 섹션 간 아이템 이동 (Trello style) - 모든 섹션(위젯 포함) 대응
    const handleCrossSectionItemDrop = (
        draggedItemId: string,
        sourceSectionId: string,
        targetSectionId: string,
        sourceTabId: string = activeTab.id,
        targetTabId: string = activeTab.id,
        targetItemId?: string | null
    ) => {
        if (sourceSectionId === targetSectionId && sourceTabId === targetTabId) return;

        // handleMoveItem을 재사용하되, targetItemId(상대적 위치) 처리가 필요하면 여기서 추가 로직 수행
        // 하지만 현재 handleMoveItem은 항상 맨 뒤에 추가하므로, reorder와 drop이 혼합된 정교한 로직이 필요함.
        // 여기서는 handleMoveItem의 로직을 확장하여 targetItemId 위치에 삽입하도록 구현.

        const sourceTab = safeData.tabs.find(t => t.id === (sourceTabId || activeTab.id));
        const targetTab = safeData.tabs.find(t => t.id === (targetTabId || activeTab.id));
        if (!sourceTab || !targetTab) return;

        // Helper to find items and memo in ANY section type
        const findInSection = (tab: Tab, secId: string) => {
            let items: ListItem[] = [];
            let memos: { [key: string]: string } = {};
            let type: 'normal' | 'inbox' | 'parking' | 'todo' = 'normal';
            let subType: string = '';

            if (tab.inboxSection?.id === secId) { items = tab.inboxSection.items; memos = tab.memos; type = 'inbox'; }
            else if (tab.sections.some(s => s.id === secId)) { 
                const s = tab.sections.find(s => s.id === secId)!;
                items = s.items; memos = tab.memos; type = 'normal'; 
            }
            else {
                type = 'parking'; // Default to parking/todo categories
                const p = tab.parkingInfo;
                const t = tab.todoManagementInfo;
                const t2 = tab.todoManagementInfo2;
                const t3 = tab.todoManagementInfo3;

                if (secId === 'checklist') { items = p.checklistItems; memos = p.checklistMemos; subType = 'checklist'; }
                else if (secId === 'shopping') { items = p.shoppingListItems; memos = p.shoppingListMemos; subType = 'shopping'; }
                else if (secId === 'reminders') { items = p.remindersItems; memos = p.remindersMemos; subType = 'reminders'; }
                else if (secId === 'todo') { items = p.todoItems; memos = p.todoMemos; subType = 'todo'; }
                else if (secId === 'parkingCat5') { items = p.category5Items; memos = p.category5Memos; subType = 'parkingCat5'; }
                else if (secId === 'todoCat1') { items = t.category1Items; memos = t.category1Memos; type='todo'; subType = 'todoCat1'; }
                else if (secId === 'todoCat2') { items = t.category2Items; memos = t.category2Memos; type='todo'; subType = 'todoCat2'; }
                else if (secId === 'todoCat3') { items = t.category3Items; memos = t.category3Memos; type='todo'; subType = 'todoCat3'; }
                else if (secId === 'todoCat4') { items = t.category4Items; memos = t.category4Memos; type='todo'; subType = 'todoCat4'; }
                else if (secId === 'todoCat5') { items = t.category5Items; memos = t.category5Memos; type='todo'; subType = 'todoCat5'; }
                else if (secId === 'todo2Cat1') { items = t2.category1Items; memos = t2.category1Memos; type='todo'; subType = 'todo2Cat1'; }
                else if (secId === 'todo2Cat2') { items = t2.category2Items; memos = t2.category2Memos; type='todo'; subType = 'todo2Cat2'; }
                else if (secId === 'todo2Cat3') { items = t2.category3Items; memos = t2.category3Memos; type='todo'; subType = 'todo2Cat3'; }
                else if (secId === 'todo2Cat4') { items = t2.category4Items; memos = t2.category4Memos; type='todo'; subType = 'todo2Cat4'; }
                else if (secId === 'todo2Cat5') { items = t2.category5Items; memos = t2.category5Memos; type='todo'; subType = 'todo2Cat5'; }
                else if (secId === 'todo3Cat1') { items = t3.category1Items; memos = t3.category1Memos; type='todo'; subType = 'todo3Cat1'; }
                else if (secId === 'todo3Cat2') { items = t3.category2Items; memos = t3.category2Memos; type='todo'; subType = 'todo3Cat2'; }
                else if (secId === 'todo3Cat3') { items = t3.category3Items; memos = t3.category3Memos; type='todo'; subType = 'todo3Cat3'; }
                else if (secId === 'todo3Cat4') { items = t3.category4Items; memos = t3.category4Memos; type='todo'; subType = 'todo3Cat4'; }
                else if (secId === 'todo3Cat5') { items = t3.category5Items; memos = t3.category5Memos; type='todo'; subType = 'todo3Cat5'; }
            }
            return { items: items || [], memos: memos || {}, type, subType };
        };

        const source = findInSection(sourceTab, sourceSectionId);
        const target = findInSection(targetTab, targetSectionId);

        const itemToMove = source.items.find(i => i.id === draggedItemId);
        if (!itemToMove) return;

        const sourceMemo = source.memos[draggedItemId];

        updateData({
            ...safeData,
            tabs: safeData.tabs.map(tab => {
                let updatedTab = { ...tab };
                const isSourceTab = tab.id === sourceTabId;
                const isTargetTab = tab.id === targetTabId;

                // 1. Remove from source
                if (isSourceTab) {
                    if (source.type === 'inbox') {
                        updatedTab.inboxSection = { ...tab.inboxSection!, items: tab.inboxSection!.items.filter(i => i.id !== draggedItemId) };
                        const { [draggedItemId]: rem, ...rest } = updatedTab.memos; updatedTab.memos = rest;
                    } else if (source.type === 'normal') {
                        updatedTab.sections = tab.sections.map(s => s.id === sourceSectionId ? { ...s, items: s.items.filter(i => i.id !== draggedItemId) } : s);
                        const { [draggedItemId]: rem, ...rest } = updatedTab.memos; updatedTab.memos = rest;
                    } else {
                        // Widget removal
                        const p = updatedTab.parkingInfo; const t1 = updatedTab.todoManagementInfo; const t2 = updatedTab.todoManagementInfo2; const t3 = updatedTab.todoManagementInfo3;
                        const filterItems = (items: ListItem[]) => (items || []).filter(i => i.id !== draggedItemId);
                        const filterMemos = (memos: any) => { const { [draggedItemId]: rm, ...rst } = (memos || {}); return rst; };

                        if (source.subType === 'checklist') updatedTab.parkingInfo = { ...p, checklistItems: filterItems(p.checklistItems), checklistMemos: filterMemos(p.checklistMemos) };
                        else if (source.subType === 'shopping') updatedTab.parkingInfo = { ...p, shoppingListItems: filterItems(p.shoppingListItems), shoppingListMemos: filterMemos(p.shoppingListMemos) };
                        else if (source.subType === 'reminders') updatedTab.parkingInfo = { ...p, remindersItems: filterItems(p.remindersItems), remindersMemos: filterMemos(p.remindersMemos) };
                        else if (source.subType === 'todo') updatedTab.parkingInfo = { ...p, todoItems: filterItems(p.todoItems), todoMemos: filterMemos(p.todoMemos) };
                        else if (source.subType === 'parkingCat5') updatedTab.parkingInfo = { ...p, category5Items: filterItems(p.category5Items), category5Memos: filterMemos(p.category5Memos) };
                        else if (source.subType === 'todoCat1') updatedTab.todoManagementInfo = { ...t1, category1Items: filterItems(t1.category1Items), category1Memos: filterMemos(t1.category1Memos) };
                        else if (source.subType === 'todoCat2') updatedTab.todoManagementInfo = { ...t1, category2Items: filterItems(t1.category2Items), category2Memos: filterMemos(t1.category2Memos) };
                        else if (source.subType === 'todoCat3') updatedTab.todoManagementInfo = { ...t1, category3Items: filterItems(t1.category3Items), category3Memos: filterMemos(t1.category3Memos) };
                        else if (source.subType === 'todoCat4') updatedTab.todoManagementInfo = { ...t1, category4Items: filterItems(t1.category4Items), category4Memos: filterMemos(t1.category4Memos) };
                        else if (source.subType === 'todoCat5') updatedTab.todoManagementInfo = { ...t1, category5Items: filterItems(t1.category5Items), category5Memos: filterMemos(t1.category5Memos) };
                        else if (source.subType === 'todo2Cat1') updatedTab.todoManagementInfo2 = { ...t2, category1Items: filterItems(t2.category1Items), category1Memos: filterMemos(t2.category1Memos) };
                        else if (source.subType === 'todo2Cat2') updatedTab.todoManagementInfo2 = { ...t2, category2Items: filterItems(t2.category2Items), category2Memos: filterMemos(t2.category2Memos) };
                        else if (source.subType === 'todo2Cat3') updatedTab.todoManagementInfo2 = { ...t2, category3Items: filterItems(t2.category3Items), category3Memos: filterMemos(t2.category3Memos) };
                        else if (source.subType === 'todo2Cat4') updatedTab.todoManagementInfo2 = { ...t2, category4Items: filterItems(t2.category4Items), category4Memos: filterMemos(t2.category4Memos) };
                        else if (source.subType === 'todo2Cat5') updatedTab.todoManagementInfo2 = { ...t2, category5Items: filterItems(t2.category5Items), category5Memos: filterMemos(t2.category5Memos) };
                        else if (source.subType === 'todo3Cat1') updatedTab.todoManagementInfo3 = { ...t3, category1Items: filterItems(t3.category1Items), category1Memos: filterMemos(t3.category1Memos) };
                        else if (source.subType === 'todo3Cat2') updatedTab.todoManagementInfo3 = { ...t3, category2Items: filterItems(t3.category2Items), category2Memos: filterMemos(t3.category2Memos) };
                        else if (source.subType === 'todo3Cat3') updatedTab.todoManagementInfo3 = { ...t3, category3Items: filterItems(t3.category3Items), category3Memos: filterMemos(t3.category3Memos) };
                        else if (source.subType === 'todo3Cat4') updatedTab.todoManagementInfo3 = { ...t3, category4Items: filterItems(t3.category4Items), category4Memos: filterMemos(t3.category4Memos) };
                        else if (source.subType === 'todo3Cat5') updatedTab.todoManagementInfo3 = { ...t3, category5Items: filterItems(t3.category5Items), category5Memos: filterMemos(t3.category5Memos) };
                    }
                }

                // 2. Add to target
                if (isTargetTab) {
                    const insertItems = (items: ListItem[]) => {
                        const newItems = [...(items || [])];
                        if (targetItemId) {
                            const idx = newItems.findIndex(i => i.id === targetItemId);
                            if (idx !== -1) newItems.splice(idx, 0, itemToMove);
                            else newItems.unshift(itemToMove);
                        } else {
                            newItems.unshift(itemToMove); // Default to start for target sections
                        }
                        return newItems;
                    };

                    if (target.type === 'inbox') {
                        updatedTab.inboxSection = { ...updatedTab.inboxSection!, items: insertItems(updatedTab.inboxSection!.items) };
                        if (sourceMemo) updatedTab.memos = { ...updatedTab.memos, [draggedItemId]: sourceMemo };
                    } else if (target.type === 'normal') {
                        updatedTab.sections = updatedTab.sections.map(s => s.id === targetSectionId ? { ...s, items: insertItems(s.items) } : s);
                        if (sourceMemo) updatedTab.memos = { ...updatedTab.memos, [draggedItemId]: sourceMemo };
                    } else {
                        // Widget addition
                        const p = updatedTab.parkingInfo; const t1 = updatedTab.todoManagementInfo; const t2 = updatedTab.todoManagementInfo2; const t3 = updatedTab.todoManagementInfo3;
                        if (target.subType === 'checklist') { updatedTab.parkingInfo = { ...p, checklistItems: insertItems(p.checklistItems) }; if (sourceMemo) updatedTab.parkingInfo.checklistMemos[draggedItemId] = sourceMemo; }
                        else if (target.subType === 'shopping') { updatedTab.parkingInfo = { ...p, shoppingListItems: insertItems(p.shoppingListItems) }; if (sourceMemo) updatedTab.parkingInfo.shoppingListMemos[draggedItemId] = sourceMemo; }
                        else if (target.subType === 'reminders') { updatedTab.parkingInfo = { ...p, remindersItems: insertItems(p.remindersItems) }; if (sourceMemo) updatedTab.parkingInfo.remindersMemos[draggedItemId] = sourceMemo; }
                        else if (target.subType === 'todo') { updatedTab.parkingInfo = { ...p, todoItems: insertItems(p.todoItems) }; if (sourceMemo) updatedTab.parkingInfo.todoMemos[draggedItemId] = sourceMemo; }
                        else if (target.subType === 'parkingCat5') { updatedTab.parkingInfo = { ...p, category5Items: insertItems(p.category5Items) }; if (sourceMemo) updatedTab.parkingInfo.category5Memos[draggedItemId] = sourceMemo; }
                        else if (target.subType === 'todoCat1') { updatedTab.todoManagementInfo = { ...t1, category1Items: insertItems(t1.category1Items) }; if (sourceMemo) updatedTab.todoManagementInfo.category1Memos[draggedItemId] = sourceMemo; }
                        else if (target.subType === 'todoCat2') { updatedTab.todoManagementInfo = { ...t1, category2Items: insertItems(t1.category2Items) }; if (sourceMemo) updatedTab.todoManagementInfo.category2Memos[draggedItemId] = sourceMemo; }
                        else if (target.subType === 'todoCat3') { updatedTab.todoManagementInfo = { ...t1, category3Items: insertItems(t1.category3Items) }; if (sourceMemo) updatedTab.todoManagementInfo.category3Memos[draggedItemId] = sourceMemo; }
                        else if (target.subType === 'todoCat4') { updatedTab.todoManagementInfo = { ...t1, category4Items: insertItems(t1.category4Items) }; if (sourceMemo) updatedTab.todoManagementInfo.category4Memos[draggedItemId] = sourceMemo; }
                        else if (target.subType === 'todoCat5') { updatedTab.todoManagementInfo = { ...t1, category5Items: insertItems(t1.category5Items) }; if (sourceMemo) updatedTab.todoManagementInfo.category5Memos[draggedItemId] = sourceMemo; }
                        else if (target.subType === 'todo2Cat1') { updatedTab.todoManagementInfo2 = { ...t2, category1Items: insertItems(t2.category1Items) }; if (sourceMemo) updatedTab.todoManagementInfo2.category1Memos[draggedItemId] = sourceMemo; }
                        else if (target.subType === 'todo2Cat2') { updatedTab.todoManagementInfo2 = { ...t2, category2Items: insertItems(t2.category2Items) }; if (sourceMemo) updatedTab.todoManagementInfo2.category2Memos[draggedItemId] = sourceMemo; }
                        else if (target.subType === 'todo2Cat3') { updatedTab.todoManagementInfo2 = { ...t2, category3Items: insertItems(t2.category3Items) }; if (sourceMemo) updatedTab.todoManagementInfo2.category3Memos[draggedItemId] = sourceMemo; }
                        else if (target.subType === 'todo2Cat4') { updatedTab.todoManagementInfo2 = { ...t2, category4Items: insertItems(t2.category4Items) }; if (sourceMemo) updatedTab.todoManagementInfo2.category4Memos[draggedItemId] = sourceMemo; }
                        else if (target.subType === 'todo2Cat5') { updatedTab.todoManagementInfo2 = { ...t2, category5Items: insertItems(t2.category5Items) }; if (sourceMemo) updatedTab.todoManagementInfo2.category5Memos[draggedItemId] = sourceMemo; }
                        else if (target.subType === 'todo3Cat1') { updatedTab.todoManagementInfo3 = { ...t3, category1Items: insertItems(t3.category1Items) }; if (sourceMemo) updatedTab.todoManagementInfo3.category1Memos[draggedItemId] = sourceMemo; }
                        else if (target.subType === 'todo3Cat2') { updatedTab.todoManagementInfo3 = { ...t3, category2Items: insertItems(t3.category2Items) }; if (sourceMemo) updatedTab.todoManagementInfo3.category2Memos[draggedItemId] = sourceMemo; }
                        else if (target.subType === 'todo3Cat3') { updatedTab.todoManagementInfo3 = { ...t3, category3Items: insertItems(t3.category3Items) }; if (sourceMemo) updatedTab.todoManagementInfo3.category3Memos[draggedItemId] = sourceMemo; }
                        else if (target.subType === 'todo3Cat4') { updatedTab.todoManagementInfo3 = { ...t3, category4Items: insertItems(t3.category4Items) }; if (sourceMemo) updatedTab.todoManagementInfo3.category4Memos[draggedItemId] = sourceMemo; }
                        else if (target.subType === 'todo3Cat5') { updatedTab.todoManagementInfo3 = { ...t3, category5Items: insertItems(t3.category5Items) }; if (sourceMemo) updatedTab.todoManagementInfo3.category5Memos[draggedItemId] = sourceMemo; }
                    }
                }

                return updatedTab;
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
        handleCrossSectionItemDrop(itemId, sourceSectionId, targetSectionId, sourceTabId, targetTabId);
        if (switchTab && sourceTabId !== targetTabId) {
            updateData({ ...safeData, activeTabId: targetTabId });
        }
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
