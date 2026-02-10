/**
 * 밀리의 서재 공유 텍스트에서 원문(인용구)만 추출
 *
 * 밀리의 서재 형식 예시:
 * "원문 내용 - <책 제목>, 저자 지음 / 역자 옮김 - 밀리의서재\nhttps://millie.page.link/..."
 *
 * @param text - 공유된 원본 텍스트
 * @returns 파싱된 텍스트 (밀리 형식이면 원문만, 아니면 원본 그대로 반환)
 */
export const parseMillieText = (text: string): string => {
  // 빈 텍스트 체크
  if (!text || text.trim() === '') {
    return text;
  }

  // 밀리의 서재 형식 감지
  // 조건: "밀리의서재" 또는 "millie.page.link" 포함
  const isMillieText =
    text.includes('밀리의서재') ||
    text.includes('밀리의 서재') ||
    text.includes('millie.page.link');

  // 밀리 형식이 아니면 원본 반환
  if (!isMillieText) {
    return text;
  }

  // 첫 번째 " - " (공백-하이픈-공백) 위치 찾기
  const firstDashIndex = text.indexOf(' - ');

  // " - " 패턴이 없으면 원본 반환
  if (firstDashIndex === -1) {
    return text;
  }

  // 첫 번째 " - " 이전의 원문만 추출하고 앞뒤 공백 제거
  const originalQuote = text.substring(0, firstDashIndex).trim();

  return originalQuote;
};
