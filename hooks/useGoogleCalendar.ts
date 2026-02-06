import { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

const SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar';

export const useGoogleCalendar = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // 저장된 토큰이 있는지 확인
  useEffect(() => {
    const savedToken = localStorage.getItem('google_access_token');
    if (savedToken) {
      setAccessToken(savedToken);
      setIsAuthorized(true);
    }
  }, []);

  // 로그인 함수
  const login = useGoogleLogin({
    scope: SCOPES,
    onSuccess: (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
      setIsAuthorized(true);
      localStorage.setItem('google_access_token', tokenResponse.access_token);
    },
    onError: () => {
      console.error('Google 로그인 실패');
    },
  });

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
      throw new Error(
        `캘린더 이벤트 생성 실패: ${error.error?.message || '알 수 없는 오류'}`
      );
    }

    return await response.json();
  };

  return {
    isAuthorized,
    login,
    createCalendarEvent,
  };
};
