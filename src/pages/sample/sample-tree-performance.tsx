import type { ProfilerOnRenderCallback, ReactNode } from 'react';
import React, {
  Profiler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FaCheckSquare,
  FaExpandArrowsAlt,
  FaPlay,
  FaRedo,
} from 'react-icons/fa';
import styled from 'styled-components';

import Layout from 'components/Layout';
import SEO from 'components/SEO';
import type { LazyTreeSource, SampleTreeNode } from 'components/Tree';
import {
  LazyTree,
  Tree,
  VirtualTree,
  collectBranchIds,
  collectTreeNodes,
  countVisibleRows,
  createLazyTreeSource,
  fetchTreeChildrenFromMap,
  updateCheckedIds,
} from 'components/Tree';

import blogConfig from '../../../blog-config';

type ManualNode = SampleTreeNode;

type BenchmarkCaseId = 'tree' | 'lazy-tree' | 'virtual-tree';

type ConfirmedSelection = {
  caseId: BenchmarkCaseId;
  nodes: ManualNode[];
};

type BenchmarkResult = {
  actualDuration: number;
  baseDuration: number;
  commitDuration: number;
  paintDuration: number;
  expectedRows: number;
  mountedRows?: number;
  measuredAt: string;
};

const MANUAL_COUNT = 10000;
const FOLDER_COUNT = 20;
const GROUPS_PER_FOLDER = 5;
const TREE_MAX_DEPTH = 5;
const ROW_HEIGHT = 44;
const TREE_HEIGHT = 420;
const RUN_ALL_COOLDOWN_MS = 1000;

const BENCHMARK_CASES: {
  id: BenchmarkCaseId;
  title: string;
  summary: string;
  target: string;
}[] = [
  {
    id: 'tree',
    title: '기본 Tree',
    summary: '이미지가 있는 5뎁스 전체 트리를 한 번에 렌더링',
    target: '초기 진입 병목 확인',
  },
  {
    id: 'lazy-tree',
    title: 'Lazy Tree',
    summary: '부모만 렌더링, 부모 클릭시 자식 노드를 fetch해서 렌더링',
    target: '초기 렌더링 속도 개선',
  },
  {
    id: 'virtual-tree',
    title: 'Virtual Tree',
    summary: '보이지 않는 행들을 가상화 DOM',
    target: '렌더링 후 Paint 속도 개선',
  },
];

const CASE_ORDER = BENCHMARK_CASES.map(({ id }) => id);

const EMPTY_SELECTED_IDS_BY_CASE: Record<BenchmarkCaseId, string[]> = {
  tree: [],
  'lazy-tree': [],
  'virtual-tree': [],
};

const PageShell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  color: ${(props: any) => props.theme.colors.text};

  @media (max-width: 768px) {
    padding: 0 13px;
  }
`;

const PageHeading = styled.section`
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
  padding-top: 8px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const HeadingGroup = styled.div`
  min-width: 0;
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

const ActionGroup = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: flex-start;
  }
`;

