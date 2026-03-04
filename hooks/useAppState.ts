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
                text: '',
                checklistItems: [],
                shoppingListItems: [],
                remindersItems: [],
                todoItems: [],
                checklistMemos: {},
                shoppingListMemos: {},
                remindersMemos: {},
                todoMemos: {}
            },
            inboxSection: {
                id: inboxSectionId, title: 'IN-BOX', items: [], color: 'slate', isLocked: false
            },
            quotesSection: {
                id: quotesSectionId, title: '명언', items: [], color: 'slate', isLocked: false
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
                        checklistItems: tab.parkingInfo?.checklistItems || [],
                        shoppingListItems: tab.parkingInfo?.shoppingListItems || [],
                        remindersItems: tab.parkingInfo?.remindersItems || [],
                        todoItems: tab.parkingInfo?.todoItems || [],
                        checklistMemos: tab.parkingInfo?.checklistMemos || {},
                        shoppingListMemos: tab.parkingInfo?.shoppingListMemos || {},
                        remindersMemos: tab.parkingInfo?.remindersMemos || {},
                        todoMemos: tab.parkingInfo?.todoMemos || {},
                    },
                    quotesSection: tab.quotesSection || {
                        id: Math.random().toString(36).substr(2, 9),
                        title: '명언', items: [], color: 'slate', isLocked: false
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
    const [memoEditor, setMemoEditor] = useState<{
        id: string | null; value: string;
        type: 'section' | 'checklist' | 'shopping' | 'memoBoard';
        isEditing: boolean; openedFromMap?: boolean;
    }>({ id: null, value: '', type: 'section', isEditing: false });
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
        handleParkingChange, handleAddToCalendarClick, handleConfirmCalendar
    };
};
