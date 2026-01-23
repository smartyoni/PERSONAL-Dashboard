import { doc, setDoc, getDoc, onSnapshot, Unsubscribe, serverTimestamp } from 'firebase/firestore';
import { db, WORKSPACE_DOC_ID } from './config';
import { AppData } from '../types';

const COLLECTION_NAME = 'workspaces';

// Firestore에서 데이터 가져오기 (일회성)
export async function fetchWorkspaceData(): Promise<AppData | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, WORKSPACE_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        tabs: data.tabs || [],
        activeTabId: data.activeTabId || '',
        bookmarks: data.bookmarks || []
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching workspace data:', error);
    throw error;
  }
}

// Firestore에 데이터 저장
export async function saveWorkspaceData(data: AppData): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, WORKSPACE_DOC_ID);
    await setDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error saving workspace data:', error);
    throw error;
  }
}

// 실시간 동기화 리스너 등록
export function subscribeToWorkspace(
  onUpdate: (data: AppData) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const docRef = doc(db, COLLECTION_NAME, WORKSPACE_DOC_ID);

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onUpdate({
          tabs: data.tabs || [],
          activeTabId: data.activeTabId || '',
          bookmarks: data.bookmarks || []
        });
      }
    },
    (error) => {
      console.error('Firestore snapshot error:', error);
      onError(error as Error);
    }
  );
}
