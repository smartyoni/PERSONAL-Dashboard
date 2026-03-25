import React from 'react';
import { linkifyText } from '../utils/linkify';
import { splitMetadata } from '../utils/memoEditorUtils';

interface LinkifiedTextProps {
  text: string;
  className?: string;
  highlightText?: string | null;
}

/**
 * URL과 휴대폰 번호를 자동으로 링크로 변환하여 렌더링하며,
 * 특정 텍스트(highlightText)가 주어지면 해당 부분을 강조 표시함.
 * 메타데이터를 파싱하여 특정 행에 스타일(볼드, 폰트 확대)을 적용함.
 */
const LinkifiedText: React.FC<LinkifiedTextProps> = ({ text: rawText, className = '', highlightText }) => {
  if (!rawText) return null;

  const { text, tocLines } = splitMetadata(rawText);

  // HTML 감지 (태그가 포함되어 있거나 <br> 등이 있는 경우)
  const isHtml = /<[a-z][\s\S]*>/i.test(text);

  const parts = text.split('---divider---');
  
  return (
    <div className={className}>
      {parts.map((part, index) => {
        if (isHtml) {
          // HTML인 경우 dangerouslySetInnerHTML 사용
          let htmlContent = part;
          if (highlightText) {
            const regex = new RegExp(`(${highlightText})`, 'gi');
            htmlContent = part.replace(regex, '<mark class="bg-yellow-100 text-slate-900 px-0.5 rounded shadow-sm ring-1 ring-yellow-300 font-bold animate-pulse">$1</mark>');
          }

          return (
            <React.Fragment key={index}>
              <div dangerouslySetInnerHTML={{ __html: htmlContent }} className="prose prose-sm max-w-none" />
              {index < parts.length - 1 && (
                <hr className="w-[80%] border-t-2 border-blue-400 mx-auto my-3 border-solid pointer-events-none" />
              )}
            </React.Fragment>
          );
        }

        // Legacy/Plain text handling with Metadata-based Styling
        const lines = part.split('\n');
        return (
          <React.Fragment key={index}>
            <div className="text-slate-700">
              {lines.map((line, lIdx) => {
                const isStyled = tocLines.includes(lIdx);
                
                // Linkify the line
                const linkified = linkifyText(line);
                
                // Highlight logic
                let finalLineContent: React.ReactNode = linkified;
                if (highlightText && line.includes(highlightText)) {
                  finalLineContent = linkified.map((node, nIdx) => {
                    if (typeof node === 'string' && node.includes(highlightText)) {
                      const nodeParts = node.split(highlightText);
                      return (
                        <React.Fragment key={nIdx}>
                          {nodeParts.map((np, npIdx) => (
                            <React.Fragment key={npIdx}>
                              {np}
                              {npIdx < nodeParts.length - 1 && (
                                <mark className="bg-yellow-100 text-slate-900 px-0.5 rounded shadow-sm ring-1 ring-yellow-300 font-bold animate-pulse">
                                  {highlightText}
                                </mark>
                              )}
                            </React.Fragment>
                          ))}
                        </React.Fragment>
                      );
                    }
                    return node;
                  });
                }

                if (isStyled) {
                  return (
                    <div key={lIdx} style={{ fontSize: '1.1em', fontWeight: 700, color: '#0f172a', lineHeight: '1.4', margin: '2px 0 1px 0' }}>
                      {finalLineContent}
                    </div>
                  );
                }
                
                return (
                  <div key={lIdx} className="min-h-[1.25em]">
                    {finalLineContent}
                  </div>
                );
              })}
            </div>
            {index < parts.length - 1 && (
              <hr className="w-[80%] border-t-2 border-blue-400 mx-auto my-3 border-solid pointer-events-none" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default LinkifiedText;
