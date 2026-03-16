import React from 'react';
import { linkifyText } from '../utils/linkify';

interface LinkifiedTextProps {
  text: string;
  className?: string;
}

/**
 * URL과 휴대폰 번호를 자동으로 링크로 변환하여 렌더링하는 컴포넌트
 */
const LinkifiedText: React.FC<LinkifiedTextProps> = ({ text, className = '' }) => {
  if (!text) return null;

  const parts = text.split('---divider---');
  
  return (
    <span className={className}>
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {linkifyText(part)}
          {index < parts.length - 1 && (
            <hr className="w-[80%] border-t-2 border-blue-400 mx-auto my-3 border-solid pointer-events-none" />
          )}
        </React.Fragment>
      ))}
    </span>
  );
};

export default LinkifiedText;
