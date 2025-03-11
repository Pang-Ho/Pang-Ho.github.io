import styled from 'styled-components';

import Header from './Header';
import Series from './Series';
import Body from './Body';
import Footer from './Footer';

const Article = styled.article`
  margin: 0px;
  padding: 0px;
`;

Article.Header = Header;
Article.Series = Series;
Article.Body = Body;
Article.Footer = Footer;

export default Article;
