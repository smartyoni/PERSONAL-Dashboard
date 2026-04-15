import React from 'react';
import { linkifyText } from '../utils/linkify';
import { splitMetadata } from '../utils/memoEditorUtils';

interface LinkifiedTextProps {
  text: string;
  className?: string;
  highlightText?: string | null;
  textColorClass?: string;
}

/**
 * URL과 휴대폰 번호를 자동으로 링크로 변환하여 렌더링하며,
 * 특정 텍스트(highlightText)가 주어지면 해당 부분을 강조 표시함.
 * 메타데이터 기반 소항목 스타일링 기능을 제거하고 순수 텍스트/HTML만 처리함.
 */
const LinkifiedText: React.FC<LinkifiedTextProps> = ({ 
  text: rawText, 
  className = '', 
  highlightText,
  textColorClass = 'text-slate-700'
}) => {
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
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} className={`prose prose-sm max-w-none ${textColorClass}`} />
      </div>
    );
  }

  // Plain text handling
  const lines = text.split('\n');

  return (
    <div className={className}>
      <div className={textColorClass}>
        {lines.map((line, lIdx) => {
          const isDivider = /^(\s*)(---|---|___|\*\*\*|---divider---)\s*$/.test(line);
          
          if (isDivider) {
            return (
              <hr key={lIdx} className="border-t-2 border-emerald-400/60 my-3 relative z-0" />
            );
          }

          // 1. Detect leading spaces (tabs)
          const spaceMatch = line.match(/^(\s+)/);
          const leadingSpaces = spaceMatch ? spaceMatch[1] : '';
          const indentLevel = Math.floor(leadingSpaces.length / 4);
          const tabPadding = indentLevel > 0 ? `${indentLevel * 1.25}rem` : undefined;
          const textAfterTabs = line.substring(leadingSpaces.length);

          // 2. Identify markdown elements in the text after tabs
          const h1Match = textAfterTabs.match(/^#\s+(.*)/);
          const h2Match = textAfterTabs.match(/^##\s+(.*)/);
          const h3Match = textAfterTabs.match(/^###\s+(.*)/);
          
          const isLargeBullet = textAfterTabs.startsWith('●');
          const isNormalBullet = textAfterTabs.startsWith('•');
          const isDashBullet = textAfterTabs.startsWith('- ');
          const isStarBullet = textAfterTabs.startsWith('* ');
          const isBullet = isLargeBullet || isNormalBullet || isDashBullet || isStarBullet;
          
          const isBold = textAfterTabs.trim().startsWith('**') && textAfterTabs.trim().endsWith('**');
          const isStrikethrough = textAfterTabs.trim().startsWith('~~') && textAfterTabs.trim().endsWith('~~');
          
          let displayLine = textAfterTabs;
          let headerLevel = 0;
          let bulletSymbol = '';

          if (h1Match) {
              displayLine = h1Match[1];
              headerLevel = 1;
          } else if (h2Match) {
              displayLine = h2Match[1];
              headerLevel = 2;
          } else if (h3Match) {
              displayLine = h3Match[1];
              headerLevel = 3;
          } else if (isBold) {
              displayLine = textAfterTabs.trim().substring(2, textAfterTabs.trim().length - 2);
          } else if (isStrikethrough) {
              displayLine = textAfterTabs.trim().substring(2, textAfterTabs.trim().length - 2);
          } else if (isDashBullet || isStarBullet) {
              bulletSymbol = '•';
              displayLine = textAfterTabs.substring(2);
          } else if (isLargeBullet || isNormalBullet) {
              bulletSymbol = textAfterTabs.substring(0, 1);
              displayLine = textAfterTabs.substring(1).trim();
          }

          // Linkify the filtered line
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
          
          let lineClassName = `whitespace-pre-wrap min-h-[24px] `;
          
          if (headerLevel === 1) {
              lineClassName += "font-black text-pink-500 font-serif";
          } else if (headerLevel === 2) {
              lineClassName += "font-bold text-blue-500 font-serif";
          } else if (headerLevel === 3) {
              lineClassName += "font-bold text-slate-700 font-serif";
          } else if (isBold) {
              lineClassName += "font-black " + (textColorClass.includes('emerald') ? 'text-emerald-950' : 'text-slate-900');
          } else if (isStrikethrough) {
              lineClassName += "line-through opacity-60 " + textColorClass;
          } else {
              lineClassName += textColorClass;
          }

          return (
            <div 
                key={lIdx} 
                id={`memo-line-${lIdx}`}
                className={lineClassName}
                style={{ paddingLeft: tabPadding }}
            >
              {isBullet ? (
                <div className="flex items-start">
                  <span className="flex-none w-5 text-center mr-1 select-none font-bold">{bulletSymbol}</span>
                  <div className="flex-1">{finalLineContent || '\u00A0'}</div>
                </div>
              ) : (
                finalLineContent || '\u00A0'
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LinkifiedText;
