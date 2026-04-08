import { useState, useEffect, useCallback, useRef } from 'react';
import { AppData } from '../types';
import { subscribeToWorkspace, saveWorkspaceData, fetchWorkspaceData } from '../firebase/firestore';

interface UseFirestoreSyncReturn {
  data: AppData | null;
  loading: boolean;
  error: Error | null;
  updateData: (newDataOrUpdater: AppData | ((prev: AppData) => AppData)) => void;
}

export function useFirestoreSync(defaultData: AppData): UseFirestoreSyncReturn {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 로컬 업데이트 및 저장 상태 관리
  const isRemoteUpdate = useRef(false);
  const isSaving = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 초기 데이터 로드 및 실시간 동기화
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    async function initialize() {
      try {
        const firestoreData = await fetchWorkspaceData();

        if (firestoreData && firestoreData.tabs.length > 0) {
          setData(firestoreData);
        } else {
          await saveWorkspaceData(defaultData);
          setData(defaultData);
        }

        unsubscribe = subscribeToWorkspace(
          (updatedData) => {
            // 로컬에서 저장 중이거나 리모트 업데이트 플래그가 켜져 있으면 스냅샷 무시
            if (isSaving.current) return;

            isRemoteUpdate.current = true;
            setData(updatedData);

            setTimeout(() => {
              isRemoteUpdate.current = false;
            }, 0);
          },
          (err) => setError(err)
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
  }, []);

  // 데이터 업데이트 함수: 로컬 상태만 즉시 업데이트
  const updateData = useCallback((newDataOrUpdater: AppData | ((prev: AppData) => AppData)) => {
    if (isRemoteUpdate.current) return;

    setData(prev => {
        const currentData = prev || defaultData;
        const resolvedData = typeof newDataOrUpdater === 'function' 
            ? newDataOrUpdater(currentData) 
            : newDataOrUpdater;
        return resolvedData;
    });
  }, [defaultData]);

  // 로컬 변경사항 감지 및 디바운스된 저장 처리
  useEffect(() => {
    if (!data || isRemoteUpdate.current || loading) return;

    // 저장 타이머 리셋
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
        try {
            isSaving.current = true;
            await saveWorkspaceData(data);
            
            // 저장 완료 후 잠시 대기 (Firestore 스냅샷이 올 때까지 대기하도록)
            setTimeout(() => {
                isSaving.current = false;
            }, 1000);
        } catch (err) {
            setError(err as Error);
            isSaving.current = false;
            console.error('Failed to save to Firestore:', err);
        }
    }, 500); // 500ms 디바운스

    return () => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [data, loading]);

  return { data, loading, error, updateData };
}
