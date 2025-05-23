import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import _ from 'lodash';

import { Link } from 'gatsby';

import Title from 'components/Title';
import Divider from 'components/Divider';
import TagList from 'components/TagList';
import DisplayAds from '../DisplayAd';

const PostListWrapper = styled.div`
  @media (max-width: 768px) {
    padding: 0 10px;
  }
`;

const PostWrapper = styled.div`
  position: relative;
  top: 0;
  transition: all 0.5s;

  @media (max-width: 768px) {
    padding: 0 5px;
  }
`;

const ContainerOfDateAndSeries = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Date = styled.p`
  // margin-bottom: 16px;
  padding: 0;
  margin: 0;
  font-size: 14.4px;
  color: ${(props) => props.theme.colors.tertiaryText};
`;
const SeriesName = styled.p`
  font-size: 14.4px;
  // float: right;
  color: ${(props) => props.theme.colors.text};
  text-decoration-line: underline;
  padding: 0;
  margin: 0;
`;

const Excerpt = styled.p`
  margin-bottom: 32px;
  line-height: 1.7;
  font-size: 15px;
  color: ${(props) => props.theme.colors.secondaryText};
  word-break: break-all;
`;

const EmojiWrapper = styled.div`
  float: left;
  margin-right: 15px;
`;

const checkIsScrollAtBottom = () => {
  return (
    document.documentElement.scrollHeight -
      document.documentElement.scrollTop <=
    document.documentElement.clientHeight + 100
  );
};

const PostList = ({ postList }) => {
  const [postCount, setPostCount] = useState(10);

  const handleMoreLoad = _.throttle(() => {
    if (checkIsScrollAtBottom() && postCount < postList.length) {
      setTimeout(() => setPostCount(postCount + 10), 300);
    }
  }, 250);

  useEffect(() => {
    window.addEventListener('scroll', handleMoreLoad);

    return () => {
      window.removeEventListener('scroll', handleMoreLoad);
    };
  }, [postCount, postList]);

  useEffect(() => {
    setPostCount(10);
  }, [postList]);

  return (
    <PostListWrapper>
      {postList.slice(0, postCount).map((post, i) => {
        const { title, date, tags, emoji, series } = post.frontmatter;
        const { excerpt } = post;
        const { slug } = post.fields;
        return (
          <React.Fragment key={JSON.stringify({ slug, date })}>
            <PostWrapper>
              <Title size="bg">
                {emoji ? <EmojiWrapper>{emoji}</EmojiWrapper> : ''}
                <Link to={slug}>{title}</Link>
              </Title>
              <ContainerOfDateAndSeries>
                <Date>{date}</Date>
                <Link to={`/series/${_.replace(series, /\s/g, '-')}`}>
                  <SeriesName>{series}</SeriesName>
                </Link>
              </ContainerOfDateAndSeries>
              <Excerpt>{excerpt}</Excerpt>
              <TagList tagList={tags} />
            </PostWrapper>
            {(i == 0 || i == 2) && <DisplayAds />}
            {postCount - 1 !== i && postList.length - 1 !== i && (
              <Divider mt="48px" mb="32px" />
            )}
          </React.Fragment>
        );
      })}
    </PostListWrapper>
  );
};

export default PostList;
