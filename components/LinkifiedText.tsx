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
  const linkified = linkifyText(text);

  return <span className={className}>{linkified}</span>;
};

export default LinkifiedText;
