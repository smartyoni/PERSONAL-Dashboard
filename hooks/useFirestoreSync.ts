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
  triggerSave: (customData?: AppData) => Promise<void>;
}

export function useFirestoreSync(defaultData: AppData): UseFirestoreSyncReturn {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');

  // 로컬 업데이트 및 저장 상태 관리
  const isRemoteUpdate = useRef(false);
  const isSavingInProgress = useRef(false);
  const lastSavedDataRef = useRef<string>(''); // 데이터 변경 감지용 (JSON string)
  const retryCount = useRef(0);

  // 초기 데이터 로드 및 실시간 동기화
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    async function initialize() {
      try {
        console.log('[Sync] Initializing Firestore...');
        const firestoreData = await fetchWorkspaceData();

        if (firestoreData && firestoreData.tabs.length > 0) {
          setData(firestoreData);
          lastSavedDataRef.current = JSON.stringify(firestoreData);
        } else {
          console.log('[Sync] No data found, saving default...');
          await saveWorkspaceData(defaultData);
          setData(defaultData);
          lastSavedDataRef.current = JSON.stringify(defaultData);
        }

        unsubscribe = subscribeToWorkspace(
          (updatedData) => {
            // 로컬에서 저장 중이면 스냅샷은 동기화하지 않음
            if (isSavingInProgress.current) return;

            const remoteString = JSON.stringify(updatedData);
            // 현재 로컬 데이터와 원격 데이터가 같으면 업데이트 무시 (불필요한 리렌더링 방지)
            if (remoteString === JSON.stringify(data)) return;

            console.log('[Sync] Remote update received');
            isRemoteUpdate.current = true;
            setData(updatedData);
            lastSavedDataRef.current = remoteString;
            setSyncStatus('synced');

            setTimeout(() => {
              isRemoteUpdate.current = false;
            }, 50);
          },
          (err) => {
            console.error('[Sync] Subscription error:', err);
            setError(err as Error);
          }
        );

        setLoading(false);
      } catch (err) {
        console.error('[Sync] Initialization failed:', err);
        setError(err as Error);
        setLoading(false);
      }
    }

    initialize();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // 실제 저장을 수행하는 내부 함수
  const performSave = async (dataToSave: AppData) => {
    if (isSavingInProgress.current) {
        console.log('[Sync] Save already in progress, skipping');
        return;
    }

    const currentString = JSON.stringify(dataToSave);
    if (currentString === lastSavedDataRef.current) {
        console.log('[Sync] No changes detected, save skipped');
        setSyncStatus('synced');
        return;
    }

    try {
        isSavingInProgress.current = true;
        setSyncStatus('saving');
        console.log('[Sync] Saving to Firestore...');
        
        const startTime = Date.now();
        
        // 15초 타임아웃 적용 (Promise.race)
        await Promise.race([
          saveWorkspaceData(dataToSave),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Save timeout')), 15000))
        ]);
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[Sync] Saved successfully in ${duration}s`);
        
        lastSavedDataRef.current = currentString;
        setSyncStatus('synced');
        isSavingInProgress.current = false;
        retryCount.current = 0;
    } catch (err: any) {
        console.error('[Sync] Save failed:', err);
        setError(err);
        setSyncStatus('error');
        isSavingInProgress.current = false;
        
        // Resource exhausted (too many writes) 발생 시 지수 백오프 재시도
        if (err.code === 'resource-exhausted' || err.message === 'Save timeout') {
            const delay = Math.min(Math.pow(2, retryCount.current) * 1000, 30000);
            retryCount.current += 1;
            console.warn(`[Sync] Retrying in ${delay/1000}s... (Attempt ${retryCount.current})`);
            setTimeout(() => performSave(dataToSave), delay);
        }
    }
  };

  // 수동 저장 트리거 함수
  const triggerSave = useCallback(async (customData?: AppData) => {
    const dataToSave = customData || data;
    if (!dataToSave) return;
    await performSave(dataToSave);
  }, [data]);

  // 데이터 업데이트 함수: 로컬 상태만 즉시 업데이트
  const updateData = useCallback((newDataOrUpdater: AppData | ((prev: AppData) => AppData)) => {
    if (isRemoteUpdate.current) return;

    setData(prev => {
        const currentData = prev || defaultData;
        const resolvedData = typeof newDataOrUpdater === 'function' 
            ? newDataOrUpdater(currentData) 
            : newDataOrUpdater;
        
        // 실제 변경이 있는지 확인
        if (JSON.stringify(resolvedData) !== lastSavedDataRef.current) {
            setSyncStatus('pending'); // 'pending' 은 "저장 필요" 상태를 의미
        } else {
            setSyncStatus('synced');
        }
        
        return resolvedData;
    });
  }, [defaultData]);

  return { data, loading, error, syncStatus, updateData, triggerSave };
}
