import { Link } from 'gatsby';
import React from 'react';
import { FaArrowRight, FaTree } from 'react-icons/fa';
import styled from 'styled-components';

import Layout from 'components/Layout';
import SEO from 'components/SEO';

import { TagLink, TagListWrapper } from 'components/TagList';
import blogConfig from '../../../blog-config';

const SAMPLE_ITEMS = [
  {
    title: 'Tree Rendering Benchmark',
    path: '/sample/sample-tree-performance',
    summary:
      '기본 Tree, Lazy Tree, Virtual Tree의 렌더링 행 수와 측정 시간을 비교하는 샘플',
    tags: ['Tree', 'Lazy', 'Virtual Scroll'],
  },
];

const PageShell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  color: ${(props: any) => props.theme.colors.text};

  @media (max-width: 768px) {
    padding: 0 13px;
  }
`;

const Header = styled.section`
  padding-top: 8px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 30px;
  font-weight: 800;
  line-height: 1.25;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const Description = styled.p`
  margin: 6px 0 0;
  color: ${(props: any) => props.theme.colors.tertiaryText};
  font-size: 14px;
`;

const SampleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
`;

const SampleCard = styled(Link)`
  display: grid;
  gap: 12px;
  min-height: 160px;
  border: 1px solid ${(props: any) => props.theme.colors.border};
  border-radius: 8px;
  padding: 16px;
  color: inherit;
  background: ${(props: any) => props.theme.colors.bodyBackground};
  text-decoration: none;
  transition:
    border-color 0.2s,
    transform 0.2s;

  &:hover {
    border-color: ${(props: any) => props.theme.colors.pointColor};
    transform: translateY(-1px);
  }
`;

const CardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const IconBox = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  color: #ffffff;
  background: ${(props: any) => props.theme.colors.pointColor};
`;

const CardTitle = styled.h2`
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  line-height: 1.35;
`;

const CardSummary = styled.p`
  margin: 0;
  color: ${(props: any) => props.theme.colors.tertiaryText};
  font-size: 13px;
  line-height: 1.55;
`;

// const TagList = styled.div`
//   display: flex;
//   flex-wrap: wrap;
//   gap: 8px;
// `;

// const Tag = styled.span`
//   display: inline-flex;
//   align-items: center;
//   border: 1px solid ${(props: any) => props.theme.colors.border};
//   border-radius: 999px;
//   padding: 3px 8px;
//   color: ${(props: any) => props.theme.colors.secondaryText};
//   background: ${(props: any) => props.theme.colors.background};
//   font-size: 12px;
//   font-weight: 700;
//   line-height: 1.4;
// `;

const CardAction = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: ${(props: any) => props.theme.colors.pointColor};
  font-size: 13px;
  font-weight: 800;
`;

function SamplePage() {
  const { description, siteUrl } = blogConfig;
  const pageUrl = `${siteUrl.replace(/\/$/, '')}/sample`;

  return (
    <Layout>
      <SEO title="Sample" description={description} url={pageUrl} />
      <PageShell>
        <Header>
          <Title>Sample</Title>
          <Description>
            블로그에 올린 프론트엔드 실험과 데모를 모아둔 페이지
          </Description>
        </Header>

        <SampleGrid>
          {SAMPLE_ITEMS.map((sample) => (
            <SampleCard key={sample.path} to={sample.path}>
              <CardTop>
                <IconBox>
                  <FaTree aria-hidden="true" />
                </IconBox>
                <CardAction>
                  열기
                  <FaArrowRight aria-hidden="true" />
                </CardAction>
              </CardTop>
              <div>
                <CardTitle>{sample.title}</CardTitle>
                <CardSummary>{sample.summary}</CardSummary>
              </div>
              <TagListWrapper>
                {sample.tags.map((tag) => (
                  <TagLink key={tag}>{tag}</TagLink>
                ))}
              </TagListWrapper>
            </SampleCard>
          ))}
        </SampleGrid>
      </PageShell>
    </Layout>
  );
}

export default SamplePage;
