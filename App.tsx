
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Header from './components/Header';
import { Section, AppData, DragState, Tab, ParkingInfo, Bookmark, ListItem } from './types';
import SectionCard from './components/SectionCard';
import ConfirmModal from './components/ConfirmModal';
import ParkingWidget from './components/ParkingWidget';
import FooterTabs, { getTabColor } from './components/FooterTabs';

import NavigationMapModal from './components/NavigationMapModal';
import MoveItemModal from './components/MoveItemModal';
import AddToCalendarModal from './components/AddToCalendarModal';
import SectionMapModal from './components/SectionMapModal';
import TagSelectionModal from './components/TagSelectionModal';
import { useFirestoreSync } from './hooks/useFirestoreSync';
import { useSwipeGesture } from './hooks/useSwipeGesture';
import { useGoogleCalendar } from './hooks/useGoogleCalendar';
import { parseMillieText } from './utils/parseMillieText';
import LinkifiedText from './components/LinkifiedText';

const STORAGE_KEY = 'custom_workspace_v4_final_persistent';



const App: React.FC = () => {
  // 기본 데이터 정의
  const defaultData: AppData = useMemo(() => {
    const initialTabId = Math.random().toString(36).substr(2, 9);
    const inboxSectionId = Math.random().toString(36).substr(2, 9);
    const quotesSectionId = Math.random().toString(36).substr(2, 9);
    return {
      tabs: [{
        id: initialTabId,
        name: '메인',
        sections: [],
        memos: {},

        parkingInfo: { text: '', checklistItems: [], shoppingListItems: [], checklistMemos: {}, shoppingListMemos: {} },
        inboxSection: {
          id: inboxSectionId,
          title: 'IN-BOX',
          items: [],
          color: 'slate',
          isLocked: false
        },
        quotesSection: {
          id: quotesSectionId,
          title: '명언',
          items: [],
          color: 'slate',
          isLocked: false
        },

        isLocked: false
      }],
      activeTabId: initialTabId,
      bookmarkSections: [
        { id: 'bms1', title: '섹션 1', items: [], color: 'slate', isLocked: false },
        { id: 'bms2', title: '섹션 2', items: [], color: 'slate', isLocked: false },
        { id: 'bms3', title: '섹션 3', items: [], color: 'slate', isLocked: false },
        { id: 'bms4', title: '섹션 4', items: [], color: 'slate', isLocked: false },
        { id: 'bms5', title: '섹션 5', items: [], color: 'slate', isLocked: false },
        { id: 'bms6', title: '섹션 6', items: [], color: 'slate', isLocked: false },
      ]
    };
  }, []);

  // Firestore 동기화 훅 사용
  const { data, loading, error, updateData } = useFirestoreSync(defaultData);

  // 공유 텍스트를 빠른입력창에 표시하기 위한 state
  const [sharedTextForInbox, setSharedTextForInbox] = useState<string>('');

  // 공유 텍스트 초기화 콜백
  const handleClearSharedText = () => {
    setSharedTextForInbox('');
  };

  // data가 null이면 기본값 사용, 기존 데이터에 inboxSection, quotesSection이 없으면 추가
  const safeData = useMemo(() => {
    if (!data) return defaultData;

    // 메인탭(첫 번째 탭)만 inboxSection을 유지, 나머지는 undefined
    return {
      ...data,
      bookmarkSections: (data.bookmarkSections && data.bookmarkSections.length === 6)
        ? data.bookmarkSections
        : defaultData.bookmarkSections,
      tabs: data.tabs.map((tab, index) => {
        const isMainTab = index === 0;
        return {
          ...tab,
          inboxSection: isMainTab
            ? (tab.inboxSection || {
              id: Math.random().toString(36).substr(2, 9),
              title: 'IN-BOX',
              items: [],
              color: 'slate',
              isLocked: false
            })
            : undefined,
          quotesSection: tab.quotesSection || {
            id: Math.random().toString(36).substr(2, 9),
            title: '명언',
            items: [],
            color: 'slate',
            isLocked: false
          },
        };
      })
    };
  }, [data, defaultData]);

  // 네트워크 상태 감지
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('[App] Network restored - Firestore will auto-sync');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('[App] Network lost - app is now offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 공유된 콘텐츠 URL 파라미터를 즉시 캡처 (mount 시)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isShared = urlParams.get('shared') === 'true';
    const sharedText = urlParams.get('text');

    if (isShared && sharedText) {
      console.log('[App] Web Share Target - URL 파라미터 캡처:', sharedText.substring(0, 50) + '...');

      // 밀리의 서재 텍스트 파싱 (원문만 추출)
      const parsedText = parseMillieText(sharedText);
      console.log('[App] Web Share Target - 파싱 후:', parsedText.substring(0, 50) + '...');

      setSharedTextForInbox(parsedText);

      // URL 파라미터 즉시 제거 (재처리 방지)
      window.history.replaceState({}, '', window.location.pathname);
      console.log('[App] Web Share Target - URL 파라미터 제거 완료');
    }
  }, []); // 빈 배열 = mount 시에만 실행

  // 공유 텍스트 수신 시 IN-BOX로 스크롤 및 강조
  useEffect(() => {
    if (!sharedTextForInbox || loading || !safeData?.tabs?.[0]?.inboxSection) {
      return;
    }

    const mainTab = safeData.tabs[0];

    // 메인 탭으로 전환
    updateData({
      ...safeData,
      activeTabId: mainTab.id
    });

    // IN-BOX로 스크롤 및 강조 효과
    setTimeout(() => {
      const inboxElement = document.querySelector('[data-section-id="' + mainTab.inboxSection!.id + '"]');
      if (inboxElement) {
        inboxElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // 3초간 황색 강조
        inboxElement.classList.add('ring-2', 'ring-yellow-400', 'ring-opacity-50');
        setTimeout(() => {
          inboxElement.classList.remove('ring-2', 'ring-yellow-400', 'ring-opacity-50');
        }, 3000);
      }
    }, 300);
  }, [sharedTextForInbox, loading, safeData, updateData]);

  // 북마크 탭 뷰 상태 - 로컬에서만 관리 (Firestore 리스너와 완전히 독립적)
  const [isBookmarkView, setIsBookmarkView] = useState(false);

  const [dragState, setDragState] = useState<DragState>({
    draggedItemId: null,
    dragOverItemId: null,
    sourceSectionId: null,
    draggedSectionId: null,
    dragOverSectionId: null
  });

  // 태블릿 세로 모드 감지 (모바일 UI로 표시)
  const [isMobileLayout, setIsMobileLayout] = useState(() => {
    const query = window.matchMedia('(max-width: 1024px) and (orientation: portrait)');
    return query.matches;
  });

  useEffect(() => {
    const query = window.matchMedia('(max-width: 1024px) and (orientation: portrait)');
    const handler = (e: MediaQueryListEvent) => setIsMobileLayout(e.matches);
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }, []);

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

  const [memoEditor, setMemoEditor] = useState<{
    id: string | null;
    value: string;
    type?: 'section' | 'checklist' | 'shopping';
    isEditing: boolean;
  }>({ id: null, value: '', type: 'section', isEditing: false });
  const memoTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [navigationMapOpen, setNavigationMapOpen] = useState(false);
  const [sectionMapOpen, setSectionMapOpen] = useState(false);
  const [tagSelectionModalOpen, setTagSelectionModalOpen] = useState(false);
  const [lastSectionPos, setLastSectionPos] = useState<{ tabId: string; sectionId: string } | null>(null);
  const [lastSectionBeforeInbox, setLastSectionBeforeInbox] = useState<{ tabId: string; sectionId: string } | null>(null);
  const [highlightedSectionId, setHighlightedSectionId] = useState<string | null>(null);

  // 메모 편집 모드 진입 시 커서를 끝으로 이동
  useEffect(() => {
    if (memoEditor.isEditing && memoTextareaRef.current) {
      const len = memoEditor.value.length;
      memoTextareaRef.current.focus();
      memoTextareaRef.current.setSelectionRange(len, len);
    }
  }, [memoEditor.isEditing]);

  // Google Calendar 관련
  const googleCalendar = useGoogleCalendar();
  const [calendarModal, setCalendarModal] = useState<{
    isOpen: boolean;
    itemText: string;
  }>({ isOpen: false, itemText: '' });

  const activeTab = useMemo(() => {
    const found = safeData.tabs.find(t => t.id === safeData.activeTabId);
    return found || safeData.tabs[0];
  }, [safeData.tabs, safeData.activeTabId]);

  const currentTabIndex = useMemo(() => {
    return safeData.tabs.findIndex(t => t.id === safeData.activeTabId);
  }, [safeData.tabs, safeData.activeTabId]);



  const handleAddTab = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const quotesSectionId = Math.random().toString(36).substr(2, 9);
    const newTab: Tab = {
      id: newId,
      name: `새 페이지 ${safeData.tabs.length + 1}`,
      sections: [],
      memos: {},

      parkingInfo: { text: '', checklistItems: [], shoppingListItems: [], checklistMemos: {}, shoppingListMemos: {} },
      quotesSection: {
        id: quotesSectionId,
        title: '명언',
        items: [],
        color: 'slate',
        isLocked: false
      },

      isLocked: false
    };

    updateData({
      ...safeData,
      tabs: [...safeData.tabs, newTab],
      activeTabId: newId
    });
  };

  const handleRenameTab = (id: string, newName: string) => {
    updateData({
      ...safeData,
      tabs: safeData.tabs.map(t => t.id === id ? { ...t, name: newName } : t)
    });
  };

  const handleToggleLockTab = (id: string) => {
    updateData({
      ...safeData,
      tabs: safeData.tabs.map(t => t.id === id ? { ...t, isLocked: !t.isLocked } : t)
    });
  };

  const handleReorderTabs = (fromIndex: number, toIndex: number) => {
    const newTabs = [...safeData.tabs];
    const [movedTab] = newTabs.splice(fromIndex, 1);
    newTabs.splice(toIndex, 0, movedTab);
    updateData({
      ...safeData,
      tabs: newTabs
    });
  };

  const handleOpenMoveItemModal = (itemId: string, sectionId: string) => {
    // IN-BOX 섹션 또는 일반 섹션에서 아이템 찾기
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

    // 같은 위치로 이동 방지
    if (sourceTabId === targetTabId && sourceSectionId === targetSectionId) {
      setMoveItemModal(prev => ({ ...prev, isOpen: false }));
      return;
    }

    // 원본 탭 찾기
    const sourceTab = safeData.tabs.find(t => t.id === sourceTabId);
    if (!sourceTab) return;

    // 원본 섹션 찾기 (일반 섹션 또는 IN-BOX)
    let sourceSection = sourceTab.sections.find(s => s.id === sourceSectionId);
    if (!sourceSection && sourceTab.inboxSection?.id === sourceSectionId) {
      sourceSection = sourceTab.inboxSection;
    }

    const itemToMove = sourceSection?.items.find(i => i.id === itemId);
    if (!itemToMove || !sourceSection) return;

    // 대상 탭 찾기
    const targetTab = safeData.tabs.find(t => t.id === targetTabId);
    if (!targetTab) return;

    // 대상 섹션 찾기 (일반 섹션 또는 IN-BOX)
    let targetSection = targetTab.sections.find(s => s.id === targetSectionId);
    if (!targetSection && targetTab.inboxSection?.id === targetSectionId) {
      targetSection = targetTab.inboxSection;
    }

    if (!targetSection) return;

    // 섹션 잠금과 관계없이 항목 이동 허용

    // 메모 데이터 처리
    const sourceMemo = sourceTab.memos[itemId];

    updateData({
      ...safeData,
      tabs: safeData.tabs.map(tab => {
        // 같은 탭 내 이동
        if (sourceTabId === targetTabId && tab.id === sourceTabId) {
          let updatedSections = tab.sections;
          let updatedInboxSection = tab.inboxSection;

          // 원본이 일반 섹션, 대상이 일반 섹션
          if (sourceSection.id !== tab.inboxSection?.id && targetSection.id !== tab.inboxSection?.id) {
            updatedSections = tab.sections.map(section => {
              if (section.id === sourceSectionId) {
                return { ...section, items: section.items.filter(i => i.id !== itemId) };
              } else if (section.id === targetSectionId) {
                return { ...section, items: [...section.items, itemToMove] };
              }
              return section;
            });
          }
          // 원본이 일반 섹션, 대상이 IN-BOX
          else if (sourceSection.id !== tab.inboxSection?.id && targetSection.id === tab.inboxSection?.id) {
            updatedSections = tab.sections.map(section =>
              section.id === sourceSectionId
                ? { ...section, items: section.items.filter(i => i.id !== itemId) }
                : section
            );
            updatedInboxSection = { ...tab.inboxSection!, items: [...tab.inboxSection!.items, itemToMove] };
          }
          // 원본이 IN-BOX, 대상이 일반 섹션
          else if (sourceSection.id === tab.inboxSection?.id && targetSection.id !== tab.inboxSection?.id) {
            updatedSections = tab.sections.map(section =>
              section.id === targetSectionId
                ? { ...section, items: [...section.items, itemToMove] }
                : section
            );
            updatedInboxSection = { ...tab.inboxSection!, items: tab.inboxSection!.items.filter(i => i.id !== itemId) };
          }
          // 원본이 IN-BOX, 대상도 IN-BOX (재정렬만)
          else if (sourceSection.id === tab.inboxSection?.id && targetSection.id === tab.inboxSection?.id) {
            updatedInboxSection = tab.inboxSection; // 같은 섹션에서는 처리 없음
          }

          return { ...tab, sections: updatedSections, inboxSection: updatedInboxSection };
        }
        // 다른 탭으로 이동 - 원본 탭
        else if (sourceTabId !== targetTabId && tab.id === sourceTabId) {
          let updatedSections = tab.sections;
          let updatedInboxSection = tab.inboxSection;

          if (sourceSection.id !== tab.inboxSection?.id) {
            // 원본이 일반 섹션
            updatedSections = tab.sections.map(section =>
              section.id === sourceSectionId
                ? { ...section, items: section.items.filter(i => i.id !== itemId) }
                : section
            );
          } else {
            // 원본이 IN-BOX
            updatedInboxSection = { ...tab.inboxSection!, items: tab.inboxSection!.items.filter(i => i.id !== itemId) };
          }

          // 메모 제거
          const { [itemId]: removed, ...restMemos } = tab.memos;
          return { ...tab, sections: updatedSections, inboxSection: updatedInboxSection, memos: restMemos };
        }
        // 다른 탭으로 이동 - 대상 탭
        else if (sourceTabId !== targetTabId && tab.id === targetTabId) {
          let updatedSections = tab.sections;
          let updatedInboxSection = tab.inboxSection;

          if (targetSection.id !== tab.inboxSection?.id) {
            // 대상이 일반 섹션
            updatedSections = tab.sections.map(section =>
              section.id === targetSectionId
                ? { ...section, items: [...section.items, itemToMove] }
                : section
            );
          } else {
            // 대상이 IN-BOX
            updatedInboxSection = { ...tab.inboxSection!, items: [...tab.inboxSection!.items, itemToMove] };
          }

          // 메모 복사
          const updatedMemos = sourceMemo
            ? { ...tab.memos, [itemId]: sourceMemo }
            : tab.memos;

          return { ...tab, sections: updatedSections, inboxSection: updatedInboxSection, memos: updatedMemos };
        }

        return tab;
      })
    });

    // 모달 닫기
    setMoveItemModal({
      isOpen: false,
      itemId: null,
      itemText: '',
      sourceTabId: '',
      sourceSectionId: ''
    });
  };

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

      // 인증 만료 또는 권한 부족 에러 체크
      if (error.message?.includes('인증이 만료') || error.message?.includes('권한이 부족')) {
        setCalendarModal({ isOpen: false, itemText: '' });
        alert(`${error.message}\n\n확인을 누르면 다시 로그인합니다.`);
        // 자동 재로그인
        googleCalendar.login();
      } else {
        alert(`캘린더 추가 실패: ${error.message || '알 수 없는 오류'}`);
      }
    }
  };

  const handleDeleteTab = (id: string) => {
    const tabToDelete = safeData.tabs.find(t => t.id === id);
    if (!tabToDelete || tabToDelete.isLocked || safeData.tabs.length <= 1) return;

    setModal({
      isOpen: true,
      title: '페이지 삭제',
      message: `'${tabToDelete.name}' 페이지의 모든 데이터가 영구적으로 삭제됩니다. 계속하시겠습니까?`,
      onConfirm: () => {
        const newTabs = safeData.tabs.filter(t => t.id !== id);
        const newActiveTabId = safeData.activeTabId === id ? newTabs[0].id : safeData.activeTabId;
        updateData({
          ...safeData,
          tabs: newTabs,
          activeTabId: newActiveTabId
        });
        setModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleSelectTab = (id: string) => {
    setIsBookmarkView(false); // 일반 탭 클릭 시 항상 북마크 뷰 해제
    updateData({ ...safeData, activeTabId: id });
  };

  const handleSwipeLeft = () => {
    const nextIndex = currentTabIndex + 1;
    if (nextIndex < safeData.tabs.length) {
      handleSelectTab(safeData.tabs[nextIndex].id);
    }
  };

  const handleSwipeRight = () => {
    const prevIndex = currentTabIndex - 1;
    if (prevIndex >= 0) {
      handleSelectTab(safeData.tabs[prevIndex].id);
    }
  };

  const mainRef = useSwipeGesture({
    onSwipeLeft: memoEditor.id || modal.isOpen ? undefined : handleSwipeLeft,
    onSwipeRight: memoEditor.id || modal.isOpen ? undefined : handleSwipeRight,
    minSwipeDistance: 50,
    minSwipeVelocity: 0.3,
    maxVerticalMovement: 80
  });

  const handleParkingChange = (newInfo: ParkingInfo) => {
    updateData({
      ...safeData,
      tabs: safeData.tabs.map(t => t.id === safeData.activeTabId ? { ...t, parkingInfo: newInfo } : t)
    });
  };



  const handleAddSection = () => {
    const newSection: Section = {
      id: Math.random().toString(36).substr(2, 9),
      title: '새 섹션',
      items: [],
      color: 'slate',
      isLocked: false
    };

    updateData({
      ...safeData,
      tabs: safeData.tabs.map(t => t.id === safeData.activeTabId
        ? { ...t, sections: [...t.sections, newSection] }
        : t
      )
    });
  };

  const handleUpdateSection = (updated: Section, newMemos?: { [key: string]: string }) => {
    updateData({
      ...safeData,
      tabs: safeData.tabs.map(t => t.id === safeData.activeTabId
        ? {
          ...t,
          sections: t.sections.map(s => s.id === updated.id ? updated : s),
          memos: newMemos ? { ...t.memos, ...newMemos } : t.memos
        }
        : t
      )
    });
  };

  const handleUpdateInboxSection = (updated: Section, newMemos?: { [key: string]: string }) => {
    updateData({
      ...safeData,
      tabs: safeData.tabs.map(t => t.id === safeData.activeTabId
        ? {
          ...t,
          inboxSection: updated,
          memos: newMemos ? { ...t.memos, ...newMemos } : t.memos
        }
        : t
      )
    });
  };

  const handleUpdateQuotesSection = (updated: Section, newMemos?: { [key: string]: string }) => {
    updateData({
      ...safeData,
      tabs: safeData.tabs.map(t => t.id === safeData.activeTabId
        ? {
          ...t,
          quotesSection: updated,
          memos: newMemos ? { ...t.memos, ...newMemos } : t.memos
        }
        : t
      )
    });
  };



  const handleDeleteSection = (id: string) => {
    const sectionToDelete = activeTab?.sections.find(s => s.id === id);

    // 잠긴 섹션은 삭제 불가
    if (sectionToDelete?.isLocked) {
      return;
    }

    setModal({
      isOpen: true,
      title: '섹션 삭제',
      message: '해당 섹션을 삭제하시겠습니까?',
      onConfirm: () => {
        updateData({
          ...safeData,
          tabs: safeData.tabs.map(t => t.id === safeData.activeTabId
            ? { ...t, sections: t.sections.filter(s => s.id !== id) }
            : t
          )
        });
        setModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const onSectionDragStart = (sectionId: string) => {
    setDragState(prev => ({ ...prev, draggedSectionId: sectionId }));
  };

  const onSectionDragOver = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    if (dragState.draggedSectionId && dragState.draggedSectionId !== sectionId) {
      setDragState(prev => ({ ...prev, dragOverSectionId: sectionId }));
    }
  };

  const onSectionDrop = (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();
    const { draggedSectionId } = dragState;
    if (!draggedSectionId || draggedSectionId === targetSectionId) return;

    updateData({
      ...safeData,
      tabs: safeData.tabs.map(t => {
        if (t.id !== safeData.activeTabId) return t;
        const newSections = [...t.sections];
        const draggedIdx = newSections.findIndex(s => s.id === draggedSectionId);
        const targetIdx = newSections.findIndex(s => s.id === targetSectionId);
        if (draggedIdx !== -1 && targetIdx !== -1) {
          const [draggedSection] = newSections.splice(draggedIdx, 1);
          newSections.splice(targetIdx, 0, draggedSection);
        }
        return { ...t, sections: newSections };
      })
    });
  };

  const onSectionDragEnd = () => {
    setDragState(prev => ({ ...prev, draggedSectionId: null, dragOverSectionId: null }));
  };

  // 섹션 간 아이템 이동 (Trello style)
  const handleCrossSectionItemDrop = (
    draggedItemId: string,
    sourceSectionId: string,
    targetSectionId: string,
    targetItemId?: string | null
  ) => {
    if (sourceSectionId === targetSectionId) return;

    // 모든 섹션 목록 (IN-BOX, 명언, 일반 섹션 모두 포함)
    const getAllSections = (tab: typeof activeTab) => {
      const all: Section[] = [];
      if (tab.inboxSection) all.push(tab.inboxSection);
      if (tab.quotesSection) all.push(tab.quotesSection);
      all.push(...tab.sections);
      return all;
    };

    updateData({
      ...safeData,
      tabs: safeData.tabs.map(t => {
        if (t.id !== safeData.activeTabId) return t;

        const allSections = getAllSections(t);
        const sourceSection = allSections.find(s => s.id === sourceSectionId);
        const targetSection = allSections.find(s => s.id === targetSectionId);
        if (!sourceSection || !targetSection) return t;

        // 이동할 아이템 추출
        const draggedItem = sourceSection.items.find(i => i.id === draggedItemId);
        if (!draggedItem) return t;

        const newSourceItems = sourceSection.items.filter(i => i.id !== draggedItemId);
        let newTargetItems = [...targetSection.items];

        if (targetItemId) {
          const targetIdx = newTargetItems.findIndex(i => i.id === targetItemId);
          if (targetIdx !== -1) {
            newTargetItems.splice(targetIdx, 0, draggedItem);
          } else {
            newTargetItems.unshift(draggedItem);
          }
        } else {
          newTargetItems.unshift(draggedItem);
        }

        // 각 섹션 종류에 따라 업데이트
        const updateSection = (sec: Section) => {
          if (sec.id === sourceSectionId) return { ...sec, items: newSourceItems };
          if (sec.id === targetSectionId) return { ...sec, items: newTargetItems };
          return sec;
        };

        return {
          ...t,
          inboxSection: t.inboxSection ? updateSection(t.inboxSection) : t.inboxSection,
          quotesSection: updateSection(t.quotesSection),
          sections: t.sections.map(updateSection),
        };
      })
    });
  };

  const handleClearAll = () => {
    if (!activeTab.sections.some(s => s.items.some(i => i.completed))) return;
    updateData({
      ...safeData,
      tabs: safeData.tabs.map(t => t.id === safeData.activeTabId
        ? { ...t, sections: t.sections.map(s => ({ ...s, items: s.items.map(i => ({ ...i, completed: false })) })) }
        : t
      )
    });
  };

  const handleShowMemo = (id: string, type?: 'checklist' | 'shopping') => {
    let memoValue = '';

    if (type === 'checklist') {
      memoValue = activeTab.parkingInfo.checklistMemos?.[id] || '';
    } else if (type === 'shopping') {
      memoValue = activeTab.parkingInfo.shoppingListMemos?.[id] || '';
    } else {
      memoValue = activeTab.memos[id] || '';
    }

    // 체크리스트/쇼핑리스트는 항상 읽기 모드로 시작, 일반 메모는 없으면 편집 모드로 시작
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
      // 첫 줄 추출 및 제목으로 사용 (SectionCard와 동일한 로직)
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
                // 체크리스트 아이템 텍스트 업데이트
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
                // 쇼핑리스트 아이템 텍스트 업데이트
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
        // 일반 섹션 아이템 (IN-BOX, 명언, 일반 섹션들 모두 포함)
        updateData({
          ...safeData,
          tabs: safeData.tabs.map(t => t.id === safeData.activeTabId
            ? {
              ...t,
              // 모든 섹션 순회하며 아이템 텍스트 업데이트
              sections: t.sections.map(s => ({
                ...s,
                items: s.items.map(i => i.id === memoEditor.id ? { ...i, text: displayTitle || i.text } : i)
              })),
              // IN-BOX 업데이트
              inboxSection: t.inboxSection ? {
                ...t.inboxSection,
                items: t.inboxSection.items.map(i => i.id === memoEditor.id ? { ...i, text: displayTitle || i.text } : i)
              } : t.inboxSection,
              // 명언 업데이트
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
    // 저장 후 읽기 모드로 전환
    if (memoEditor.value.trim()) {
      setMemoEditor({ ...memoEditor, isEditing: false });
    } else {
      // 빈 메모면 모달 닫기
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
              // 주차 위젯 챙길것
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
              // 주차 위젯 구매예정
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
              // 일반 섹션 또는 IN-BOX/명언
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
    // 커서 위치를 삽입된 기호 뒤로 이동
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

  const handleNavigateFromMap = (tabId: string, sectionId?: string) => {
    // 1. 탭 전환 (다른 탭인 경우)
    if (tabId !== safeData.activeTabId) {
      handleSelectTab(tabId);
    }

    // 2. 섹션으로 스크롤 (sectionId가 있는 경우)
    if (sectionId) {
      setTimeout(() => {
        const el = document.querySelector(`[data-section-id="${sectionId}"]`);
        if (el) {
          el.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          });
        }
      }, 100);

      // 섹션 강조 효과
      setHighlightedSectionId(sectionId);
      setTimeout(() => {
        setHighlightedSectionId(null);
      }, 3000); // 3초 후 강조 제거
    }

    // 3. 모달 닫기
    setNavigationMapOpen(false);
  };

  const handleNavigateToInbox = () => {
    const mainTab = safeData.tabs[0];
    if (!mainTab?.inboxSection) return;

    const mainTabId = mainTab.id;
    const inboxSectionId = mainTab.inboxSection.id;

    // 메인탭으로 전환
    if (mainTabId !== safeData.activeTabId) {
      handleSelectTab(mainTabId);
    }

    // IN-BOX 섹션으로 스크롤
    setTimeout(() => {
      const el = document.querySelector(`[data-section-id="${inboxSectionId}"]`);
      if (el) {
        el.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 100);

    // 섹션 강조 효과 (3초)
    setHighlightedSectionId(inboxSectionId);
    setTimeout(() => {
      setHighlightedSectionId(null);
    }, 3000);
  };

  const handleGoToInbox = (tabId: string, sectionId: string) => {
    setLastSectionBeforeInbox({ tabId, sectionId });
    handleNavigateToInbox();
  };

  const handleReturnFromInbox = () => {
    if (lastSectionBeforeInbox) {
      handleNavigateFromMap(lastSectionBeforeInbox.tabId, lastSectionBeforeInbox.sectionId);
      setLastSectionBeforeInbox(null);
    }
  };

  const handleOpenSectionMap = () => {
    setSectionMapOpen(true);
  };

  const handleNavigateFromSectionMap = (sectionId: string) => {
    // 현재 탭과 현재 위치를 '복귀'용으로 저장
    setLastSectionPos({ tabId: safeData.activeTabId, sectionId: highlightedSectionId || activeTab.sections[0]?.id || '' });

    // 이동 실행
    handleNavigateFromMap(safeData.activeTabId, sectionId);
    setSectionMapOpen(false);
  };

  const handleNavigateFromTag = (sectionId: string, tabId: string) => {
    handleNavigateFromMap(tabId, sectionId);
    setTagSelectionModalOpen(false);
  };

  const handleReturnToLastSection = () => {
    if (lastSectionPos) {
      handleNavigateFromMap(lastSectionPos.tabId, lastSectionPos.sectionId);
      setLastSectionPos(null);
    }
  };

  const hasAnyCompletedItems = activeTab.sections.some(s => s.items.some(i => i.completed));
  const isMainTab = activeTab.id === (safeData.tabs[0]?.id || '');

  const handleToggleBookmarkView = () => {
    setIsBookmarkView(prev => !prev);
  };

  // 북마크 섹션 업데이트 핸들러
  const handleUpdateBookmarkSection = (updated: Section, newMemos?: { [key: string]: string }) => {
    const newSections = (safeData.bookmarkSections || []).map(s => s.id === updated.id ? updated : s);
    updateData({ ...safeData, bookmarkSections: newSections });
  };

  // 북마크 섹션 간 아이템 이동
  const handleCrossBookmarkSectionDrop = (
    draggedItemId: string,
    sourceSectionId: string,
    targetSectionId: string,
    targetItemId?: string | null
  ) => {
    if (sourceSectionId === targetSectionId) return;
    const bSections = safeData.bookmarkSections || [];
    const sourceSection = bSections.find(s => s.id === sourceSectionId);
    const targetSection = bSections.find(s => s.id === targetSectionId);
    if (!sourceSection || !targetSection) return;
    const draggedItem = sourceSection.items.find(i => i.id === draggedItemId);
    if (!draggedItem) return;
    const newSourceItems = sourceSection.items.filter(i => i.id !== draggedItemId);
    let newTargetItems = [...targetSection.items];
    if (targetItemId) {
      const idx = newTargetItems.findIndex(i => i.id === targetItemId);
      if (idx !== -1) newTargetItems.splice(idx, 0, draggedItem);
      else newTargetItems.unshift(draggedItem);
    } else {
      newTargetItems.unshift(draggedItem);
    }
    const newSections = bSections.map(s => {
      if (s.id === sourceSectionId) return { ...s, items: newSourceItems };
      if (s.id === targetSectionId) return { ...s, items: newTargetItems };
      return s;
    });
    updateData({ ...safeData, bookmarkSections: newSections });
  };

  // 로딩 상태 처리
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태 처리
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">데이터 로드 실패</h2>
          <p className="text-sm text-slate-600 mb-4">{error.message}</p>
          <p className="text-xs text-slate-500 mb-6">인터넷 연결을 확인하고 페이지를 새로고침해주세요.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC] overflow-hidden text-slate-900">
      {/* 오프라인 배너 */}
      {!isOnline && (
        <div className="flex-none bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>오프라인 상태 - 네트워크 연결을 확인하세요</span>
          </div>
        </div>
      )}



      <div className="flex-1 flex flex-row overflow-hidden">
        {/* 중앙 컨텐츠 컬럼 */}


        {/* 중앙 컨텐츠 컬럼 */}
        <div ref={mainRef} className="flex-1 flex flex-col overflow-hidden">
          {/* 2. 대시보드 헤더 (틀고정 영역) */}
          <div className="flex-none bg-[#F8FAFC]">
            <Header
              onAddSection={handleAddSection}
              onOpenNavigationMap={() => setNavigationMapOpen(true)}
              onNavigateToInbox={handleNavigateToInbox}
            />
          </div>

          {/* 3. 스크롤 가능한 메인 그리드 영역 */}
          <main className="flex-1 overflow-y-auto custom-scrollbar px-0 md:px-6 pb-20">

            {/* ── 북마크 탭 뷰 ── */}
            {isBookmarkView ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 pt-2" style={{ gridAutoRows: 'auto' }}>
                {(safeData.bookmarkSections || []).map((section) => (
                  <div key={section.id} className="h-[480px] lg:h-[calc(100vh-160px)]">
                    <SectionCard
                      section={section}
                      itemMemos={{}}
                      onUpdateSection={handleUpdateBookmarkSection}
                      onDeleteSection={() => { }} // 북마크 섹션은 삭제 불가
                      onShowItemMemo={(id) => { }}
                      onMoveItem={() => { }}
                      onAddToCalendar={handleAddToCalendarClick}
                      dragState={dragState}
                      setDragState={setDragState}
                      onSectionDragStart={() => { }} // 북마크 섹션은 위치 고정
                      onSectionDragOver={() => { }}
                      onSectionDrop={() => { }}
                      onSectionDragEnd={() => { }}
                      isHighlighted={false}
                      isInboxSection={true}
                      isBookmarkTab={true}
                      tabColorBg={'bg-[#FEF3C7]'}
                      onCrossSectionDrop={handleCrossBookmarkSectionDrop}
                      onItemDoubleClick={() => setTagSelectionModalOpen(true)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              /* ── 일반 탭 뷰 ── */
              <div className={`grid gap-3 h-full ${isMobileLayout
                ? 'grid-cols-1'
                : 'grid-cols-1 md:grid-cols-2 md:gap-6 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
                }`} style={{ gridAutoRows: 'auto' }}>
                {isMainTab && (
                  <>
                    {/* 주차 섹션 */}
                    <div className="h-[600px] md:h-auto md:row-span-2">
                      <ParkingWidget
                        info={activeTab.parkingInfo}
                        onChange={handleParkingChange}
                        onShowChecklistMemo={(id) => handleShowMemo(id, 'checklist')}
                        onShowShoppingMemo={(id) => handleShowMemo(id, 'shopping')}
                        onAddToCalendar={handleAddToCalendarClick}
                      />
                    </div>

                    {/* IN-BOX 섹션 */}
                    <div className="h-[600px] md:h-auto md:row-span-2 xl:col-span-2">
                      <SectionCard
                        section={activeTab.inboxSection}
                        itemMemos={activeTab.memos}
                        onUpdateSection={handleUpdateInboxSection}
                        onDeleteSection={() => { }} // IN-BOX는 삭제 불가
                        onShowItemMemo={handleShowMemo}
                        onMoveItem={(itemId) => handleOpenMoveItemModal(itemId, activeTab.inboxSection.id)}
                        onAddToCalendar={handleAddToCalendarClick}
                        dragState={dragState}
                        setDragState={setDragState}
                        onSectionDragStart={() => { }} // IN-BOX는 드래그 불가
                        onSectionDragOver={() => { }}
                        onSectionDrop={() => { }}
                        onSectionDragEnd={() => { }}
                        isHighlighted={activeTab.inboxSection.id === highlightedSectionId}
                        isInboxSection={true}
                        tabColorBg={getTabColor(0).bgLight}
                        initialQuickAddValue={sharedTextForInbox}
                        onQuickAddValuePopulated={handleClearSharedText}
                        onCrossSectionDrop={handleCrossSectionItemDrop}
                        onReturnFromInbox={handleReturnFromInbox}
                        isReturnVisible={!!lastSectionBeforeInbox}
                        onItemDoubleClick={() => setTagSelectionModalOpen(true)}
                      />
                    </div>

                    {/* 명언 섹션 */}
                    <div className="h-[600px] md:h-auto md:row-span-2">
                      <SectionCard
                        section={activeTab.quotesSection}
                        itemMemos={activeTab.memos}
                        onUpdateSection={handleUpdateQuotesSection}
                        onDeleteSection={() => { }} // 명언은 삭제 불가
                        onShowItemMemo={handleShowMemo}
                        onMoveItem={(itemId) => handleOpenMoveItemModal(itemId, activeTab.quotesSection.id)}
                        onAddToCalendar={handleAddToCalendarClick}
                        dragState={dragState}
                        setDragState={setDragState}
                        onSectionDragStart={() => { }} // 명언은 드래그 불가
                        onSectionDragOver={() => { }}
                        onSectionDrop={() => { }}
                        onSectionDragEnd={() => { }}
                        isHighlighted={activeTab.quotesSection.id === highlightedSectionId}
                        isInboxSection={true}
                        tabColorBg={getTabColor(0).bgLight}
                        onCrossSectionDrop={handleCrossSectionItemDrop}
                        onGoToInbox={() => handleGoToInbox(activeTab.id, activeTab.quotesSection.id)}
                        onItemDoubleClick={() => setTagSelectionModalOpen(true)}
                      />
                    </div>


                  </>
                )}

                {activeTab.sections.map(section => (
                  <div key={section.id} className={isMainTab ? '' : 'h-screen md:h-full md:row-span-2'}>
                    <SectionCard
                      section={section}
                      itemMemos={activeTab.memos}
                      onUpdateSection={handleUpdateSection}
                      onDeleteSection={handleDeleteSection}
                      onShowItemMemo={handleShowMemo}
                      onMoveItem={(itemId) => handleOpenMoveItemModal(itemId, section.id)}
                      onAddToCalendar={handleAddToCalendarClick}
                      dragState={dragState}
                      setDragState={setDragState}
                      onSectionDragStart={() => onSectionDragStart(section.id)}
                      onSectionDragOver={(e) => onSectionDragOver(e, section.id)}
                      onSectionDrop={(e) => onSectionDrop(e, section.id)}
                      onSectionDragEnd={onSectionDragEnd}
                      isHighlighted={section.id === highlightedSectionId}
                      isFullHeight={!isMainTab}
                      tabColorText={getTabColor(currentTabIndex).text}
                      tabColorBg={getTabColor(currentTabIndex).bgLight}
                      onCrossSectionDrop={handleCrossSectionItemDrop}
                      onGoToInbox={() => handleGoToInbox(activeTab.id, section.id)}
                      onItemDoubleClick={() => setTagSelectionModalOpen(true)}
                    />
                  </div>
                ))}

                {activeTab.sections.length === 0 && (!isMainTab || activeTab.sections.length === 0) && (
                  <div className="col-span-full text-center py-16 text-slate-400">
                    <p className="text-sm italic">
                      {isMainTab && activeTab.sections.length === 0 ? '추가된 섹션이 없습니다. "+항목" 버튼을 눌러 섹션을 추가하세요.' :
                        activeTab.sections.length === 0 ? '이 페이지는 비어있습니다. 새로운 섹션을 추가해 보세요.' : ''}
                    </p>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>


      </div>

      {/* 5. 하단 고정: 탭바 */}
      <div className="flex-none">
        <FooterTabs
          tabs={data.tabs}
          activeTabId={data.activeTabId}
          onSelectTab={handleSelectTab}
          onAddTab={handleAddTab}
          onRenameTab={handleRenameTab}
          onDeleteTab={handleDeleteTab}
          onToggleLockTab={handleToggleLockTab}
          onReorderTabs={handleReorderTabs}
          onNavigateToInbox={handleNavigateToInbox}
          hasInbox={!!safeData.tabs[0]?.inboxSection}
          isBookmarkView={isBookmarkView}
          onToggleBookmarkView={handleToggleBookmarkView}
        />
      </div>

      {/* 중앙 메모용 모달 */}
      {memoEditor.id && (
        <div
          onClick={() => setMemoEditor({ id: null, value: '', type: 'section', isEditing: false })}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-2xl md:max-w-[800px] h-[90vh] shadow-2xl border-[1.5px] md:border-2 border-black flex flex-col"
          >
            {/* 읽기 모드 */}
            {!memoEditor.isEditing && (
              <>
                <div
                  onDoubleClick={() => setMemoEditor({ ...memoEditor, isEditing: true })}
                  className="flex-1 w-full overflow-y-auto custom-scrollbar bg-slate-50 text-slate-700 text-base whitespace-pre-wrap break-words p-4 cursor-text hover:bg-slate-100 transition-colors"
                >
                  {memoEditor.value ? (
                    <div className="prose prose-sm max-w-none select-text">
                      <LinkifiedText text={memoEditor.value} />
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">메모가 없습니다.</p>
                  )}
                </div>
                <div className="border-t border-slate-300 px-4 py-3 flex justify-end gap-3 flex-wrap">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(memoEditor.value);
                    }}
                    className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white font-medium border-2 border-black transition-colors"
                  >
                    📋 복사
                  </button>
                  <button
                    onClick={() => setMemoEditor({ ...memoEditor, id: null })}
                    className="px-4 py-2 border-2 border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                  >
                    닫기
                  </button>
                  <button
                    onClick={() => setMemoEditor({ ...memoEditor, isEditing: true })}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium border-2 border-black transition-colors"
                  >
                    ✏️ 수정
                  </button>
                  <button
                    onClick={handleDeleteItemFromModal}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium border-2 border-black transition-colors"
                  >
                    🗑️ 삭제
                  </button>
                </div>
              </>
            )}

            {/* 편집 모드 */}
            {memoEditor.isEditing && (
              <>
                <textarea
                  ref={memoTextareaRef}
                  autoFocus
                  value={memoEditor.value}
                  onChange={(e) => setMemoEditor({ ...memoEditor, value: e.target.value })}
                  onBlur={(e) => {
                    // 툴바 버튼 클릭 시엔 blur 무시
                    if (e.relatedTarget && (e.relatedTarget as HTMLElement).closest('.memo-symbol-toolbar')) return;
                    handleSaveMemo();
                  }}
                  className="flex-1 w-full overflow-y-auto custom-scrollbar focus:outline-none text-slate-700 text-base resize-none p-4"
                  placeholder="여기에 메모를 작성하세요..."
                />
                {/* 기호 삽입 툴바 - 하단으로 이동 */}
                <div className="memo-symbol-toolbar flex-none flex items-center gap-1 px-2 py-1.5 bg-slate-100 border-t border-slate-200 overflow-x-auto">
                  {memoSymbols.map((sym, idx) => (
                    <button
                      key={sym.label}
                      title={sym.title}
                      onMouseDown={(e) => {
                        e.preventDefault(); // textarea 포커스 유지
                        handleInsertSymbol(sym.value);
                      }}
                      className={`flex-none flex items-center justify-center rounded hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-medium transition-colors select-none ${idx < 3 ? 'w-10 h-10 text-2xl' : 'w-8 h-8 text-base'}`}
                    >
                      {sym.label}
                    </button>
                  ))}
                  <div className="w-px h-5 bg-slate-300 mx-1 flex-none" />
                  <button
                    title="들여쓰기"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleInsertSymbol('  ');
                    }}
                    className="flex-none px-2 h-8 flex items-center justify-center rounded hover:bg-slate-200 active:bg-slate-300 text-slate-500 text-xs font-medium transition-colors select-none"
                  >
                    Tab
                  </button>
                </div>
                <div className="px-4 py-3 flex justify-end gap-3 pb-6">
                  <button
                    onClick={() => {
                      // 메모가 원래 있었으면 읽기 모드로 돌아가기, 없었으면 닫기
                      let originalMemo = '';
                      if (memoEditor.type === 'checklist') {
                        originalMemo = activeTab.parkingInfo.checklistMemos?.[memoEditor.id!] || '';
                      } else if (memoEditor.type === 'shopping') {
                        originalMemo = activeTab.parkingInfo.shoppingListMemos?.[memoEditor.id!] || '';
                      } else {
                        originalMemo = activeTab.memos?.[memoEditor.id!] || '';
                      }

                      if (originalMemo) {
                        setMemoEditor({ ...memoEditor, value: originalMemo, isEditing: false });
                      } else {
                        setMemoEditor({ id: null, value: '', type: 'section', isEditing: false });
                      }
                    }}
                    className="px-4 py-2 border-2 border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveMemo}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium border-2 border-black transition-colors"
                  >
                    💾 저장
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(memoEditor.value);
                    }}
                    className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white font-medium border-2 border-black transition-colors"
                  >
                    📋 복사
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <MoveItemModal
        isOpen={moveItemModal.isOpen}
        itemText={moveItemModal.itemText}
        currentTabId={moveItemModal.sourceTabId}
        currentSectionId={moveItemModal.sourceSectionId}
        tabs={safeData.tabs}
        onMove={handleMoveItem}
        onCancel={() => setMoveItemModal(prev => ({ ...prev, isOpen: false }))}
      />

      <ConfirmModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
      />

      <NavigationMapModal
        isOpen={navigationMapOpen}
        tabs={safeData.tabs}
        activeTabId={safeData.activeTabId}
        onClose={() => setNavigationMapOpen(false)}
        onNavigate={handleNavigateFromMap}
      />

      <SectionMapModal
        isOpen={sectionMapOpen}
        activeTab={activeTab}
        tabs={safeData.tabs}
        onClose={() => setSectionMapOpen(false)}
        onNavigate={handleNavigateFromSectionMap}
      />

      {/* 태그(섹션) 선택 모달 */}
      {tagSelectionModalOpen && (
        <TagSelectionModal
          isOpen={tagSelectionModalOpen}
          tabs={safeData.tabs}
          onClose={() => setTagSelectionModalOpen(false)}
          onNavigate={handleNavigateFromTag}
        />
      )}

      {/* 모바일 플로팅 버튼 (FAB) */}
      {isMobileLayout && (
        <div className="fixed bottom-24 right-6 z-[200] flex flex-col gap-3">
          {lastSectionPos && (
            <button
              onClick={handleReturnToLastSection}
              className="w-14 h-14 bg-white border-2 border-slate-800 text-slate-800 rounded-full shadow-xl flex items-center justify-center text-2xl active:scale-95 transition-all animate-in fade-in slide-in-from-left-4"
              title="이전 섹션으로 되돌아가기"
            >
              ↩️
            </button>
          )}
          <button
            onClick={handleOpenSectionMap}
            className="w-14 h-14 bg-yellow-400 border-2 border-black text-black rounded-full shadow-xl flex items-center justify-center text-2xl active:scale-95 transition-all"
            title="섹션 이동 맵 열기"
          >
            📋
          </button>
        </div>
      )}

      <AddToCalendarModal
        isOpen={calendarModal.isOpen}
        itemText={calendarModal.itemText}
        onClose={() => setCalendarModal({ isOpen: false, itemText: '' })}
        onConfirm={handleConfirmCalendar}
      />
    </div>
  );
};

export default App;
