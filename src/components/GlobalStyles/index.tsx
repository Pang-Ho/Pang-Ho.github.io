import React from 'react';
import { Helmet } from 'react-helmet';
import { createGlobalStyle } from 'styled-components';
// import reset from 'styled-reset';

const GlobalStyles = createGlobalStyle`
  /* 글로벌 폰트 스타일 */
  body {
    font-family: 'Pretendard', 'Noto Sans', 'Noto Sans KR', 'Noto Sans CJK KR', sans-serif;
    font-size: 16px;
    line-height: 1.6;
    color: #333;
    background: ${(props) => props.theme.colors.bodyBackground};
  }
`;

const GlobalStyleWrapper = () => (
  <>
    <Helmet>
      <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        rel="stylesheet"
      />
    </Helmet>
    <GlobalStyles />
  </>
);

export default GlobalStyleWrapper;
