
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
  remindersItems: ListItem[]; // 지금 흥미있는것
  todoItems: ListItem[];      // 잊지말고 할일
  checklistMemos: { [key: string]: string };
  shoppingListMemos: { [key: string]: string };
  remindersMemos: { [key: string]: string }; // 지금 흥미있는것 메모
  todoMemos: { [key: string]: string };      // 잊지말고 할일 메모
}

export interface Bookmark {
  id: string;
  label: string;
  url: string;
  color: string;
}



export interface TodoManagementInfo {
  category1Title: string;
  category2Title: string;
  category3Title: string;
  category4Title: string;
  category1Items: ListItem[];
  category2Items: ListItem[];
  category3Items: ListItem[];
  category4Items: ListItem[];
  category1Memos: { [key: string]: string };
  category2Memos: { [key: string]: string };
  category3Memos: { [key: string]: string };
  category4Memos: { [key: string]: string };
}

export interface Tab {
  id: string;
  name: string;
  sections: Section[];
  memos: {
    [key: string]: string;
  };

  parkingInfo: ParkingInfo;
  todoManagementInfo: TodoManagementInfo; // 추가: 할일 관리 섹션
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
  type: 'section' | 'checklist' | 'shopping' | 'reminders' | 'todo' | 'memoBoard' | 'todoCat1' | 'todoCat2' | 'todoCat3' | 'todoCat4';
  isEditing: boolean;
  openedFromMap?: boolean;
  sectionId?: string | null;
}
