import React, { useRef } from 'react';
import { AppData, Tab, ListItem } from '../types';

interface MemoEditorState {
    id: string | null;
    value: string;
    type: 'section' | 'checklist' | 'shopping' | 'memoBoard';
    isEditing: boolean;
    openedFromMap?: boolean;
}

interface ConfirmModal {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
}

export const useMemoEditor = (
    safeData: AppData,
    updateData: (data: AppData) => void,
    activeTab: Tab,
    memoEditor: MemoEditorState,
    setMemoEditor: React.Dispatch<React.SetStateAction<MemoEditorState>>,
    memoTextareaRef: React.RefObject<HTMLTextAreaElement>,
    setModal: React.Dispatch<React.SetStateAction<ConfirmModal>>
) => {
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
                            quotesSection: t.quotesSection ? {
                                ...t.quotesSection,
                                items: t.quotesSection.items.map(i => i.id === memoEditor.id ? { ...i, text: displayTitle || i.text } : i)
                            } : t.quotesSection,
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
                                quotesSection: { ...t.quotesSection, items: updateItems(t.quotesSection.items) },
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

    const memoSymbols = [
        { label: '•', value: '• ', title: '불렛' },
        { label: '-', value: '- ', title: '하이픈' },
        { label: '▸', value: '▸ ', title: '삼각' },
        { label: '✓', value: '✓ ', title: '체크' },
        { label: '★', value: '★ ', title: '별' },
        { label: '※', value: '※ ', title: '참고' },
        { label: '→', value: '→ ', title: '화살표' },
        { label: '○', value: '○ ', title: '원' },
        { label: '■', value: '■ ', title: '사각' },
        { label: '◆', value: '◆ ', title: '다이아' },
    ];

    return {
        handleShowMemo,
        handleSaveMemo,
        handleDeleteItemFromModal,
        handleInsertSymbol,
        memoSymbols
    };
};
