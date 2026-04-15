import { useState, useEffect, useCallback, useRef } from 'react';
import { AppData } from '../types';
import { subscribeToWorkspace, saveWorkspaceData, fetchWorkspaceData } from '../firebase/firestore';

export type SyncStatus = 'synced' | 'pending' | 'saving' | 'error';

interface UseFirestoreSyncReturn {
  data: AppData | null;
  loading: boolean;
  error: Error | null;
  syncStatus: SyncStatus;
  updateData: (newDataOrUpdater: AppData | ((prev: AppData) => AppData)) => void;
}

export function useFirestoreSync(defaultData: AppData): UseFirestoreSyncReturn {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');

  // 로컬 업데이트 및 저장 상태 관리
  const isRemoteUpdate = useRef(false);
  const isSavingInProgress = useRef(false);
  const pendingDataRef = useRef<AppData | null>(null);
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
            // 로컬에서 저장 중이면 스냅샷은 동기화하지 않음 (저장 후 어차피 스냅샷이 올 것이므로)
            if (isSavingInProgress.current || syncStatus === 'pending') return;

            isRemoteUpdate.current = true;
            setData(updatedData);

            setTimeout(() => {
              isRemoteUpdate.current = false;
            }, 0);
          },
          (err) => {
            console.error('Firestore subscription error:', err);
            setError(err as Error);
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
  }, []);

  // 실제 저장을 수행하는 내부 함수
  const performSave = async (dataToSave: AppData) => {
    if (isSavingInProgress.current) {
        pendingDataRef.current = dataToSave;
        return;
    }

    try {
        isSavingInProgress.current = true;
        setSyncStatus('saving');
        
        await saveWorkspaceData(dataToSave);
        
        setSyncStatus('synced');
        isSavingInProgress.current = false;

        // 저장하는 동안 들어온 최신 데이터가 있다면 연쇄적으로 저장
        if (pendingDataRef.current) {
            const nextData = pendingDataRef.current;
            pendingDataRef.current = null;
            // 1초 정도의 최소 간격을 두어 Firestore 속도 제한(1 write/sec) 준수
            setTimeout(() => performSave(nextData), 1000);
        }
    } catch (err: any) {
        console.error('Failed to save to Firestore:', err);
        setError(err);
        setSyncStatus('error');
        isSavingInProgress.current = false;
        
        // 재시도 로직 (필요 시)
        if (err.code === 'resource-exhausted') {
            console.warn('Resource exhausted. retrying in 5s...');
            setTimeout(() => performSave(dataToSave), 5000);
        }
    }
  };

  // 데이터 업데이트 함수: 로컬 상태만 즉시 업데이트
  const updateData = useCallback((newDataOrUpdater: AppData | ((prev: AppData) => AppData)) => {
    if (isRemoteUpdate.current) return;

    setData(prev => {
        const currentData = prev || defaultData;
        const resolvedData = typeof newDataOrUpdater === 'function' 
            ? newDataOrUpdater(currentData) 
            : newDataOrUpdater;
        
        // 데이터가 실제로 변경되었는지 확인하면 더 좋지만 일단 저장 대상으로 설정
        return resolvedData;
    });
    setSyncStatus('pending');
  }, [defaultData]);

  // 로컬 변경사항 감지 및 디바운스된 저장 처리
  useEffect(() => {
    if (!data || isRemoteUpdate.current || loading) return;

    // 저장 타이머 리셋
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
        performSave(data);
    }, 2000); // 디바운스 2초로 상향 조정

    return () => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [data, loading]);

  return { data, loading, error, syncStatus, updateData };
}
