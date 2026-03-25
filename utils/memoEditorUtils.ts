import { TITLE_SEPARATOR } from '../types';

/**
 * 에디터의 HTML 콘텐츠를 저장용 텍스트로 변환
 * (목차 마커 추출 로직 제거 - 순수 텍스트만 처리)
 */
export const htmlToContent = (html: string): string => {
  if (!html) return '';
  return html
    .replace(/<div[^>]*>/g, '\n')
    .replace(/<\/div>/g, '')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, '') // 나머지 태그 제거
    .trim();
};

/**
 * 저장된 텍스트를 에디터용 HTML로 변환
 */
export const contentToHtml = (content: string): string => {
  if (!content) return '';
  return content
    .split('\n')
    .map(line => `<div>${line || '<br>'}</div>`)
    .join('');
};

/**
 * 텍스트에서 HTML 태그를 모두 제거하고 순수 텍스트만 반환
 */
export const htmlToPlainText = (html: string): string => {
  if (!html) return '';
  // 1. Convert <br> and <div> etc to newlines
  let text = html
    .replace(/<br\s*\/?>/i, '\n')
    .replace(/<\/div>/i, '\n')
    .replace(/<div[^>]*>/i, '');
    
  // 2. Remove all other tags
  text = text.replace(/<[^>]+>/g, '');
  
  // 3. Decode entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
    
  return text;
};

/**
 * 메모 데이터를 제목 배열과 본문 배열로 파싱
 */
export const parseMemoPages = (rawData: string) => {
  if (!rawData) return { allTitles: [''], allValues: [''] };

  const pages = rawData.split('\n===page-break===\n');
  const allTitles: string[] = [];
  const allValues: string[] = [];

  pages.forEach(page => {
    // TITLE_SEPARATOR가 HTML 엔티티로 변환되었을 수도 있음 (&lt;!-- title-divider --&gt;)
    let separator = TITLE_SEPARATOR;
    let sepIdx = page.indexOf(separator);
    
    if (sepIdx === -1) {
      // Check for encoded version
      const encodedSep = TITLE_SEPARATOR.replace('<', '&lt;').replace('>', '&gt;');
      sepIdx = page.indexOf(encodedSep);
      if (sepIdx !== -1) separator = encodedSep;
    }

    if (sepIdx !== -1) {
      allTitles.push(page.substring(0, sepIdx));
      allValues.push(page.substring(sepIdx + separator.length));
    } else {
      allTitles.push('');
      allValues.push(page);
    }
  });

  return { allTitles, allValues };
};

/**
 * 메타데이터 분리 (하위 호환성을 위해 텍스트만 반환하는 형태로 유지)
 */
export const splitMetadata = (content: string): { text: string } => {
  if (!content) return { text: '' };
  const metadataMarker = '---toc-metadata---';
  const parts = content.split(metadataMarker);
  return { text: parts[0] };
};
