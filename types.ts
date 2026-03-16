
export interface ListItem {
  id: string;
  text: string;
  completed: boolean;
  url?: string; // 추가: 북마크 이동 주소
  isFavorite?: boolean; // 추가: 즐겨찾기 여부
}

export interface Section {
  id: string;
  title: string;
  items: ListItem[];
  color?: string;
  isLocked?: boolean;
}

export interface ParkingInfo {
  title?: string;
  text: string;
  checklistTitle?: string;
  checklistItems: ListItem[]; // 업무루틴
  shoppingTitle?: string;
  shoppingListItems: ListItem[];
  remindersTitle?: string;
  remindersItems: ListItem[]; // 챙겨야할 것
  todoTitle?: string;
  todoItems: ListItem[];      // 잊지말고 할일
  category5Title?: string;    // 추가: 5번째 카테고리
  category5Items: ListItem[]; // 추가
  checklistMemos: { [key: string]: string }; // 업무루틴 메모
  shoppingListMemos: { [key: string]: string };
  remindersMemos: { [key: string]: string }; // 챙겨야할 것 메모
  todoMemos: { [key: string]: string };      // 잊지말고 할일 메모
  category5Memos: { [key: string]: string }; // 추가
}

export interface Bookmark {
  id: string;
  label: string;
  url: string;
  color: string;
}



export interface TodoManagementInfo {
  title?: string;
  category1Title: string;
  category2Title: string;
  category3Title: string;
  category4Title: string;
  category5Title: string; // 추가
  category1Items: ListItem[];
  category2Items: ListItem[];
  category3Items: ListItem[];
  category4Items: ListItem[];
  category5Items: ListItem[]; // 추가
  category1Memos: { [key: string]: string };
  category2Memos: { [key: string]: string };
  category3Memos: { [key: string]: string };
  category4Memos: { [key: string]: string };
  category5Memos: { [key: string]: string }; // 추가
}

export interface Tab {
  id: string;
  name: string;
  sections: Section[];
  memos: {
    [key: string]: string;
  };

  parkingInfo: ParkingInfo; // 섹션 2: 주차
  todoManagementInfo: TodoManagementInfo; // 섹션 3: 할일 관리 1
  todoManagementInfo2: TodoManagementInfo; // 섹션 4: 할일 관리 2
  inboxSection?: Section;  // 섹션 1: IN-BOX (메인탭만)
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
  allValues: string[]; // 추가: 3페이지 저장용 (length 3)
  activePageIndex: number; // 추가: 현재 페이지 (0, 1, 2)
  type: 'section' | 'checklist' | 'shopping' | 'reminders' | 'todo' | 'memoBoard' | 'todoCat1' | 'todoCat2' | 'todoCat3' | 'todoCat4' | 'todoCat5' | 'todo2Cat1' | 'todo2Cat2' | 'todo2Cat3' | 'todo2Cat4' | 'todo2Cat5' | 'parkingCat5';
  isEditing: boolean;
  openedFromMap?: boolean;
  sectionId?: string | null;
  tabId?: string | null;
}
