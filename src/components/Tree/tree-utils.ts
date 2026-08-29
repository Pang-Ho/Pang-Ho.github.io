export type SampleTreeNode = {
  tree_id: string;
  label: string;
  imageUrl?: string;
  checked?: boolean;
  selected?: boolean;
  hasChildren?: boolean;
  children?: SampleTreeNode[];
};

export type LazyTreeSource = {
  roots: SampleTreeNode[];
  childrenByParentId: Map<string, SampleTreeNode[]>;
};

export type FetchTreeChildren = (tree_id: string) => Promise<SampleTreeNode[]>;

export type VisibleTreeRow = {
  node: SampleTreeNode;
  depth: number;
};

export function collectBranchIds(nodes: SampleTreeNode[]): string[] {
  return nodes.flatMap((node) => {
    if (!node.children?.length) {
      return [];
    }

    return [node.tree_id, ...collectBranchIds(node.children)];
  });
}

export function collectTreeNodes(nodes: SampleTreeNode[]): SampleTreeNode[] {
  return nodes.flatMap((node) => [
    node,
    ...collectTreeNodes(node.children ?? []),
  ]);
}

export function countVisibleRows(
  nodes: SampleTreeNode[],
  expandedIds: Set<string>
): number {
  return nodes.reduce((total, node) => {
    if (!node.children?.length || !expandedIds.has(node.tree_id)) {
      return total + 1;
    }

    return total + 1 + countVisibleRows(node.children, expandedIds);
  }, 0);
}

export function updateCheckedIds(
  currentIds: string[],
  tree_id: string,
  checked: boolean
) {
  const nextIds = new Set(currentIds);

  if (checked) {
    nextIds.add(tree_id);
  } else {
    nextIds.delete(tree_id);
  }

  return Array.from(nextIds);
}

export function createLazyTreeSource(nodes: SampleTreeNode[]): LazyTreeSource {
  const childrenByParentId = new Map<string, SampleTreeNode[]>();

  const stripChildren = (node: SampleTreeNode): SampleTreeNode => {
    const children = node.children ?? [];

    if (children.length === 0) {
      return {
        tree_id: node.tree_id,
        label: node.label,
        imageUrl: node.imageUrl,
        checked: node.checked,
        selected: node.selected,
      };
    }

    const strippedChildren = children.map(stripChildren);
    childrenByParentId.set(node.tree_id, strippedChildren);

    return {
      tree_id: node.tree_id,
      label: node.label,
      imageUrl: node.imageUrl,
      checked: node.checked,
      selected: node.selected,
      hasChildren: true,
    };
  };

  return {
    roots: nodes.map(stripChildren),
    childrenByParentId,
  };
}

export async function fetchTreeChildrenFromMap(
  tree_id: string,
  childrenByParentId: Map<string, SampleTreeNode[]>
): Promise<SampleTreeNode[]> {
  await Promise.resolve();
  return childrenByParentId.get(tree_id) ?? [];
}

export function createInitialLoadedChildren(
  childrenByParentId: Map<string, SampleTreeNode[]>,
  initialExpandedIds: string[]
) {
  return initialExpandedIds.reduce<Record<string, SampleTreeNode[]>>(
    (loadedChildren, tree_id) => {
      loadedChildren[tree_id] = childrenByParentId.get(tree_id) ?? [];
      return loadedChildren;
    },
    {}
  );
}

export function flattenVisibleRows(
  nodes: SampleTreeNode[],
  expandedIds: Set<string>,
  loadedChildrenById: Record<string, SampleTreeNode[]>,
  depth = 0
): VisibleTreeRow[] {
  return nodes.flatMap((node) => {
    const row = { node, depth };

    if (!expandedIds.has(node.tree_id)) {
      return [row];
    }

    return [
      row,
      ...flattenVisibleRows(
        loadedChildrenById[node.tree_id] ?? [],
        expandedIds,
        loadedChildrenById,
        depth + 1
      ),
    ];
  });
}
