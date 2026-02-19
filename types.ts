
export interface ListItem {
  id: string;
  text: string;
  completed: boolean;
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

export interface SideNote {
  title: string;
  content: string;
}

export interface Tab {
  id: string;
  name: string;
  sections: Section[];
  memos: {
    [key: string]: string;
  };
  sideNotes: SideNote[]; // 우측 사이드바 메모들을 위한 필드 (객체 배열로 변경)
  parkingInfo: ParkingInfo;
  inboxSection?: Section;  // IN-BOX 기본 섹션 (메인탭만)
  quotesSection: Section;  // 명언 기본 섹션
  goalsSection: Section;   // 현안 기본 섹션 (NEW)
  isLocked?: boolean;
  headerGoals?: {
    goal1: string;
    goal2: string;
  };
}

export interface AppData {
  tabs: Tab[];
  activeTabId: string;
  bookmarks: Bookmark[];
}

export interface DragState {
  draggedItemId: string | null;
  dragOverItemId: string | null;
  sourceSectionId: string | null;
  draggedSectionId: string | null;
  dragOverSectionId: string | null;
}
