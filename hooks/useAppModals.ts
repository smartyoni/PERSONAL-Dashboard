import { useState, useRef, useEffect } from 'react';
import { AppData, Tab, ListItem } from '../types';
import { useGoogleCalendar } from './useGoogleCalendar';

export function useAppModals(
    safeData: AppData,
    updateData: (data: AppData) => void,
    activeTab: Tab
) {
    // 1. 확인 모달 (ConfirmModal)
    const [modal, setModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    // 2. 항목 이동 모달 (MoveItemModal)
    const [moveItemModal, setMoveItemModal] = useState<{
        isOpen: boolean;
        itemId: string | null;
        itemText: string;
        sourceTabId: string;
        sourceSectionId: string;
    }>({
        isOpen: false,
        itemId: null,
        itemText: '',
        sourceTabId: '',
        sourceSectionId: ''
    });

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

        updateData({
            ...safeData,
            tabs: safeData.tabs.map(tab => {
                if (sourceTabId === targetTabId && tab.id === sourceTabId) {
                    let updatedSections = tab.sections;
                    let updatedInboxSection = tab.inboxSection;

                    if (sourceSection!.id !== tab.inboxSection?.id && targetSection!.id !== tab.inboxSection?.id) {
                        updatedSections = tab.sections.map(section => {
                            if (section.id === sourceSectionId) {
                                return { ...section, items: section.items.filter(i => i.id !== itemId) };
                            } else if (section.id === targetSectionId) {
                                return { ...section, items: [...section.items, itemToMove] };
                            }
                            return section;
                        });
                    } else if (sourceSection!.id !== tab.inboxSection?.id && targetSection!.id === tab.inboxSection?.id) {
                        updatedSections = tab.sections.map(section =>
                            section.id === sourceSectionId
                                ? { ...section, items: section.items.filter(i => i.id !== itemId) }
                                : section
                        );
                        updatedInboxSection = { ...tab.inboxSection!, items: [...tab.inboxSection!.items, itemToMove] };
                    } else if (sourceSection!.id === tab.inboxSection?.id && targetSection!.id !== tab.inboxSection?.id) {
                        updatedSections = tab.sections.map(section =>
                            section.id === targetSectionId
                                ? { ...section, items: [...section.items, itemToMove] }
                                : section
                        );
                        updatedInboxSection = { ...tab.inboxSection!, items: tab.inboxSection!.items.filter(i => i.id !== itemId) };
                    }
                    return { ...tab, sections: updatedSections, inboxSection: updatedInboxSection };
                }

                if (sourceTabId !== targetTabId) {
                    if (tab.id === sourceTabId) {
                        let updatedSections = tab.sections;
                        let updatedInboxSection = tab.inboxSection;
                        if (sourceSection!.id === tab.inboxSection?.id) {
                            updatedInboxSection = { ...tab.inboxSection!, items: tab.inboxSection!.items.filter(i => i.id !== itemId) };
                        } else {
                            updatedSections = tab.sections.map(section =>
                                section.id === sourceSectionId
                                    ? { ...section, items: section.items.filter(i => i.id !== itemId) }
                                    : section
                            );
                        }
                        return { ...tab, sections: updatedSections, inboxSection: updatedInboxSection };
                    }
                    if (tab.id === targetTabId) {
                        let updatedSections = tab.sections;
                        let updatedInboxSection = tab.inboxSection;
                        if (targetSection!.id === tab.inboxSection?.id) {
                            updatedInboxSection = { ...tab.inboxSection!, items: [...tab.inboxSection!.items, itemToMove] };
                        } else {
                            updatedSections = tab.sections.map(section =>
                                section.id === targetSectionId
                                    ? { ...section, items: [...section.items, itemToMove] }
                                    : section
                            );
                        }
                        // 다른 탭으로 이동시 메모까지 복사
                        const sourceMemo = sourceTab.memos[itemId!];
                        let updatedMemos = tab.memos;
                        if (sourceMemo) {
                            updatedMemos = { ...tab.memos, [itemId!]: sourceMemo };
                        }
                        return { ...tab, sections: updatedSections, inboxSection: updatedInboxSection, memos: updatedMemos };
                    }
                }
                return tab;
            })
        });

        setMoveItemModal({
            isOpen: false,
            itemId: null,
            itemText: '',
            sourceTabId: '',
            sourceSectionId: ''
        });
    };

    // 3. 캘린더 모달 (GoogleCalendar)
    const googleCalendar = useGoogleCalendar();
    const [calendarModal, setCalendarModal] = useState<{
        isOpen: boolean;
        itemText: string;
    }>({ isOpen: false, itemText: '' });

    const handleAddToCalendarClick = (itemText: string) => {
        if (!googleCalendar.isAuthorized) {
            googleCalendar.login();
            return;
        }
        setCalendarModal({ isOpen: true, itemText });
    };

    const handleConfirmCalendar = async (startDate: string, endDate: string, isAllDay: boolean) => {
        try {
            await googleCalendar.createCalendarEvent({
                summary: calendarModal.itemText,
                start: startDate,
                end: endDate,
                isAllDay: isAllDay,
            });
            alert('캘린더에 추가되었습니다!');
            setCalendarModal({ isOpen: false, itemText: '' });
        } catch (error: any) {
            console.error('캘린더 추가 실패:', error);
            if (error.message?.includes('인증이 만료') || error.message?.includes('권한이 부족')) {
                setCalendarModal({ isOpen: false, itemText: '' });
                alert(`${error.message}\n\n확인을 누르면 다시 로그인합니다.`);
                googleCalendar.login();
            } else {
                alert(`캘린더 추가 실패: ${error.message || '알 수 없는 오류'}`);
            }
        }
    };

    // 4. 지도 모달들
    const [navigationMapOpen, setNavigationMapOpen] = useState(false);
    const [sectionMapOpen, setSectionMapOpen] = useState(false);

    // 5. 메모 에디터
    const [memoEditor, setMemoEditor] = useState<{
        id: string | null;
        value: string;
        type?: 'section' | 'checklist' | 'shopping';
        isEditing: boolean;
    }>({ id: null, value: '', type: 'section', isEditing: false });
    const memoTextareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (memoEditor.isEditing && memoTextareaRef.current) {
            const len = memoEditor.value.length;
            memoTextareaRef.current.focus();
            memoTextareaRef.current.setSelectionRange(len, len);
        }
    }, [memoEditor.isEditing]);

    const handleShowMemo = (id: string, type?: 'checklist' | 'shopping') => {
        let memoValue = '';
        if (type === 'checklist') {
            memoValue = activeTab.parkingInfo.checklistMemos?.[id] || '';
        } else if (type === 'shopping') {
            memoValue = activeTab.parkingInfo.shoppingListMemos?.[id] || '';
        } else {
            memoValue = activeTab.memos[id] || '';
        }

        const isChecklistOrShopping = type === 'checklist' || type === 'shopping';
        setMemoEditor({
            id,
            value: memoValue,
            type: type || 'section',
            isEditing: !isChecklistOrShopping && memoValue === ''
        });
    };

    const handleSaveMemo = () => {
        if (memoEditor.id) {
            const lines = memoEditor.value.trim().split('\n');
            const firstLine = lines[0]?.trim() || '';
            const titleLimit = 30;
            const displayTitle = firstLine.length > titleLimit
                ? firstLine.substring(0, titleLimit)
                : firstLine;

            if (memoEditor.type === 'checklist') {
                updateData({
                    ...safeData,
                    tabs: safeData.tabs.map(t => t.id === safeData.activeTabId
                        ? {
                            ...t,
                            parkingInfo: {
                                ...t.parkingInfo,
                                checklistItems: t.parkingInfo.checklistItems.map(item =>
                                    item.id === memoEditor.id ? { ...item, text: displayTitle || item.text } : item
                                ),
                                checklistMemos: {
                                    ...t.parkingInfo.checklistMemos,
                                    [memoEditor.id!]: memoEditor.value
                                }
                            }
                        }
                        : t
                    )
                });
            } else if (memoEditor.type === 'shopping') {
                updateData({
                    ...safeData,
                    tabs: safeData.tabs.map(t => t.id === safeData.activeTabId
                        ? {
                            ...t,
                            parkingInfo: {
                                ...t.parkingInfo,
                                shoppingListItems: t.parkingInfo.shoppingListItems.map(item =>
                                    item.id === memoEditor.id ? { ...item, text: displayTitle || item.text } : item
                                ),
                                shoppingListMemos: {
                                    ...t.parkingInfo.shoppingListMemos,
                                    [memoEditor.id!]: memoEditor.value
                                }
                            }
                        }
                        : t
                    )
                });
            } else {
                updateData({
                    ...safeData,
                    tabs: safeData.tabs.map(t => t.id === safeData.activeTabId
                        ? {
                            ...t,
                            sections: t.sections.map(s => ({
                                ...s,
                                items: s.items.map(i => i.id === memoEditor.id ? { ...i, text: displayTitle || i.text } : i)
                            })),
                            inboxSection: t.inboxSection ? {
                                ...t.inboxSection,
                                items: t.inboxSection.items.map(i => i.id === memoEditor.id ? { ...i, text: displayTitle || i.text } : i)
                            } : t.inboxSection,
                            memos: { ...t.memos, [memoEditor.id!]: memoEditor.value }
                        }
                        : t
                    )
                });
            }
        }

        if (memoEditor.value.trim()) {
            setMemoEditor({ ...memoEditor, isEditing: false });
        } else {
            setMemoEditor({ id: null, value: '', type: 'section', isEditing: false });
        }
    };

    const handleDeleteItemFromModal = () => {
        if (!memoEditor.id) return;

        setModal({
            isOpen: true,
            title: '항목 삭제',
            message: '해당 항목을 삭제하시겠습니까? 관련 메모도 함께 삭제됩니다.',
            onConfirm: () => {
                updateData({
                    ...safeData,
                    tabs: safeData.tabs.map(t => {
                        if (t.id !== safeData.activeTabId) return t;

                        if (memoEditor.type === 'checklist') {
                            const newChecklistMemos = { ...t.parkingInfo.checklistMemos };
                            delete newChecklistMemos[memoEditor.id!];
                            return {
                                ...t,
                                parkingInfo: {
                                    ...t.parkingInfo,
                                    checklistItems: t.parkingInfo.checklistItems.filter(i => i.id !== memoEditor.id),
                                    checklistMemos: newChecklistMemos
                                }
                            };
                        } else if (memoEditor.type === 'shopping') {
                            const newShoppingMemos = { ...t.parkingInfo.shoppingListMemos };
                            delete newShoppingMemos[memoEditor.id!];
                            return {
                                ...t,
                                parkingInfo: {
                                    ...t.parkingInfo,
                                    shoppingListItems: t.parkingInfo.shoppingListItems.filter(i => i.id !== memoEditor.id),
                                    shoppingListMemos: newShoppingMemos
                                }
                            };
                        } else {
                            const newMemos = { ...t.memos };
                            delete newMemos[memoEditor.id!];
                            const updateItems = (items: ListItem[]) => items.filter(i => i.id !== memoEditor.id);

                            return {
                                ...t,
                                memos: newMemos,
                                inboxSection: t.inboxSection ? { ...t.inboxSection, items: updateItems(t.inboxSection.items) } : t.inboxSection,
                                sections: t.sections.map(s => ({ ...s, items: updateItems(s.items) }))
                            };
                        }
                    })
                });
                setModal(prev => ({ ...prev, isOpen: false }));
                setMemoEditor({ id: null, value: '', type: 'section', isEditing: false });
            }
        });
    };

    const handleInsertSymbol = (symbol: string) => {
        const textarea = memoTextareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentValue = memoEditor.value;
        const newValue = currentValue.substring(0, start) + symbol + currentValue.substring(end);
        setMemoEditor({ ...memoEditor, value: newValue });
        requestAnimationFrame(() => {
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = start + symbol.length;
        });
    };

    return {
        modal, setModal,
        moveItemModal, setMoveItemModal, handleOpenMoveItemModal, handleMoveItem,
        calendarModal, setCalendarModal, googleCalendar, handleAddToCalendarClick, handleConfirmCalendar,
        navigationMapOpen, setNavigationMapOpen,
        sectionMapOpen, setSectionMapOpen,
        memoEditor, setMemoEditor, memoTextareaRef, handleShowMemo, handleSaveMemo, handleDeleteItemFromModal, handleInsertSymbol
    };
}
