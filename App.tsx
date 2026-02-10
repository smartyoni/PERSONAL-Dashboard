
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Header from './components/Header';
import { Section, AppData, DragState, Tab, ParkingInfo, Bookmark, SideNote, ListItem } from './types';
import SectionCard from './components/SectionCard';
import ConfirmModal from './components/ConfirmModal';
import ParkingWidget from './components/ParkingWidget';
import FooterTabs, { getTabColor } from './components/FooterTabs';
import BookmarkBar from './components/BookmarkBar';
import MemoBoard from './components/MemoBoard';
import NavigationMapModal from './components/NavigationMapModal';
import MoveItemModal from './components/MoveItemModal';
import AddToCalendarModal from './components/AddToCalendarModal';
import { useFirestoreSync } from './hooks/useFirestoreSync';
import { useSwipeGesture } from './hooks/useSwipeGesture';
import { useGoogleCalendar } from './hooks/useGoogleCalendar';
import { parseMillieText } from './utils/parseMillieText';

const STORAGE_KEY = 'custom_workspace_v4_final_persistent';

const DEFAULT_BOOKMARKS: Bookmark[] = [
  { id: 'b1', label: '호실관리', url: '', color: 'bg-[#B89F1F]' },
  { id: 'b2', label: '호실수정', url: '', color: 'bg-[#B89F1F]' },
  { id: 'b3', label: '호실시트', url: '', color: 'bg-[#B89F1F]' },
  { id: 'b4', label: '북클립바', url: '', color: 'bg-[#B89F1F]' },
  { id: 'b5', label: '등기소', url: '', color: 'bg-[#0F5A9F]' },
  { id: 'b6', label: '정부24', url: '', color: 'bg-[#0F5A9F]' },
  { id: 'b7', label: '토지이음', url: '', color: 'bg-[#0F5A9F]' },
  { id: 'b8', label: '정보광장', url: '', color: 'bg-[#0F5A9F]' },
  { id: 'b9', label: '원부장님계약', url: '', color: 'bg-[#724C8F]' },
  { id: 'b10', label: '건강보험', url: '', color: 'bg-[#724C8F]' },
  { id: 'b11', label: '네이버메일', url: '', color: 'bg-[#724C8F]' },
  { id: 'b12', label: '공제가입(협회)', url: '', color: 'bg-[#724C8F]' },
  { id: 'b13', label: '깃허브', url: '', color: 'bg-[#369D47]' },
  { id: 'b14', label: 'AI스튜디오', url: '', color: 'bg-[#369D47]' },
  { id: 'b15', label: '구글시트', url: '', color: 'bg-[#369D47]' },
];

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
        sideNotes: [],
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
        isLocked: false,
        headerGoals: { goal1: '', goal2: '' }
      }],
      activeTabId: initialTabId,
      bookmarks: DEFAULT_BOOKMARKS
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
          headerGoals: tab.headerGoals || { goal1: '', goal2: '' }
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

  const [dragState, setDragState] = useState<DragState>({
    draggedItemId: null,
    dragOverItemId: null,
    sourceSectionId: null,
    draggedSectionId: null,
    dragOverSectionId: null
  });

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
    onConfirm: () => {}
  });

  const [memoEditor, setMemoEditor] = useState<{
    id: string | null;
    value: string;
    type?: 'section' | 'checklist' | 'shopping';
    isEditing: boolean;
  }>({ id: null, value: '', type: 'section', isEditing: false });

  const [navigationMapOpen, setNavigationMapOpen] = useState(false);
  const [highlightedSectionId, setHighlightedSectionId] = useState<string | null>(null);

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

  const handleUpdateBookmarks = (newBookmarks: Bookmark[]) => {
    updateData({ ...safeData, bookmarks: newBookmarks });
  };

  const handleAddTab = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const quotesSectionId = Math.random().toString(36).substr(2, 9);
    const newTab: Tab = {
      id: newId,
      name: `새 페이지 ${safeData.tabs.length + 1}`,
      sections: [],
      memos: {},
      sideNotes: [],
      parkingInfo: { text: '', checklistItems: [], shoppingListItems: [], checklistMemos: {}, shoppingListMemos: {} },
      quotesSection: {
        id: quotesSectionId,
        title: '명언',
        items: [],
        color: 'slate',
        isLocked: false
      },
      isLocked: false,
      headerGoals: { goal1: '', goal2: '' }
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

  const handleUpdateSideNotes = (newNotes: SideNote[]) => {
    updateData({
      ...safeData,
      tabs: safeData.tabs.map(t => t.id === safeData.activeTabId ? { ...t, sideNotes: newNotes } : t)
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

  const handleUpdateSection = (updated: Section) => {
    updateData({
      ...safeData,
      tabs: safeData.tabs.map(t => t.id === safeData.activeTabId
        ? { ...t, sections: t.sections.map(s => s.id === updated.id ? updated : s) }
        : t
      )
    });
  };

  const handleUpdateInboxSection = (updated: Section) => {
    updateData({
      ...safeData,
      tabs: safeData.tabs.map(t => t.id === safeData.activeTabId
        ? { ...t, inboxSection: updated }
        : t
      )
    });
  };

  const handleUpdateQuotesSection = (updated: Section) => {
    updateData({
      ...safeData,
      tabs: safeData.tabs.map(t => t.id === safeData.activeTabId
        ? { ...t, quotesSection: updated }
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

    // 메모가 없으면 편집 모드로 시작, 있으면 읽기 모드로 시작
    setMemoEditor({
      id,
      value: memoValue,
      type: type || 'section',
      isEditing: memoValue === ''
    });
  };

  const handleSaveMemo = () => {
    if (memoEditor.id) {
      if (memoEditor.type === 'checklist') {
        updateData({
          ...safeData,
          tabs: safeData.tabs.map(t => t.id === safeData.activeTabId
            ? {
                ...t,
                parkingInfo: {
                  ...t.parkingInfo,
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
            ? { ...t, memos: { ...t.memos, [memoEditor.id!]: memoEditor.value } }
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

  const hasAnyCompletedItems = activeTab.sections.some(s => s.items.some(i => i.completed));
  const isMainTab = activeTab.id === (safeData.tabs[0]?.id || '');

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

      {/* 1. 상단 완전 고정: 북마크바 */}
      <div className="flex-none hidden md:block">
        <BookmarkBar bookmarks={safeData.bookmarks} onUpdateBookmarks={handleUpdateBookmarks} />
      </div>
      
      <div className="flex-1 flex flex-row overflow-hidden">
        {/* 중앙 컨텐츠 컬럼 */}
        <div ref={mainRef} className="flex-1 flex flex-col overflow-hidden">
          {/* 2. 대시보드 헤더 (틀고정 영역) */}
          <div className="flex-none bg-[#F8FAFC]">
            <Header
              onClearAll={handleClearAll}
              onAddSection={handleAddSection}
              hasAnyCompletedItems={hasAnyCompletedItems}
              onOpenNavigationMap={() => setNavigationMapOpen(true)}
              headerGoals={activeTab.headerGoals}
              onHeaderGoalsChange={(newGoals) => {
                updateData({
                  ...safeData,
                  tabs: safeData.tabs.map(t =>
                    t.id === safeData.activeTabId
                      ? { ...t, headerGoals: newGoals }
                      : t
                  )
                });
              }}
            />
          </div>

          {/* 3. 스크롤 가능한 메인 그리드 영역 (주차위치 + 섹션 카드들) */}
          <main className="flex-1 overflow-y-auto custom-scrollbar px-0 md:px-6 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 h-full" style={{ gridAutoRows: 'auto' }}>
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
                  <div className="h-[600px] md:h-auto md:row-span-2">
                    <SectionCard
                      section={activeTab.inboxSection}
                      itemMemos={activeTab.memos}
                      onUpdateSection={handleUpdateInboxSection}
                      onDeleteSection={() => {}} // IN-BOX는 삭제 불가
                      onShowItemMemo={handleShowMemo}
                      onMoveItem={(itemId) => handleOpenMoveItemModal(itemId, activeTab.inboxSection.id)}
                      onAddToCalendar={handleAddToCalendarClick}
                      dragState={dragState}
                      setDragState={setDragState}
                      onSectionDragStart={() => {}} // IN-BOX는 드래그 불가
                      onSectionDragOver={() => {}}
                      onSectionDrop={() => {}}
                      onSectionDragEnd={() => {}}
                      isHighlighted={activeTab.inboxSection.id === highlightedSectionId}
                      isInboxSection={true}
                      tabColorBg={getTabColor(0).bgLight}
                      initialQuickAddValue={sharedTextForInbox}
                      onQuickAddValuePopulated={handleClearSharedText}
                    />
                  </div>

                  {/* 명언 섹션 */}
                  <div className="h-[600px] md:h-auto md:row-span-2">
                    <SectionCard
                      section={activeTab.quotesSection}
                      itemMemos={activeTab.memos}
                      onUpdateSection={handleUpdateQuotesSection}
                      onDeleteSection={() => {}} // 명언은 삭제 불가
                      onShowItemMemo={handleShowMemo}
                      onMoveItem={(itemId) => handleOpenMoveItemModal(itemId, activeTab.quotesSection.id)}
                      onAddToCalendar={handleAddToCalendarClick}
                      dragState={dragState}
                      setDragState={setDragState}
                      onSectionDragStart={() => {}} // 명언은 드래그 불가
                      onSectionDragOver={() => {}}
                      onSectionDrop={() => {}}
                      onSectionDragEnd={() => {}}
                      isHighlighted={activeTab.quotesSection.id === highlightedSectionId}
                      isInboxSection={true}
                      tabColorBg={getTabColor(0).bgLight}
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
          </main>
        </div>

        {/* 4. 우측 사이드바 고정: 메모보드 */}
        <aside className="flex-none hidden lg:block w-48 border-l border-slate-200 bg-white/40">
          <MemoBoard 
            notes={activeTab.sideNotes || []} 
            onChange={handleUpdateSideNotes} 
          />
        </aside>
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
            className="bg-white w-full max-w-2xl h-[80vh] rounded-2xl shadow-2xl border border-slate-200 p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">📝 메모</h3>
              <button
                onClick={() => setMemoEditor({ id: null, value: '', type: 'section', isEditing: false })}
                className="text-slate-400 hover:text-slate-600 p-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 읽기 모드 */}
            {!memoEditor.isEditing && (
              <>
                <div className="flex-1 w-full p-4 border border-slate-200 rounded-xl text-slate-700 text-base overflow-y-auto custom-scrollbar bg-slate-50 whitespace-pre-wrap break-words">
                  {memoEditor.value ? (
                    <div className="prose prose-sm max-w-none">
                      {memoEditor.value}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">메모가 없습니다.</p>
                  )}
                </div>
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    onClick={() => setMemoEditor({ ...memoEditor, id: null })}
                    className="px-4 py-2 rounded-lg border-2 border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                  >
                    닫기
                  </button>
                  <button
                    onClick={() => setMemoEditor({ ...memoEditor, isEditing: true })}
                    className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium border-2 border-black transition-colors"
                  >
                    ✏️ 수정
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(memoEditor.value);
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-500 hover:bg-slate-600 text-white font-medium border-2 border-black transition-colors"
                  >
                    📋 복사
                  </button>
                </div>
              </>
            )}

            {/* 편집 모드 */}
            {memoEditor.isEditing && (
              <>
                <textarea
                  autoFocus
                  value={memoEditor.value}
                  onChange={(e) => setMemoEditor({ ...memoEditor, value: e.target.value })}
                  className="flex-1 w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 text-slate-700 text-base resize-none custom-scrollbar"
                  placeholder="여기에 메모를 작성하세요..."
                />
                <div className="mt-4 flex justify-end gap-3">
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
                    className="px-4 py-2 rounded-lg border-2 border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveMemo}
                    className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium border-2 border-black transition-colors"
                  >
                    💾 저장
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(memoEditor.value);
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-500 hover:bg-slate-600 text-white font-medium border-2 border-black transition-colors"
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
