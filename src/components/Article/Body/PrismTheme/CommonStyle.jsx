import { css } from 'styled-components';
import D2Coding from './../../../../fonts/D2Coding-Ver1.3.2-20180524.ttf';

const CommonStyle = css`
  @font-face {
    font-family: 'D2Coding';
    src: url(${D2Coding}) format('truetype');
    font-weight: normal;
    font-style: normal;
  }

  code[class*='language-'],
  pre[class*='language-'] {
    margin-bottom: 24px;
    font-size: 13.5px;
    color: #ccc;
    background: none;
    font-family:
      'D2Coding', Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
    text-align: left;
    white-space: pre;
    word-spacing: normal;
    word-break: normal;
    word-wrap: normal;
    line-height: 1.5;

    -moz-tab-size: 4;
    -o-tab-size: 4;
    tab-size: 4;

    -webkit-hyphens: none;
    -moz-hyphens: none;
    -ms-hyphens: none;
    hyphens: none;
  }

  /* Code blocks */
  pre[class*='language-'] {
    padding: 1em;
    overflow: auto;
  }

  /* Inline code */
  :not(pre) > code[class*='language-'] {
    padding: 0.1em;
    border-radius: 0.3em;
    white-space: normal;
  }

  .token.important,
  .token.bold {
    font-weight: bold;
  }
  .token.italic {
    font-style: italic;
  }

  .token.entity {
    cursor: help;
  }
`;

export default CommonStyle;
