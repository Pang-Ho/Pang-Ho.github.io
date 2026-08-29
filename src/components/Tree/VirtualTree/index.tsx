import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { CSSProperties, KeyboardEvent, MouseEvent } from 'react';
import { List } from 'react-window';
import type { RowComponentProps } from 'react-window';

import {
  createInitialLoadedChildren,
  flattenVisibleRows,
  updateCheckedIds,
} from '../tree-utils';
import type {
  FetchTreeChildren,
  LazyTreeSource,
  SampleTreeNode,
} from '../tree-utils';

type VirtualTreeProps = {
  source: LazyTreeSource;
  fetchChildren: FetchTreeChildren;
  initialExpandedIds?: string[];
  expandAllVersion?: number;
  height?: number;
  rowHeight?: number;
  selectedIds: string[];
  onSelectedIdsChange: (selectedIds: string[]) => void;
};

type VisibleTreeRow = {
  node: SampleTreeNode;
  depth: number;
};

type VirtualTreeRowData = {
  rows: VisibleTreeRow[];
  expandedIds: Set<string>;
  checkedIds: Set<string>;
  selectedId: string;
  rowHeight: number;
  onCheck: (node: SampleTreeNode, checked: boolean) => void;
  onToggle: (node: SampleTreeNode) => void;
};

const EMPTY_IDS: string[] = [];
const VIRTUAL_OVERSCAN = 8;

