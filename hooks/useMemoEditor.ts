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
    memoTextareaRef: React.RefObject<HTMLDivElement>,
    setModal: React.Dispatch<React.SetStateAction<ConfirmModal>>
) => {
    const handleShowMemo = (id: string, type?: MemoEditorState['type'], sectionId?: string | null, initialValue?: string, tabId?: string | null, openedFromMap?: boolean) => {
        const targetTab = tabId ? safeData.tabs.find(t => t.id === tabId) || activeTab : activeTab;
        const targetTabId = tabId || activeTab.id;

        if (targetTab) {
            let loadedValue = '';
            if (type === 'checklist') {
                loadedValue = targetTab.parkingInfo.checklistMemos?.[id] || '';
            } else if (type === 'shopping') {
                loadedValue = targetTab.parkingInfo.shoppingListMemos?.[id] || '';
            } else if (type === 'reminders') {
                loadedValue = targetTab.parkingInfo.remindersMemos?.[id] || '';
            } else if (type === 'todo') {
                loadedValue = targetTab.parkingInfo.todoMemos?.[id] || '';
            } else if (type === 'parkingCat5') {
                loadedValue = targetTab.parkingInfo.category5Memos?.[id] || '';
            } else if (type === 'todoCat1') {
                loadedValue = targetTab.todoManagementInfo.category1Memos?.[id] || '';
            } else if (type === 'todoCat2') {
                loadedValue = targetTab.todoManagementInfo.category2Memos?.[id] || '';
            } else if (type === 'todoCat3') {
                loadedValue = targetTab.todoManagementInfo.category3Memos?.[id] || '';
            } else if (type === 'todoCat4') {
                loadedValue = targetTab.todoManagementInfo.category4Memos?.[id] || '';
            } else if (type === 'todoCat5') {
                loadedValue = targetTab.todoManagementInfo.category5Memos?.[id] || '';
            } else if (type === 'todo2Cat1') {
                loadedValue = targetTab.todoManagementInfo2.category1Memos?.[id] || '';
            } else if (type === 'todo2Cat2') {
                loadedValue = targetTab.todoManagementInfo2.category2Memos?.[id] || '';
            } else if (type === 'todo2Cat3') {
                loadedValue = targetTab.todoManagementInfo2.category3Memos?.[id] || '';
            } else if (type === 'todo2Cat4') {
                loadedValue = targetTab.todoManagementInfo2.category4Memos?.[id] || '';
            } else if (type === 'todo2Cat5') {
                loadedValue = targetTab.todoManagementInfo2.category5Memos?.[id] || '';
            } else if (type === 'todo3Cat1') {
                loadedValue = targetTab.todoManagementInfo3.category1Memos?.[id] || '';
            } else if (type === 'todo3Cat2') {
                loadedValue = targetTab.todoManagementInfo3.category2Memos?.[id] || '';
            } else if (type === 'todo3Cat3') {
                loadedValue = targetTab.todoManagementInfo3.category3Memos?.[id] || '';
            } else if (type === 'todo3Cat4') {
                loadedValue = targetTab.todoManagementInfo3.category4Memos?.[id] || '';
            } else if (type === 'todo3Cat5') {
                loadedValue = targetTab.todoManagementInfo3.category5Memos?.[id] || '';
            } else {
                loadedValue = targetTab.memos?.[id] || '';
            }

            // 만약 로드된 값이 비어있고 initialValue가 있다면 (빠른 입력 등에서 넘어온 경우)
            if (!loadedValue && initialValue) {
                loadedValue = initialValue;
            }
            
            // 페이지 분할 로직 (backward compatibility 포함)
            const pages = loadedValue.split('\n===page-break===\n');
            const allValues = [
                pages[0] || '',
                pages[1] || '',
                pages[2] || '',
                pages[3] || '',
                pages[4] || ''
            ];

            const isParkingSub = type === 'checklist' || type === 'shopping' || type === 'reminders' || type === 'todo' ||
                type === 'todoCat1' || type === 'todoCat2' || type === 'todoCat3' || type === 'todoCat4' ||
                type === 'todo2Cat1' || type === 'todo2Cat2' || type === 'todo2Cat3' || type === 'todo2Cat4' ||
                type === 'todo3Cat1' || type === 'todo3Cat2' || type === 'todo3Cat3' || type === 'todo3Cat4';

            setMemoEditor({
                id,
                value: allValues[0],
                allValues,
                activePageIndex: 0,
                type: type || 'section',
                isEditing: !isParkingSub && allValues[0] === '' && !openedFromMap,
                openedFromMap,
                sectionId: sectionId || null,
                tabId: targetTabId
            });
        }
    };

    const handleSwipeMemo = (direction: 'left' | 'right') => {
        if (!memoEditor.id) return;

        let items: ListItem[] = [];
        const type = memoEditor.type;
        const targetTab = memoEditor.tabId ? safeData.tabs.find(t => t.id === memoEditor.tabId) || activeTab : activeTab;

        if (type === 'checklist') {
            items = targetTab.parkingInfo.checklistItems;
        } else if (type === 'shopping') {
            items = targetTab.parkingInfo.shoppingListItems;
        } else if (type === 'reminders') {
            items = targetTab.parkingInfo.remindersItems;
        } else if (type === 'todo') {
            items = targetTab.parkingInfo.todoItems;
        } else if (type === 'parkingCat5') {
            items = targetTab.parkingInfo.category5Items;
        } else if (type === 'todoCat1') {
            items = targetTab.todoManagementInfo.category1Items;
        } else if (type === 'todoCat2') {
            items = targetTab.todoManagementInfo.category2Items;
        } else if (type === 'todoCat3') {
            items = targetTab.todoManagementInfo.category3Items;
        } else if (type === 'todoCat4') {
            items = targetTab.todoManagementInfo.category4Items;
        } else if (type === 'todoCat5') {
            items = targetTab.todoManagementInfo.category5Items;
        } else if (type === 'todo2Cat1') {
            items = targetTab.todoManagementInfo2.category1Items;
        } else if (type === 'todo2Cat2') {
            items = targetTab.todoManagementInfo2.category2Items;
        } else if (type === 'todo2Cat3') {
            items = targetTab.todoManagementInfo2.category3Items;
        } else if (type === 'todo2Cat4') {
            items = targetTab.todoManagementInfo2.category4Items;
        } else if (type === 'todo2Cat5') {
            items = targetTab.todoManagementInfo2.category5Items;
        } else if (type === 'todo3Cat1') {
            items = targetTab.todoManagementInfo3.category1Items;
        } else if (type === 'todo3Cat2') {
            items = targetTab.todoManagementInfo3.category2Items;
        } else if (type === 'todo3Cat3') {
            items = targetTab.todoManagementInfo3.category3Items;
        } else if (type === 'todo3Cat4') {
            items = targetTab.todoManagementInfo3.category4Items;
        } else if (type === 'todo3Cat5') {
            items = targetTab.todoManagementInfo3.category5Items;
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
        if (!memoEditor.id) return;

        // 현재 수정 중인 페이지 내용을 allValues에 동기화
        const updatedAllValues = [...memoEditor.allValues];
        updatedAllValues[memoEditor.activePageIndex] = memoEditor.value;

        // 모든 페이지를 하나의 문자열로 결합 (구분자: ===page-break===)
        const finalValue = updatedAllValues.join('\n===page-break===\n');

        const lines = memoEditor.value.trim().split('\n');
        const firstLine = lines[0]?.trim() || '';
        const titleLimit = 30;
        const displayTitle = firstLine.length > titleLimit
            ? firstLine.substring(0, titleLimit)
            : firstLine;

        if (memoEditor.type === 'section') {
            updateData({
                ...safeData,
                tabs: safeData.tabs.map(t => t.id === (memoEditor.tabId || safeData.activeTabId)
                    ? {
                        ...t,
                        memos: {
                            ...t.memos,
                            [memoEditor.id!]: finalValue
                        }
                    }
                    : t
                )
            });
        } else if (memoEditor.type === 'checklist') {
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
                                [memoEditor.id!]: finalValue
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
                                [memoEditor.id!]: finalValue
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
                                [memoEditor.id!]: finalValue
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
                                [memoEditor.id!]: finalValue
                            }
                        }
                    }
                    : t
                )
            });
        } else if (memoEditor.type === 'parkingCat5') {
            updateData({
                ...safeData,
                tabs: safeData.tabs.map(t => t.id === (memoEditor.tabId || safeData.activeTabId)
                    ? {
                        ...t,
                        parkingInfo: {
                            ...t.parkingInfo,
                            category5Items: t.parkingInfo.category5Items.map(item =>
                                item.id === memoEditor.id ? { ...item, text: displayTitle || item.text } : item
                            ),
                            category5Memos: {
                                ...t.parkingInfo.category5Memos,
                                [memoEditor.id!]: finalValue
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
                                [memoEditor.id!]: finalValue
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
                                [memoEditor.id!]: finalValue
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
                                [memoEditor.id!]: finalValue
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
                                [memoEditor.id!]: finalValue
                            }
                        }
                    }
                    : t
                )
            });
        } else if (memoEditor.type === 'todoCat5') {
            updateData({
                ...safeData,
                tabs: safeData.tabs.map(t => t.id === (memoEditor.tabId || safeData.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo: {
                            ...t.todoManagementInfo,
                            category5Items: t.todoManagementInfo.category5Items.map(item =>
                                item.id === memoEditor.id ? { ...item, text: displayTitle || item.text } : item
                            ),
                            category5Memos: {
                                ...t.todoManagementInfo.category5Memos,
                                [memoEditor.id!]: finalValue
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
                                [memoEditor.id!]: finalValue
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
                                [memoEditor.id!]: finalValue
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
                                [memoEditor.id!]: finalValue
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
                                [memoEditor.id!]: finalValue
                            }
                        }
                    }
                    : t
                )
            });
        } else if (memoEditor.type === 'todo2Cat5') {
            updateData({
                ...safeData,
                tabs: safeData.tabs.map(t => t.id === (memoEditor.tabId || safeData.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo2: {
                            ...t.todoManagementInfo2,
                            category5Items: t.todoManagementInfo2.category5Items.map(item =>
                                item.id === memoEditor.id ? { ...item, text: displayTitle || item.text } : item
                            ),
                            category5Memos: {
                                ...t.todoManagementInfo2.category5Memos,
                                [memoEditor.id!]: finalValue
                            }
                        }
                    }
                    : t
                )
            });
        } else if (memoEditor.type === 'todo3Cat1') {
            updateData({
                ...safeData,
                tabs: safeData.tabs.map(t => t.id === (memoEditor.tabId || safeData.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo3: {
                            ...t.todoManagementInfo3,
                            category1Items: t.todoManagementInfo3.category1Items.map(item =>
                                item.id === memoEditor.id ? { ...item, text: displayTitle || item.text } : item
                            ),
                            category1Memos: {
                                ...t.todoManagementInfo3.category1Memos,
                                [memoEditor.id!]: finalValue
                            }
                        }
                    }
                    : t
                )
            });
        } else if (memoEditor.type === 'todo3Cat2') {
            updateData({
                ...safeData,
                tabs: safeData.tabs.map(t => t.id === (memoEditor.tabId || safeData.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo3: {
                            ...t.todoManagementInfo3,
                            category2Items: t.todoManagementInfo3.category2Items.map(item =>
                                item.id === memoEditor.id ? { ...item, text: displayTitle || item.text } : item
                            ),
                            category2Memos: {
                                ...t.todoManagementInfo3.category2Memos,
                                [memoEditor.id!]: finalValue
                            }
                        }
                    }
                    : t
                )
            });
        } else if (memoEditor.type === 'todo3Cat3') {
            updateData({
                ...safeData,
                tabs: safeData.tabs.map(t => t.id === (memoEditor.tabId || safeData.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo3: {
                            ...t.todoManagementInfo3,
                            category3Items: t.todoManagementInfo3.category3Items.map(item =>
                                item.id === memoEditor.id ? { ...item, text: displayTitle || item.text } : item
                            ),
                            category3Memos: {
                                ...t.todoManagementInfo3.category3Memos,
                                [memoEditor.id!]: finalValue
                            }
                        }
                    }
                    : t
                )
            });
        } else if (memoEditor.type === 'todo3Cat4') {
            updateData({
                ...safeData,
                tabs: safeData.tabs.map(t => t.id === (memoEditor.tabId || safeData.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo3: {
                            ...t.todoManagementInfo3,
                            category4Items: t.todoManagementInfo3.category4Items.map(item =>
                                item.id === memoEditor.id ? { ...item, text: displayTitle || item.text } : item
                            ),
                            category4Memos: {
                                ...t.todoManagementInfo3.category4Memos,
                                [memoEditor.id!]: finalValue
                            }
                        }
                    }
                    : t
                )
            });
        } else if (memoEditor.type === 'todo3Cat5') {
            updateData({
                ...safeData,
                tabs: safeData.tabs.map(t => t.id === (memoEditor.tabId || safeData.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo3: {
                            ...t.todoManagementInfo3,
                            category5Items: t.todoManagementInfo3.category5Items.map(item =>
                                item.id === memoEditor.id ? { ...item, text: displayTitle || item.text } : item
                            ),
                            category5Memos: {
                                ...t.todoManagementInfo3.category5Memos,
                                [memoEditor.id!]: finalValue
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
                        memos: { ...t.memos, [memoEditor.id!]: finalValue }
                    }
                    : t
                )
            });
        }

        if (memoEditor.value.trim()) {
            setMemoEditor(prev => ({ ...prev, isEditing: false }));
        } else {
            setMemoEditor({ id: null, value: '', allValues: ['', '', '', '', ''], activePageIndex: 0, type: 'section', isEditing: false, sectionId: null });
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
                            const newMemos = { ...t.parkingInfo.checklistMemos };
                            delete newMemos[memoEditor.id!];
                            return { ...t, parkingInfo: { ...t.parkingInfo, checklistItems: t.parkingInfo.checklistItems.filter(i => i.id !== memoEditor.id), checklistMemos: newMemos } };
                        } else if (memoEditor.type === 'shopping') {
                            const newMemos = { ...t.parkingInfo.shoppingListMemos };
                            delete newMemos[memoEditor.id!];
                            return { ...t, parkingInfo: { ...t.parkingInfo, shoppingListItems: t.parkingInfo.shoppingListItems.filter(i => i.id !== memoEditor.id), shoppingListMemos: newMemos } };
                        } else if (memoEditor.type === 'reminders') {
                            const newMemos = { ...t.parkingInfo.remindersMemos };
                            delete newMemos[memoEditor.id!];
                            return { ...t, parkingInfo: { ...t.parkingInfo, remindersItems: t.parkingInfo.remindersItems.filter(i => i.id !== memoEditor.id), remindersMemos: newMemos } };
                        } else if (memoEditor.type === 'todo') {
                            const newMemos = { ...t.parkingInfo.todoMemos };
                            delete newMemos[memoEditor.id!];
                            return { ...t, parkingInfo: { ...t.parkingInfo, todoItems: t.parkingInfo.todoItems.filter(i => i.id !== memoEditor.id), todoMemos: newMemos } };
                        } else if (memoEditor.type === 'parkingCat5') {
                            const newMemos = { ...t.parkingInfo.category5Memos };
                            delete newMemos[memoEditor.id!];
                            return { ...t, parkingInfo: { ...t.parkingInfo, category5Items: t.parkingInfo.category5Items.filter(i => i.id !== memoEditor.id), category5Memos: newMemos } };
                        } else if (memoEditor.type.startsWith('todoCat')) {
                            const catNum = memoEditor.type.replace('todoCat', '');
                            const catMemosKey = `category${catNum}Memos` as keyof typeof t.todoManagementInfo;
                            const catItemsKey = `category${catNum}Items` as keyof typeof t.todoManagementInfo;
                            const newMemos = { ...t.todoManagementInfo[catMemosKey] as any };
                            delete newMemos[memoEditor.id!];
                            return { ...t, todoManagementInfo: { ...t.todoManagementInfo, [catItemsKey]: (t.todoManagementInfo[catItemsKey] as any).filter((i: any) => i.id !== memoEditor.id), [catMemosKey]: newMemos } };
                        } else if (memoEditor.type.startsWith('todo2Cat')) {
                            const catNum = memoEditor.type.replace('todo2Cat', '');
                            const catMemosKey = `category${catNum}Memos` as keyof typeof t.todoManagementInfo2;
                            const catItemsKey = `category${catNum}Items` as keyof typeof t.todoManagementInfo2;
                            const newMemos = { ...t.todoManagementInfo2[catMemosKey] as any };
                            delete newMemos[memoEditor.id!];
                            return { ...t, todoManagementInfo2: { ...t.todoManagementInfo2, [catItemsKey]: (t.todoManagementInfo2[catItemsKey] as any).filter((i: any) => i.id !== memoEditor.id), [catMemosKey]: newMemos } };
                        } else if (memoEditor.type.startsWith('todo3Cat')) {
                            const catNum = memoEditor.type.replace('todo3Cat', '');
                            const catMemosKey = `category${catNum}Memos` as keyof typeof t.todoManagementInfo3;
                            const catItemsKey = `category${catNum}Items` as keyof typeof t.todoManagementInfo3;
                            const newMemos = { ...t.todoManagementInfo3[catMemosKey] as any };
                            delete newMemos[memoEditor.id!];
                            return { ...t, todoManagementInfo3: { ...t.todoManagementInfo3, [catItemsKey]: (t.todoManagementInfo3[catItemsKey] as any).filter((i: any) => i.id !== memoEditor.id), [catMemosKey]: newMemos } };
                        } else {
                            const newMemos = { ...t.memos };
                            delete newMemos[memoEditor.id!];
                            const updateItems = (items: ListItem[]) => items.filter(i => i.id !== memoEditor.id);
                            return { ...t, memos: newMemos, inboxSection: t.inboxSection ? { ...t.inboxSection, items: updateItems(t.inboxSection.items) } : t.inboxSection, sections: t.sections.map(s => ({ ...s, items: updateItems(s.items) })) };
                        }
                    })
                });
                setModal(prev => ({ ...prev, isOpen: false }));
                setMemoEditor({ id: null, value: '', allValues: ['', '', '', '', ''], activePageIndex: 0, type: 'section', isEditing: false, sectionId: null });
            }
        });
    };

    const handleInsertSymbol = (symbol: string) => {
        const element = memoTextareaRef.current;
        if (!element) return;

        // If it's a contentEditable div
        if (element.tagName === 'DIV') {
            element.focus();
            const selection = window.getSelection();
            if (!selection || !selection.rangeCount) return;

            const range = selection.getRangeAt(0);
            range.deleteContents();

            if (symbol === '\n---divider---\n') {
                // Insert visual divider
                const hr = document.createElement('hr');
                hr.className = "w-[80%] border-t-2 border-blue-400 mx-auto my-3 border-solid pointer-events-none";
                hr.setAttribute('contenteditable', 'false');
                hr.setAttribute('data-type', 'divider');
                
                // Add newlines around hr if needed
                const container = document.createElement('div');
                container.appendChild(document.createElement('br'));
                container.appendChild(hr);
                container.appendChild(document.createElement('br'));
                
                const fragment = document.createDocumentFragment();
                while (container.firstChild) fragment.appendChild(container.firstChild);
                
                range.insertNode(fragment);
                
                // Move cursor after the inserted fragment
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
            } else {
                const textNode = document.createTextNode(symbol);
                range.insertNode(textNode);
                range.setStartAfter(textNode);
                range.setEndAfter(textNode);
                selection.removeAllRanges();
                selection.addRange(range);
            }
            
            // Trigger input event to update state
            const event = new Event('input', { bubbles: true });
            element.dispatchEvent(event);
            return;
        }
    };

    const memoSymbols = [
        { label: '•', value: '• ', title: '불렛' },
        { label: ':', value: ': ', title: '콜론' },
        { label: '―', value: '\n---divider---\n', title: '구분선' },
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

    const handleChangePage = (index: number) => {
        if (index === memoEditor.activePageIndex) return;
        
        const newAllValues = [...memoEditor.allValues];
        newAllValues[memoEditor.activePageIndex] = memoEditor.value;

        setMemoEditor({
            ...memoEditor,
            allValues: newAllValues,
            activePageIndex: index,
            value: newAllValues[index]
        });
    };

    return {
        handleShowMemo,
        handleSwipeMemo,
        handleSaveMemo,
        handleDeleteItemFromModal,
        handleInsertSymbol,
        handleChangePage,
        memoSymbols
    };
};
