import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppData, ParkingInfo, MemoEditorState } from '../types';
import { useFirestoreSync } from './useFirestoreSync';
import { useGoogleCalendar } from './useGoogleCalendar';
import { parseMillieText } from '../utils/parseMillieText';

const defaultData: AppData = (() => {
    const initialTabId = Math.random().toString(36).substr(2, 9);
    const inboxSectionId = Math.random().toString(36).substr(2, 9);
    const quotesSectionId = Math.random().toString(36).substr(2, 9);
    return {
        tabs: [{
            id: initialTabId,
            name: '메인',
            sections: [],
            memos: {},
            parkingInfo: {
                title: '주차',
                text: '',
                checklistTitle: '업무루틴',
                checklistItems: [],
                shoppingTitle: '구매예정',
                shoppingListItems: [],
                remindersTitle: '챙겨야할 것',
                remindersItems: [],
                todoTitle: '잊지말고 할일',
                todoItems: [],
                checklistMemos: {},
                shoppingListMemos: {},
                remindersMemos: {},
                todoMemos: {}
            },
            todoManagementInfo: {
                title: '할일관리',
                category1Title: '항목 1',
                category2Title: '항목 2',
                category3Title: '항목 3',
                category4Title: '항목 4',
                category1Items: [],
                category2Items: [],
                category3Items: [],
                category4Items: [],
                category1Memos: {},
                category2Memos: {},
                category3Memos: {},
                category4Memos: {}
            },
            todoManagementInfo2: {
                title: '할일관리 2',
                category1Title: '항목 1',
                category2Title: '항목 2',
                category3Title: '항목 3',
                category4Title: '항목 4',
                category1Items: [],
                category2Items: [],
                category3Items: [],
                category4Items: [],
                category1Memos: {},
                category2Memos: {},
                category3Memos: {},
                category4Memos: {}
            },
            inboxSection: {
                id: inboxSectionId, title: 'IN-BOX', items: [], color: 'slate', isLocked: false
            },
            isLocked: false
        }],
        activeTabId: initialTabId,
        bookmarks: [],
        bookmarkSections: [
            { id: 'bms1', title: '섹션 1', items: [], color: 'slate', isLocked: false },
            { id: 'bms2', title: '섹션 2', items: [], color: 'slate', isLocked: false },
            { id: 'bms3', title: '섹션 3', items: [], color: 'slate', isLocked: false },
            { id: 'bms4', title: '섹션 4', items: [], color: 'slate', isLocked: false },
            { id: 'bms5', title: '섹션 5', items: [], color: 'slate', isLocked: false },
            { id: 'bms6', title: '섹션 6', items: [], color: 'slate', isLocked: false },
        ]
    };
})();

