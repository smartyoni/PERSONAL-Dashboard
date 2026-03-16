import React, { useRef } from 'react';
import { AppData, Tab, ListItem, MemoEditorState } from '../types';

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
    const handleShowMemo = (id: string, type?: MemoEditorState['type'], sectionId?: string | null, initialValue?: string, tabId?: string | null) => {
        let memoValue = initialValue !== undefined ? initialValue : '';
        const targetTab = tabId ? safeData.tabs.find(t => t.id === tabId) || activeTab : activeTab;

        if (initialValue === undefined) {
            if (type === 'checklist') {
                memoValue = targetTab.parkingInfo.checklistMemos?.[id] || '';
            } else if (type === 'shopping') {
                memoValue = targetTab.parkingInfo.shoppingListMemos?.[id] || '';
            } else if (type === 'reminders') {
                memoValue = targetTab.parkingInfo.remindersMemos?.[id] || '';
            } else if (type === 'todo') {
                memoValue = targetTab.parkingInfo.todoMemos?.[id] || '';
            } else if (type === 'todoCat1') {
                memoValue = targetTab.todoManagementInfo.category1Memos?.[id] || '';
            } else if (type === 'todoCat2') {
                memoValue = targetTab.todoManagementInfo.category2Memos?.[id] || '';
            } else if (type === 'todoCat3') {
                memoValue = targetTab.todoManagementInfo.category3Memos?.[id] || '';
            } else if (type === 'todoCat4') {
                memoValue = targetTab.todoManagementInfo.category4Memos?.[id] || '';
            } else if (type === 'todo2Cat1') {
                memoValue = targetTab.todoManagementInfo2.category1Memos?.[id] || '';
            } else if (type === 'todo2Cat2') {
                memoValue = targetTab.todoManagementInfo2.category2Memos?.[id] || '';
            } else if (type === 'todo2Cat3') {
                memoValue = targetTab.todoManagementInfo2.category3Memos?.[id] || '';
            } else if (type === 'todo2Cat4') {
                memoValue = targetTab.todoManagementInfo2.category4Memos?.[id] || '';
            } else {
                memoValue = targetTab.memos[id] || '';
            }
        }
        const isParkingSub = type === 'checklist' || type === 'shopping' || type === 'reminders' || type === 'todo' ||
            type === 'todoCat1' || type === 'todoCat2' || type === 'todoCat3' || type === 'todoCat4' ||
            type === 'todo2Cat1' || type === 'todo2Cat2' || type === 'todo2Cat3' || type === 'todo2Cat4';
        setMemoEditor({
            id,
            value: memoValue,
            type: type || 'section',
            isEditing: !isParkingSub && memoValue === '' && !memoEditor.openedFromMap,
            sectionId: sectionId || null,
            tabId: tabId || activeTab.id
        });
    };

    const handleSwipeMemo = (direction: 'left' | 'right') => {
        if (!memoEditor.id) return;

        let items: ListItem[] = [];
        let type: 'checklist' | 'shopping' | 'section' = memoEditor.type as any;
        const targetTab = memoEditor.tabId ? safeData.tabs.find(t => t.id === memoEditor.tabId) || activeTab : activeTab;

        if (memoEditor.type === 'checklist') {
            items = targetTab.parkingInfo.checklistItems;
        } else if (memoEditor.type === 'shopping') {
            items = targetTab.parkingInfo.shoppingListItems;
        } else if (memoEditor.type === 'reminders') {
            items = targetTab.parkingInfo.remindersItems;
        } else if (memoEditor.type === 'todo') {
            items = targetTab.parkingInfo.todoItems;
        } else if (memoEditor.type === 'todoCat1') {
            items = targetTab.todoManagementInfo.category1Items;
        } else if (memoEditor.type === 'todoCat2') {
            items = targetTab.todoManagementInfo.category2Items;
        } else if (memoEditor.type === 'todoCat3') {
            items = targetTab.todoManagementInfo.category3Items;
        } else if (memoEditor.type === 'todoCat4') {
            items = targetTab.todoManagementInfo.category4Items;
        } else if (memoEditor.type === 'todo2Cat1') {
            items = targetTab.todoManagementInfo2.category1Items;
        } else if (memoEditor.type === 'todo2Cat2') {
            items = targetTab.todoManagementInfo2.category2Items;
        } else if (memoEditor.type === 'todo2Cat3') {
            items = targetTab.todoManagementInfo2.category3Items;
        } else if (memoEditor.type === 'todo2Cat4') {
            items = targetTab.todoManagementInfo2.category4Items;
        } else {
            // Find section items
            if (memoEditor.sectionId === targetTab.inboxSection?.id) {
                items = targetTab.inboxSection.items;
            } else {
                const section = targetTab.sections.find(s => s.id === memoEditor.sectionId);
                if (section) items = section.items;
            }
        }

        if (items.length === 0) return;

        // Sort items the same way as in SectionCard (uncompleted first)
        const sortedItems = [...items].sort((a, b) => {
            if (a.completed === b.completed) return 0;
            return a.completed ? 1 : -1;
        });

        const currentIndex = sortedItems.findIndex(i => i.id === memoEditor.id);
        if (currentIndex === -1) return;

        let nextIndex = direction === 'left' ? currentIndex + 1 : currentIndex - 1;

        if (nextIndex >= 0 && nextIndex < sortedItems.length) {
            const nextItem = sortedItems[nextIndex];
            handleShowMemo(nextItem.id, type, memoEditor.sectionId, undefined, memoEditor.tabId);
        }
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
                    tabs: safeData.tabs.map(t => t.id === (memoEditor.tabId || safeData.activeTabId)
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
                    tabs: safeData.tabs.map(t => t.id === (memoEditor.tabId || safeData.activeTabId)
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
            } else if (memoEditor.type === 'reminders') {
                updateData({
                    ...safeData,
                    tabs: safeData.tabs.map(t => t.id === (memoEditor.tabId || safeData.activeTabId)
                        ? {
                            ...t,
                            parkingInfo: {
                                ...t.parkingInfo,
                                remindersItems: t.parkingInfo.remindersItems.map(item =>
                                    item.id === memoEditor.id ? { ...item, text: displayTitle || item.text } : item
                                ),
                                remindersMemos: {
                                    ...t.parkingInfo.remindersMemos,
                                    [memoEditor.id!]: memoEditor.value
                                }
                            }
                        }
                        : t
                    )
                });
            } else if (memoEditor.type === 'todo') {
                updateData({
                    ...safeData,
                    tabs: safeData.tabs.map(t => t.id === (memoEditor.tabId || safeData.activeTabId)
                        ? {
                            ...t,
                            parkingInfo: {
                                ...t.parkingInfo,
                                todoItems: t.parkingInfo.todoItems.map(item =>
                                    item.id === memoEditor.id ? { ...item, text: displayTitle || item.text } : item
                                ),
                                todoMemos: {
                                    ...t.parkingInfo.todoMemos,
                                    [memoEditor.id!]: memoEditor.value
                                }
                            }
                        }
                        : t
                    )
                });
            } else if (memoEditor.type === 'todoCat1') {
                updateData({
                    ...safeData,
                    tabs: safeData.tabs.map(t => t.id === (memoEditor.tabId || safeData.activeTabId)
                        ? {
                            ...t,
                            todoManagementInfo: {
                                ...t.todoManagementInfo,
                                category1Items: t.todoManagementInfo.category1Items.map(item =>
                                    item.id === memoEditor.id ? { ...item, text: displayTitle || item.text } : item
                                ),
                                category1Memos: {
                                    ...t.todoManagementInfo.category1Memos,
                                    [memoEditor.id!]: memoEditor.value
                                }
                            }
                        }
                        : t
                    )
                });
            } else if (memoEditor.type === 'todoCat2') {
                updateData({
                    ...safeData,
                    tabs: safeData.tabs.map(t => t.id === (memoEditor.tabId || safeData.activeTabId)
                        ? {
                            ...t,
                            todoManagementInfo: {
                                ...t.todoManagementInfo,
                                category2Items: t.todoManagementInfo.category2Items.map(item =>
                                    item.id === memoEditor.id ? { ...item, text: displayTitle || item.text } : item
                                ),
                                category2Memos: {
                                    ...t.todoManagementInfo.category2Memos,
                                    [memoEditor.id!]: memoEditor.value
                                }
                            }
                        }
                        : t
                    )
                });
            } else if (memoEditor.type === 'todoCat3') {
                updateData({
                    ...safeData,
                    tabs: safeData.tabs.map(t => t.id === (memoEditor.tabId || safeData.activeTabId)
                        ? {
                            ...t,
                            todoManagementInfo: {
                                ...t.todoManagementInfo,
                                category3Items: t.todoManagementInfo.category3Items.map(item =>
                                    item.id === memoEditor.id ? { ...item, text: displayTitle || item.text } : item
                                ),
                                category3Memos: {
                                    ...t.todoManagementInfo.category3Memos,
                                    [memoEditor.id!]: memoEditor.value
                                }
                            }
                        }
                        : t
                    )
                });
            } else if (memoEditor.type === 'todoCat4') {
                updateData({
                    ...safeData,
                    tabs: safeData.tabs.map(t => t.id === (memoEditor.tabId || safeData.activeTabId)
                        ? {
                            ...t,
                            todoManagementInfo: {
                                ...t.todoManagementInfo,
                                category4Items: t.todoManagementInfo.category4Items.map(item =>
                                    item.id === memoEditor.id ? { ...item, text: displayTitle || item.text } : item
                                ),
                                category4Memos: {
                                    ...t.todoManagementInfo.category4Memos,
                                    [memoEditor.id!]: memoEditor.value
                                }
                            }
                        }
                        : t
                    )
                });
            } else if (memoEditor.type === 'todo2Cat1') {
                updateData({
                    ...safeData,
                    tabs: safeData.tabs.map(t => t.id === (memoEditor.tabId || safeData.activeTabId)
                        ? {
                            ...t,
                            todoManagementInfo2: {
                                ...t.todoManagementInfo2,
                                category1Items: t.todoManagementInfo2.category1Items.map(item =>
                                    item.id === memoEditor.id ? { ...item, text: displayTitle || item.text } : item
                                ),
                                category1Memos: {
                                    ...t.todoManagementInfo2.category1Memos,
                                    [memoEditor.id!]: memoEditor.value
                                }
                            }
                        }
                        : t
                    )
                });
            } else if (memoEditor.type === 'todo2Cat2') {
                updateData({
                    ...safeData,
                    tabs: safeData.tabs.map(t => t.id === (memoEditor.tabId || safeData.activeTabId)
                        ? {
                            ...t,
                            todoManagementInfo2: {
                                ...t.todoManagementInfo2,
                                category2Items: t.todoManagementInfo2.category2Items.map(item =>
                                    item.id === memoEditor.id ? { ...item, text: displayTitle || item.text } : item
                                ),
                                category2Memos: {
                                    ...t.todoManagementInfo2.category2Memos,
                                    [memoEditor.id!]: memoEditor.value
                                }
                            }
                        }
                        : t
                    )
                });
            } else if (memoEditor.type === 'todo2Cat3') {
                updateData({
                    ...safeData,
                    tabs: safeData.tabs.map(t => t.id === (memoEditor.tabId || safeData.activeTabId)
                        ? {
                            ...t,
                            todoManagementInfo2: {
                                ...t.todoManagementInfo2,
                                category3Items: t.todoManagementInfo2.category3Items.map(item =>
                                    item.id === memoEditor.id ? { ...item, text: displayTitle || item.text } : item
                                ),
                                category3Memos: {
                                    ...t.todoManagementInfo2.category3Memos,
                                    [memoEditor.id!]: memoEditor.value
                                }
                            }
                        }
                        : t
                    )
                });
            } else if (memoEditor.type === 'todo2Cat4') {
                updateData({
                    ...safeData,
                    tabs: safeData.tabs.map(t => t.id === (memoEditor.tabId || safeData.activeTabId)
                        ? {
                            ...t,
                            todoManagementInfo2: {
                                ...t.todoManagementInfo2,
                                category4Items: t.todoManagementInfo2.category4Items.map(item =>
                                    item.id === memoEditor.id ? { ...item, text: displayTitle || item.text } : item
                                ),
                                category4Memos: {
                                    ...t.todoManagementInfo2.category4Memos,
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
                    tabs: safeData.tabs.map(t => t.id === (memoEditor.tabId || safeData.activeTabId)
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
            setMemoEditor(prev => ({ ...prev, isEditing: false }));
        } else {
            setMemoEditor({ id: null, value: '', type: 'section', isEditing: false, sectionId: null });
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
                        if (t.id !== (memoEditor.tabId || safeData.activeTabId)) return t;

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
                        } else if (memoEditor.type === 'reminders') {
                            const newRemindersMemos = { ...t.parkingInfo.remindersMemos };
                            delete newRemindersMemos[memoEditor.id!];
                            return {
                                ...t,
                                parkingInfo: {
                                    ...t.parkingInfo,
                                    remindersItems: t.parkingInfo.remindersItems.filter(i => i.id !== memoEditor.id),
                                    remindersMemos: newRemindersMemos
                                }
                            };
                        } else if (memoEditor.type === 'todo') {
                            const newTodoMemos = { ...t.parkingInfo.todoMemos };
                            delete newTodoMemos[memoEditor.id!];
                            return {
                                ...t,
                                parkingInfo: {
                                    ...t.parkingInfo,
                                    todoItems: t.parkingInfo.todoItems.filter(i => i.id !== memoEditor.id),
                                    todoMemos: newTodoMemos
                                }
                            };
                        } else if (memoEditor.type === 'todo2Cat1') {
                            const newMemos = { ...t.todoManagementInfo2.category1Memos };
                            delete newMemos[memoEditor.id!];
                            return {
                                ...t,
                                todoManagementInfo2: {
                                    ...t.todoManagementInfo2,
                                    category1Items: t.todoManagementInfo2.category1Items.filter(i => i.id !== memoEditor.id),
                                    category1Memos: newMemos
                                }
                            };
                        } else if (memoEditor.type === 'todo2Cat2') {
                            const newMemos = { ...t.todoManagementInfo2.category2Memos };
                            delete newMemos[memoEditor.id!];
                            return {
                                ...t,
                                todoManagementInfo2: {
                                    ...t.todoManagementInfo2,
                                    category2Items: t.todoManagementInfo2.category2Items.filter(i => i.id !== memoEditor.id),
                                    category2Memos: newMemos
                                }
                            };
                        } else if (memoEditor.type === 'todo2Cat3') {
                            const newMemos = { ...t.todoManagementInfo2.category3Memos };
                            delete newMemos[memoEditor.id!];
                            return {
                                ...t,
                                todoManagementInfo2: {
                                    ...t.todoManagementInfo2,
                                    category3Items: t.todoManagementInfo2.category3Items.filter(i => i.id !== memoEditor.id),
                                    category3Memos: newMemos
                                }
                            };
                        } else if (memoEditor.type === 'todo2Cat4') {
                            const newMemos = { ...t.todoManagementInfo2.category4Memos };
                            delete newMemos[memoEditor.id!];
                            return {
                                ...t,
                                todoManagementInfo2: {
                                    ...t.todoManagementInfo2,
                                    category4Items: t.todoManagementInfo2.category4Items.filter(i => i.id !== memoEditor.id),
                                    category4Memos: newMemos
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
                setMemoEditor({ id: null, value: '', type: 'section', isEditing: false, sectionId: null });
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
        handleSwipeMemo,
        handleSaveMemo,
        handleDeleteItemFromModal,
        handleInsertSymbol,
        memoSymbols
    };
};
