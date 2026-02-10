import { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

const SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar';
const TOKEN_VERSION = '1'; // Increment when scopes change
const TOKEN_STORAGE_KEY = 'google_access_token';
const TOKEN_VERSION_KEY = 'google_token_version';
const TOKEN_EXPIRY_KEY = 'google_token_expires_at';
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5분 버퍼

// 토큰 유효성 검증
const isTokenValid = (): boolean => {
  const expiresAt = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiresAt) return false;
  const expiryTime = parseInt(expiresAt);
  return Date.now() < (expiryTime - TOKEN_EXPIRY_BUFFER);
};

// 인증 데이터 제거
const clearAuthData = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(TOKEN_VERSION_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

export const useGoogleCalendar = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // 저장된 토큰이 있는지 확인 및 버전 + 만료 시간 체크
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const savedVersion = localStorage.getItem(TOKEN_VERSION_KEY);

    // 토큰이 있고 버전이 일치하며 만료되지 않은 경우만 사용
    if (savedToken && savedVersion === TOKEN_VERSION && isTokenValid()) {
      setAccessToken(savedToken);
      setIsAuthorized(true);
    } else {
      // 만료되었거나 버전이 맞지 않는 토큰 제거
      clearAuthData();
    }
  }, []);

  // 로그인 함수
  const login = useGoogleLogin({
    scope: SCOPES,
    onSuccess: (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
      setIsAuthorized(true);
      localStorage.setItem(TOKEN_STORAGE_KEY, tokenResponse.access_token);
      localStorage.setItem(TOKEN_VERSION_KEY, TOKEN_VERSION);

      // 만료 시간 계산 및 저장
      const expiresIn = tokenResponse.expires_in || 3600;
      const expiresAt = Date.now() + (expiresIn * 1000);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString());
    },
    onError: () => {
      console.error('Google 로그인 실패');
    },
  });

  // 로그아웃 함수
  const logout = () => {
    clearAuthData();
    setAccessToken(null);
    setIsAuthorized(false);
  };

  // 캘린더 이벤트 생성 함수
  const createCalendarEvent = async (event: {
    summary: string;
    description?: string;
    start: string;
    end: string;
    isAllDay?: boolean;
  }) => {
    if (!accessToken) {
      throw new Error('Google 인증이 필요합니다');
    }

    // 토큰 만료 체크
    if (!isTokenValid()) {
      clearAuthData();
      setAccessToken(null);
      setIsAuthorized(false);
      throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
    }

    const eventBody: any = {
      summary: event.summary,
      description: event.description || '',
    };

    if (event.isAllDay) {
      // 종일 이벤트: date 형식 사용
      eventBody.start = { date: event.start };
      eventBody.end = { date: event.end };
    } else {
      // 시간 지정 이벤트: dateTime 형식 사용
      eventBody.start = {
        dateTime: event.start,
        timeZone: 'Asia/Seoul',
      };
      eventBody.end = {
        dateTime: event.end,
        timeZone: 'Asia/Seoul',
      };
    }

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      }
    );

    if (!response.ok) {
      const error = await response.json();

      // 401 에러 처리 (토큰 만료)
      if (response.status === 401) {
        clearAuthData();
        setAccessToken(null);
        setIsAuthorized(false);
        throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
      }

      // 권한 부족 오류 감지 - 토큰 제거 후 재인증 요청
      if (error.error?.message?.includes('insufficient authentication scopes')) {
        clearAuthData();
        setAccessToken(null);
        setIsAuthorized(false);
        throw new Error('권한이 부족합니다. 다시 로그인해주세요.');
      }

      throw new Error(
        `캘린더 이벤트 생성 실패: ${error.error?.message || '알 수 없는 오류'}`
      );
    }

    return await response.json();
  };

  return {
    isAuthorized,
    login,
    logout,
    createCalendarEvent,
  };
};