export const useAppState = () => {
    const { data, loading, error, updateData } = useFirestoreSync(defaultData);

    // 공유 텍스트
    const [sharedTextForInbox, setSharedTextForInbox] = useState<string>('');
    const handleClearSharedText = () => setSharedTextForInbox('');

    // safeData
    const safeData = useMemo(() => {
        if (!data) return defaultData;
        return {
            ...data,
            bookmarkSections: (data.bookmarkSections && data.bookmarkSections.length === 6)
                ? data.bookmarkSections : defaultData.bookmarkSections,
            tabs: data.tabs.map((tab, index) => {
                const isMainTab = index === 0;
                return {
                    ...tab,
                    inboxSection: isMainTab
                        ? (tab.inboxSection || {
                            id: Math.random().toString(36).substr(2, 9),
                            title: 'IN-BOX', items: [], color: 'slate', isLocked: false
                        })
                        : undefined,
                    parkingInfo: {
                        ...tab.parkingInfo,
                        title: tab.parkingInfo?.title || '주차',
                        checklistTitle: tab.parkingInfo?.checklistTitle || '업무루틴',
                        checklistItems: tab.parkingInfo?.checklistItems || [],
                        shoppingTitle: tab.parkingInfo?.shoppingTitle || '구매예정',
                        shoppingListItems: tab.parkingInfo?.shoppingListItems || [],
                        remindersTitle: tab.parkingInfo?.remindersTitle || '챙겨야할 것',
                        remindersItems: tab.parkingInfo?.remindersItems || [],
                        todoTitle: tab.parkingInfo?.todoTitle || '잊지말고 할일',
                        todoItems: tab.parkingInfo?.todoItems || [],
                        checklistMemos: tab.parkingInfo?.checklistMemos || {},
                        shoppingListMemos: tab.parkingInfo?.shoppingListMemos || {},
                        remindersMemos: tab.parkingInfo?.remindersMemos || {},
                        todoMemos: tab.parkingInfo?.todoMemos || {},
                    },
                    todoManagementInfo: {
                        ...tab.todoManagementInfo,
                        title: tab.todoManagementInfo?.title || '할일관리',
                        category1Title: tab.todoManagementInfo?.category1Title || '항목 1',
                        category2Title: tab.todoManagementInfo?.category2Title || '항목 2',
                        category3Title: tab.todoManagementInfo?.category3Title || '항목 3',
                        category4Title: tab.todoManagementInfo?.category4Title || '항목 4',
                        category1Items: tab.todoManagementInfo?.category1Items || [],
                        category2Items: tab.todoManagementInfo?.category2Items || [],
                        category3Items: tab.todoManagementInfo?.category3Items || [],
                        category4Items: tab.todoManagementInfo?.category4Items || [],
                        category1Memos: tab.todoManagementInfo?.category1Memos || {},
                        category2Memos: tab.todoManagementInfo?.category2Memos || {},
                        category3Memos: tab.todoManagementInfo?.category3Memos || {},
                        category4Memos: tab.todoManagementInfo?.category4Memos || {},
                    },
                    todoManagementInfo2: {
                        ...tab.todoManagementInfo2,
                        title: tab.todoManagementInfo2?.title || '할일관리 2',
                        category1Title: tab.todoManagementInfo2?.category1Title || '항목 1',
                        category2Title: tab.todoManagementInfo2?.category2Title || '항목 2',
                        category3Title: tab.todoManagementInfo2?.category3Title || '항목 3',
                        category4Title: tab.todoManagementInfo2?.category4Title || '항목 4',
                        category1Items: tab.todoManagementInfo2?.category1Items || [],
                        category2Items: tab.todoManagementInfo2?.category2Items || [],
                        category3Items: tab.todoManagementInfo2?.category3Items || [],
                        category4Items: tab.todoManagementInfo2?.category4Items || [],
                        category1Memos: tab.todoManagementInfo2?.category1Memos || {},
                        category2Memos: tab.todoManagementInfo2?.category2Memos || {},
                        category3Memos: tab.todoManagementInfo2?.category3Memos || {},
                        category4Memos: tab.todoManagementInfo2?.category4Memos || {},
                    },
                };
            })
        };
    }, [data]);

    // 네트워크 상태
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    useEffect(() => {
        const handleOnline = () => { setIsOnline(true); console.log('[App] Network restored'); };
        const handleOffline = () => { setIsOnline(false); console.log('[App] Network lost'); };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
    }, []);

    // 공유 컨텐츠 URL 파라미터 캡처
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const isShared = urlParams.get('shared') === 'true';
        const sharedText = urlParams.get('text');
        if (isShared && sharedText) {
            const parsedText = parseMillieText(sharedText);
            setSharedTextForInbox(parsedText);
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    // 공유 텍스트 수신 시 IN-BOX 스크롤
    useEffect(() => {
        if (!sharedTextForInbox || loading || !safeData?.tabs?.[0]?.inboxSection) return;
        const mainTab = safeData.tabs[0];
        updateData({ ...safeData, activeTabId: mainTab.id });
        setTimeout(() => {
            const el = document.querySelector('[data-section-id="' + mainTab.inboxSection!.id + '"]');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                el.classList.add('ring-2', 'ring-yellow-400', 'ring-opacity-50');
                setTimeout(() => el.classList.remove('ring-2', 'ring-yellow-400', 'ring-opacity-50'), 3000);
            }
        }, 300);
    }, [sharedTextForInbox, loading, safeData, updateData]);

    // 모바일 레이아웃 감지
    const [isMobileLayout, setIsMobileLayout] = useState(() => {
        return window.matchMedia('(max-width: 1024px) and (orientation: portrait)').matches;
    });
    useEffect(() => {
        const query = window.matchMedia('(max-width: 1024px) and (orientation: portrait)');
        const handler = (e: MediaQueryListEvent) => setIsMobileLayout(e.matches);
        query.addEventListener('change', handler);
        return () => query.removeEventListener('change', handler);
    }, []);

    // 확인 모달
    const [modal, setModal] = useState<{
        isOpen: boolean; title: string; message: string; onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    // 메모 에디터 상태
    const [memoEditor, setMemoEditor] = useState<MemoEditorState>({
        id: null, value: '', type: 'section', isEditing: false, sectionId: null
    });
    const memoTextareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (memoEditor.isEditing && memoTextareaRef.current) {
            const len = memoEditor.value.length;
            memoTextareaRef.current.focus();
            memoTextareaRef.current.setSelectionRange(len, len);
        }
    }, [memoEditor.isEditing]);

    // Google Calendar
    const googleCalendar = useGoogleCalendar();
    const [calendarModal, setCalendarModal] = useState<{
        isOpen: boolean; itemText: string;
    }>({ isOpen: false, itemText: '' });

    const handleParkingChange = (newInfo: ParkingInfo) => {
        updateData({
            ...safeData,
            tabs: safeData.tabs.map(t => t.id === safeData.activeTabId ? { ...t, parkingInfo: newInfo } : t)
        });
    };

    const handleTodoManagementChange = (newInfo: any) => {
        updateData({
            ...safeData,
            tabs: safeData.tabs.map(t => t.id === safeData.activeTabId ? { ...t, todoManagementInfo: newInfo } : t)
        });
    };

    const handleTodoManagement2Change = (newInfo: any) => {
        updateData({
            ...safeData,
            tabs: safeData.tabs.map(t => t.id === safeData.activeTabId ? { ...t, todoManagementInfo2: newInfo } : t)
        });
    };

    const handleAddToCalendarClick = (itemText: string) => {
        if (!googleCalendar.isAuthorized) { googleCalendar.login(); return; }
        setCalendarModal({ isOpen: true, itemText });
    };

    const handleConfirmCalendar = async (startDate: string, endDate: string, isAllDay: boolean) => {
        try {
            await googleCalendar.createCalendarEvent({
                summary: calendarModal.itemText, start: startDate, end: endDate, isAllDay,
            });
            alert('캘린더에 추가되었습니다!');
            setCalendarModal({ isOpen: false, itemText: '' });
        } catch (error: any) {
            console.error('캘린더 추가 실패:', error);
            if (error.message?.includes('인증이 만료') || error.message?.includes('권한이 부족')) {
                setCalendarModal({ isOpen: false, itemText: '' });
                alert(`${error.message} \n\n확인을 누르면 다시 로그인합니다.`);
                googleCalendar.login();
            } else {
                alert(`캘린더 추가 실패: ${error.message || '알 수 없는 오류'} `);
            }
        }
    };

    return {
        data, loading, error, updateData, safeData,
        sharedTextForInbox, handleClearSharedText,
        isOnline, isMobileLayout,
        modal, setModal,
        memoEditor, setMemoEditor, memoTextareaRef,
        calendarModal, setCalendarModal,
        handleParkingChange, handleTodoManagementChange, handleTodoManagement2Change, handleAddToCalendarClick, handleConfirmCalendar
    };
};
