import { useEffect, useRef } from 'react';
import { MemoEditorState } from '../types';

interface BackButtonProps {
    memoEditor: MemoEditorState;
    setMemoEditor: (state: MemoEditorState) => void;
    modal: { isOpen: boolean };
    setModal: (state: any) => void;
    sectionMapOpen: boolean;
    setSectionMapOpen: (open: boolean) => void;
    tagSelectionModalOpen: boolean;
    setTagSelectionModalOpen: (open: boolean) => void;
    calendarModal: { isOpen: boolean };
    setCalendarModal: (state: any) => void;
    isBookmarkView: boolean;
    setIsBookmarkView: (open: boolean) => void;
    searchModalOpen: boolean;
    setSearchModalOpen: (open: boolean) => void;
}

export const useBackButton = ({
    memoEditor, setMemoEditor,
    modal, setModal,
    sectionMapOpen, setSectionMapOpen,
    tagSelectionModalOpen, setTagSelectionModalOpen,
    calendarModal, setCalendarModal,
    isBookmarkView, setIsBookmarkView,
    searchModalOpen, setSearchModalOpen
}: BackButtonProps) => {
    const isInternalPush = useRef(false);

    // Any state that is "open"
    const isAnyModalOpen = 
        memoEditor.id !== null || 
        modal.isOpen || 
        sectionMapOpen || 
        tagSelectionModalOpen || 
        calendarModal.isOpen || 
        isBookmarkView ||
        searchModalOpen;

    const lastOpenState = useRef(isAnyModalOpen);

    useEffect(() => {
        // When something opens, push state
        if (isAnyModalOpen && !lastOpenState.current) {
            isInternalPush.current = true;
            window.history.pushState({ appModal: true }, '');
        } 
        // When everything closes via UI, we should potentially go back in history
        // BUT wait, if we call history.back() here, it might trigger popstate and close things again.
        // Actually, if the user manually closes a modal, we WANT to remove that history entry.
        else if (!isAnyModalOpen && lastOpenState.current && !isInternalPush.current) {
            // This was closed by UI (X button, etc), not by back button
            // If the top of history is our appModal state, go back
            if (window.history.state?.appModal) {
                window.history.back();
            }
        }

        lastOpenState.current = isAnyModalOpen;
        isInternalPush.current = false;
    }, [isAnyModalOpen]);

    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            if (isAnyModalOpen) {
                // If any modal is open, priority closing
                if (modal.isOpen) setModal((prev: any) => ({ ...prev, isOpen: false }));
                else if (calendarModal.isOpen) setCalendarModal((prev: any) => ({ ...prev, isOpen: false }));
                else if (memoEditor.id !== null) setMemoEditor({ 
                    id: null, value: '', allValues: ['', '', '', '', ''], 
                    allTitles: ['', '', '', '', ''], title: '', 
                    activePageIndex: 0, type: 'section', isEditing: false, sectionId: null, tabId: null 
                });
                else if (tagSelectionModalOpen) setTagSelectionModalOpen(false);
                else if (sectionMapOpen) setSectionMapOpen(false);
                else if (isBookmarkView) setIsBookmarkView(false);
                else if (searchModalOpen) setSearchModalOpen(false);
                
                // Prevent browser from actually going back if we closed a modal
                // Actually, popstate ALREADY moved back in history. 
                // So we just need to handle the UI state.
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [
        setTagSelectionModalOpen, setCalendarModal, setIsBookmarkView, setSearchModalOpen
    ]);
};
