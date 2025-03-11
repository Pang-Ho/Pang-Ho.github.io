import React from 'react';
import styled from 'styled-components';

import blogConfig from '../../../../blog-config';

const FooterWrapper = styled.footer`
  margin-top: 32px;
  padding: 40px 15px;
  border-top: 1px solid ${(props) => props.theme.colors.divider};
  text-align: center;
  font-size: 11pt;
  // font-weight: lighter;
  max-width: 1020px;
  margin: 0 auto;

  color: ${(props) => props.theme.colors.secondaryText};
  & > div#copyright {
    float: left;
  }
  & > div#themeby {
    // margin-bottom: 15px;
    text-align: right;
    float: right;
  }
  a {
    color: black;
    font-weight: bold;
    text-decoration: none;
  }
`;

const Footer = () => {
  const { copyright } = blogConfig;

  return (
    <FooterWrapper>
      <div id={'copyright'}>
        ©
        <a href="https://github.com/Pang-Ho" target="blank">
          {copyright}
        </a>
      </div>
      <div id={'themeby'}>
        Theme by{' '}
        <a
          href="https://github.com/rundevelrun/gatsby-starter-rundevelrun"
          target="blank"
        >
          RUN:DEVEL:RUN
        </a>{' '}
        Built with Gatsby
      </div>
    </FooterWrapper>
  );
};

export default Footer;
