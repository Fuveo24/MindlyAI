import type { MindEdge, MindNode } from "./types";

/**
 * Converts the mind map graph into a structured Markdown document and
 * triggers a browser download.
 */
export function exportMarkdown(
  nodes: MindNode[],
  edges: MindEdge[],
  mapTitle: string,
): void {
  const md = buildMarkdown(nodes, edges, mapTitle);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${mapTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "mindmap"}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function buildMarkdown(
  nodes: MindNode[],
  edges: MindEdge[],
  mapTitle: string,
): string {
  const lines: string[] = [];
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Build adjacency: parentId → childIds
  const children = new Map<string, string[]>();
  const hasParent = new Set<string>();
  for (const e of edges) {
    if (!children.has(e.source)) children.set(e.source, []);
    children.get(e.source)!.push(e.target);
    hasParent.add(e.target);
  }
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // --- Header ---
  lines.push(`# ${mapTitle}`);
  lines.push(`_Exported from Mindly on ${date}_`);
  lines.push("");

  // --- Table of contents (top-level nodes only) ---
  const topLevel = nodes.filter((n) => !hasParent.has(n.id));
  if (topLevel.length > 1) {
    lines.push("## Contents");
    for (const n of topLevel) {
      lines.push(`- [${n.data.title}](#${slugify(n.data.title)})`);
    }
    lines.push("");
  }

  // --- Render each tree recursively ---
  function renderNode(n: MindNode, depth: number) {
    const d = n.data;
    const hashes = "#".repeat(Math.min(depth + 2, 6));
    const kindBadge = d.kind !== "root" && d.kind !== "idea"
      ? ` \`${d.kind.toUpperCase()}\``
      : "";

    lines.push(`${hashes} ${d.title}${kindBadge}`);

    if ("description" in d && d.description) {
      lines.push(`> ${d.description}`);
      lines.push("");
    }

    // Kind-specific fields
    if (d.kind === "task") {
      const status = d.status ?? (d.done ? "done" : "todo");
      const priority = d.priority ?? "";
      const meta: string[] = [`**Status:** ${status}`];
      if (priority) meta.push(`**Priority:** ${priority}`);
      if (d.dueAt) meta.push(`**Due:** ${new Date(d.dueAt).toLocaleDateString()}`);
      if (d.progress != null && d.progress > 0) meta.push(`**Progress:** ${d.progress}%`);
      lines.push(meta.join(" · "));
      lines.push("");
    }

    if (d.kind === "budget") {
      const sym = d.currency === "EUR" ? "€" : d.currency === "GBP" ? "£" : "$";
      lines.push(`**Amount:** ${sym}${(d.amount ?? 0).toLocaleString()} ${d.currency ?? "USD"}`);
      lines.push("");
    }

    if (d.kind === "place" && d.location) {
      lines.push(`**Location:** ${d.location}`);
      lines.push("");
    }

    if (d.kind === "event") {
      if (d.startAt) lines.push(`**Date:** ${new Date(d.startAt).toLocaleString()}`);
      if (d.location) lines.push(`**Location:** ${d.location}`);
      lines.push("");
    }

    // Recurse into children
    const kids = (children.get(n.id) ?? [])
      .map((id) => nodeMap.get(id))
      .filter(Boolean) as MindNode[];

    for (const kid of kids) {
      renderNode(kid, depth + 1);
    }
  }

  for (const node of topLevel) {
    renderNode(node, 0);
    lines.push("---");
    lines.push("");
  }

  // --- Standalone nodes (no edges at all) ---
  const connected = new Set([...hasParent, ...[...children.keys()]]);
  const orphans = nodes.filter(
    (n) => !connected.has(n.id) && n.data.kind !== "root",
  );
  if (orphans.length) {
    lines.push("## Unconnected nodes");
    for (const n of orphans) {
      lines.push(`- **${n.data.title}** (\`${n.data.kind}\`)`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
