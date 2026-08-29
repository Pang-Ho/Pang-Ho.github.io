import React, { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';

import { PlainTreeInner, TreeViewport } from '../shared';
import type { SampleTreeNode } from '../tree-utils';

type TreeProps = {
  nodes: SampleTreeNode[];
  expandedIds?: string[];
  expandAllVersion?: number;
  height?: number;
  maxDepth?: number;
  selectedIds?: string[];
  onCheckedChange?: (tree_id: string, checked: boolean) => void;
};

type TreeNodeProps = {
  node: SampleTreeNode;
  depth: number;
  maxDepth: number;
  activeId: string;
  checkedIds: Set<string>;
  openIds: Set<string>;
  setActiveId: (tree_id: string) => void;
  setOpenIds: (updater: (prev: Set<string>) => Set<string>) => void;
  onCheckedChange?: (tree_id: string, checked: boolean) => void;
};

const EMPTY_IDS: string[] = [];

function TreeNode({
  node,
  depth,
  maxDepth,
  activeId,
  checkedIds,
  openIds,
  setActiveId,
  setOpenIds,
  onCheckedChange,
}: TreeNodeProps) {
  const children = node.children ?? [];
  const hasChildren = children.length > 0 && depth < maxDepth;
  const expanded = hasChildren && openIds.has(node.tree_id);
  const selected = activeId === node.tree_id || node.selected;
  const checked = checkedIds.has(node.tree_id) || Boolean(node.checked);

  const toggleNode = () => {
    setActiveId(node.tree_id);

    if (!hasChildren) {
      return;
    }

    setOpenIds((prev) => {
      const next = new Set(prev);

      if (next.has(node.tree_id)) {
        next.delete(node.tree_id);
      } else {
        next.add(node.tree_id);
      }

      return next;
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    toggleNode();
  };

  const handleCheckboxClick = (event: MouseEvent<HTMLInputElement>) => {
    event.stopPropagation();
  };

  return (
    <div data-tree-row>
      <div
        role="treeitem"
        aria-expanded={hasChildren ? expanded : undefined}
        tabIndex={0}
        onClick={toggleNode}
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
          minHeight: 34,
          minWidth: 'max-content',
          padding: '4px 8px 4px 0',
          whiteSpace: 'nowrap',
        }}
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
          onChange={(event) =>
            onCheckedChange?.(node.tree_id, event.target.checked)
          }
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
          {node.label}
        </span>
      </div>
      {expanded
        ? children.map((child) => (
            <TreeNode
              key={child.tree_id}
              node={child}
              depth={depth + 1}
              maxDepth={maxDepth}
              activeId={activeId}
              checkedIds={checkedIds}
              openIds={openIds}
              setActiveId={setActiveId}
              setOpenIds={setOpenIds}
              onCheckedChange={onCheckedChange}
            />
          ))
        : null}
    </div>
  );
}

export function Tree({
  nodes,
  expandedIds = EMPTY_IDS,
  expandAllVersion = 0,
  height = 420,
  maxDepth = 8,
  selectedIds = EMPTY_IDS,
  onCheckedChange,
}: TreeProps) {
  const expandedKey = expandedIds.join('|');
  const [activeId, setActiveId] = useState('');
  const [openIds, setOpenIds] = useState(() => new Set(expandedIds));
  const checkedIds = useMemo(() => new Set(selectedIds), [selectedIds]);

  useEffect(() => {
    if (expandAllVersion === 0) {
      return;
    }

    setOpenIds(new Set(expandedIds));
  }, [expandedKey, expandAllVersion, expandedIds]);

  return (
    <TreeViewport role="tree" $height={height}>
      <PlainTreeInner>
        {nodes.map((node) => (
          <TreeNode
            key={node.tree_id}
            node={node}
            depth={0}
            maxDepth={maxDepth}
            activeId={activeId}
            checkedIds={checkedIds}
            openIds={openIds}
            setActiveId={setActiveId}
            setOpenIds={setOpenIds}
            onCheckedChange={onCheckedChange}
          />
        ))}
      </PlainTreeInner>
    </TreeViewport>
  );
}
