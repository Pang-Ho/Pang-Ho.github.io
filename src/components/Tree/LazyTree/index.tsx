import React, {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';

import { PlainTreeInner, TreeViewport } from '../shared';
import type { FetchTreeChildren, SampleTreeNode } from '../tree-utils';

type Listener = () => void;

type SelectedNodeStore = {
  getSelectedId: () => string;
  setSelectedId: (tree_id: string) => void;
  subscribe: (tree_id: string, listener: Listener) => () => void;
};

type LazyTreeProps = {
  nodes: SampleTreeNode[];
  fetchChildren: FetchTreeChildren;
  expandedIds?: string[];
  expandAllVersion?: number;
  height?: number;
  maxDepth?: number;
  selectedIds?: string[];
  onCheckedChange?: (tree_id: string, checked: boolean) => void;
};

type LazyTreeNodeProps = {
  node: SampleTreeNode;
  depth: number;
  expandedIds: string[];
  expandAllVersion: number;
  fetchChildren: FetchTreeChildren;
  maxDepth: number;
  selectedIds: string[];
  selectedStore: SelectedNodeStore;
  onCheckedChange?: (tree_id: string, checked: boolean) => void;
};

const EMPTY_IDS: string[] = [];

function createSelectedNodeStore(): SelectedNodeStore {
  let selectedId = '';
  const listenersById = new Map<string, Set<Listener>>();

  return {
    getSelectedId: () => selectedId,
    setSelectedId: (tree_id: string) => {
      if (selectedId === tree_id) {
        return;
      }

      const previousId = selectedId;
      selectedId = tree_id;

      listenersById.get(previousId)?.forEach((listener) => listener());
      listenersById.get(tree_id)?.forEach((listener) => listener());
    },
    subscribe: (tree_id: string, listener: Listener) => {
      const listeners = listenersById.get(tree_id) ?? new Set<Listener>();
      listeners.add(listener);
      listenersById.set(tree_id, listeners);

      return () => {
        listeners.delete(listener);

        if (listeners.size === 0) {
          listenersById.delete(tree_id);
        }
      };
    },
  };
}

function useSelectedNode(selectedStore: SelectedNodeStore, tree_id: string) {
  return useSyncExternalStore(
    (listener) => selectedStore.subscribe(tree_id, listener),
    () => selectedStore.getSelectedId() === tree_id,
    () => false
  );
}

function LazyTreeNodeComponent({
  node,
  depth,
  expandedIds,
  expandAllVersion,
  fetchChildren,
  maxDepth,
  selectedIds,
  selectedStore,
  onCheckedChange,
}: LazyTreeNodeProps) {
  const selected = useSelectedNode(selectedStore, node.tree_id);
  const [expanded, setExpanded] = useState(expandedIds.includes(node.tree_id));
  const [checked, setChecked] = useState(
    selectedIds.includes(node.tree_id) || Boolean(node.checked)
  );
  const [children, setChildren] = useState<SampleTreeNode[]>(
    () => node.children ?? []
  );
  const [loaded, setLoaded] = useState(Boolean(node.children?.length));
  const [loading, setLoading] = useState(false);
  const expandAllRequestRef = useRef(0);
  const hasChildren = Boolean(node.hasChildren || children.length > 0);

  useEffect(() => {
    setChecked(selectedIds.includes(node.tree_id) || Boolean(node.checked));
  }, [node.checked, node.tree_id, selectedIds]);

  const openNode = useCallback(async () => {
    if (!hasChildren || depth >= maxDepth || loading) {
      return;
    }

    if (loaded) {
      setExpanded(true);
      return;
    }

    setLoading(true);

    try {
      const fetchedChildren = await fetchChildren(node.tree_id);
      setChildren(fetchedChildren);
      setLoaded(true);
      setExpanded(true);
    } finally {
      setLoading(false);
    }
  }, [
    depth,
    fetchChildren,
    hasChildren,
    loaded,
    loading,
    maxDepth,
    node.tree_id,
  ]);

  useEffect(() => {
    if (
      expandAllVersion === 0 ||
      expandAllRequestRef.current === expandAllVersion ||
      !expandedIds.includes(node.tree_id)
    ) {
      return;
    }

    expandAllRequestRef.current = expandAllVersion;
    void openNode();
  }, [expandedIds, expandAllVersion, node.tree_id, openNode]);

  const toggleNode = useCallback(async () => {
    selectedStore.setSelectedId(node.tree_id);

    if (!hasChildren || depth >= maxDepth || loading) {
      return;
    }

    if (expanded) {
      setExpanded(false);
      return;
    }

    await openNode();
  }, [
    depth,
    expanded,
    hasChildren,
    loading,
    maxDepth,
    node.tree_id,
    openNode,
    selectedStore,
  ]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    void toggleNode();
  };

  const handleCheckboxClick = (event: MouseEvent<HTMLInputElement>) => {
    event.stopPropagation();
  };

  const handleCheckChange = (nextChecked: boolean) => {
    setChecked(nextChecked);
    onCheckedChange?.(node.tree_id, nextChecked);
  };

  return (
    <div
      data-lazy-tree-row
      style={{ cursor: 'pointer', minWidth: 'max-content' }}
    >
      <div
        role="treeitem"
        aria-expanded={hasChildren ? expanded : undefined}
        tabIndex={0}
        onClick={() => void toggleNode()}
        onKeyDown={handleKeyDown}
        style={{
          alignItems: 'center',
          backgroundColor: selected || node.selected ? '#e8f0fb' : '#ffffff',
          borderLeft:
            selected || node.selected
              ? '4px solid #2d9bb2'
              : '4px solid transparent',
          boxSizing: 'border-box',
          color: '#1f1f1f',
          display: 'flex',
          justifyContent: 'space-between',
          minHeight: 34,
          padding: '4px 8px 4px 0',
          whiteSpace: 'nowrap',
        }}
      >
        <div
          style={{ alignItems: 'center', display: 'flex', gap: 6, height: 28 }}
        >
          <span style={{ display: 'inline-block', width: depth * 18 + 8 }} />
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
            onChange={(event) => handleCheckChange(event.target.checked)}
            style={{ margin: 0 }}
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
            {loading ? `${node.label} loading...` : node.label}
          </span>
        </div>
      </div>
      {expanded
        ? children.map((child) => (
            <LazyTreeNode
              key={child.tree_id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              expandAllVersion={expandAllVersion}
              fetchChildren={fetchChildren}
              maxDepth={maxDepth}
              selectedIds={selectedIds}
              selectedStore={selectedStore}
              onCheckedChange={onCheckedChange}
            />
          ))
        : null}
    </div>
  );
}

const LazyTreeNode = memo(LazyTreeNodeComponent);
LazyTreeNode.displayName = 'LazyTreeNode';

export function LazyTree({
  nodes,
  fetchChildren,
  expandedIds = EMPTY_IDS,
  expandAllVersion = 0,
  height = 420,
  maxDepth = 8,
  selectedIds = EMPTY_IDS,
  onCheckedChange,
}: LazyTreeProps) {
  const selectedStoreRef = useRef(createSelectedNodeStore());

  return (
    <TreeViewport role="tree" $height={height}>
      <PlainTreeInner>
        {nodes.map((node) => (
          <LazyTreeNode
            key={node.tree_id}
            node={node}
            depth={0}
            expandedIds={expandedIds}
            expandAllVersion={expandAllVersion}
            fetchChildren={fetchChildren}
            maxDepth={maxDepth}
            selectedIds={selectedIds}
            selectedStore={selectedStoreRef.current}
            onCheckedChange={onCheckedChange}
          />
        ))}
      </PlainTreeInner>
    </TreeViewport>
  );
}
