# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **zero-dependency, standalone React app** for managing an AI Integration Map — a hierarchical registry of applications, features, and AI agents. There is no build step, no package manager, and no server required.

## Running the App

Open `definian-ai-map.html` directly in any browser. React 18 and Babel are loaded via CDN; JSX is compiled in-browser at runtime.

## Architecture

The project has two files that must stay in sync:

- **`src/app.jsx`** — canonical source (701 lines). Edit this for code changes.
- **`definian-ai-map.html`** — self-contained distribution artifact with React, Babel, and the full app embedded. This is what users actually open.

After editing `src/app.jsx`, the `definian-ai-map.html` must be updated. Users do this via the in-app **⬇ Export HTML** button, which regenerates the file. Alternatively, the JSX content in `app.jsx` can be pasted into the `<script type="text/babel">` block inside the HTML file.

## Data Model

Nodes form a tree with arbitrary depth. Each node has these fields:

```js
{ id, name, description, status, owner, nodeType, model, buildType, aiType, trainingRequired, children[] }
```

**Enums:**
- `status`: `"Completed"` | `"In Progress"` | `"Not Started"`
- `nodeType`: `"Application"` | `"Feature"` | `"Module"` | `"Integration"` | `"AI Agent"`
- `buildType`: `"Local LLM API"` | `"Claude Project"` | `"Web LLM API"`

## Extending Fields

To add new fields without touching component logic, add entries to the `EXTRA_FIELDS` array (lines 36–55 in `app.jsx`):

```js
{ key: "priority", label: "Priority", type: "select", options: ["—","High","Medium","Low"], defaultValue: "—" }
```

Each entry supports `type: "select"` (dropdown) or `type: "text"` (free input).

## Key Functions

- `updateNode(tree, id, update)` — immutably updates a node by id
- `deleteNode(tree, id)` — recursively removes a node and all descendants
- `addChild(tree, parentId, child)` — inserts a child under a given parent
- `moveChild(tree, id, direction)` — reorders siblings (`"up"` or `"down"`)
- `buildExportHTML(data, extraFields)` — serializes current state into a new standalone HTML string for download

## Styling

Inline styles are used throughout (no CSS framework or external stylesheet). Colors follow Definian brand standards: `#02072D` background, `#0D2C71` secondary, `#00AB63` green accent. Depth-based visual hierarchy: root nodes render green, level-1 blue, deeper nodes gray.

## Workflow

The intended edit cycle is:
1. Open `definian-ai-map.html` in a browser
2. Edit nodes using the UI
3. Click **⬇ Export HTML** to download the updated file
4. Replace `definian-ai-map.html` in the repo and push to GitHub
