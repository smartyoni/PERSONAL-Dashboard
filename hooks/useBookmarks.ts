import React, { useState } from 'react';
import { AppData, Section } from '../types';

export const useBookmarks = (
    safeData: AppData,
    updateData: (newDataOrUpdater: AppData | ((prev: AppData) => AppData)) => void
) => {
    const [isBookmarkView, setIsBookmarkView] = useState(false);

    const handleToggleBookmarkView = () => {
        setIsBookmarkView(prev => !prev);
    };

    const handleUpdateBookmarkSection = (updated: Section, newMemos?: { [key: string]: string }) => {
        const newSections = (safeData.bookmarkSections || []).map(s => s.id === updated.id ? updated : s);
        updateData({ ...safeData, bookmarkSections: newSections });
    };

    const handleCrossBookmarkSectionDrop = (
        draggedItemId: string,
        sourceSectionId: string,
        targetSectionId: string,
        targetItemId?: string | null
    ) => {
        if (sourceSectionId === targetSectionId) return;
        const bSections = safeData.bookmarkSections || [];
        const sourceSection = bSections.find(s => s.id === sourceSectionId);
        const targetSection = bSections.find(s => s.id === targetSectionId);
        if (!sourceSection || !targetSection) return;
        const draggedItem = sourceSection.items.find(i => i.id === draggedItemId);
        if (!draggedItem) return;
        const newSourceItems = sourceSection.items.filter(i => i.id !== draggedItemId);
        let newTargetItems = [...targetSection.items];
        if (targetItemId) {
            const idx = newTargetItems.findIndex(i => i.id === targetItemId);
            if (idx !== -1) newTargetItems.splice(idx, 0, draggedItem);
            else newTargetItems.unshift(draggedItem);
        } else {
            newTargetItems.unshift(draggedItem);
        }
        const newSections = bSections.map(s => {
            if (s.id === sourceSectionId) return { ...s, items: newSourceItems };
            if (s.id === targetSectionId) return { ...s, items: newTargetItems };
            return s;
        });
        updateData({ ...safeData, bookmarkSections: newSections });
    };

    return {
        isBookmarkView,
        setIsBookmarkView,
        handleToggleBookmarkView,
        handleUpdateBookmarkSection,
        handleCrossBookmarkSectionDrop
    };
};