const Button = styled.button<{
  $variant?: 'primary' | 'secondary';
  $full?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: ${(props) => (props.$full ? '100%' : 'auto')};
  min-height: 34px;
  border: 1px solid
    ${(props: any) =>
      props.$variant === 'primary'
        ? props.theme.colors.pointColor
        : props.theme.colors.border};
  border-radius: 6px;
  padding: 7px 12px;
  background: ${(props: any) =>
    props.$variant === 'primary'
      ? props.theme.colors.pointColor
      : props.theme.colors.bodyBackground};
  color: ${(props: any) =>
    props.$variant === 'primary' ? '#ffffff' : props.theme.colors.text};
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
  transition:
    background 0.2s,
    border-color 0.2s,
    color 0.2s;

  &:hover {
    border-color: ${(props: any) => props.theme.colors.pointColor};
  }

  & > svg {
    width: 14px;
    height: 14px;
  }
`;

const CaseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
`;

const CaseCard = styled.article<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 158px;
  border: 1px solid
    ${(props: any) =>
      props.$selected
        ? props.theme.colors.pointColor
        : props.theme.colors.border};
  border-radius: 8px;
  padding: 16px;
  background: ${(props: any) => props.theme.colors.bodyBackground};
`;

const CaseTitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
`;

const CaseTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.3;
`;

const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  border: 1px solid ${(props: any) => props.theme.colors.border};
  border-radius: 999px;
  padding: 3px 8px;
  color: ${(props: any) => props.theme.colors.secondaryText};
  background: ${(props: any) => props.theme.colors.background};
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
`;

const CaseSummary = styled.p`
  margin: 10px 0 14px;
  color: ${(props: any) => props.theme.colors.tertiaryText};
  font-size: 13px;
  line-height: 1.5;
`;

const MetricRow = styled.div`
  display: flex;
  gap: 18px;
  margin-bottom: 14px;
`;

const Metric = styled.div`
  min-width: 0;
`;

const MetricLabel = styled.div`
  color: ${(props: any) => props.theme.colors.tertiaryText};
  font-size: 12px;
`;

const MetricValue = styled.div`
  margin-top: 2px;
  font-size: 15px;
  font-weight: 800;
`;

const TablePanel = styled.div`
  overflow-x: auto;
  border: 1px solid ${(props: any) => props.theme.colors.border};
  border-radius: 8px;
  background: ${(props: any) => props.theme.colors.bodyBackground};
`;

const ResultTable = styled.table`
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
  font-size: 13px;

  th,
  td {
    border-bottom: 1px solid ${(props: any) => props.theme.colors.divider};
    padding: 10px 12px;
    text-align: right;
    white-space: nowrap;
  }

  th:first-child,
  td:first-child {
    text-align: left;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }
`;

const WorkArea = styled.div`
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 16px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.section`
  border: 1px solid ${(props: any) => props.theme.colors.border};
  border-radius: 8px;
  padding: 16px;
  background: ${(props: any) => props.theme.colors.bodyBackground};
`;

const PanelTitle = styled.h2`
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.35;
`;

const TargetButtons = styled.div`
  display: grid;
  gap: 8px;
  padding: 12px 0;
  border-top: 1px solid ${(props: any) => props.theme.colors.divider};
  border-bottom: 1px solid ${(props: any) => props.theme.colors.divider};
`;

const NoteList = styled.div`
  display: grid;
  gap: 8px;
  margin-top: 14px;
`;

const Note = styled.p`
  margin: 0;
  color: ${(props: any) => props.theme.colors.tertiaryText};
  font-size: 13px;
  line-height: 1.5;
`;

const TreePanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 12px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const TreeActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const SelectionSection = styled.section`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid ${(props: any) => props.theme.colors.divider};
`;

const SelectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
`;

const SelectionList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
`;

function createNodeImageSrc(type: 'folder' | 'manual', index: number) {
  const hue = type === 'folder' ? (index * 23) % 360 : (index * 17 + 120) % 360;
  const label = type === 'folder' ? 'F' : 'M';
  const baseColor = `hsl(${hue}, 62%, 52%)`;
  const accentColor = `hsl(${(hue + 38) % 360}, 70%, 86%)`;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <rect width="32" height="32" rx="7" fill="${baseColor}"/>
      <circle cx="24" cy="8" r="6" fill="${accentColor}" opacity="0.9"/>
      <path d="M7 20c4-7 8-7 12 0 2-3 4-4 6-2v7H7z" fill="${accentColor}" opacity="0.78"/>
      <text x="9" y="15" font-family="Arial, sans-serif" font-size="10" font-weight="700" fill="#fff">${label}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function createFolderNode(
  tree_id: string,
  label: string,
  index: number,
  children: ManualNode[]
): ManualNode {
  return {
    tree_id,
    label,
    imageUrl: createNodeImageSrc('folder', index),
    children,
  };
}

function createManualNode(
  index: number,
  prefix = 'manual',
  labelPrefix = '매뉴얼'
): ManualNode {
  return {
    tree_id: `${prefix}-${index}`,
    label: `${labelPrefix} ${index.toString().padStart(4, '0')}`,
    imageUrl: createNodeImageSrc('manual', index),
  };
}

function createBalancedManualTree(manualCount: number): ManualNode[] {
  const docsPerFolder = Math.ceil(manualCount / FOLDER_COUNT);
  const docsPerGroup = Math.ceil(docsPerFolder / GROUPS_PER_FOLDER);
  let createdCount = 0;

  return Array.from({ length: FOLDER_COUNT }, (_, folderIndex) => {
    const folderNo = folderIndex + 1;
    const groupNodes = Array.from(
      { length: GROUPS_PER_FOLDER },
      (_, groupIndex) => {
        const groupNo = groupIndex + 1;
        const manuals: ManualNode[] = [];

        while (manuals.length < docsPerGroup && createdCount < manualCount) {
          createdCount += 1;
          manuals.push(createManualNode(createdCount));
        }

        if (manuals.length === 0) {
          return null;
        }

        const sectionNode = createFolderNode(
          `folder-${folderNo}-group-${groupNo}-category-1-section-1`,
          `섹션 ${folderNo.toString().padStart(2, '0')}-${groupNo}`,
          folderNo * 100 + groupNo * 10 + 3,
          manuals
        );
        const categoryNode = createFolderNode(
          `folder-${folderNo}-group-${groupNo}-category-1`,
          `카테고리 ${folderNo.toString().padStart(2, '0')}-${groupNo}`,
          folderNo * 100 + groupNo * 10 + 2,
          [sectionNode]
        );

        return createFolderNode(
          `folder-${folderNo}-group-${groupNo}`,
          `업무 그룹 ${folderNo.toString().padStart(2, '0')}-${groupNo}`,
          folderNo * 100 + groupNo * 10 + 1,
          [categoryNode]
        );
      }
    ).filter((node): node is ManualNode => node !== null);

    return createFolderNode(
      `folder-${folderNo}`,
      `업무 폴더 ${folderNo.toString().padStart(2, '0')}`,
      folderNo,
      groupNodes
    );
  });
}

function formatMs(value?: number) {
  if (typeof value !== 'number') {
    return '-';
  }

  return `${value < 10 ? value.toFixed(2) : value.toFixed(1)} ms`;
}

function formatRows(value?: number) {
  if (typeof value !== 'number') {
    return '-';
  }

  return value.toLocaleString();
}

function getNow() {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}

function RenderMeasure({
  caseId,
  children,
  enabled,
  expectedRows,
  onMeasured,
  runId,
  startedAt,
}: {
  caseId: BenchmarkCaseId;
  children: ReactNode;
  enabled: boolean;
  expectedRows: number;
  onMeasured: (caseId: BenchmarkCaseId, result: BenchmarkResult) => void;
  runId: number;
  startedAt: number;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const profilerResultRef = useRef({
    actualDuration: 0,
    baseDuration: 0,
    startTime: 0,
    commitTime: 0,
  });

  const handleRender = useCallback<ProfilerOnRenderCallback>(
    (_id, _phase, actualDuration, baseDuration, startTime, commitTime) => {
      profilerResultRef.current = {
        actualDuration,
        baseDuration,
        startTime,
        commitTime,
      };
    },
    []
  );

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let secondFrameId = 0;
    const firstFrameId = window.requestAnimationFrame(() => {
      secondFrameId = window.requestAnimationFrame(() => {
        const mountedRows =
          rootRef.current?.querySelectorAll(
            '[data-tree-row], [data-lazy-tree-row], [data-tree-benchmark-row]'
          ).length ?? 0;
        const { actualDuration, baseDuration, startTime, commitTime } =
          profilerResultRef.current;

        onMeasured(caseId, {
          actualDuration,
          baseDuration,
          commitDuration: Math.max(0, commitTime - startTime),
          paintDuration: getNow() - startedAt,
          expectedRows,
          mountedRows: mountedRows > 0 ? mountedRows : undefined,
          measuredAt: new Date().toLocaleTimeString(),
        });
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrameId);
      window.cancelAnimationFrame(secondFrameId);
    };
  }, [caseId, enabled, expectedRows, onMeasured, runId, startedAt]);

  if (!enabled) {
    return <div ref={rootRef}>{children}</div>;
  }

  return (
    <Profiler id={caseId} onRender={handleRender}>
      <div ref={rootRef}>{children}</div>
    </Profiler>
  );
}

function SampleTreePerformancePage() {
  const [activeCaseId, setActiveCaseId] = useState<BenchmarkCaseId>('tree');
  const [results, setResults] = useState<
    Partial<Record<BenchmarkCaseId, BenchmarkResult>>
  >({});
  const [runId, setRunId] = useState(0);
  const [startedAt, setStartedAt] = useState(() => getNow());
  const [queue, setQueue] = useState<BenchmarkCaseId[]>([]);
  const [running, setRunning] = useState(false);
  const [selectedIdsByCase, setSelectedIdsByCase] = useState(
    EMPTY_SELECTED_IDS_BY_CASE
  );
  const [expandAllVersionByCase, setExpandAllVersionByCase] = useState<
    Record<BenchmarkCaseId, number>
  >({
    tree: 0,
    'lazy-tree': 0,
    'virtual-tree': 0,
  });
  const [confirmedSelection, setConfirmedSelection] =
    useState<ConfirmedSelection | null>(null);

  const balancedTree = useMemo(
    () => createBalancedManualTree(MANUAL_COUNT),
    []
  );
  const lazyTreeSource = useMemo(
    () => createLazyTreeSource(balancedTree),
    [balancedTree]
  );
  const allExpandedIds = useMemo(
    () => collectBranchIds(balancedTree),
    [balancedTree]
  );
  const nodeById = useMemo(() => {
    const nodes = collectTreeNodes(balancedTree);

    return new Map(nodes.map((node) => [node.tree_id, node]));
  }, [balancedTree]);

  const fetchLazyTreeChildren = useCallback(
    (tree_id: string) =>
      fetchTreeChildrenFromMap(tree_id, lazyTreeSource.childrenByParentId),
    [lazyTreeSource]
  );

  const expectedRowsByCase = useMemo<Record<BenchmarkCaseId, number>>(
    () => ({
      tree: countVisibleRows(balancedTree, new Set(allExpandedIds)),
      'lazy-tree': countVisibleRows(balancedTree, new Set()),
      'virtual-tree': countVisibleRows(balancedTree, new Set(allExpandedIds)),
    }),
    [allExpandedIds, balancedTree]
  );
  const activeExpandAllVersion = expandAllVersionByCase[activeCaseId];
  const activeSelectedNodes = useMemo(
    () =>
      selectedIdsByCase[activeCaseId]
        .map((tree_id) => nodeById.get(tree_id))
        .filter((node): node is ManualNode => Boolean(node)),
    [activeCaseId, nodeById, selectedIdsByCase]
  );
  const activeExpectedRows = useMemo(() => {
    if (activeExpandAllVersion > 0 && activeCaseId === 'lazy-tree') {
      return countVisibleRows(balancedTree, new Set(allExpandedIds));
    }

    return expectedRowsByCase[activeCaseId];
  }, [
    activeCaseId,
    activeExpandAllVersion,
    allExpandedIds,
    balancedTree,
    expectedRowsByCase,
  ]);

  const handleSelectedIdsChange = useCallback(
    (caseId: BenchmarkCaseId, selectedIds: string[]) => {
      setSelectedIdsByCase((prev) => ({
        ...prev,
        [caseId]: Array.from(new Set(selectedIds)),
      }));
    },
    []
  );

  const handleNodeChecked = useCallback(
    (caseId: BenchmarkCaseId, tree_id: string, checked: boolean) => {
      setSelectedIdsByCase((prev) => ({
        ...prev,
        [caseId]: updateCheckedIds(prev[caseId], tree_id, checked),
      }));
    },
    []
  );

  const handleExpandAllActiveTree = () => {
    setExpandAllVersionByCase((prev) => ({
      ...prev,
      [activeCaseId]: 1,
    }));
  };

  const handleConfirmSelectedData = () => {
    setConfirmedSelection({
      caseId: activeCaseId,
      nodes: activeSelectedNodes,
    });
  };

  const runCase = useCallback((caseId: BenchmarkCaseId) => {
    setActiveCaseId(caseId);
    setStartedAt(getNow());
    setRunId((prev) => prev + 1);
    setRunning(true);
  }, []);

  const handleRunSingle = (caseId: BenchmarkCaseId) => {
    setQueue([]);
    setExpandAllVersionByCase((prev) => ({
      ...prev,
      [activeCaseId]: 0,
    }));
    runCase(caseId);
  };

  const handleRunAll = () => {
    setResults({});
    setRunning(false);
    const caseIds: BenchmarkCaseId[] = JSON.parse(JSON.stringify(CASE_ORDER));
    setQueue(caseIds.reverse());
  };

  const handleMeasured = useCallback(
    (caseId: BenchmarkCaseId, result: BenchmarkResult) => {
      setResults((prev) => ({
        ...prev,
        [caseId]: result,
      }));
      setRunning(false);
    },
    []
  );

  useEffect(() => {
    if (running || queue.length === 0) {
      return;
    }

    const [nextCase, ...restQueue] = queue;
    const timeoutId = window.setTimeout(() => {
      setQueue(restQueue);
      runCase(nextCase);
    }, RUN_ALL_COOLDOWN_MS);

    return () => window.clearTimeout(timeoutId);
  }, [queue, runCase, running]);

  const activeCase =
    BENCHMARK_CASES.find(({ id }) => id === activeCaseId) ?? BENCHMARK_CASES[0];
  const confirmedCaseTitle = confirmedSelection
    ? BENCHMARK_CASES.find(({ id }) => id === confirmedSelection.caseId)?.title
    : undefined;
  const treeSelectedIds = selectedIdsByCase.tree;
  const lazyTreeSelectedIds = selectedIdsByCase['lazy-tree'];
  const virtualTreeSelectedIds = selectedIdsByCase['virtual-tree'];
  const { description, siteUrl } = blogConfig;
  const pageUrl = `${siteUrl.replace(/\/$/, '')}/sample/sample-tree-performance`;

  const renderVirtualTree = (
    source: LazyTreeSource,
    initialExpandedIds: string[],
    selectedIds: string[],
    fetchChildren: (tree_id: string) => Promise<ManualNode[]>,
    caseId: BenchmarkCaseId
  ) => (
    <VirtualTree
      source={source}
      fetchChildren={fetchChildren}
      initialExpandedIds={initialExpandedIds}
      expandAllVersion={expandAllVersionByCase[caseId]}
      height={TREE_HEIGHT}
      rowHeight={ROW_HEIGHT}
      selectedIds={selectedIds}
      onSelectedIdsChange={(nextSelectedIds) =>
        handleSelectedIdsChange(caseId, nextSelectedIds)
      }
    />
  );

  const renderActiveTree = () => {
    switch (activeCaseId) {
      case 'tree':
        return (
          <Tree
            nodes={balancedTree}
            expandedIds={allExpandedIds}
            expandAllVersion={expandAllVersionByCase.tree}
            height={TREE_HEIGHT}
            maxDepth={TREE_MAX_DEPTH}
            selectedIds={treeSelectedIds}
            onCheckedChange={(tree_id, checked) =>
              handleNodeChecked('tree', tree_id, checked)
            }
          />
        );
      case 'virtual-tree':
        return renderVirtualTree(
          lazyTreeSource,
          allExpandedIds,
          virtualTreeSelectedIds,
          fetchLazyTreeChildren,
          'virtual-tree'
        );
      case 'lazy-tree':
      default:
        return (
          <LazyTree
            nodes={lazyTreeSource.roots}
            fetchChildren={fetchLazyTreeChildren}
            expandedIds={
              expandAllVersionByCase['lazy-tree'] > 0 ? allExpandedIds : []
            }
            expandAllVersion={expandAllVersionByCase['lazy-tree']}
            height={TREE_HEIGHT}
            maxDepth={TREE_MAX_DEPTH}
            selectedIds={lazyTreeSelectedIds}
            onCheckedChange={(tree_id, checked) =>
              handleNodeChecked('lazy-tree', tree_id, checked)
            }
          />
        );
    }
  };

  return (
    <Layout>
      <SEO
        title="Tree Rendering Benchmark"
        description={description}
        url={pageUrl}
      />
      <PageShell>
        <PageHeading>
          <HeadingGroup>
            <Title>Tree Rendering Benchmark</Title>
            <Description>
              매뉴얼 {MANUAL_COUNT.toLocaleString()}개, {TREE_MAX_DEPTH}뎁스,
              이미지 노드 기준 렌더링 시간 비교
            </Description>
          </HeadingGroup>
          <ActionGroup>
            <Button type="button" onClick={() => setResults({})}>
              <FaRedo aria-hidden="true" />
              Reset
            </Button>
            <Button type="button" $variant="primary" onClick={handleRunAll}>
              <FaPlay aria-hidden="true" />
              Run All
            </Button>
          </ActionGroup>
        </PageHeading>

        <CaseGrid>
          {BENCHMARK_CASES.map((benchmarkCase) => {
            const result = results[benchmarkCase.id];
            const selected = activeCaseId === benchmarkCase.id;

            return (
              <CaseCard key={benchmarkCase.id} $selected={selected}>
                <div>
                  <CaseTitleRow>
                    <CaseTitle>{benchmarkCase.title}</CaseTitle>
                    <Chip>{benchmarkCase.target}</Chip>
                  </CaseTitleRow>
                  <CaseSummary>{benchmarkCase.summary}</CaseSummary>
                  <MetricRow>
                    <Metric>
                      <MetricLabel>React render</MetricLabel>
                      <MetricValue>
                        {formatMs(result?.actualDuration)}
                      </MetricValue>
                    </Metric>
                    <Metric>
                      <MetricLabel>Commit</MetricLabel>
                      <MetricValue>
                        {formatMs(result?.commitDuration)}
                      </MetricValue>
                    </Metric>
                    <Metric>
                      <MetricLabel>After paint</MetricLabel>
                      <MetricValue>
                        {formatMs(result?.paintDuration)}
                      </MetricValue>
                    </Metric>
                  </MetricRow>
                </div>
                <Button
                  type="button"
                  $full
                  $variant={selected ? 'primary' : 'secondary'}
                  onClick={() => handleRunSingle(benchmarkCase.id)}
                >
                  측정
                </Button>
              </CaseCard>
            );
          })}
        </CaseGrid>

        <TablePanel>
          <ResultTable>
            <thead>
              <tr>
                <th>구분</th>
                <th>React render</th>
                <th>Commit</th>
                <th>After paint</th>
                <th>표시 대상 행</th>
                <th>실제 DOM 행</th>
                <th>측정 시간</th>
              </tr>
            </thead>
            <tbody>
              {BENCHMARK_CASES.map((benchmarkCase) => {
                const result = results[benchmarkCase.id];

                return (
                  <tr key={benchmarkCase.id}>
                    <td>{benchmarkCase.title}</td>
                    <td>{formatMs(result?.actualDuration)}</td>
                    <td>{formatMs(result?.commitDuration)}</td>
                    <td>{formatMs(result?.paintDuration)}</td>
                    <td>
                      {formatRows(
                        result?.expectedRows ??
                          expectedRowsByCase[benchmarkCase.id]
                      )}
                    </td>
                    <td>{formatRows(result?.mountedRows)}</td>
                    <td>{result?.measuredAt ?? '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </ResultTable>
        </TablePanel>

        <WorkArea>
          <Panel>
            <PanelTitle>측정 대상</PanelTitle>
            <TargetButtons>
              {BENCHMARK_CASES.map((benchmarkCase) => (
                <Button
                  key={benchmarkCase.id}
                  type="button"
                  $full
                  $variant={
                    activeCaseId === benchmarkCase.id ? 'primary' : 'secondary'
                  }
                  onClick={() => handleRunSingle(benchmarkCase.id)}
                >
                  {benchmarkCase.title}
                </Button>
              ))}
            </TargetButtons>
          </Panel>

          <Panel>
            <TreePanelHeader>
              <div
                style={{
                  width: '100%',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <PanelTitle>{activeCase.title}</PanelTitle>
                  <TreeActions>
                    <Chip>
                      표시 대상 {activeExpectedRows.toLocaleString()}행
                    </Chip>
                    <Button type="button" onClick={handleExpandAllActiveTree}>
                      <FaExpandArrowsAlt aria-hidden="true" />
                      모두 펼치기
                    </Button>
                    <Button
                      type="button"
                      $variant="primary"
                      onClick={handleConfirmSelectedData}
                    >
                      <FaCheckSquare aria-hidden="true" />
                      선택 데이터 확인 ({activeSelectedNodes.length})
                    </Button>
                  </TreeActions>
                </div>
                <Description>{activeCase.summary}</Description>
              </div>
            </TreePanelHeader>

            <RenderMeasure
              key={`${activeCaseId}-${runId}`}
              caseId={activeCaseId}
              enabled={running}
              expectedRows={activeExpectedRows}
              runId={runId}
              startedAt={startedAt}
              onMeasured={handleMeasured}
            >
              {renderActiveTree()}
            </RenderMeasure>

            <SelectionSection>
              <SelectionHeader>
                <PanelTitle>선택 데이터</PanelTitle>
                <Chip>{confirmedSelection?.nodes.length ?? 0}개</Chip>
              </SelectionHeader>
              <Description>
                {confirmedSelection
                  ? `${confirmedCaseTitle}에서 확인한 선택 결과`
                  : '체크박스로 여러 노드를 선택한 뒤 확인 버튼을 누르면 여기에 표시'}
              </Description>
              {confirmedSelection ? (
                <SelectionList>
                  {confirmedSelection.nodes.slice(0, 20).map((node) => (
                    <Chip key={node.tree_id}>
                      {node.label} / {node.tree_id}
                    </Chip>
                  ))}
                  {confirmedSelection.nodes.length > 20 ? (
                    <Chip>외 {confirmedSelection.nodes.length - 20}개</Chip>
                  ) : null}
                </SelectionList>
              ) : null}
            </SelectionSection>
          </Panel>
        </WorkArea>
      </PageShell>
    </Layout>
  );
}

export default SampleTreePerformancePage;
