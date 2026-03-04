import React, { useState } from 'react';
import { AppData, Section, DragState, Tab } from '../types';

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
        let section = activeTab.sections.find(s => s.id === sectionId);
        if (!section && activeTab.inboxSection?.id === sectionId) {
            section = activeTab.inboxSection;
        }
        const item = section?.items.find(i => i.id === itemId);
        if (!item || !section) return;

        setMoveItemModal({
            isOpen: true,
            itemId: item.id,
            itemText: item.text,
            sourceTabId: safeData.activeTabId,
            sourceSectionId: section.id
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

        let sourceSection = sourceTab.sections.find(s => s.id === sourceSectionId);
        if (!sourceSection && sourceTab.inboxSection?.id === sourceSectionId) {
            sourceSection = sourceTab.inboxSection;
        }

        const itemToMove = sourceSection?.items.find(i => i.id === itemId);
        if (!itemToMove || !sourceSection) return;

        const targetTab = safeData.tabs.find(t => t.id === targetTabId);
        if (!targetTab) return;

        let targetSection = targetTab.sections.find(s => s.id === targetSectionId);
        if (!targetSection && targetTab.inboxSection?.id === targetSectionId) {
            targetSection = targetTab.inboxSection;
        }
        if (!targetSection) return;

        const sourceMemo = sourceTab.memos[itemId];

        updateData({
            ...safeData,
            tabs: safeData.tabs.map(tab => {
                if (sourceTabId === targetTabId && tab.id === sourceTabId) {
                    let updatedSections = tab.sections;
                    let updatedInboxSection = tab.inboxSection;

                    if (sourceSection.id !== tab.inboxSection?.id && targetSection.id !== tab.inboxSection?.id) {
                        updatedSections = tab.sections.map(section => {
                            if (section.id === sourceSectionId) return { ...section, items: section.items.filter(i => i.id !== itemId) };
                            if (section.id === targetSectionId) return { ...section, items: [...section.items, itemToMove] };
                            return section;
                        });
                    } else if (sourceSection.id !== tab.inboxSection?.id && targetSection.id === tab.inboxSection?.id) {
                        updatedSections = tab.sections.map(s => s.id === sourceSectionId ? { ...s, items: s.items.filter(i => i.id !== itemId) } : s);
                        updatedInboxSection = { ...tab.inboxSection!, items: [...tab.inboxSection!.items, itemToMove] };
                    } else if (sourceSection.id === tab.inboxSection?.id && targetSection.id !== tab.inboxSection?.id) {
                        updatedSections = tab.sections.map(s => s.id === targetSectionId ? { ...s, items: [...s.items, itemToMove] } : s);
                        updatedInboxSection = { ...tab.inboxSection!, items: tab.inboxSection!.items.filter(i => i.id !== itemId) };
                    } else {
                        updatedInboxSection = tab.inboxSection;
                    }
                    return { ...tab, sections: updatedSections, inboxSection: updatedInboxSection };
                }
                else if (sourceTabId !== targetTabId && tab.id === sourceTabId) {
                    let updatedSections = tab.sections;
                    let updatedInboxSection = tab.inboxSection;
                    if (sourceSection.id !== tab.inboxSection?.id) {
                        updatedSections = tab.sections.map(s => s.id === sourceSectionId ? { ...s, items: s.items.filter(i => i.id !== itemId) } : s);
                    } else {
                        updatedInboxSection = { ...tab.inboxSection!, items: tab.inboxSection!.items.filter(i => i.id !== itemId) };
                    }
                    const { [itemId]: removed, ...restMemos } = tab.memos;
                    return { ...tab, sections: updatedSections, inboxSection: updatedInboxSection, memos: restMemos };
                }
                else if (sourceTabId !== targetTabId && tab.id === targetTabId) {
                    let updatedSections = tab.sections;
                    let updatedInboxSection = tab.inboxSection;
                    if (targetSection.id !== tab.inboxSection?.id) {
                        updatedSections = tab.sections.map(s => s.id === targetSectionId ? { ...s, items: [...s.items, itemToMove] } : s);
                    } else {
                        updatedInboxSection = { ...tab.inboxSection!, items: [...tab.inboxSection!.items, itemToMove] };
                    }
                    const updatedMemos = sourceMemo ? { ...tab.memos, [itemId]: sourceMemo } : tab.memos;
                    return { ...tab, sections: updatedSections, inboxSection: updatedInboxSection, memos: updatedMemos };
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
