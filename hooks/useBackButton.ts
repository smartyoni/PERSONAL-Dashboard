import { useEffect, useRef } from 'react';
import { MemoEditorState } from '../types';

interface BackButtonProps {
    memoEditor: MemoEditorState;
    setMemoEditor: (state: MemoEditorState) => void;
    modal: { isOpen: boolean };
    setModal: (state: any) => void;
    navigationMapOpen: boolean;
    setNavigationMapOpen: (open: boolean) => void;
    sectionMapOpen: boolean;
    setSectionMapOpen: (open: boolean) => void;
    tagSelectionModalOpen: boolean;
    setTagSelectionModalOpen: (open: boolean) => void;
    calendarModal: { isOpen: boolean };
    setCalendarModal: (state: any) => void;
    isBookmarkView: boolean;
    setIsBookmarkView: (open: boolean) => void;
}

export const useBackButton = ({
    memoEditor, setMemoEditor,
    modal, setModal,
    navigationMapOpen, setNavigationMapOpen,
    sectionMapOpen, setSectionMapOpen,
    tagSelectionModalOpen, setTagSelectionModalOpen,
    calendarModal, setCalendarModal,
    isBookmarkView, setIsBookmarkView
}: BackButtonProps) => {
    const isInternalPush = useRef(false);

    // Any state that is "open"
    const isAnyModalOpen = 
        memoEditor.id !== null || 
        modal.isOpen || 
        navigationMapOpen || 
        sectionMapOpen || 
        tagSelectionModalOpen || 
        calendarModal.isOpen || 
        isBookmarkView;

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
                else if (memoEditor.id !== null) setMemoEditor({ ...memoEditor, id: null, isEditing: false });
                else if (tagSelectionModalOpen) setTagSelectionModalOpen(false);
                else if (sectionMapOpen) setSectionMapOpen(false);
                else if (navigationMapOpen) setNavigationMapOpen(false);
                else if (isBookmarkView) setIsBookmarkView(false);
                
                // Prevent browser from actually going back if we closed a modal
                // Actually, popstate ALREADY moved back in history. 
                // So we just need to handle the UI state.
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [
        isAnyModalOpen, memoEditor, modal.isOpen, navigationMapOpen, 
        sectionMapOpen, tagSelectionModalOpen, calendarModal.isOpen, isBookmarkView,
        setMemoEditor, setModal, setNavigationMapOpen, setSectionMapOpen, 
        setTagSelectionModalOpen, setCalendarModal, setIsBookmarkView
    ]);
};