function VirtualTreeRow({
  index,
  style,
  rows,
  expandedIds,
  checkedIds,
  selectedId,
  rowHeight,
  onCheck,
  onToggle,
}: RowComponentProps<VirtualTreeRowData>) {
  const row = rows[index];

  if (!row) {
    return null;
  }

  const { node, depth } = row;
  const hasChildren = Boolean(node.hasChildren);
  const expanded = expandedIds.has(node.tree_id);
  const selected = selectedId === node.tree_id;
  const checked = checkedIds.has(node.tree_id);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    onToggle(node);
  };

  const handleCheckboxClick = (event: MouseEvent<HTMLInputElement>) => {
    event.stopPropagation();
  };

  return (
    <div style={style} data-tree-benchmark-row>
      <div
        role="treeitem"
        aria-level={depth + 1}
        aria-expanded={hasChildren ? expanded : undefined}
        tabIndex={0}
        onClick={() => onToggle(node)}
        onKeyDown={handleKeyDown}
        style={{
          alignItems: 'center',
          backgroundColor: selected ? '#e8f0fb' : '#ffffff',
          borderLeft: selected ? '4px solid #2d9bb2' : '4px solid transparent',
          boxSizing: 'border-box',
          color: '#1f1f1f',
          cursor: 'pointer',
          display: 'flex',
          gap: 6,
          height: rowHeight,
          minWidth: '100%',
          overflow: 'hidden',
          paddingLeft: depth * 18 + 8,
          paddingRight: 8,
          whiteSpace: 'nowrap',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: 'inline-flex',
            height: 18,
            justifyContent: 'center',
            lineHeight: '18px',
            transform:
              hasChildren && !expanded ? 'rotate(-90deg)' : 'rotate(0)',
            visibility: hasChildren ? 'visible' : 'hidden',
            width: 18,
          }}
        >
          &gt;
        </span>
        <input
          type="checkbox"
          checked={checked}
          onClick={handleCheckboxClick}
          onChange={(event) => onCheck(node, event.target.checked)}
          style={{ flex: '0 0 auto', margin: 0 }}
        />
        {node.imageUrl ? (
          <img
            alt=""
            src={node.imageUrl}
            style={{
              borderRadius: 6,
              flex: '0 0 auto',
              height: 28,
              objectFit: 'cover',
              width: 28,
            }}
          />
        ) : null}
        <span
          title={node.label}
          style={{
            fontSize: 13,
            lineHeight: '20px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {node.label}
        </span>
      </div>
    </div>
  );
}

export function VirtualTree({
  source,
  fetchChildren,
  initialExpandedIds = EMPTY_IDS,
  expandAllVersion = 0,
  height = 420,
  rowHeight = 44,
  selectedIds,
  onSelectedIdsChange,
}: VirtualTreeProps) {
  const initialExpandedKey = initialExpandedIds.join('|');
  const expandAllAppliedRef = useRef(0);
  const [expandedIds, setExpandedIds] = useState(
    () => new Set(initialExpandedIds)
  );
  const [loadedChildrenById, setLoadedChildrenById] = useState(() =>
    createInitialLoadedChildren(source.childrenByParentId, initialExpandedIds)
  );
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    setExpandedIds(new Set(initialExpandedIds));
    setLoadedChildrenById(
      createInitialLoadedChildren(source.childrenByParentId, initialExpandedIds)
    );
    setSelectedId('');
  }, [source, initialExpandedKey, initialExpandedIds]);

  useEffect(() => {
    if (
      expandAllVersion === 0 ||
      expandAllAppliedRef.current === expandAllVersion
    ) {
      return;
    }

    const allBranchIds = Array.from(source.childrenByParentId.keys());
    expandAllAppliedRef.current = expandAllVersion;
    setExpandedIds(new Set(allBranchIds));
    setLoadedChildrenById(
      createInitialLoadedChildren(source.childrenByParentId, allBranchIds)
    );
  }, [expandAllVersion, source]);

  const handleToggle = useCallback(
    async (node: SampleTreeNode) => {
      setSelectedId(node.tree_id);

      if (!node.hasChildren) {
        return;
      }

      if (!loadedChildrenById[node.tree_id]) {
        const children = await fetchChildren(node.tree_id);
        setLoadedChildrenById((prev) => ({
          ...prev,
          [node.tree_id]: children,
        }));
      }

      setExpandedIds((prev) => {
        const next = new Set(prev);

        if (next.has(node.tree_id)) {
          next.delete(node.tree_id);
        } else {
          next.add(node.tree_id);
        }

        return next;
      });
    },
    [fetchChildren, loadedChildrenById]
  );

  const visibleRows = useMemo(
    () => flattenVisibleRows(source.roots, expandedIds, loadedChildrenById),
    [expandedIds, loadedChildrenById, source.roots]
  );
  const checkedIds = useMemo(() => new Set(selectedIds), [selectedIds]);

  const handleCheck = useCallback(
    (node: SampleTreeNode, checked: boolean) => {
      onSelectedIdsChange(updateCheckedIds(selectedIds, node.tree_id, checked));
    },
    [onSelectedIdsChange, selectedIds]
  );

  const rowProps = useMemo<VirtualTreeRowData>(
    () => ({
      rows: visibleRows,
      expandedIds,
      checkedIds,
      selectedId,
      rowHeight,
      onCheck: handleCheck,
      onToggle: (node: SampleTreeNode) => {
        void handleToggle(node);
      },
    }),
    [
      checkedIds,
      expandedIds,
      handleCheck,
      handleToggle,
      rowHeight,
      selectedId,
      visibleRows,
    ]
  );

  const rowKey = useCallback(
    (index: number, data: VirtualTreeRowData) =>
      data.rows[index]?.node.tree_id ?? index,
    []
  );

  const listStyle = useMemo<CSSProperties>(
    () => ({
      background: '#ffffff',
      border: '1px solid #dde0df',
      boxSizing: 'border-box',
      height,
      overflowX: 'auto',
      width: '100%',
    }),
    [height]
  );

  return (
    <List<VirtualTreeRowData>
      role="tree"
      defaultHeight={height}
      overscanCount={VIRTUAL_OVERSCAN}
      rowComponent={VirtualTreeRow}
      rowCount={visibleRows.length}
      rowHeight={rowHeight}
      rowKey={rowKey}
      rowProps={rowProps}
      style={listStyle}
    />
  );
}
