
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
}

export interface ParkingInfo {
  text: string;
  image: string | null;
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
  isLocked?: boolean;
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
