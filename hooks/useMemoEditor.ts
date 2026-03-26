import React, { useRef } from 'react';
import { AppData, Tab, ListItem, MemoEditorState, TITLE_SEPARATOR, HistoryItem } from '../types';
import { parseMemoPages, htmlToPlainText } from '../utils/memoEditorUtils';

const HISTORY_KEY = 'personal-dashboard-recent-memos';

export const getRecentMemos = (): HistoryItem[] => {
    try {
        const stored = localStorage.getItem(HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const addToHistory = (item: HistoryItem) => {
    let history = getRecentMemos();
    // Remove if exists to move to top
    history = history.filter(h => h.id !== item.id);
    history.unshift(item);
    // Keep max 5
    if (history.length > 5) history = history.slice(0, 5);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

interface ConfirmModal {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
}


export const useMemoEditor = (
    safeData: AppData,
    updateData: (newDataOrUpdater: AppData | ((prev: AppData) => AppData)) => Promise<void>,
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

            if (!loadedValue && initialValue) {
                loadedValue = initialValue;
            }
            
            const { allTitles: rawTitles, allValues: rawContents } = parseMemoPages(loadedValue);
            
            // Just clean HTML, no metadata split needed
            const allTitles = rawTitles.map(t => htmlToPlainText(t).trim());
            const allContents = rawContents.map(c => htmlToPlainText(c));
            
            const firstPageText = allContents[0] || '';

            const isParkingSub = type === 'checklist' || type === 'shopping' || type === 'reminders' || type === 'todo' ||
                type === 'todoCat1' || type === 'todoCat2' || type === 'todoCat3' || type === 'todoCat4' ||
                type === 'todo2Cat1' || type === 'todo2Cat2' || type === 'todo2Cat3' || type === 'todo2Cat4' ||
                type === 'todo3Cat1' || type === 'todo3Cat2' || type === 'todo3Cat3' || type === 'todo3Cat4';

            setMemoEditor({
                id,
                value: firstPageText,
                title: allTitles[0],
                allValues: allContents,
                allTitles,
                activePageIndex: 0,
                type: type || 'section',
                isEditing: !isParkingSub && firstPageText === '' && allTitles[0] === '' && !openedFromMap,
                openedFromMap,
                sectionId: sectionId || null,
                tabId: targetTabId
            });

            // Add to history
            addToHistory({
                id,
                type: type || 'section',
                sectionId: sectionId || null,
                tabId: targetTabId,
                title: allTitles[0] || '제목없음'
            });
        }
    };

    const handleChangePage = (index: number) => {
        setMemoEditor(prev => {
            if (index === prev.activePageIndex) return prev;
            
            const newAllValues = [...prev.allValues];
            newAllValues[prev.activePageIndex] = prev.value;

            const newAllTitles = [...prev.allTitles];
            newAllTitles[prev.activePageIndex] = prev.title;

            return {
                ...prev,
                allValues: newAllValues,
                allTitles: newAllTitles,
                activePageIndex: index,
                value: newAllValues[index],
                title: newAllTitles[index]
            };
        });
    };

    const handleUpdateTitle = (newTitle: string) => {
        setMemoEditor(prev => {
            const newAllTitles = [...prev.allTitles];
            newAllTitles[prev.activePageIndex] = newTitle;
            return {
                ...prev,
                title: newTitle,
                allTitles: newAllTitles
            };
        });
    };

    const handleUpdateItemText = (newText: string) => {
        if (!memoEditor.id) return;
        
        const targetId = String(memoEditor.id);

        updateData(prevData => ({
            ...prevData,
            tabs: prevData.tabs.map(t => ({
                ...t,
                inboxSection: t.inboxSection ? {
                    ...t.inboxSection,
                    items: t.inboxSection.items.map(i => String(i.id) === targetId ? { ...i, text: newText } : i)
                } : undefined,
                sections: t.sections.map(s => ({
                    ...s,
                    items: s.items.map(i => String(i.id) === targetId ? { ...i, text: newText } : i)
                })),
                parkingInfo: {
                    ...t.parkingInfo,
                    checklistItems: t.parkingInfo.checklistItems.map(i => String(i.id) === targetId ? { ...i, text: newText } : i),
                    shoppingListItems: t.parkingInfo.shoppingListItems.map(i => String(i.id) === targetId ? { ...i, text: newText } : i),
                    remindersItems: t.parkingInfo.remindersItems.map(i => String(i.id) === targetId ? { ...i, text: newText } : i),
                    todoItems: t.parkingInfo.todoItems.map(i => String(i.id) === targetId ? { ...i, text: newText } : i),
                    category5Items: t.parkingInfo.category5Items.map(i => String(i.id) === targetId ? { ...i, text: newText } : i),
                },
                todoManagementInfo: {
                    ...t.todoManagementInfo,
                    category1Items: t.todoManagementInfo.category1Items.map(i => String(i.id) === targetId ? { ...i, text: newText } : i),
                    category2Items: t.todoManagementInfo.category2Items.map(i => String(i.id) === targetId ? { ...i, text: newText } : i),
                    category3Items: t.todoManagementInfo.category3Items.map(i => String(i.id) === targetId ? { ...i, text: newText } : i),
                    category4Items: t.todoManagementInfo.category4Items.map(i => String(i.id) === targetId ? { ...i, text: newText } : i),
                    category5Items: (t.todoManagementInfo as any).category5Items?.map((i: any) => String(i.id) === targetId ? { ...i, text: newText } : i) || [],
                },
                todoManagementInfo2: t.todoManagementInfo2 ? {
                    ...t.todoManagementInfo2,
                    category1Items: t.todoManagementInfo2.category1Items.map(i => String(i.id) === targetId ? { ...i, text: newText } : i),
                    category2Items: t.todoManagementInfo2.category2Items.map(i => String(i.id) === targetId ? { ...i, text: newText } : i),
                    category3Items: t.todoManagementInfo2.category3Items.map(i => String(i.id) === targetId ? { ...i, text: newText } : i),
                    category4Items: t.todoManagementInfo2.category4Items.map(i => String(i.id) === targetId ? { ...i, text: newText } : i),
                    category5Items: (t.todoManagementInfo2 as any).category5Items?.map((i: any) => String(i.id) === targetId ? { ...i, text: newText } : i) || [],
                } : undefined,
                todoManagementInfo3: t.todoManagementInfo3 ? {
                    ...t.todoManagementInfo3,
                    category1Items: t.todoManagementInfo3.category1Items.map(i => String(i.id) === targetId ? { ...i, text: newText } : i),
                    category2Items: t.todoManagementInfo3.category2Items.map(i => String(i.id) === targetId ? { ...i, text: newText } : i),
                    category3Items: t.todoManagementInfo3.category3Items.map(i => String(i.id) === targetId ? { ...i, text: newText } : i),
                    category4Items: t.todoManagementInfo3.category4Items.map(i => String(i.id) === targetId ? { ...i, text: newText } : i),
                    category5Items: (t.todoManagementInfo3 as any).category5Items?.map((i: any = null) => i && String(i.id) === targetId ? { ...i, text: newText } : i) || [],
                } : undefined,
            })),
            bookmarkSections: prevData.bookmarkSections?.map(s => ({
                ...s,
                items: s.items.map(i => String(i.id) === targetId ? { ...i, text: newText } : i)
            })) || []
        }));
    };

    const handleAddPage = () => {
        setMemoEditor(prev => {
            if (!prev.id) return prev;
            
            const newAllValues = [...prev.allValues];
            newAllValues[prev.activePageIndex] = prev.value;
            
            const newAllTitles = [...prev.allTitles];
            newAllTitles[prev.activePageIndex] = prev.title;

            const updatedAllValues = [...newAllValues, ''];
            const updatedAllTitles = [...newAllTitles, ''];
            
            return {
                ...prev,
                allValues: updatedAllValues,
                allTitles: updatedAllTitles,
                activePageIndex: updatedAllValues.length - 1,
                value: '',
                title: ''
            };
        });
    };

    const handleDeletePage = () => {
        setMemoEditor(prev => {
            if (!prev.id) return prev;
            if (prev.allValues.length <= 5) {
                alert('최소 5페이지는 유지해야 합니다.');
                return prev;
            }

            const newAllValues = [...prev.allValues];
            const newAllTitles = [...prev.allTitles];
            
            // Remove current page
            newAllValues.splice(prev.activePageIndex, 1);
            newAllTitles.splice(prev.activePageIndex, 1);
            
            // Adjust active index if it was the last page
            const newIndex = Math.min(prev.activePageIndex, newAllValues.length - 1);
            
            return {
                ...prev,
                allValues: newAllValues,
                allTitles: newAllTitles,
                activePageIndex: newIndex,
                value: newAllValues[newIndex],
                title: newAllTitles[newIndex]
            };
        });
    };

    const handleSwipeMemo = (direction: 'left' | 'right') => {
        if (!memoEditor.id) return;

        const totalPages = memoEditor.allValues.length;
        const currentIndex = memoEditor.activePageIndex;

        if (direction === 'left') { // Next page
            if (currentIndex < totalPages - 1) {
                handleChangePage(currentIndex + 1);
            }
        } else { // Previous page
            if (currentIndex > 0) {
                handleChangePage(currentIndex - 1);
            }
        }
    };

    const handleSaveMemo = (exitEditMode: boolean = true, newValue?: string) => {
        if (!memoEditor.id) return;

        const updatedAllContents = [...memoEditor.allValues];
        updatedAllContents[memoEditor.activePageIndex] = newValue !== undefined ? newValue : memoEditor.value;

        const updatedAllTitles = [...memoEditor.allTitles];
        updatedAllTitles[memoEditor.activePageIndex] = memoEditor.title;

        const finalPages = updatedAllContents.map((content, idx) => {
            const title = updatedAllTitles[idx];
            return title + TITLE_SEPARATOR + content;
        });
        const finalValue = finalPages.join('\n===page-break===\n');

        if (memoEditor.type === 'section') {
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (memoEditor.tabId || prev.activeTabId)
                    ? {
                        ...t,
                        memos: {
                            ...t.memos,
                            [memoEditor.id!]: finalValue
                        }
                    }
                    : t
                )
            }));
        } else if (memoEditor.type === 'checklist') {
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (memoEditor.tabId || prev.activeTabId)
                    ? {
                        ...t,
                        parkingInfo: {
                            ...t.parkingInfo,
                            checklistItems: t.parkingInfo.checklistItems.map(item =>
                                item.id === memoEditor.id ? { ...item } : item
                            ),
                            checklistMemos: {
                                ...t.parkingInfo.checklistMemos,
                                [memoEditor.id!]: finalValue
                            }
                        }
                    }
                    : t
                )
            }));
        } else if (memoEditor.type === 'shopping') {
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (memoEditor.tabId || prev.activeTabId)
                    ? {
                        ...t,
                        parkingInfo: {
                            ...t.parkingInfo,
                            shoppingListItems: t.parkingInfo.shoppingListItems.map(item =>
                                item.id === memoEditor.id ? { ...item } : item
                            ),
                            shoppingListMemos: {
                                ...t.parkingInfo.shoppingListMemos,
                                [memoEditor.id!]: finalValue
                            }
                        }
                    }
                    : t
                )
            }));
        } else if (memoEditor.type === 'reminders') {
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (memoEditor.tabId || prev.activeTabId)
                    ? {
                        ...t,
                        parkingInfo: {
                            ...t.parkingInfo,
                            remindersItems: t.parkingInfo.remindersItems.map(item =>
                                item.id === memoEditor.id ? { ...item } : item
                            ),
                            remindersMemos: {
                                ...t.parkingInfo.remindersMemos,
                                [memoEditor.id!]: finalValue
                            }
                        }
                    }
                    : t
                )
            }));
        } else if (memoEditor.type === 'todo') {
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (memoEditor.tabId || prev.activeTabId)
                    ? {
                        ...t,
                        parkingInfo: {
                            ...t.parkingInfo,
                            todoItems: t.parkingInfo.todoItems.map(item =>
                                item.id === memoEditor.id ? { ...item } : item
                            ),
                            todoMemos: {
                                ...t.parkingInfo.todoMemos,
                                [memoEditor.id!]: finalValue
                            }
                        }
                    }
                    : t
                )
            }));
        } else if (memoEditor.type === 'parkingCat5') {
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (memoEditor.tabId || prev.activeTabId)
                    ? {
                        ...t,
                        parkingInfo: {
                            ...t.parkingInfo,
                            category5Items: t.parkingInfo.category5Items.map(item =>
                                item.id === memoEditor.id ? { ...item } : item
                            ),
                            category5Memos: {
                                ...t.parkingInfo.category5Memos,
                                [memoEditor.id!]: finalValue
                            }
                        }
                    }
                    : t
                )
            }));
        } else if (memoEditor.type === 'todoCat1') {
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (memoEditor.tabId || prev.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo: {
                            ...t.todoManagementInfo,
                            category1Items: t.todoManagementInfo.category1Items.map(item =>
                                item.id === memoEditor.id ? { ...item } : item
                            ),
                            category1Memos: {
                                ...t.todoManagementInfo.category1Memos,
                                [memoEditor.id!]: finalValue
                            }
                        }
                    }
                    : t
                )
            }));
        } else if (memoEditor.type === 'todoCat2') {
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (memoEditor.tabId || prev.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo: {
                            ...t.todoManagementInfo,
                            category2Items: t.todoManagementInfo.category2Items.map(item =>
                                item.id === memoEditor.id ? { ...item } : item
                            ),
                            category2Memos: {
                                ...t.todoManagementInfo.category2Memos,
                                [memoEditor.id!]: finalValue
                            }
                        }
                    }
                    : t
                )
            }));
        } else if (memoEditor.type === 'todoCat3') {
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (memoEditor.tabId || prev.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo: {
                            ...t.todoManagementInfo,
                            category3Items: t.todoManagementInfo.category3Items.map(item =>
                                item.id === memoEditor.id ? { ...item } : item
                            ),
                            category3Memos: {
                                ...t.todoManagementInfo.category3Memos,
                                [memoEditor.id!]: finalValue
                            }
                        }
                    }
                    : t
                )
            }));
        } else if (memoEditor.type === 'todoCat4') {
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (memoEditor.tabId || prev.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo: {
                            ...t.todoManagementInfo,
                            category4Items: t.todoManagementInfo.category4Items.map(item =>
                                item.id === memoEditor.id ? { ...item } : item
                            ),
                            category4Memos: {
                                ...t.todoManagementInfo.category4Memos,
                                [memoEditor.id!]: finalValue
                            }
                        }
                    }
                    : t
                )
            }));
        } else if (memoEditor.type === 'todoCat5') {
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (memoEditor.tabId || prev.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo: {
                            ...t.todoManagementInfo,
                            category5Items: t.todoManagementInfo.category5Items.map(item =>
                                item.id === memoEditor.id ? { ...item } : item
                            ),
                            category5Memos: {
                                ...t.todoManagementInfo.category5Memos,
                                [memoEditor.id!]: finalValue
                            }
                        }
                    }
                    : t
                )
            }));
        } else if (memoEditor.type === 'todo2Cat1') {
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (memoEditor.tabId || prev.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo2: {
                            ...t.todoManagementInfo2,
                            category1Items: t.todoManagementInfo2.category1Items.map(item =>
                                item.id === memoEditor.id ? { ...item } : item
                            ),
                            category1Memos: {
                                ...t.todoManagementInfo2.category1Memos,
                                [memoEditor.id!]: finalValue
                            }
                        }
                    }
                    : t
                )
            }));
        } else if (memoEditor.type === 'todo2Cat2') {
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (memoEditor.tabId || prev.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo2: {
                            ...t.todoManagementInfo2,
                            category2Items: t.todoManagementInfo2.category2Items.map(item =>
                                item.id === memoEditor.id ? { ...item } : item
                            ),
                            category2Memos: {
                                ...t.todoManagementInfo2.category2Memos,
                                [memoEditor.id!]: finalValue
                            }
                        }
                    }
                    : t
                )
            }));
        } else if (memoEditor.type === 'todo2Cat3') {
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (memoEditor.tabId || prev.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo2: {
                            ...t.todoManagementInfo2,
                            category3Items: t.todoManagementInfo2.category3Items.map(item =>
                                item.id === memoEditor.id ? { ...item } : item
                            ),
                            category3Memos: {
                                ...t.todoManagementInfo2.category3Memos,
                                [memoEditor.id!]: finalValue
                            }
                        }
                    }
                    : t
                )
            }));
        } else if (memoEditor.type === 'todo2Cat4') {
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (memoEditor.tabId || prev.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo2: {
                            ...t.todoManagementInfo2,
                            category4Items: t.todoManagementInfo2.category4Items.map(item =>
                                item.id === memoEditor.id ? { ...item } : item
                            ),
                            category4Memos: {
                                ...t.todoManagementInfo2.category4Memos,
                                [memoEditor.id!]: finalValue
                            }
                        }
                    }
                    : t
                )
            }));
        } else if (memoEditor.type === 'todo2Cat5') {
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (memoEditor.tabId || prev.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo2: {
                            ...t.todoManagementInfo2,
                            category5Items: t.todoManagementInfo2.category5Items.map(item =>
                                item.id === memoEditor.id ? { ...item } : item
                            ),
                            category5Memos: {
                                ...t.todoManagementInfo2.category5Memos,
                                [memoEditor.id!]: finalValue
                            }
                        }
                    }
                    : t
                )
            }));
        } else if (memoEditor.type === 'todo3Cat1') {
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (memoEditor.tabId || prev.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo3: {
                            ...t.todoManagementInfo3,
                            category1Items: t.todoManagementInfo3.category1Items.map(item =>
                                item.id === memoEditor.id ? { ...item } : item
                            ),
                            category1Memos: {
                                ...t.todoManagementInfo3.category1Memos,
                                [memoEditor.id!]: finalValue
                            }
                        }
                    }
                    : t
                )
            }));
        } else if (memoEditor.type === 'todo3Cat2') {
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (memoEditor.tabId || prev.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo3: {
                            ...t.todoManagementInfo3,
                            category2Items: t.todoManagementInfo3.category2Items.map(item =>
                                item.id === memoEditor.id ? { ...item } : item
                            ),
                            category2Memos: {
                                ...t.todoManagementInfo3.category2Memos,
                                [memoEditor.id!]: finalValue
                            }
                        }
                    }
                    : t
                )
            }));
        } else if (memoEditor.type === 'todo3Cat3') {
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (memoEditor.tabId || prev.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo3: {
                            ...t.todoManagementInfo3,
                            category3Items: t.todoManagementInfo3.category3Items.map(item =>
                                item.id === memoEditor.id ? { ...item } : item
                            ),
                            category3Memos: {
                                ...t.todoManagementInfo3.category3Memos,
                                [memoEditor.id!]: finalValue
                            }
                        }
                    }
                    : t
                )
            }));
        } else if (memoEditor.type === 'todo3Cat4') {
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (memoEditor.tabId || prev.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo3: {
                            ...t.todoManagementInfo3,
                            category4Items: t.todoManagementInfo3.category4Items.map(item =>
                                item.id === memoEditor.id ? { ...item } : item
                            ),
                            category4Memos: {
                                ...t.todoManagementInfo3.category4Memos,
                                [memoEditor.id!]: finalValue
                            }
                        }
                    }
                    : t
                )
            }));
        } else if (memoEditor.type === 'todo3Cat5') {
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (memoEditor.tabId || prev.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo3: {
                            ...t.todoManagementInfo3,
                            category5Items: t.todoManagementInfo3.category5Items.map(item =>
                                item.id === memoEditor.id ? { ...item } : item
                            ),
                            category5Memos: {
                                ...t.todoManagementInfo3.category5Memos,
                                [memoEditor.id!]: finalValue
                            }
                        }
                    }
                    : t
                )
            }));
        } else {
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (memoEditor.tabId || prev.activeTabId)
                    ? {
                        ...t,
                        sections: t.sections.map(s => ({
                            ...s,
                            items: s.items.map(i => String(i.id) === String(memoEditor.id) ? { ...i } : i)
                        })),
                        inboxSection: t.inboxSection ? {
                            ...t.inboxSection,
                            items: t.inboxSection.items.map(i => String(i.id) === String(memoEditor.id) ? { ...i } : i)
                        } : t.inboxSection,
                        memos: { ...t.memos, [memoEditor.id!]: finalValue }
                    }
                    : t
                )
            }));
        }

        if (exitEditMode) {
            if (memoEditor.value.trim() || memoEditor.title.trim()) {
                setMemoEditor(prev => ({ ...prev, isEditing: false }));
            } else {
                setMemoEditor(prev => ({ ...prev, id: null, value: '', title: '', allValues: Array(prev.allValues.length).fill(''), allTitles: Array(prev.allTitles.length).fill(''), activePageIndex: 0, isEditing: false, sectionId: null }));
            }
        }
    };

    const handleDeleteItemFromModal = () => {
        if (!memoEditor.id) return;

        setModal({
            isOpen: true,
            title: '항목 삭제',
            message: '해당 항목을 삭제하시겠습니까? 관련 메모도 함께 삭제됩니다.',
            onConfirm: () => {
                updateData(prev => ({
                    ...prev,
                    tabs: prev.tabs.map(t => {
                        if (t.id !== (memoEditor.tabId || prev.activeTabId)) return t;

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
                        } else if (memoEditor.type?.startsWith('todoCat')) {
                            const catNum = memoEditor.type.replace('todoCat', '');
                            const itemsKey = `category${catNum}Items` as keyof typeof t.todoManagementInfo;
                            const memosKey = `category${catNum}Memos` as keyof typeof t.todoManagementInfo;
                            const newMemos = { ...(t.todoManagementInfo[memosKey] as object) };
                            delete (newMemos as any)[memoEditor.id!];
                            return {
                                ...t,
                                todoManagementInfo: {
                                    ...t.todoManagementInfo,
                                    [itemsKey]: (t.todoManagementInfo[itemsKey] as any[]).filter(i => i.id !== memoEditor.id),
                                    [memosKey]: newMemos
                                }
                            };
                        } else if (memoEditor.type?.startsWith('todo2Cat')) {
                            const catNum = memoEditor.type.replace('todo2Cat', '');
                            const itemsKey = `category${catNum}Items` as keyof typeof t.todoManagementInfo2;
                            const memosKey = `category${catNum}Memos` as keyof typeof t.todoManagementInfo2;
                            const newMemos = { ...(t.todoManagementInfo2[memosKey] as object) };
                            delete (newMemos as any)[memoEditor.id!];
                            return {
                                ...t,
                                todoManagementInfo2: {
                                    ...t.todoManagementInfo2,
                                    [itemsKey]: (t.todoManagementInfo2[itemsKey] as any[]).filter(i => i.id !== memoEditor.id),
                                    [memosKey]: newMemos
                                }
                            };
                        } else if (memoEditor.type?.startsWith('todo3Cat')) {
                            const catNum = memoEditor.type.replace('todo3Cat', '');
                            const itemsKey = `category${catNum}Items` as keyof typeof t.todoManagementInfo3;
                            const memosKey = `category${catNum}Memos` as keyof typeof t.todoManagementInfo3;
                            const newMemos = { ...(t.todoManagementInfo3[memosKey] as object) };
                            delete (newMemos as any)[memoEditor.id!];
                            return {
                                ...t,
                                todoManagementInfo3: {
                                    ...t.todoManagementInfo3,
                                    [itemsKey]: (t.todoManagementInfo3[itemsKey] as any[]).filter(i => i.id !== memoEditor.id),
                                    [memosKey]: newMemos
                                }
                            };
                        } else {
                            const newMemos = { ...t.memos };
                            delete newMemos[memoEditor.id!];
                            return {
                                ...t,
                                sections: t.sections.map(s => ({
                                    ...s,
                                    items: s.items.filter(i => i.id !== memoEditor.id)
                                })),
                                inboxSection: t.inboxSection ? {
                                    ...t.inboxSection,
                                    items: t.inboxSection.items.filter(i => i.id !== memoEditor.id)
                                } : t.inboxSection,
                                memos: newMemos
                            };
                        }
                    })
                }));
                setModal(prev => ({ ...prev, isOpen: false }));
                setMemoEditor(prev => ({ ...prev, id: null, value: '', title: '', allValues: Array(prev.allValues.length).fill(''), allTitles: Array(prev.allTitles.length).fill(''), activePageIndex: 0, isEditing: false, sectionId: null }));
            }
        });
    };

    const handleInsertSymbol = (symbol: string) => {
        const element = memoTextareaRef.current;
        if (!element) return;

        if (element.tagName === 'DIV') {
            element.focus();
            const selection = window.getSelection();
            if (!selection || !selection.rangeCount) return;

            const range = selection.getRangeAt(0);
            range.deleteContents();

            if (symbol === '\n---divider---\n') {
                const hr = document.createElement('hr');
                hr.className = "w-[80%] border-t-2 border-blue-400 mx-auto my-3 border-solid pointer-events-none";
                hr.setAttribute('contenteditable', 'false');
                hr.setAttribute('data-type', 'divider');
                
                const container = document.createElement('div');
                container.appendChild(document.createElement('br'));
                container.appendChild(hr);
                container.appendChild(document.createElement('br'));
                
                const fragment = document.createDocumentFragment();
                while (container.firstChild) fragment.appendChild(container.firstChild);
                
                range.insertNode(fragment);
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
            
            const event = new Event('input', { bubbles: true });
            element.dispatchEvent(event);
            return;
        }
    };

    const memoSymbols = [
        { label: '•', value: '• ', title: '불렛' },
        { label: ':', value: ': ', title: '콜론' },
        { label: '―', value: '\n---divider---\n', title: '구분선' },
        { label: '→', value: '→ ', title: '화살표' },
        { label: '■', value: '■ ', title: '사각' },
        { label: '◆', value: '◆ ', title: '다이아' },
    ];



    return {
        handleShowMemo,
        handleSwipeMemo,
        handleSaveMemo,
        handleDeleteItemFromModal,
        handleInsertSymbol,
        handleChangePage,
        handleUpdateTitle,
        handleUpdateItemText,
        handleAddPage,
        handleDeletePage,
        memoSymbols
    };
};
