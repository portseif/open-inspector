import {
  DEFAULT_STRUCTURE_CHILD_LIMIT,
  flattenStructure,
  structureChildren,
  structurePath,
  type StructureNode,
} from '@open-inspector/core';
import type { StructureInfo, StructureRowInfo } from './view-model.js';

/**
 * The state behind the structure drawer: what is expanded, how many children
 * each node lists, and which id stands for which node.
 *
 * Lives with the session rather than the panel, like the override store: the
 * panel renders rows and hands ids back, and this is the one place that turns
 * an id into something on the page.
 */
export interface StructureModel {
  readonly open: boolean;
  setOpen(open: boolean): void;
  setExpanded(id: number, expanded: boolean): void;
  /** List another batch of a node's children. */
  showMore(id: number): void;
  /** Expand everything above an element so its row is listed, and count it as a reveal. */
  reveal(element: Element): void;
  /**
   * The element a row stands for. A shadow-root row stands for its host, which
   * is what there is to highlight or select.
   */
  elementFor(id: number): Element | null;
  /** Rows for the expanded part of the document, with `selected` marked. */
  build(selected: Element | null): StructureInfo;
}

export interface StructureModelOptions {
  /** The inspector's own UI, kept out of the tree. */
  ignore?: (element: Element) => boolean;
  /** How many children a node lists at first, and per "more". */
  childLimit?: number;
  maxRows?: number;
}

const DOCUMENT_FRAGMENT_NODE = 11;

export function createStructureModel(
  doc: Document,
  options: StructureModelOptions = {},
): StructureModel {
  const batch = options.childLimit ?? DEFAULT_STRUCTURE_CHILD_LIMIT;

  let open = false;
  let revealed = 0;

  /** Weak, so a node the page removes is not kept alive by having been expanded. */
  const expanded = new WeakSet<StructureNode>();
  const limits = new WeakMap<StructureNode, number>();

  /**
   * Ids handed to the panel.
   *
   * Stable for a node's lifetime, so Preact keeps each row's DOM — and with it
   * keyboard focus — across repaints. The reverse map only holds what the last
   * build listed: those are the only ids the panel can send back.
   */
  const ids = new WeakMap<StructureNode, number>();
  let nextId = 1;
  const listed = new Map<number, StructureNode>();

  function idFor(node: StructureNode): number {
    let id = ids.get(node);
    if (id === undefined) {
      id = nextId;
      nextId += 1;
      ids.set(node, id);
    }
    return id;
  }

  function limitFor(node: StructureNode): number {
    return limits.get(node) ?? batch;
  }

  // The tree opens at the page's content, as DevTools does.
  expanded.add(doc.documentElement);
  if (doc.body) expanded.add(doc.body);

  return {
    get open() {
      return open;
    },

    setOpen(next) {
      open = next;
    },

    setExpanded(id, next) {
      const node = listed.get(id);
      if (!node) return;
      if (next) expanded.add(node);
      else expanded.delete(node);
    },

    showMore(id) {
      const node = listed.get(id);
      if (node) limits.set(node, limitFor(node) + batch);
    },

    reveal(element) {
      const path = structurePath(element);

      path.forEach((node, index) => {
        expanded.add(node);

        // A selection past its parent's listing limit would be revealed into a
        // row that is not there; list at least as far as it.
        const child = path[index + 1] ?? element;
        const position = structureChildren(node, options.ignore).indexOf(child);
        if (position >= limitFor(node)) limits.set(node, position + 1);
      });

      revealed += 1;
    },

    elementFor(id) {
      const node = listed.get(id);
      if (!node) return null;
      return node.nodeType === DOCUMENT_FRAGMENT_NODE ? (node as ShadowRoot).host : (node as Element);
    },

    build(selected) {
      listed.clear();

      const listing = flattenStructure(doc.documentElement, {
        isExpanded: (node) => expanded.has(node),
        childLimit: limitFor,
        ...(options.ignore ? { ignore: options.ignore } : {}),
        ...(options.maxRows !== undefined ? { maxRows: options.maxRows } : {}),
      });

      const rows = listing.rows.map((row): StructureRowInfo => {
        if (row.kind === 'more') {
          return {
            id: idFor(row.parent),
            kind: 'more',
            depth: row.depth,
            label: `${row.hidden} more`,
            expandable: false,
            expanded: false,
            hidden: row.hidden,
          };
        }

        const id = idFor(row.node);
        listed.set(id, row.node);

        const info: StructureRowInfo = {
          id,
          kind: row.kind,
          depth: row.depth,
          label: row.label,
          expandable: row.expandable,
          expanded: row.expanded,
        };
        if (row.text) info.text = row.text;
        if (row.address) info.address = row.address;
        return info;
      });

      const selectedId = selected ? (ids.get(selected) ?? null) : null;

      return {
        rows,
        selectedId: selectedId !== null && listed.has(selectedId) ? selectedId : null,
        revealed,
        truncated: listing.truncated,
      };
    },
  };
}
