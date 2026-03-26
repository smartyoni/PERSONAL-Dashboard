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
 * 메타데이터 기반 소항목 스타일링 기능을 제거하고 순수 텍스트/HTML만 처리함.
 */
const LinkifiedText: React.FC<LinkifiedTextProps> = ({ text: rawText, className = '', highlightText }) => {
  if (!rawText) return null;

  // 메타데이터가 아직 남아있을 수 있으므로 분리하되, 스타일링은 적용하지 않음
  const { text } = splitMetadata(rawText);

  // HTML 감지 (태그가 포함되어 있거나 <br> 등이 있는 경우)
  const isHtml = /<[a-z][\s\S]*>/i.test(text);

  if (isHtml) {
    let htmlContent = text;
    if (highlightText) {
      const regex = new RegExp(`(${highlightText})`, 'gi');
      htmlContent = text.replace(regex, '<mark class="bg-yellow-100 text-slate-900 px-0.5 rounded shadow-sm ring-1 ring-yellow-300 font-bold animate-pulse">$1</mark>');
    }

    return (
      <div className={className}>
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} className="prose prose-sm max-w-none text-slate-700" />
      </div>
    );
  }

  // Plain text handling
  const lines = text.split('\n');

  return (
    <div className={className}>
      <div className="text-slate-700">
        {lines.map((line, lIdx) => {
          const isDivider = line.trim() === '---divider---';
          
          if (isDivider) {
            return (
              <hr key={lIdx} className="w-[80%] border-t-2 border-blue-400 mx-auto my-3 border-solid pointer-events-none" />
            );
          }

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
          
          return (
            <div key={lIdx} className="min-h-[1.25em] whitespace-pre-wrap">
              {finalLineContent}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LinkifiedText;
