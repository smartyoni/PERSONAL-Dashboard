
export interface ListItem {
  id: string;
  text: string;
  completed: boolean;
  url?: string; // 추가: 북마크 이동 주소
}

export interface Section {
  id: string;
  title: string;
  items: ListItem[];
  color?: string;
  isLocked?: boolean;
}

export interface ParkingInfo {
  text: string;
  checklistItems: ListItem[];
  shoppingListItems: ListItem[];
  checklistMemos: { [key: string]: string };
  shoppingListMemos: { [key: string]: string };
}

export interface Bookmark {
  id: string;
  label: string;
  url: string;
  color: string;
}



export interface Tab {
  id: string;
  name: string;
  sections: Section[];
  memos: {
    [key: string]: string;
  };

  parkingInfo: ParkingInfo;
  inboxSection?: Section;  // IN-BOX 기본 섹션 (메인탭만)
  quotesSection: Section;  // 명언 기본 섹션
  isLocked?: boolean;

}

export interface AppData {
  tabs: Tab[];
  activeTabId: string;
  bookmarks: Bookmark[];
  bookmarkSections?: Section[];      // 북마크 탭의 6개 고정 섹션
}

export interface DragState {
  draggedItemId: string | null;
  dragOverItemId: string | null;
  sourceSectionId: string | null;
  draggedSectionId: string | null;
  dragOverSectionId: string | null;
}

export interface MemoEditorState {
  id: string | null;
  value: string;
  type: 'section' | 'checklist' | 'shopping' | 'memoBoard';
  isEditing: boolean;
  openedFromMap?: boolean;
  sectionId?: string | null;
}
