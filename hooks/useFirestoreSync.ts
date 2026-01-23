import { useState, useEffect, useCallback, useRef } from 'react';
import { AppData } from '../types';
import { subscribeToWorkspace, saveWorkspaceData, fetchWorkspaceData } from '../firebase/firestore';

interface UseFirestoreSyncReturn {
  data: AppData | null;
  loading: boolean;
  error: Error | null;
  updateData: (newData: AppData) => Promise<void>;
}

export function useFirestoreSync(defaultData: AppData): UseFirestoreSyncReturn {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 로컬 업데이트 방지 플래그 (무한 루프 방지)
  const isRemoteUpdate = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 초기 데이터 로드
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    async function initialize() {
      try {
        // 1. 초기 데이터 가져오기
        const firestoreData = await fetchWorkspaceData();

        if (firestoreData && firestoreData.tabs.length > 0) {
          // Firestore에 데이터가 있으면 사용
          setData(firestoreData);
        } else {
          // Firestore가 비어있으면 기본값으로 초기화
          await saveWorkspaceData(defaultData);
          setData(defaultData);
        }

        // 2. 실시간 동기화 시작
        unsubscribe = subscribeToWorkspace(
          (updatedData) => {
            isRemoteUpdate.current = true;
            setData(updatedData);
            // 다음 렌더 후 플래그 리셋
            setTimeout(() => {
              isRemoteUpdate.current = false;
            }, 0);
          },
          (err) => {
            setError(err);
          }
        );

        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    }

    initialize();

    return () => {
      if (unsubscribe) unsubscribe();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []); // 빈 배열: 마운트 시 1회만 실행

  // 데이터 업데이트 함수 (디바운스 적용)
  const updateData = useCallback(async (newData: AppData) => {
    // 원격 업데이트면 저장 스킵
    if (isRemoteUpdate.current) {
      return;
    }

    // 로컬 상태 즉시 업데이트
    setData(newData);

    // 디바운스: 300ms 후에 Firestore 저장
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveWorkspaceData(newData);
      } catch (err) {
        setError(err as Error);
        console.error('Failed to save to Firestore:', err);
      }
    }, 300);
  }, []);

  return { data, loading, error, updateData };
}
