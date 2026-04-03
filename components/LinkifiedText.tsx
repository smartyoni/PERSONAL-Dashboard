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
          
          // Header & Bullet & Bold handling
          const h1Match = line.match(/^#\s+(.*)/);
          const h2Match = line.match(/^##\s+(.*)/);
          const h3Match = line.match(/^###\s+(.*)/);
          const isLargeBullet = line.startsWith('●');
          const isNormalBullet = line.startsWith('•');
          
          let displayLine = line;
          let headerLevel = 0;

          if (h1Match) {
              displayLine = h1Match[1];
              headerLevel = 1;
          } else if (h2Match) {
              displayLine = h2Match[1];
              headerLevel = 2;
          } else if (h3Match) {
              displayLine = h3Match[1];
              headerLevel = 3;
          } else if (isLargeBullet || isNormalBullet) {
              displayLine = line.replace(/^[●•]\s+/, (match) => {
                  return match.includes('  ') ? '  ' : '';
              });
          }

          // Linkify the filtered line instead
          const filteredLinkified = linkifyText(displayLine);

          // Highlight logic
          let finalLineContent: React.ReactNode = filteredLinkified;
          if (highlightText && displayLine.includes(highlightText)) {
            finalLineContent = filteredLinkified.map((node, nIdx) => {
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
          
          let lineClassName = `min-h-[1.25em] whitespace-pre-wrap `;
          if (headerLevel === 1) {
              lineClassName += "text-2xl font-black text-slate-900 mt-6 mb-3 border-b-2 border-slate-100 pb-1 font-serif";
          } else if (headerLevel === 2) {
              lineClassName += "text-xl font-bold text-slate-800 mt-5 mb-2 font-serif";
          } else if (headerLevel === 3) {
              lineClassName += "text-lg font-bold text-slate-700 mt-4 mb-1 font-serif";
          } else if (isLargeBullet) {
              lineClassName += "font-bold text-slate-900";
          } else {
              lineClassName += "text-slate-700";
          }

          return (
            <div 
                key={lIdx} 
                id={`memo-line-${lIdx}`}
                className={lineClassName}
            >
              {finalLineContent}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LinkifiedText;
