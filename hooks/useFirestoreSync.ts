import { useState, useEffect, useCallback, useRef } from 'react';
import { AppData } from '../types';
import { subscribeToWorkspace, saveWorkspaceData, fetchWorkspaceData } from '../firebase/firestore';

interface UseFirestoreSyncReturn {
  data: AppData | null;
  loading: boolean;
  error: Error | null;
  updateData: (newDataOrUpdater: AppData | ((prev: AppData) => AppData)) => Promise<void>;
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

  // 데이터 업데이트 함수 (디바운스 적용)
  const updateData = useCallback(async (newDataOrUpdater: AppData | ((prev: AppData) => AppData)) => {
    if (isRemoteUpdate.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // 로컬 상태 즉시 업데이트 (함수형 업데이트 지원)
    setData(prev => {
        const currentData = prev || defaultData;
        const resolvedData = typeof newDataOrUpdater === 'function' 
            ? newDataOrUpdater(currentData) 
            : newDataOrUpdater;
        
        isSaving.current = true; // 저장 프로세스 시작됨을 표시

        saveTimeoutRef.current = setTimeout(async () => {
            try {
                await saveWorkspaceData(resolvedData);
                setTimeout(() => {
                    isSaving.current = false;
                }, 500);
            } catch (err) {
                setError(err as Error);
                isSaving.current = false;
                console.error('Failed to save to Firestore:', err);
            }
        }, 300);

        return resolvedData;
    });
  }, [defaultData]);

  return { data, loading, error, updateData };
}
