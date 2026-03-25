import React from 'react';
import { linkifyText } from '../utils/linkify';

interface LinkifiedTextProps {
  text: string;
  className?: string;
  highlightText?: string | null;
}

/**
 * URL과 휴대폰 번호를 자동으로 링크로 변환하여 렌더링하며,
 * 특정 텍스트(highlightText)가 주어지면 해당 부분을 강조 표시함
 */
const LinkifiedText: React.FC<LinkifiedTextProps> = ({ text, className = '', highlightText }) => {
  if (!text) return null;

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

          // 소항목(#, ※) 스타일링 및 줄간격 조정
          htmlContent = htmlContent.replace(/<(p|li|h[1-6])>\s*([#※][\s\S]*?)<\/\1>/g, (match, tag, content) => {
            // <br>이 포함된 멀티라인 블록인 경우 각 줄을 개별 체크
            if (content.includes('<br')) {
              const lines = content.split(/<br\s*\/?>/gi);
              const styledLines = lines.map(line => {
                const trimmed = line.trim();
                if (trimmed.startsWith('#') || trimmed.startsWith('※')) {
                  return `<span style="font-size: 1.1em; font-weight: 700; color: #0f172a; line-height: 1.4;">${line}</span>`;
                }
                return line;
              });
              return `<${tag}>${styledLines.join('<br>')}</${tag}>`;
            }
            
            // 단일 라인인 경우 전체 태그에 스타일 적용
            return `<${tag} style="font-size: 1.1em; font-weight: 700; color: #0f172a; margin-top: 2px; margin-bottom: 1px; line-height: 1.4;">${content}</${tag}>`;
          });
          
          return (
            <React.Fragment key={index}>
              <div dangerouslySetInnerHTML={{ __html: htmlContent }} className="prose prose-sm max-w-none" />
              {index < parts.length - 1 && (
                <hr className="w-[80%] border-t-2 border-blue-400 mx-auto my-3 border-solid pointer-events-none" />
              )}
            </React.Fragment>
          );
        }

        // Legacy plain text handling with Header support
        const lines = part.split('\n');
        return (
          <React.Fragment key={index}>
            <div className="text-slate-700">
              {lines.map((line, lIdx) => {
                const trimmed = line.trim();
                const isHeader = trimmed.startsWith('#') || trimmed.startsWith('※');
                
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

                if (isHeader) {
                  return (
                    <div key={lIdx} style={{ fontSize: '1.1em', fontWeight: 700, color: '#0f172a', lineHeight: '1.4', margin: '2px 0 1px 0' }}>
                      {/* Hide the marker character */}
                      {typeof finalLineContent === 'string' 
                        ? finalLineContent.replace(/^([#※])\s*/, '') 
                        : (Array.isArray(finalLineContent) && typeof finalLineContent[0] === 'string')
                          ? [finalLineContent[0].replace(/^([#※])\s*/, ''), ...finalLineContent.slice(1)]
                          : finalLineContent
                      }
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
