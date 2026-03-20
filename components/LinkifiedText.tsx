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

  const parts = text.split('---divider---');
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        const linkified = linkifyText(part);
        
        // 하이라이트 처리가 필요한 경우
        let finalContent = linkified;
        if (highlightText && typeof part === 'string' && part.includes(highlightText)) {
          // linkifyText는 (string | JSX.Element)[]를 반환하므로 하이라이트 로직이 복잡함
          // 간단하게 전체 linkified를 돌면서 string인 부분만 split/join 처리할 수 있음
          finalContent = linkified.map((node, nIdx) => {
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
          <React.Fragment key={index}>
            {finalContent}
            {index < parts.length - 1 && (
              <hr className="w-[80%] border-t-2 border-blue-400 mx-auto my-3 border-solid pointer-events-none" />
            )}
          </React.Fragment>
        );
      })}
    </span>
  );
};

export default LinkifiedText;
