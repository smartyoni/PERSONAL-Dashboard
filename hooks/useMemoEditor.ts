import React, { useRef } from 'react';
import { AppData, Tab, ListItem, MemoEditorState, TITLE_SEPARATOR, HistoryItem, TodoManagementInfo, ParkingInfo } from '../types';
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
                loadedValue = targetTab.todoManagementInfo2?.category1Memos?.[id] || '';
            } else if (type === 'todo2Cat2') {
                loadedValue = targetTab.todoManagementInfo2?.category2Memos?.[id] || '';
            } else if (type === 'todo2Cat3') {
                loadedValue = targetTab.todoManagementInfo2?.category3Memos?.[id] || '';
            } else if (type === 'todo2Cat4') {
                loadedValue = targetTab.todoManagementInfo2?.category4Memos?.[id] || '';
            } else if (type === 'todo2Cat5') {
                loadedValue = targetTab.todoManagementInfo2?.category5Memos?.[id] || '';
            } else if (type === 'todo3Cat1') {
                loadedValue = targetTab.todoManagementInfo3?.category1Memos?.[id] || '';
            } else if (type === 'todo3Cat2') {
                loadedValue = targetTab.todoManagementInfo3?.category2Memos?.[id] || '';
            } else if (type === 'todo3Cat3') {
                loadedValue = targetTab.todoManagementInfo3?.category3Memos?.[id] || '';
            } else if (type === 'todo3Cat4') {
                loadedValue = targetTab.todoManagementInfo3?.category4Memos?.[id] || '';
            } else if (type === 'todo3Cat5') {
                loadedValue = targetTab.todoManagementInfo3?.category5Memos?.[id] || '';
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
                type?.startsWith('todoCat') || type?.startsWith('todo2Cat') || type?.startsWith('todo3Cat');

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

    const handleUpdatePageTitle = (index: number, newTitle: string) => {
        if (!memoEditor.id) return;

        // 1. Update LOCAL state for immediate feedback
        setMemoEditor(prev => {
            const newAllTitles = [...prev.allTitles];
            newAllTitles[index] = newTitle;
            const isCurrentPage = index === prev.activePageIndex;
            return {
                ...prev,
                allTitles: newAllTitles,
                title: isCurrentPage ? newTitle : prev.title
            };
        });

        // 2. Prepare final value for persistence
        // SYNC: Ensure current unsaved changes are captured
        const updatedAllContents = [...memoEditor.allValues];
        updatedAllContents[memoEditor.activePageIndex] = memoEditor.value;
        const updatedAllTitles = [...memoEditor.allTitles];
        updatedAllTitles[memoEditor.activePageIndex] = memoEditor.title;
        
        // Apply the new title for the targeted index
        updatedAllTitles[index] = newTitle;

        const finalPages = updatedAllContents.map((content, idx) => {
            const title = updatedAllTitles[idx];
            return title + TITLE_SEPARATOR + content;
        });
        const finalValue = finalPages.join('\n===page-break===\n');

        const { id, type, tabId } = memoEditor;

        // 3. Persist to data (Mirrors handleSaveMemo consolidation)
        if (type === 'section') {
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (tabId || prev.activeTabId)
                    ? { ...t, memos: { ...t.memos, [id!]: finalValue } }
                    : t
                )
            }));
        } else if (type === 'checklist' || type === 'shopping' || type === 'reminders' || type === 'todo' || type === 'parkingCat5') {
            const pkKey = type === 'checklist' ? 'checklistMemos' : 
                          type === 'shopping' ? 'shoppingListMemos' :
                          type === 'reminders' ? 'remindersMemos' :
                          type === 'todo' ? 'todoMemos' : 'category5Memos';
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (tabId || prev.activeTabId)
                    ? {
                        ...t,
                        parkingInfo: { ...t.parkingInfo, [pkKey]: { ...(t.parkingInfo as any)[pkKey], [id!]: finalValue } }
                    }
                    : t
                )
            }));
        } else if (type?.startsWith('todoCat')) {
            const catNum = type.replace('todoCat', '');
            const memosKey = `category${catNum}Memos` as keyof TodoManagementInfo;
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (tabId || prev.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo: {
                            ...t.todoManagementInfo,
                            [memosKey]: { ...(t.todoManagementInfo[memosKey] as any), [id!]: finalValue }
                        }
                    }
                    : t
                )
            }));
        } else if (type?.startsWith('todo2Cat')) {
            const catNum = type.replace('todo2Cat', '');
            const memosKey = `category${catNum}Memos` as keyof TodoManagementInfo;
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (tabId || prev.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo2: t.todoManagementInfo2 ? {
                            ...t.todoManagementInfo2,
                            [memosKey]: { ...(t.todoManagementInfo2[memosKey] as any), [id!]: finalValue }
                        } : undefined
                    }
                    : t
                )
            }));
        } else if (type?.startsWith('todo3Cat')) {
            const catNum = type.replace('todo3Cat', '');
            const memosKey = `category${catNum}Memos` as keyof TodoManagementInfo;
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (tabId || prev.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo3: t.todoManagementInfo3 ? {
                            ...t.todoManagementInfo3,
                            [memosKey]: { ...(t.todoManagementInfo3[memosKey] as any), [id!]: finalValue }
                        } : undefined
                    }
                    : t
                )
            }));
        }
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
        if (!memoEditor.id) return;
        setMemoEditor(prev => {
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

        // SYNC Fix
        const updatedAllValues = [...memoEditor.allValues];
        updatedAllValues[memoEditor.activePageIndex] = memoEditor.value;
        const updatedAllTitles = [...memoEditor.allTitles];
        updatedAllTitles[memoEditor.activePageIndex] = memoEditor.title;
        const finalPages = [...updatedAllValues, ''].map((content, idx) => {
            const title = updatedAllTitles[idx] || '';
            const value = idx === updatedAllValues.length ? '' : content;
            return title + TITLE_SEPARATOR + value;
        });
        const finalValue = finalPages.join('\n===page-break===\n');
        const { id, type, tabId } = memoEditor;

        if (type === 'section') {
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (tabId || prev.activeTabId)
                    ? { ...t, memos: { ...t.memos, [id!]: finalValue } }
                    : t
                )
            }));
        } else if (type === 'checklist' || type === 'shopping' || type === 'reminders' || type === 'todo' || type === 'parkingCat5') {
            const pkKey = type === 'checklist' ? 'checklistMemos' : 
                          type === 'shopping' ? 'shoppingListMemos' :
                          type === 'reminders' ? 'remindersMemos' :
                          type === 'todo' ? 'todoMemos' : 'category5Memos';
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (tabId || prev.activeTabId)
                    ? {
                        ...t,
                        parkingInfo: { ...t.parkingInfo, [pkKey]: { ...(t.parkingInfo as any)[pkKey], [id!]: finalValue } }
                    }
                    : t
                )
            }));
        } else if (type?.startsWith('todoCat')) {
            const catNum = type.replace('todoCat', '');
            const memosKey = `category${catNum}Memos` as keyof TodoManagementInfo;
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (tabId || prev.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo: { ...t.todoManagementInfo, [memosKey]: { ...(t.todoManagementInfo[memosKey] as any), [id!]: finalValue } }
                    }
                    : t
                )
            }));
        } else if (type?.startsWith('todo2Cat')) {
            const catNum = type.replace('todo2Cat', '');
            const memosKey = `category${catNum}Memos` as keyof TodoManagementInfo;
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (tabId || prev.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo2: t.todoManagementInfo2 ? {
                            ...t.todoManagementInfo2,
                            [memosKey]: { ...(t.todoManagementInfo2[memosKey] as any), [id!]: finalValue }
                        } : undefined
                    }
                    : t
                )
            }));
        } else if (type?.startsWith('todo3Cat')) {
            const catNum = type.replace('todo3Cat', '');
            const memosKey = `category${catNum}Memos` as keyof TodoManagementInfo;
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (tabId || prev.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo3: t.todoManagementInfo3 ? {
                            ...t.todoManagementInfo3,
                            [memosKey]: { ...(t.todoManagementInfo3[memosKey] as any), [id!]: finalValue }
                        } : undefined
                    }
                    : t
                )
            }));
        }
    };

    const handleDeletePage = () => {
        setMemoEditor(prev => {
            if (!prev.id) return prev;
            if (prev.allValues.length <= 1) {
                alert('최소 1페이지는 유지해야 합니다.');
                return prev;
            }
            const newAllValues = [...prev.allValues];
            const newAllTitles = [...prev.allTitles];
            newAllValues.splice(prev.activePageIndex, 1);
            newAllTitles.splice(prev.activePageIndex, 1);
            const newIndex = Math.min(prev.activePageIndex, newAllValues.length - 1);
            const newState = {
                ...prev,
                allValues: newAllValues,
                allTitles: newAllTitles,
                activePageIndex: newIndex,
                value: newAllValues[newIndex],
                title: newAllTitles[newIndex]
            };
            const finalPages = newAllValues.map((content, idx) => {
                const title = newAllTitles[idx] || '';
                return title + TITLE_SEPARATOR + content;
            });
            const finalValue = finalPages.join('\n===page-break===\n');
            const { id, type, tabId } = prev;
            if (type === 'section') {
                updateData(p => ({
                    ...p,
                    tabs: p.tabs.map(t => t.id === (tabId || p.activeTabId) ? { ...t, memos: { ...t.memos, [id!]: finalValue } } : t)
                }));
            } else if (type === 'checklist' || type === 'shopping' || type === 'reminders' || type === 'todo' || type === 'parkingCat5') {
                const pkKey = type === 'checklist' ? 'checklistMemos' : 
                              type === 'shopping' ? 'shoppingListMemos' :
                              type === 'reminders' ? 'remindersMemos' :
                              type === 'todo' ? 'todoMemos' : 'category5Memos';
                updateData(p => ({
                    ...p,
                    tabs: p.tabs.map(t => t.id === (tabId || p.activeTabId) ? { ...t, parkingInfo: { ...t.parkingInfo, [pkKey]: { ...(t.parkingInfo as any)[pkKey], [id!]: finalValue } } } : t)
                }));
            } else if (type?.startsWith('todoCat')) {
                const catNum = type.replace('todoCat', '');
                const memosKey = `category${catNum}Memos` as keyof TodoManagementInfo;
                updateData(p => ({
                    ...p,
                    tabs: p.tabs.map(t => t.id === (tabId || p.activeTabId) ? { ...t, todoManagementInfo: { ...t.todoManagementInfo, [memosKey]: { ...(t.todoManagementInfo[memosKey] as any), [id!]: finalValue } } } : t)
                }));
            } else if (type?.startsWith('todo2Cat')) {
                const catNum = type.replace('todo2Cat', '');
                const memosKey = `category${catNum}Memos` as keyof TodoManagementInfo;
                updateData(p => ({
                    ...p,
                    tabs: p.tabs.map(t => t.id === (tabId || p.activeTabId) ? { ...t, todoManagementInfo2: t.todoManagementInfo2 ? { ...t.todoManagementInfo2, [memosKey]: { ...(t.todoManagementInfo2[memosKey] as any), [id!]: finalValue } } : undefined } : t)
                }));
            } else if (type?.startsWith('todo3Cat')) {
                const catNum = type.replace('todo3Cat', '');
                const memosKey = `category${catNum}Memos` as keyof TodoManagementInfo;
                updateData(p => ({
                    ...p,
                    tabs: p.tabs.map(t => t.id === (tabId || p.activeTabId) ? { ...t, todoManagementInfo3: t.todoManagementInfo3 ? { ...t.todoManagementInfo3, [memosKey]: { ...(t.todoManagementInfo3[memosKey] as any), [id!]: finalValue } } : undefined } : t)
                }));
            }
            return newState;
        });
    };

    const handleSwipeMemo = (direction: 'left' | 'right') => {
        if (!memoEditor.id) return;
        const totalPages = memoEditor.allValues.length;
        const currentIndex = memoEditor.activePageIndex;
        if (direction === 'left') {
            if (currentIndex < totalPages - 1) handleChangePage(currentIndex + 1);
        } else {
            if (currentIndex > 0) handleChangePage(currentIndex - 1);
        }
    };

    const handleSaveMemo = (exitEditMode: boolean = true, newValue?: string) => {
        if (!memoEditor.id) return;
        const currentContent = newValue !== undefined ? newValue : memoEditor.value;
        const currentTitle = memoEditor.title || '';
        const updatedAllContents = [...memoEditor.allValues];
        if (memoEditor.activePageIndex >= 0 && memoEditor.activePageIndex < updatedAllContents.length) {
            updatedAllContents[memoEditor.activePageIndex] = currentContent;
        }
        const updatedAllTitles = [...memoEditor.allTitles];
        if (memoEditor.activePageIndex >= 0 && memoEditor.activePageIndex < updatedAllTitles.length) {
            updatedAllTitles[memoEditor.activePageIndex] = currentTitle;
        }
        const finalPages = updatedAllContents.map((content, idx) => {
            const title = updatedAllTitles[idx] || '';
            return title + TITLE_SEPARATOR + content;
        });
        const finalValue = finalPages.join('\n===page-break===\n');
        const { type, id, tabId } = memoEditor;

        if (type === 'section') {
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (tabId || prev.activeTabId) ? { ...t, memos: { ...t.memos, [id!]: finalValue } } : t)
            }));
        } else if (type === 'checklist' || type === 'shopping' || type === 'reminders' || type === 'todo' || type === 'parkingCat5') {
            const pkKey = type === 'checklist' ? 'checklistMemos' : 
                          type === 'shopping' ? 'shoppingListMemos' :
                          type === 'reminders' ? 'remindersMemos' :
                          type === 'todo' ? 'todoMemos' : 'category5Memos';
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (tabId || prev.activeTabId) ? { ...t, parkingInfo: { ...t.parkingInfo, [pkKey]: { ...(t.parkingInfo as any)[pkKey], [id!]: finalValue } } } : t)
            }));
        } else if (type?.startsWith('todoCat')) {
            const catNum = type.replace('todoCat', '');
            const memosKey = `category${catNum}Memos` as keyof TodoManagementInfo;
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (tabId || prev.activeTabId) ? { ...t, todoManagementInfo: { ...t.todoManagementInfo, [memosKey]: { ...(t.todoManagementInfo[memosKey] as any), [id!]: finalValue } } } : t)
            }));
        } else if (type?.startsWith('todo2Cat')) {
            const catNum = type.replace('todo2Cat', '');
            const memosKey = `category${catNum}Memos` as keyof TodoManagementInfo;
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (tabId || prev.activeTabId) ? { ...t, todoManagementInfo2: t.todoManagementInfo2 ? { ...t.todoManagementInfo2, [memosKey]: { ...(t.todoManagementInfo2[memosKey] as any), [id!]: finalValue } } : undefined } : t)
            }));
        } else if (type?.startsWith('todo3Cat')) {
            const catNum = type.replace('todo3Cat', '');
            const memosKey = `category${catNum}Memos` as keyof TodoManagementInfo;
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (tabId || prev.activeTabId) ? { ...t, todoManagementInfo3: t.todoManagementInfo3 ? { ...t.todoManagementInfo3, [memosKey]: { ...(t.todoManagementInfo3[memosKey] as any), [id!]: finalValue } } : undefined } : t)
            }));
        } else {
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (tabId || prev.activeTabId) ? { ...t, memos: { ...t.memos, [id!]: finalValue } } : t)
            }));
        }

        setMemoEditor(prev => {
            if (exitEditMode && !currentContent.trim() && !currentTitle.trim() && prev.allValues.length <= 1) {
                return { ...prev, id: null, value: '', title: '', allValues: [''], allTitles: [''], activePageIndex: 0, isEditing: false, sectionId: null };
            }
            return { ...prev, value: currentContent, title: currentTitle, allValues: updatedAllContents, allTitles: updatedAllTitles, isEditing: exitEditMode ? false : prev.isEditing };
        });
    };

    const handleDeleteItemFromModal = () => {
        if (!memoEditor.id) return;
        const targetTab = safeData.tabs.find(t => t.id === (memoEditor.tabId || safeData.activeTabId));
        if (targetTab) {
            let itemToDelete: any = null;
            const { type, id } = memoEditor;
            if (type === 'checklist') itemToDelete = targetTab.parkingInfo.checklistItems.find((i: any) => i.id === id);
            else if (type === 'shopping') itemToDelete = targetTab.parkingInfo.shoppingListItems.find((i: any) => i.id === id);
            else if (type === 'reminders') itemToDelete = targetTab.parkingInfo.remindersItems.find((i: any) => i.id === id);
            else if (type === 'todo') itemToDelete = targetTab.parkingInfo.todoItems.find((i: any) => i.id === id);
            else if (type === 'parkingCat5') itemToDelete = targetTab.parkingInfo.category5Items.find((i: any) => i.id === id);
            else if (type?.includes('Cat')) {
                const catMatch = type.match(/cat(\d+)$/i);
                const num = catMatch ? catMatch[1] : '1';
                const itemsKey = `category${num}Items`;
                let info;
                if (type.startsWith('todo2Cat')) info = targetTab.todoManagementInfo2;
                else if (type.startsWith('todo3Cat')) info = targetTab.todoManagementInfo3;
                else if (type.startsWith('todoCat')) info = targetTab.todoManagementInfo;
                if (info) itemToDelete = (info as any)[itemsKey]?.find((i: any) => i.id === id);
            } else {
                const section = [targetTab.inboxSection, ...targetTab.sections].find((s: any) => s?.id === memoEditor.sectionId);
                itemToDelete = section?.items.find((i: any) => i.id === id);
            }
            if (itemToDelete?.isLocked) {
                alert("🔒 잠긴 항목은 삭제할 수 없습니다. 먼저 잠금을 해제해주세요.");
                return;
            }
        }
        setMemoEditor(prev => ({ ...prev, id: null, value: '', title: '', allValues: [''], allTitles: [''], activePageIndex: 0, isEditing: false, sectionId: null }));
        updateData(prev => ({
            ...prev,
            tabs: prev.tabs.map(t => {
                if (t.id !== (memoEditor.tabId || prev.activeTabId)) return t;
                const { type, id } = memoEditor;
                if (type === 'checklist' || type === 'shopping' || type === 'reminders' || type === 'todo' || type === 'parkingCat5') {
                    const itemsKey = type === 'checklist' ? 'checklistItems' : type === 'shopping' ? 'shoppingListItems' : type === 'reminders' ? 'remindersItems' : type === 'todo' ? 'todoItems' : 'category5Items';
                    const memosKey = type === 'checklist' ? 'checklistMemos' : type === 'shopping' ? 'shoppingListMemos' : type === 'reminders' ? 'remindersMemos' : type === 'todo' ? 'todoMemos' : 'category5Memos';
                    const newMemos = { ...(t.parkingInfo as any)[memosKey] };
                    delete newMemos[id!];
                    return { ...t, parkingInfo: { ...t.parkingInfo, [itemsKey]: (t.parkingInfo as any)[itemsKey].filter((i: any) => i.id !== id), [memosKey]: newMemos } };
                } else if (type?.includes('Cat')) {
                    const catMatch = type.match(/cat(\d+)$/i);
                    const num = catMatch ? catMatch[1] : '1';
                    const itemsKey = `category${num}Items`;
                    const memosKey = `category${num}Memos`;
                    let infoKey: keyof Tab = 'todoManagementInfo';
                    if (type.startsWith('todo2Cat')) infoKey = 'todoManagementInfo2';
                    else if (type.startsWith('todo3Cat')) infoKey = 'todoManagementInfo3';
                    const info = t[infoKey] as any;
                    if (!info) return t;
                    const newMemos = { ...info[memosKey] };
                    delete newMemos[id!];
                    return { ...t, [infoKey]: { ...info, [itemsKey]: info[itemsKey].filter((i: any) => i.id !== id), [memosKey]: newMemos } };
                } else {
                    const newMemos = { ...t.memos };
                    delete newMemos[id!];
                    return { ...t, sections: t.sections.map(s => ({ ...s, items: s.items.filter(i => i.id !== id) })), inboxSection: t.inboxSection ? { ...t.inboxSection, items: t.inboxSection.items.filter(i => i.id !== id) } : t.inboxSection, memos: newMemos };
                }
            })
        }));
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
            element.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };

    const memoSymbols = [
        { label: 'H1', value: '# ', title: '제목 1' },
        { label: 'H2', value: '## ', title: '제목 2' },
        { label: 'H3', value: '### ', title: '제목 3' },
        { label: '•', value: '• ', title: '불렛' },
        { label: ':', value: ': ', title: '콜론' },
        { label: '―', value: '\n---\n', title: '구분선' },
        { label: '→', value: '→ ', title: '화살표' },
        { label: '■', value: '■ ', title: '사각' },
        { label: '◆', value: '◆ ', title: '다이아' },
    ];

    const handleReorderPages = (oldIndex: number, newIndex: number) => {
        if (!memoEditor.id) return;
        if (oldIndex === newIndex) return;

        // 1. Sync CURRENT unsaved changes to local array first
        const updatedAllContents = [...memoEditor.allValues];
        updatedAllContents[memoEditor.activePageIndex] = memoEditor.value;
        const updatedAllTitles = [...memoEditor.allTitles];
        updatedAllTitles[memoEditor.activePageIndex] = memoEditor.title;

        // 2. Perform reorder on the SYNCED arrays
        const [movedValue] = updatedAllContents.splice(oldIndex, 1);
        updatedAllContents.splice(newIndex, 0, movedValue);
        
        const [movedTitle] = updatedAllTitles.splice(oldIndex, 1);
        updatedAllTitles.splice(newIndex, 0, movedTitle);

        // 3. Update activePageIndex to follow the moved page or handle shifts
        let newActiveIndex = memoEditor.activePageIndex;
        if (memoEditor.activePageIndex === oldIndex) {
            newActiveIndex = newIndex;
        } else if (oldIndex < memoEditor.activePageIndex && newIndex >= memoEditor.activePageIndex) {
            newActiveIndex--;
        } else if (oldIndex > memoEditor.activePageIndex && newIndex <= memoEditor.activePageIndex) {
            newActiveIndex++;
        }

        // 4. Update LOCAL state for immediate feedback
        setMemoEditor(prev => ({
            ...prev,
            allValues: updatedAllContents,
            allTitles: updatedAllTitles,
            activePageIndex: newActiveIndex,
            value: updatedAllContents[newActiveIndex],
            title: updatedAllTitles[newActiveIndex]
        }));

        // 5. Build finalValue for Firestore persistence
        const finalPages = updatedAllContents.map((content, idx) => {
            const title = updatedAllTitles[idx] || '';
            return title + TITLE_SEPARATOR + content;
        });
        const finalValue = finalPages.join('\n===page-break===\n');
        const { id, type, tabId } = memoEditor;

        // 6. Update Firestore data
        if (type === 'section') {
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (tabId || prev.activeTabId)
                    ? { ...t, memos: { ...t.memos, [id!]: finalValue } }
                    : t
                )
            }));
        } else if (type === 'checklist' || type === 'shopping' || type === 'reminders' || type === 'todo' || type === 'parkingCat5') {
            const pkKey = type === 'checklist' ? 'checklistMemos' : 
                          type === 'shopping' ? 'shoppingListMemos' :
                          type === 'reminders' ? 'remindersMemos' :
                          type === 'todo' ? 'todoMemos' : 'category5Memos';
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (tabId || prev.activeTabId)
                    ? {
                        ...t,
                        parkingInfo: { ...t.parkingInfo, [pkKey]: { ...(t.parkingInfo as any)[pkKey], [id!]: finalValue } }
                    }
                    : t
                )
            }));
        } else if (type?.startsWith('todoCat')) {
            const catNum = type.replace('todoCat', '');
            const memosKey = `category${catNum}Memos` as keyof TodoManagementInfo;
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (tabId || prev.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo: { ...t.todoManagementInfo, [memosKey]: { ...(t.todoManagementInfo[memosKey] as any), [id!]: finalValue } }
                    }
                    : t
                )
            }));
        } else if (type?.startsWith('todo2Cat')) {
            const catNum = type.replace('todo2Cat', '');
            const memosKey = `category${catNum}Memos` as keyof TodoManagementInfo;
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (tabId || prev.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo2: t.todoManagementInfo2 ? {
                            ...t.todoManagementInfo2,
                            [memosKey]: { ...(t.todoManagementInfo2[memosKey] as any), [id!]: finalValue }
                        } : undefined
                    }
                    : t
                )
            }));
        } else if (type?.startsWith('todo3Cat')) {
            const catNum = type.replace('todo3Cat', '');
            const memosKey = `category${catNum}Memos` as keyof TodoManagementInfo;
            updateData(prev => ({
                ...prev,
                tabs: prev.tabs.map(t => t.id === (tabId || prev.activeTabId)
                    ? {
                        ...t,
                        todoManagementInfo3: t.todoManagementInfo3 ? {
                            ...t.todoManagementInfo3,
                            [memosKey]: { ...(t.todoManagementInfo3[memosKey] as any), [id!]: finalValue }
                        } : undefined
                    }
                    : t
                )
            }));
        }
    };

    return {
        handleShowMemo,
        handleSwipeMemo,
        handleSaveMemo,
        handleDeleteItemFromModal,
        handleInsertSymbol,
        handleChangePage,
        handleUpdateTitle,
        handleUpdatePageTitle,
        handleUpdateItemText,
        handleAddPage,
        handleDeletePage,
        handleReorderPages,
        memoSymbols
    };
};
