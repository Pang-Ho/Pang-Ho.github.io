import { GatsbyNode } from 'gatsby';
import { createFilePath } from 'gatsby-source-filesystem';
import _ from 'lodash';
import path from 'path';

export const createPages: GatsbyNode['createPages'] = async ({
  graphql,
  actions,
  reporter,
}) => {
  const { createPage } = actions;

  const postTemplate = path.resolve(`./src/templates/Post.jsx`);
  const seriesTemplate = path.resolve(`./src/templates/Series.jsx`);

  const result = await graphql<{ postsRemark: any }>(`
    {
      postsRemark: allMarkdownRemark(
        sort: { fields: [frontmatter___date], order: ASC }
        filter: { fileAbsolutePath: { regex: "/contents/posts/" } }
        limit: 1000
      ) {
        nodes {
          id
          fields {
            slug
          }
          fileAbsolutePath
          frontmatter {
            series
          }
        }
      }
      tagsGroup: allMarkdownRemark(limit: 2000) {
        group(field: frontmatter___tags) {
          fieldValue
        }
      }
    }
  `);

  if (result.errors) {
    reporter.panicOnBuild(
      `There was an error loading your blog posts`,
      result.errors
    );
    return;
  }

  const posts = result.data?.postsRemark.nodes;
  const series = _.reduce(
    posts,
    (acc: string[], cur: any) => {
      const seriesName = cur.frontmatter.series;
      if (seriesName && !_.includes(acc, seriesName))
        return [...acc, seriesName];
      return acc;
    },
    []
  );

  if (posts.length > 0) {
    posts.forEach((post, index) => {
      const previousPostId = index === 0 ? null : posts[index - 1].id;
      const nextPostId =
        index === posts.length - 1 ? null : posts[index + 1].id;

      createPage({
        path: post.fields.slug,
        component: postTemplate,
        context: {
          id: post.id,
          series: post.frontmatter.series,
          previousPostId,
          nextPostId,
        },
      });
    });
  }

  if (series.length > 0) {
    series.forEach((singleSeries) => {
      const path = `/series/${_.replace(singleSeries, /\s/g, '-')}`;
      createPage({
        path,
        component: seriesTemplate,
        context: {
          series: singleSeries,
        },
      });
    });
  }
};

export const onCreateNode: GatsbyNode['onCreateNode'] = ({
  node,
  actions,
  getNode,
}) => {
  const { createNodeField } = actions;

  if (node.internal.type === `MarkdownRemark`) {
    const slug = createFilePath({ node, getNode });

    const newSlug = slug.replace(/^\/posts/, '');
    // const newSlug = `/${slug.split('/').reverse()[1]}/`;
    console.log(newSlug);
    createNodeField({
      node,
      name: `slug`,
      value: newSlug,
    });
  }
};

export const createSchemaCustomization: GatsbyNode['createSchemaCustomization'] =
  ({ actions }) => {
    const { createTypes } = actions;
    const typeDefs = `
  type MarkdownRemark implements Node {
    frontmatter: Frontmatter!
  }
  type Frontmatter {
    title: String!
    description: String
    tags: [String!]!
    series: String
  }
  `;
    createTypes(typeDefs);
  };
