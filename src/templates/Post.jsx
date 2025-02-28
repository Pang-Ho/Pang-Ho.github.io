import React from 'react';
import SEO from 'components/SEO';
import { graphql } from 'gatsby';

import Layout from 'components/Layout';
import Article from 'components/Article';

import blogConfig from '../../blog-config';
import Header from 'components/Article/Header';
import Series from 'components/Article/Series';
import Footer from 'components/Article/Footer';
import Body from 'components/Article/Body';

const Post = ({ data }) => {
  const post = data.markdownRemark;
  const { previous, next, seriesList } = data;

  const { title, date, update, tags, series, emoji } = post.frontmatter;
  const { excerpt } = post;
  const { readingTime, slug } = post.fields;

  let filteredSeries = [];
  if (series !== null) {
    filteredSeries = seriesList.edges.map((seriesPost) => {
      if (seriesPost.node.id === post.id) {
        return {
          ...seriesPost.node,
          currentPost: true,
        };
      } else {
        return {
          ...seriesPost.node,
          currentPost: false,
        };
      }
    });
  }

  return (
    <Layout>
      <SEO
        title={title}
        description={excerpt}
        url={`${blogConfig.siteUrl}${slug}`}
      />
      <Article>
        <Header
          emoji={emoji}
          title={title}
          date={date}
          // update={update}
          tags={tags}
          minToRead={Math.round(readingTime.minutes)}
        />
        {filteredSeries.length > 0 && (
          <Series header={series} series={filteredSeries} />
        )}
        <Body html={post.html} />
        <Footer previous={previous} next={next} />
      </Article>
    </Layout>
  );
};

export default Post;

export const pageQuery = graphql`
  query BlogPostBySlug(
    $id: String!
    $series: String
    $previousPostId: String
    $nextPostId: String
  ) {
    site {
      siteMetadata {
        title
      }
    }
    markdownRemark(id: { eq: $id }) {
      id
      excerpt(pruneLength: 200, truncate: true)
      html
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
        update(formatString: "MMMM DD, YYYY")
        tags
        series
        emoji
      }
      fields {
        slug
        readingTime {
          minutes
        }
      }
    }
    seriesList: allMarkdownRemark(
      sort: { order: ASC, fields: [frontmatter___date] }
      filter: { frontmatter: { series: { eq: $series } } }
    ) {
      edges {
        node {
          id
          fields {
            slug
          }
          frontmatter {
            title
            emoji
          }
        }
      }
    }
    previous: markdownRemark(id: { eq: $previousPostId }) {
      fields {
        slug
      }
      frontmatter {
        title
      }
    }
    next: markdownRemark(id: { eq: $nextPostId }) {
      fields {
        slug
      }
      frontmatter {
        title
        emoji
      }
    }
  }
`;
