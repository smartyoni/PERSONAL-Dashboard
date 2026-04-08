import React from 'react';

// URL 정규식: http://, https://, www.로 시작하는 URL
const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;

// 한국 휴대폰 번호 정규식: 010-xxxx-xxxx, 010 xxxx xxxx, 01xxxxxxxx
const PHONE_REGEX = /010[-\s]?\d{4}[-\s]?\d{4}/g;

// 구분선 정규식
const DIVIDER_REGEX = /---divider---/g;

// Bold/Italic 정규식
const BOLD_REGEX = /\*\*(.*?)\*\*/g;
const ITALIC_REGEX = /((?<!\*)\*(?!\*)|(?<!_)_(?!_))(.*?)\1/g;

interface Match {
  type: 'url' | 'phone' | 'divider' | 'bold' | 'italic';
  content: string;
  innerContent?: string;
  index: number;
  length: number;
}

/**
 * 텍스트에서 URL과 휴대폰 번호를 찾아 링크로 변환
 * @param text 변환할 텍스트
 * @returns React.ReactNode 배열 (텍스트와 링크의 혼합)
 */
export const linkifyText = (text: string): React.ReactNode[] => {
  if (!text || typeof text !== 'string') return [text];

  const matches: Match[] = [];

  // URL 찾기
  let match;
  URL_REGEX.lastIndex = 0; // 정규식 리셋
  while ((match = URL_REGEX.exec(text)) !== null) {
    matches.push({
      type: 'url',
      content: match[0],
      index: match.index,
      length: match[0].length,
    });
  }

  // 휴대폰 번호 찾기
  PHONE_REGEX.lastIndex = 0; // 정규식 리셋
  while ((match = PHONE_REGEX.exec(text)) !== null) {
    // URL과 겹치지 않는지 확인
    const isOverlapping = matches.some(
      (m) =>
        match.index >= m.index && match.index < m.index + m.length ||
        (match.index + match[0].length > m.index &&
          match.index + match[0].length <= m.index + m.length)
    );

    if (!isOverlapping) {
      matches.push({
        type: 'phone',
        content: match[0],
        index: match.index,
        length: match[0].length,
      });
    }
  }

  // 구분선 찾기
  DIVIDER_REGEX.lastIndex = 0;
  while ((match = DIVIDER_REGEX.exec(text)) !== null) {
    matches.push({
      type: 'divider',
      content: match[0],
      index: match.index,
      length: match[0].length,
    });
  }

  // Bold 찾기
  BOLD_REGEX.lastIndex = 0;
  while ((match = BOLD_REGEX.exec(text)) !== null) {
    const isOverlapping = matches.some(
      (m) =>
        (match.index >= m.index && match.index < m.index + m.length) ||
        (match.index + match[0].length > m.index && match.index + match[0].length <= m.index + m.length)
    );
    if (!isOverlapping) {
      matches.push({
        type: 'bold',
        content: match[0],
        innerContent: match[1],
        index: match.index,
        length: match[0].length,
      });
    }
  }

  // Italic 찾기
  ITALIC_REGEX.lastIndex = 0;
  while ((match = ITALIC_REGEX.exec(text)) !== null) {
    const isOverlapping = matches.some(
      (m) =>
        (match.index >= m.index && match.index < m.index + m.length) ||
        (match.index + match[0].length > m.index && match.index + match[0].length <= m.index + m.length)
    );
    if (!isOverlapping) {
      matches.push({
        type: 'italic',
        content: match[0],
        innerContent: match[2],
        index: match.index,
        length: match[0].length,
      });
    }
  }

  // 인덱스 기준으로 정렬
  matches.sort((a, b) => a.index - b.index);

  // 텍스트 파싱
  const result: React.ReactNode[] = [];
  let currentIndex = 0;
  let keyIndex = 0;

  matches.forEach((m) => {
    // 매치 이전의 일반 텍스트
    if (m.index > currentIndex) {
      result.push(text.substring(currentIndex, m.index));
    }

    // 링크 생성
    if (m.type === 'url') {
      const url = m.content.startsWith('www.')
        ? `https://${m.content}`
        : m.content;
      result.push(
        <a
          key={`url-${keyIndex++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-blue-500 underline hover:text-blue-600 transition-colors"
        >
          {m.content}
        </a>
      );
    } else if (m.type === 'phone') {
      const cleanPhone = m.content.replace(/[-\s]/g, '');
      result.push(
        <a
          key={`phone-${keyIndex++}`}
          href={`sms:${cleanPhone}`}
          onClick={(e) => e.stopPropagation()}
          className="text-green-600 underline hover:text-green-700 transition-colors"
        >
          {m.content}
        </a>
      );
    } else if (m.type === 'divider') {
      result.push(
        <hr 
          key={`divider-${keyIndex++}`}
          className="border-t-2 border-blue-400 mx-auto my-3 border-solid" 
        />
      );
    } else if (m.type === 'bold') {
      result.push(
        <strong key={`bold-${keyIndex++}`} className="font-bold text-slate-900">
          {m.innerContent}
        </strong>
      );
    } else if (m.type === 'italic') {
      result.push(
        <em key={`italic-${keyIndex++}`} className="italic">
          {m.innerContent}
        </em>
      );
    }

    currentIndex = m.index + m.length;
  });

  // 남은 텍스트
  if (currentIndex < text.length) {
    result.push(text.substring(currentIndex));
  }

  return result.length > 0 ? result : [text];
};
