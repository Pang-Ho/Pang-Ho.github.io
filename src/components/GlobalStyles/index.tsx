import React from 'react';
import { useEffect } from 'react';
import { createGlobalStyle } from 'styled-components';
import reset from 'styled-reset';

const GlobalStyles = createGlobalStyle`
  ${reset}

  /* 글로벌 폰트 스타일 */
  body {
    font-family: 'Pretendard', 'Noto Sans', 'Noto Sans KR', 'Noto Sans CJK KR', sans-serif;
    font-size: 16px;
    line-height: 1.6;
    color: #333;
    background: ${(props) => props.theme.colors.bodyBackground};
  }
`;

export const GlobalStyleWithFont = () => {
  useEffect(() => {
    const link = document.createElement('link');
    link.href =
      'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  return <GlobalStyles />;
};

export default GlobalStyles;
