import { useState, useMemo } from "react";

const BRAND = {
  blue: "#0D2C71", green: "#00AB63", midnight: "#02072D",
  darkGray: "#3C405B", coolGray: "#D8D7EE", white: "#FFFFFF",
  blueLight: "#1a3d8f", greenDark: "#008a4f", midnightLight: "#0a1240",
};

const STATUS_CONFIG = {
  "Completed":   { bg: "#003d24", text: "#00AB63", dot: "#00AB63", border: "#00AB63" },
  "In Progress": { bg: "#2a1e00", text: "#f5c842", dot: "#f5c842", border: "#f5c842" },
  "Not Started": { bg: "#1e2035", text: "#D8D7EE", dot: "#6b7280", border: "#3C405B" },
};
const BUILD_CONFIG = {
  "Local LLM API": { icon: "🖥️", color: "#7c6af5" },
  "Claude Project": { icon: "🔷", color: "#00AB63" },
  "Web LLM API":    { icon: "🌐", color: "#4a90d9" },
  "—":              { icon: "", color: "transparent" },
};

// ── Node types ────────────────────────────────────────────────────────────────
// Defines the types of nodes that can exist in the hierarchy.
// Every node has a nodeType that controls its badge color and which fields are shown.
const NODE_TYPE_CONFIG = {
  "Application": { icon: "🏗️", color: "#4a90d9" },
  "Feature":     { icon: "⚙️", color: "#a78bfa" },
  "Module":      { icon: "📦", color: "#f59e0b" },
  "Integration": { icon: "🔗", color: "#e879a0" },
  "AI Agent":    { icon: "🤖", color: "#00AB63" },
};

// ── Extensible extra fields ────────────────────────────────────────────────────
// These fields are only shown for "AI Agent" nodes (in forms and display).
// Add entries here to introduce additional AI-specific fields automatically.
// type: "select" renders a dropdown; "text" renders a free-text input.
const EXTRA_FIELDS = [
  {
    key: "aiType",
    label: "AI Type",
    type: "select",
    options: ["—", "Gen AI", "Agentic AI", "ML", "NLP", "Computer Vision", "Rule-Based"],
    icon: "🧠",
    defaultValue: "—",
  },
  {
    key: "trainingRequired",
    label: "Training/Context Req.",
    type: "select",
    options: ["—", "Yes – Training", "Yes – Context", "No"],
    icon: "🎓",
    defaultValue: "—",
  },
  // To add more AI-specific fields, append an object here, e.g.:
  // { key: "priority", label: "Priority", type: "select", options: ["—","High","Medium","Low"], icon: "⚡", defaultValue: "—" },
];

let nextId = 100;
const makeId = () => `node_${nextId++}`;
const BLANK = {
  name: "", description: "", status: "Not Started", owner: "", nodeType: "AI Agent",
  model: "", buildType: "—",
  ...Object.fromEntries(EXTRA_FIELDS.map(f => [f.key, f.defaultValue])),
  children: [],
};

function updateNode(tree, id, u) { if (tree.id === id) return { ...tree, ...u }; return { ...tree, children: tree.children.map(c => updateNode(c, id, u)) }; }
function deleteNode(tree, id) { return { ...tree, children: tree.children.filter(c => c.id !== id).map(c => deleteNode(c, id)) }; }
function addChild(tree, pid, child) { if (tree.id === pid) return { ...tree, children: [...tree.children, child] }; return { ...tree, children: tree.children.map(c => addChild(c, pid, child)) }; }
function moveChild(tree, id, dir) {
  const idx = tree.children.findIndex(c => c.id === id);
  if (idx !== -1) {
    const ni = dir === "up" ? idx - 1 : idx + 1;
    if (ni < 0 || ni >= tree.children.length) return tree;
    const ch = [...tree.children];
    [ch[idx], ch[ni]] = [ch[ni], ch[idx]];
    return { ...tree, children: ch };
  }
  return { ...tree, children: tree.children.map(c => moveChild(c, id, dir)) };
}
function getAllNodes(n, a = []) { a.push(n); n.children?.forEach(c => getAllNodes(c, a)); return a; }
function getAllOwners(n, s = new Set()) { if (n.owner && n.owner !== "—") s.add(n.owner); n.children?.forEach(c => getAllOwners(c, s)); return s; }

const initialData = {
  id: "root", name: "Data Platform", description: "Central hub for all AI integrations", status: "In Progress", owner: "Platform Team", nodeType: "Application", model: "—", buildType: "—", aiType: "—", trainingRequired: "—",
  children: [
    {
      id: "ingestion", name: "Data Ingestion", description: "Pipeline ingestion feature for ETL workflows", status: "In Progress", owner: "Data Eng", nodeType: "Feature", model: "—", buildType: "—", aiType: "—", trainingRequired: "—",
      children: [
        { id: "schema", name: "Schema Detector", description: "Automatically detects and maps incoming data schemas", status: "Completed", owner: "Alice", nodeType: "AI Agent", model: "GPT-4o", buildType: "Web LLM API", aiType: "Gen AI", trainingRequired: "No", children: [] },
        { id: "cleaner", name: "Data Cleaner", description: "Identifies and resolves data quality issues in real-time", status: "In Progress", owner: "Bob", nodeType: "AI Agent", model: "Claude Sonnet", buildType: "Claude Project", aiType: "Agentic AI", trainingRequired: "Yes – Context", children: [] },
      ],
    },
    {
      id: "analytics", name: "Analytics", description: "AI-powered analytics and insight generation feature", status: "In Progress", owner: "Analytics Team", nodeType: "Feature", model: "—", buildType: "—", aiType: "—", trainingRequired: "—",
      children: [
        { id: "nlq", name: "NL Query Agent", description: "Translates natural language questions into SQL queries", status: "Completed", owner: "Carol", nodeType: "AI Agent", model: "Claude Opus", buildType: "Claude Project", aiType: "Gen AI", trainingRequired: "Yes – Context", children: [] },
        { id: "anomaly", name: "Anomaly Detector", description: "Flags statistical anomalies in streaming data", status: "In Progress", owner: "Dave", nodeType: "AI Agent", model: "Llama 3", buildType: "Local LLM API", aiType: "ML", trainingRequired: "Yes – Training", children: [] },
        { id: "forecast", name: "Forecasting Agent", description: "Generates predictive models for KPI forecasting", status: "Not Started", owner: "Eve", nodeType: "AI Agent", model: "GPT-4o", buildType: "Web LLM API", aiType: "ML", trainingRequired: "Yes – Training", children: [] },
      ],
    },
    {
      id: "governance", name: "Governance", description: "Data quality, compliance, and lineage feature", status: "Not Started", owner: "Governance Team", nodeType: "Feature", model: "—", buildType: "—", aiType: "—", trainingRequired: "—",
      children: [
        { id: "pii", name: "PII Redactor", description: "Scans and redacts personally identifiable information", status: "Not Started", owner: "Frank", nodeType: "AI Agent", model: "Claude Haiku", buildType: "Claude Project", aiType: "NLP", trainingRequired: "No", children: [] },
        { id: "lineage", name: "Lineage Tracer", description: "Tracks data lineage across the entire platform", status: "Not Started", owner: "Grace", nodeType: "AI Agent", model: "Mistral", buildType: "Local LLM API", aiType: "Rule-Based", trainingRequired: "No", children: [] },
      ],
    },
    {
      id: "client_portal", name: "Client Portal", description: "Customer-facing portal for data management operations", status: "Not Started", owner: "", nodeType: "Application", model: "—", buildType: "—", aiType: "—", trainingRequired: "—",
      children: [
        { id: "data_mapping", name: "Data Mapping", description: "Maps and transforms data fields between source and target schemas", status: "Not Started", owner: "", nodeType: "Feature", model: "—", buildType: "—", aiType: "—", trainingRequired: "—", children: [] },
        { id: "deduplication", name: "Deduplication", description: "Identifies and removes duplicate records across datasets", status: "Not Started", owner: "", nodeType: "Feature", model: "—", buildType: "—", aiType: "—", trainingRequired: "—", children: [] },
        { id: "data_validation", name: "Data Validation", description: "Validates data quality and conformance to business rules", status: "Not Started", owner: "", nodeType: "Feature", model: "—", buildType: "—", aiType: "—", trainingRequired: "—", children: [] },
        { id: "error_mgmt", name: "Error Management", description: "Tracks, categorizes, and resolves data processing errors", status: "Not Started", owner: "", nodeType: "Feature", model: "—", buildType: "—", aiType: "—", trainingRequired: "—", children: [] },
        { id: "compare_recon", name: "Compare/Recon", description: "Compares and reconciles data between source and target systems", status: "Not Started", owner: "", nodeType: "Feature", model: "—", buildType: "—", aiType: "—", trainingRequired: "—", children: [] },
      ],
    },
    {
      id: "exec_platform", name: "Execution Platform", description: "Core platform for running and orchestrating data workloads", status: "Not Started", owner: "", nodeType: "Application", model: "—", buildType: "—", aiType: "—", trainingRequired: "—",
      children: [
        { id: "codeforge", name: "CodeForge", description: "Code generation and transformation engine", status: "Not Started", owner: "", nodeType: "Application", model: "—", buildType: "—", aiType: "—", trainingRequired: "—", children: [] },
        { id: "mapmaestro", name: "MapMaestro", description: "Visual data mapping and orchestration application", status: "Not Started", owner: "", nodeType: "Application", model: "—", buildType: "—", aiType: "—", trainingRequired: "—", children: [] },
        { id: "applaud", name: "Applaud", description: "Workflow approval and audit management application", status: "Not Started", owner: "", nodeType: "Application", model: "—", buildType: "—", aiType: "—", trainingRequired: "—", children: [] },
      ],
    },
  ],
};

const inputStyle = { background: "#0a1240", border: "1px solid #3C405B", borderRadius: 6, padding: "5px 9px", fontSize: 12, color: "#FFFFFF", fontFamily: "Roboto,sans-serif", outline: "none", width: 160 };
const selectStyle = { ...inputStyle, width: "auto", minWidth: 140, cursor: "pointer" };

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 11, color: "#D8D7EE", fontFamily: "Roboto,sans-serif" }}>
      <span style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontSize: 10, color: "#00AB63" }}>{label}</span>
      {children}
    </label>
  );
}

function Btn({ onClick, primary, children }) {
  const [h, sH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => sH(true)} onMouseLeave={() => sH(false)}
      style={{ background: primary ? (h ? "#008a4f" : "#00AB63") : (h ? "#3C405B" : "#1e2240"), color: primary ? "#02072D" : "#D8D7EE", border: "none", borderRadius: 7, padding: "6px 16px", fontSize: 12, cursor: "pointer", fontWeight: 700, fontFamily: "Roboto,sans-serif", transition: "background 0.15s" }}>
      {children}
    </button>
  );
}

function ActionBtn({ onClick, title, danger, disabled, children }) {
  const [h, sH] = useState(false);
  return (
    <button onClick={onClick} title={title} disabled={disabled}
      onMouseEnter={() => sH(true)} onMouseLeave={() => sH(false)}
      style={{ background: h && !disabled ? (danger ? "#3d0a0a" : "#3C405B") : "transparent", border: `1px solid ${danger ? "#7f1d1d" : "#3C405B"}`, borderRadius: 6, padding: "2px 7px", fontSize: 12, cursor: disabled ? "default" : "pointer", color: disabled ? "#3C405B" : (danger ? "#f87171" : "#D8D7EE"), transition: "background 0.15s", opacity: disabled ? 0.4 : 1 }}>
      {children}
    </button>
  );
}

function NodeCard({ node, depth, filters, onEdit, onDelete, onAddChild, onMove, siblingIndex, siblingCount, isRoot }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ ...node });
  const [newNode, setNewNode] = useState({ ...BLANK });
  const hasChildren = node.children?.length > 0;
  const sc = STATUS_CONFIG[node.status] || STATUS_CONFIG["Not Started"];
  const bc = BUILD_CONFIG[node.buildType] || BUILD_CONFIG["—"];
  const ntc = NODE_TYPE_CONFIG[node.nodeType] || NODE_TYPE_CONFIG["AI Agent"];
  const depthAccent = depth === 0 ? BRAND.green : depth === 1 ? BRAND.blue : BRAND.darkGray;
  const headerBg = depth === 0 ? BRAND.midnightLight : depth === 1 ? "#071040" : "#0d1535";

  // Show/hide AI-specific fields based on nodeType in forms
  const editIsAgent = (form.nodeType || "AI Agent") === "AI Agent";
  const newIsAgent  = (newNode.nodeType || "AI Agent") === "AI Agent";

  function nodePassesFilters(n) {
    const selfPass =
      (!filters.status   || n.status === filters.status) &&
      (!filters.owner    || n.owner === filters.owner) &&
      (!filters.buildType || n.buildType === filters.buildType) &&
      (!filters.nodeType || (n.nodeType || "AI Agent") === filters.nodeType);
    if (!n.children || n.children.length === 0) return selfPass;
    // For parent nodes: show if self matches OR any descendant matches
    return selfPass || n.children.some(c => nodePassesFilters(c));
  }
  if (!nodePassesFilters(node)) return null;

  function saveEdit() { onEdit(node.id, form); setEditing(false); }
  function saveNew() { if (!newNode.name.trim()) return; onAddChild(node.id, { ...newNode, id: makeId() }); setNewNode({ ...BLANK }); setAdding(false); setExpanded(true); }

  const isFirst = siblingIndex === 0;
  const isLast  = siblingIndex === siblingCount - 1;

  return (
    <div style={{ marginLeft: depth === 0 ? 0 : 20, marginTop: 8 }}>
      <div style={{ border: `1.5px solid ${depthAccent}`, borderRadius: 10, background: BRAND.midnightLight, boxShadow: "0 2px 16px rgba(0,0,0,0.4)", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", background: headerBg, cursor: hasChildren ? "pointer" : "default", userSelect: "none", borderBottom: `1px solid ${BRAND.darkGray}22` }} onClick={() => hasChildren && setExpanded(e => !e)}>
          {hasChildren && <span style={{ fontSize: 13, color: depthAccent, minWidth: 14 }}>{expanded ? "▾" : "▸"}</span>}
          {/* Node type icon prefix */}
          <span style={{ fontSize: 14, lineHeight: 1 }}>{ntc.icon}</span>
          <span style={{ fontFamily: "'Titillium Web',sans-serif", fontWeight: 700, fontSize: depth === 0 ? 17 : 14, color: BRAND.white, flex: 1 }}>{node.name}</span>
          {/* Node type badge */}
          <span style={{ color: ntc.color, border: `1px solid ${ntc.color}44`, borderRadius: 99, padding: "2px 8px", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap", fontFamily: "Roboto,sans-serif", background: `${ntc.color}12` }}>
            {node.nodeType || "AI Agent"}
          </span>
          {/* Status badge */}
          <span style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}44`, borderRadius: 99, padding: "2px 10px", fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap", fontFamily: "Roboto,sans-serif" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: sc.dot }} />
            {node.status}
          </span>
          <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
            {!isRoot && (
              <>
                <ActionBtn onClick={() => onMove(node.id, "up")} title="Move up" disabled={isFirst}>↑</ActionBtn>
                <ActionBtn onClick={() => onMove(node.id, "down")} title="Move down" disabled={isLast}>↓</ActionBtn>
              </>
            )}
            <ActionBtn onClick={() => { setEditing(e => !e); setForm({ ...node }); }} title="Edit">✏️</ActionBtn>
            <ActionBtn onClick={() => setAdding(a => !a)} title="Add child">＋</ActionBtn>
            {!isRoot && <ActionBtn onClick={() => { if (window.confirm(`Delete "${node.name}" and all its children?`)) onDelete(node.id); }} title="Delete" danger>🗑</ActionBtn>}
          </div>
        </div>

        {/* Display view */}
        {!editing && (
          <div style={{ padding: "8px 14px 10px", fontSize: 12, color: BRAND.coolGray, display: "flex", flexWrap: "wrap", gap: "5px 18px", fontFamily: "Roboto,sans-serif" }}>
            <span style={{ color: "#a0a9c8" }}>📝 {node.description}</span>
            <span>👤 <b style={{ color: BRAND.white }}>{node.owner}</b></span>
            {/* AI-specific fields only shown when present */}
            {node.model !== "—" && node.model && <span>🤖 <b style={{ color: BRAND.white }}>{node.model}</b></span>}
            {node.buildType !== "—" && node.buildType && <span style={{ color: bc.color }}>{bc.icon} <b>{node.buildType}</b></span>}
            {EXTRA_FIELDS.map(f => {
              const val = node[f.key];
              if (!val || val === "—") return null;
              return <span key={f.key}>{f.icon} <b style={{ color: BRAND.white }}>{val}</b></span>;
            })}
          </div>
        )}

        {/* Edit form */}
        {editing && (
          <div style={{ padding: "12px 14px", background: "#040d2a", display: "flex", flexWrap: "wrap", gap: 10, borderTop: `1px solid ${BRAND.darkGray}` }} onClick={e => e.stopPropagation()}>
            <Field label="Name"><input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
            <Field label="Node Type">
              <select style={selectStyle} value={form.nodeType || "AI Agent"} onChange={e => setForm(f => ({ ...f, nodeType: e.target.value }))}>
                {Object.keys(NODE_TYPE_CONFIG).map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Description"><input style={{ ...inputStyle, width: 220 }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></Field>
            <Field label="Owner"><input style={inputStyle} value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} /></Field>
            <Field label="Status">
              <select style={selectStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {Object.keys(STATUS_CONFIG).map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            {/* AI Agent-specific fields */}
            {editIsAgent && (
              <>
                <Field label="Model"><input style={inputStyle} value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} placeholder="e.g. GPT-4o" /></Field>
                <Field label="Build Type">
                  <select style={selectStyle} value={form.buildType} onChange={e => setForm(f => ({ ...f, buildType: e.target.value }))}>
                    {Object.keys(BUILD_CONFIG).map(s => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                {EXTRA_FIELDS.map(f => (
                  <Field key={f.key} label={f.label}>
                    {f.type === "select" ? (
                      <select style={selectStyle} value={form[f.key] ?? f.defaultValue} onChange={e => setForm(ff => ({ ...ff, [f.key]: e.target.value }))}>
                        {f.options.map(o => <option key={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input style={inputStyle} value={form[f.key] ?? ""} onChange={e => setForm(ff => ({ ...ff, [f.key]: e.target.value }))} />
                    )}
                  </Field>
                ))}
              </>
            )}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
              <Btn onClick={saveEdit} primary>Save</Btn>
              <Btn onClick={() => setEditing(false)}>Cancel</Btn>
            </div>
          </div>
        )}

        {/* Add child form */}
        {adding && (
          <div style={{ padding: "12px 14px", background: "#030b22", display: "flex", flexWrap: "wrap", gap: 10, borderTop: `1px solid ${BRAND.green}44` }} onClick={e => e.stopPropagation()}>
            <div style={{ width: "100%", fontSize: 11, color: BRAND.green, fontFamily: "'Titillium Web',sans-serif", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>＋ Add child to "{node.name}"</div>
            <Field label="Name *"><input style={inputStyle} value={newNode.name} onChange={e => setNewNode(f => ({ ...f, name: e.target.value }))} placeholder="Node name" /></Field>
            <Field label="Node Type">
              <select style={selectStyle} value={newNode.nodeType || "AI Agent"} onChange={e => setNewNode(f => ({ ...f, nodeType: e.target.value }))}>
                {Object.keys(NODE_TYPE_CONFIG).map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Description"><input style={{ ...inputStyle, width: 220 }} value={newNode.description} onChange={e => setNewNode(f => ({ ...f, description: e.target.value }))} placeholder="What does it do?" /></Field>
            <Field label="Owner"><input style={inputStyle} value={newNode.owner} onChange={e => setNewNode(f => ({ ...f, owner: e.target.value }))} placeholder="Name or team" /></Field>
            <Field label="Status">
              <select style={selectStyle} value={newNode.status} onChange={e => setNewNode(f => ({ ...f, status: e.target.value }))}>
                {Object.keys(STATUS_CONFIG).map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            {/* AI Agent-specific fields */}
            {newIsAgent && (
              <>
                <Field label="Model"><input style={inputStyle} value={newNode.model} onChange={e => setNewNode(f => ({ ...f, model: e.target.value }))} placeholder="e.g. GPT-4o" /></Field>
                <Field label="Build Type">
                  <select style={selectStyle} value={newNode.buildType} onChange={e => setNewNode(f => ({ ...f, buildType: e.target.value }))}>
                    {Object.keys(BUILD_CONFIG).map(s => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                {EXTRA_FIELDS.map(f => (
                  <Field key={f.key} label={f.label}>
                    {f.type === "select" ? (
                      <select style={selectStyle} value={newNode[f.key] ?? f.defaultValue} onChange={e => setNewNode(nn => ({ ...nn, [f.key]: e.target.value }))}>
                        {f.options.map(o => <option key={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input style={inputStyle} value={newNode[f.key] ?? ""} onChange={e => setNewNode(nn => ({ ...nn, [f.key]: e.target.value }))} />
                    )}
                  </Field>
                ))}
              </>
            )}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
              <Btn onClick={saveNew} primary>Add</Btn>
              <Btn onClick={() => setAdding(false)}>Cancel</Btn>
            </div>
          </div>
        )}
      </div>

      {hasChildren && expanded && (
        <div style={{ borderLeft: `2px dashed ${depthAccent}55`, marginLeft: 16, paddingLeft: 4 }}>
          {node.children.map((child, idx) => (
            <NodeCard key={child.id} node={child} depth={depth + 1} filters={filters}
              onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} onMove={onMove}
              siblingIndex={idx} siblingCount={node.children.length} isRoot={false} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── HTML Export ───────────────────────────────────────────────────────────────
function buildExportHTML(data, extraFields) {
  const jsonData = JSON.stringify(data, null, 2);
  const jsonExtraFields = JSON.stringify(extraFields);
  const jsonNodeTypes = JSON.stringify(NODE_TYPE_CONFIG);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Definian – AI Integration Map</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Titillium+Web:wght@400;600;700;900&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet"/>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.2/babel.min.js"></script>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{background:#02072D;font-family:'Roboto',sans-serif;min-height:100vh;padding:28px;}
    select,input,button{font-family:'Roboto',sans-serif;}
  </style>
</head>
<body>
  <div id="root"></div>
  <script>window.__INITIAL_DATA__ = ${jsonData};</script>
  <script>window.__EXTRA_FIELDS__ = ${jsonExtraFields};</script>
  <script>window.__NODE_TYPE_CONFIG__ = ${jsonNodeTypes};</script>
  <script type="text/babel">
    const{useState,useMemo}=React;
    const BRAND={blue:"#0D2C71",green:"#00AB63",midnight:"#02072D",darkGray:"#3C405B",coolGray:"#D8D7EE",white:"#FFFFFF",blueLight:"#1a3d8f",greenDark:"#008a4f",midnightLight:"#0a1240"};
    const STATUS_CONFIG={"Completed":{bg:"#003d24",text:"#00AB63",dot:"#00AB63",border:"#00AB63"},"In Progress":{bg:"#2a1e00",text:"#f5c842",dot:"#f5c842",border:"#f5c842"},"Not Started":{bg:"#1e2035",text:"#D8D7EE",dot:"#6b7280",border:"#3C405B"}};
    const BUILD_CONFIG={"Local LLM API":{icon:"🖥️",color:"#7c6af5"},"Claude Project":{icon:"🔷",color:"#00AB63"},"Web LLM API":{icon:"🌐",color:"#4a90d9"},"—":{icon:"",color:"transparent"}};
    const NODE_TYPE_CONFIG=window.__NODE_TYPE_CONFIG__;
    const EXTRA_FIELDS=window.__EXTRA_FIELDS__;
    let nextId=100;
    const makeId=()=>\`node_\${nextId++}\`;
    const BLANK={name:"",description:"",status:"Not Started",owner:"",nodeType:"AI Agent",model:"",buildType:"—",...Object.fromEntries(EXTRA_FIELDS.map(f=>[f.key,f.defaultValue])),children:[]};
    function updateNode(t,id,u){if(t.id===id)return{...t,...u};return{...t,children:t.children.map(c=>updateNode(c,id,u))};}
    function deleteNode(t,id){return{...t,children:t.children.filter(c=>c.id!==id).map(c=>deleteNode(c,id))};}
    function addChild(t,pid,child){if(t.id===pid)return{...t,children:[...t.children,child]};return{...t,children:t.children.map(c=>addChild(c,pid,child))};}
    function moveChild(t,id,dir){const i=t.children.findIndex(c=>c.id===id);if(i!==-1){const ni=dir==="up"?i-1:i+1;if(ni<0||ni>=t.children.length)return t;const ch=[...t.children];[ch[i],ch[ni]]=[ch[ni],ch[i]];return{...t,children:ch};}return{...t,children:t.children.map(c=>moveChild(c,id,dir))};}
    function getAllNodes(n,a=[]){a.push(n);n.children?.forEach(c=>getAllNodes(c,a));return a;}
    function getAllOwners(n,s=new Set()){if(n.owner&&n.owner!=="—")s.add(n.owner);n.children?.forEach(c=>getAllOwners(c,s));return s;}
    const iS={background:"#0a1240",border:"1px solid #3C405B",borderRadius:6,padding:"5px 9px",fontSize:12,color:"#FFFFFF",outline:"none",width:160};
    const sS={...iS,width:"auto",minWidth:140,cursor:"pointer"};
    function Field({label,children}){return(<label style={{display:"flex",flexDirection:"column",gap:3,fontSize:11,color:"#D8D7EE"}}><span style={{textTransform:"uppercase",letterSpacing:"0.06em",fontSize:10,color:"#00AB63"}}>{label}</span>{children}</label>);}
    function Btn({onClick,primary,children}){const[h,sH]=useState(false);return(<button onClick={onClick} onMouseEnter={()=>sH(true)} onMouseLeave={()=>sH(false)} style={{background:primary?(h?"#008a4f":"#00AB63"):(h?"#3C405B":"#1e2240"),color:primary?"#02072D":"#D8D7EE",border:"none",borderRadius:7,padding:"6px 16px",fontSize:12,cursor:"pointer",fontWeight:700,transition:"background 0.15s"}}>{children}</button>);}
    function ActionBtn({onClick,title,danger,disabled,children}){const[h,sH]=useState(false);return(<button onClick={onClick} title={title} disabled={disabled} onMouseEnter={()=>sH(true)} onMouseLeave={()=>sH(false)} style={{background:h&&!disabled?(danger?"#3d0a0a":"#3C405B"):"transparent",border:\`1px solid \${danger?"#7f1d1d":"#3C405B"}\`,borderRadius:6,padding:"2px 7px",fontSize:12,cursor:disabled?"default":"pointer",color:disabled?"#3C405B":(danger?"#f87171":"#D8D7EE"),transition:"background 0.15s",opacity:disabled?0.4:1}}>{children}</button>);}
    function NodeCard({node,depth,filters,onEdit,onDelete,onAddChild,onMove,siblingIndex,siblingCount,isRoot}){
      const[expanded,setExpanded]=useState(depth<1);
      const[editing,setEditing]=useState(false);
      const[adding,setAdding]=useState(false);
      const[form,setForm]=useState({...node});
      const[newNode,setNewNode]=useState({...BLANK});
      const hasChildren=node.children?.length>0;
      const sc=STATUS_CONFIG[node.status]||STATUS_CONFIG["Not Started"];
      const bc=BUILD_CONFIG[node.buildType]||BUILD_CONFIG["—"];
      const ntc=NODE_TYPE_CONFIG[node.nodeType]||NODE_TYPE_CONFIG["AI Agent"];
      const depthAccent=depth===0?BRAND.green:depth===1?BRAND.blue:BRAND.darkGray;
      const headerBg=depth===0?BRAND.midnightLight:depth===1?"#071040":"#0d1535";
      const editIsAgent=(form.nodeType||"AI Agent")==="AI Agent";
      const newIsAgent=(newNode.nodeType||"AI Agent")==="AI Agent";
      function npf(n){
        const sp=(!filters.status||n.status===filters.status)&&(!filters.owner||n.owner===filters.owner)&&(!filters.buildType||n.buildType===filters.buildType)&&(!filters.nodeType||(n.nodeType||"AI Agent")===filters.nodeType);
        if(!n.children||n.children.length===0)return sp;
        return sp||n.children.some(c=>npf(c));
      }
      if(!npf(node))return null;
      function saveEdit(){onEdit(node.id,form);setEditing(false);}
      function saveNew(){if(!newNode.name.trim())return;onAddChild(node.id,{...newNode,id:makeId()});setNewNode({...BLANK});setAdding(false);setExpanded(true);}
      const isFirst=siblingIndex===0;
      const isLast=siblingIndex===siblingCount-1;
      return(<div style={{marginLeft:depth===0?0:20,marginTop:8}}>
        <div style={{border:\`1.5px solid \${depthAccent}\`,borderRadius:10,background:BRAND.midnightLight,boxShadow:"0 2px 16px rgba(0,0,0,0.4)",overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"11px 14px",background:headerBg,cursor:hasChildren?"pointer":"default",userSelect:"none"}} onClick={()=>hasChildren&&setExpanded(e=>!e)}>
            {hasChildren&&<span style={{fontSize:13,color:depthAccent,minWidth:14}}>{expanded?"▾":"▸"}</span>}
            <span style={{fontSize:14,lineHeight:1}}>{ntc.icon}</span>
            <span style={{fontFamily:"'Titillium Web',sans-serif",fontWeight:700,fontSize:depth===0?17:14,color:BRAND.white,flex:1}}>{node.name}</span>
            <span style={{color:ntc.color,border:\`1px solid \${ntc.color}44\`,borderRadius:99,padding:"2px 8px",fontSize:10,fontWeight:700,whiteSpace:"nowrap",background:\`\${ntc.color}12\`}}>{node.nodeType||"AI Agent"}</span>
            <span style={{background:sc.bg,color:sc.text,border:\`1px solid \${sc.border}44\`,borderRadius:99,padding:"2px 10px",fontSize:11,fontWeight:600,display:"inline-flex",alignItems:"center",gap:4,whiteSpace:"nowrap"}}>
              <span style={{width:7,height:7,borderRadius:"50%",background:sc.dot}}/>{node.status}
            </span>
            <div style={{display:"flex",gap:4}} onClick={e=>e.stopPropagation()}>
              {!isRoot&&(<><ActionBtn onClick={()=>onMove(node.id,"up")} title="Move up" disabled={isFirst}>↑</ActionBtn><ActionBtn onClick={()=>onMove(node.id,"down")} title="Move down" disabled={isLast}>↓</ActionBtn></>)}
              <ActionBtn onClick={()=>{setEditing(e=>!e);setForm({...node});}} title="Edit">✏️</ActionBtn>
              <ActionBtn onClick={()=>setAdding(a=>!a)} title="Add child">＋</ActionBtn>
              {!isRoot&&<ActionBtn onClick={()=>{if(window.confirm(\`Delete "\${node.name}"?\`))onDelete(node.id);}} title="Delete" danger>🗑</ActionBtn>}
            </div>
          </div>
          {!editing&&(<div style={{padding:"8px 14px 10px",fontSize:12,color:BRAND.coolGray,display:"flex",flexWrap:"wrap",gap:"5px 18px"}}>
            <span style={{color:"#a0a9c8"}}>📝 {node.description}</span>
            <span>👤 <b style={{color:BRAND.white}}>{node.owner}</b></span>
            {node.model!=="—"&&node.model&&<span>🤖 <b style={{color:BRAND.white}}>{node.model}</b></span>}
            {node.buildType!=="—"&&node.buildType&&<span style={{color:bc.color}}>{bc.icon} <b>{node.buildType}</b></span>}
            {EXTRA_FIELDS.map(f=>{const val=node[f.key];if(!val||val==="—")return null;return<span key={f.key}>{f.icon} <b style={{color:BRAND.white}}>{val}</b></span>;})}
          </div>)}
          {editing&&(<div style={{padding:"12px 14px",background:"#040d2a",display:"flex",flexWrap:"wrap",gap:10,borderTop:\`1px solid \${BRAND.darkGray}\`}} onClick={e=>e.stopPropagation()}>
            <Field label="Name"><input style={iS} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></Field>
            <Field label="Node Type"><select style={sS} value={form.nodeType||"AI Agent"} onChange={e=>setForm(f=>({...f,nodeType:e.target.value}))}>{Object.keys(NODE_TYPE_CONFIG).map(t=><option key={t}>{t}</option>)}</select></Field>
            <Field label="Description"><input style={{...iS,width:220}} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></Field>
            <Field label="Owner"><input style={iS} value={form.owner} onChange={e=>setForm(f=>({...f,owner:e.target.value}))}/></Field>
            <Field label="Status"><select style={sS} value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>{Object.keys(STATUS_CONFIG).map(s=><option key={s}>{s}</option>)}</select></Field>
            {editIsAgent&&(<>
              <Field label="Model"><input style={iS} value={form.model} onChange={e=>setForm(f=>({...f,model:e.target.value}))} placeholder="e.g. GPT-4o"/></Field>
              <Field label="Build Type"><select style={sS} value={form.buildType} onChange={e=>setForm(f=>({...f,buildType:e.target.value}))}>{Object.keys(BUILD_CONFIG).map(s=><option key={s}>{s}</option>)}</select></Field>
              {EXTRA_FIELDS.map(f=>(<Field key={f.key} label={f.label}>{f.type==="select"?(<select style={sS} value={form[f.key]??f.defaultValue} onChange={e=>setForm(ff=>({...ff,[f.key]:e.target.value}))}>{f.options.map(o=><option key={o}>{o}</option>)}</select>):(<input style={iS} value={form[f.key]??""} onChange={e=>setForm(ff=>({...ff,[f.key]:e.target.value}))}/>)}</Field>))}
            </>)}
            <div style={{display:"flex",alignItems:"flex-end",gap:6}}><Btn onClick={saveEdit} primary>Save</Btn><Btn onClick={()=>setEditing(false)}>Cancel</Btn></div>
          </div>)}
          {adding&&(<div style={{padding:"12px 14px",background:"#030b22",display:"flex",flexWrap:"wrap",gap:10,borderTop:\`1px solid \${BRAND.green}44\`}} onClick={e=>e.stopPropagation()}>
            <div style={{width:"100%",fontSize:11,color:BRAND.green,fontFamily:"'Titillium Web',sans-serif",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:2}}>＋ Add child to "{node.name}"</div>
            <Field label="Name *"><input style={iS} value={newNode.name} onChange={e=>setNewNode(f=>({...f,name:e.target.value}))} placeholder="Node name"/></Field>
            <Field label="Node Type"><select style={sS} value={newNode.nodeType||"AI Agent"} onChange={e=>setNewNode(f=>({...f,nodeType:e.target.value}))}>{Object.keys(NODE_TYPE_CONFIG).map(t=><option key={t}>{t}</option>)}</select></Field>
            <Field label="Description"><input style={{...iS,width:220}} value={newNode.description} onChange={e=>setNewNode(f=>({...f,description:e.target.value}))} placeholder="What does it do?"/></Field>
            <Field label="Owner"><input style={iS} value={newNode.owner} onChange={e=>setNewNode(f=>({...f,owner:e.target.value}))} placeholder="Name or team"/></Field>
            <Field label="Status"><select style={sS} value={newNode.status} onChange={e=>setNewNode(f=>({...f,status:e.target.value}))}>{Object.keys(STATUS_CONFIG).map(s=><option key={s}>{s}</option>)}</select></Field>
            {newIsAgent&&(<>
              <Field label="Model"><input style={iS} value={newNode.model} onChange={e=>setNewNode(f=>({...f,model:e.target.value}))} placeholder="e.g. GPT-4o"/></Field>
              <Field label="Build Type"><select style={sS} value={newNode.buildType} onChange={e=>setNewNode(f=>({...f,buildType:e.target.value}))}>{Object.keys(BUILD_CONFIG).map(s=><option key={s}>{s}</option>)}</select></Field>
              {EXTRA_FIELDS.map(f=>(<Field key={f.key} label={f.label}>{f.type==="select"?(<select style={sS} value={newNode[f.key]??f.defaultValue} onChange={e=>setNewNode(nn=>({...nn,[f.key]:e.target.value}))}>{f.options.map(o=><option key={o}>{o}</option>)}</select>):(<input style={iS} value={newNode[f.key]??""} onChange={e=>setNewNode(nn=>({...nn,[f.key]:e.target.value}))}/>)}</Field>))}
            </>)}
            <div style={{display:"flex",alignItems:"flex-end",gap:6}}><Btn onClick={saveNew} primary>Add</Btn><Btn onClick={()=>setAdding(false)}>Cancel</Btn></div>
          </div>)}
        </div>
        {hasChildren&&expanded&&(<div style={{borderLeft:\`2px dashed \${depthAccent}55\`,marginLeft:16,paddingLeft:4}}>
          {node.children.map((child,idx)=>(<NodeCard key={child.id} node={child} depth={depth+1} filters={filters} onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} onMove={onMove} siblingIndex={idx} siblingCount={node.children.length} isRoot={false}/>))}
        </div>)}
      </div>);
    }
    function App(){
      const[data,setData]=useState(window.__INITIAL_DATA__);
      const[filters,setFilters]=useState({status:"",owner:"",buildType:"",nodeType:""});
      function handleEdit(id,u){setData(d=>updateNode(d,id,u));}
      function handleDelete(id){setData(d=>deleteNode(d,id));}
      function handleAddChild(pid,child){setData(d=>addChild(d,pid,child));}
      function handleMove(id,dir){setData(d=>moveChild(d,id,dir));}
      const allNodes=useMemo(()=>getAllNodes(data),[data]);
      const owners=useMemo(()=>[...getAllOwners(data)].sort(),[data]);
      const counts=useMemo(()=>{const c={"Completed":0,"In Progress":0,"Not Started":0};allNodes.forEach(n=>{if(c[n.status]!==undefined)c[n.status]++;});return c;},[allNodes]);
      const typeCounts=useMemo(()=>{const c={};allNodes.forEach(n=>{const t=n.nodeType||"AI Agent";c[t]=(c[t]||0)+1;});return c;},[allNodes]);
      const anyFilter=filters.status||filters.owner||filters.buildType||filters.nodeType;
      const sS2={background:"#0a1240",border:"1px solid #3C405B",color:"#FFFFFF",borderRadius:7,padding:"6px 12px",fontSize:12,cursor:"pointer"};
      return(<div style={{fontFamily:"Roboto,sans-serif",background:BRAND.midnight,minHeight:"100vh",padding:28}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:18,marginBottom:6}}>
            <svg width="52" height="58" viewBox="0 0 900 1000" fill="none" xmlns="http://www.w3.org/2000/svg" style={{flexShrink:0}}>
              <defs><linearGradient id="cg" x1="0" y1="0" x2="900" y2="1000" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#00AB63"/><stop offset="100%" stopColor="#0D2C71"/></linearGradient></defs>
              <polygon points="450,60 820,260 450,460 80,260" fill="#00AB63"/>
              <polygon points="80,260 80,680 450,880 450,460" fill="url(#cg)"/>
              <polygon points="820,260 820,680 450,880 450,460" fill="#0D2C71"/>
              <polygon points="450,140 620,230 450,320 280,230" fill="white"/>
              <path d="M450 195 L465 220 L490 220 L470 238 L478 265 L450 248 L422 265 L430 238 L410 220 L435 220 Z" fill="#00AB63"/>
              <g stroke="#D8D7EE" strokeWidth="8" fill="none" opacity="0.5">
                <polyline points="200,480 160,540 120,540 120,600"/><circle cx="120" cy="610" r="14" fill="#D8D7EE"/>
                <polyline points="200,520 170,580 170,640"/><circle cx="170" cy="652" r="14" fill="#D8D7EE"/>
                <polyline points="300,540 260,600 220,600 220,660"/><circle cx="220" cy="672" r="14" fill="#D8D7EE"/>
                <polyline points="350,600 310,660 310,720"/><circle cx="310" cy="732" r="14" fill="#D8D7EE"/>
              </g>
              <g stroke="#D8D7EE" strokeWidth="8" fill="none" opacity="0.4">
                <polyline points="700,480 740,540 780,540 780,600"/><circle cx="780" cy="610" r="14" fill="#D8D7EE"/>
                <polyline points="680,520 720,580 720,640"/><circle cx="720" cy="652" r="14" fill="#D8D7EE"/>
                <polyline points="600,540 640,600 680,600 680,660"/><circle cx="680" cy="672" r="14" fill="#D8D7EE"/>
                <polyline points="560,580 600,640 560,700"/><circle cx="560" cy="712" r="14" fill="#D8D7EE"/>
              </g>
            </svg>
            <div>
              <svg width="190" height="44" viewBox="0 0 760 176" xmlns="http://www.w3.org/2000/svg">
                <rect x="302" y="0" width="44" height="44" fill="#00AB63"/>
                <rect x="468" y="0" width="44" height="44" fill="#00AB63"/>
                <text x="0" y="160" fontFamily="'Titillium Web',sans-serif" fontWeight="700" fontSize="152" fill="#0D2C71" letterSpacing="-2">definian</text>
              </svg>
              <div style={{fontSize:12,color:BRAND.coolGray,marginTop:2}}>Data Platform · AI Integration Map</div>
            </div>
          </div>
          <div style={{height:2,background:"linear-gradient(90deg,#00AB63,#0D2C7133)",borderRadius:2,marginBottom:20}}/>
          <div style={{display:"flex",flexWrap:"wrap",gap:10,alignItems:"center",marginBottom:20}}>
            {Object.entries(STATUS_CONFIG).map(([s,c])=>(<div key={s} style={{background:c.bg,color:c.text,border:\`1px solid \${c.border}44\`,borderRadius:8,padding:"5px 14px",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:6}}><span style={{width:8,height:8,borderRadius:"50%",background:c.dot}}/>{counts[s]} {s}</div>))}
            {Object.entries(NODE_TYPE_CONFIG).map(([t,cfg])=>typeCounts[t]?(<div key={t} style={{background:\`\${cfg.color}15\`,color:cfg.color,border:\`1px solid \${cfg.color}44\`,borderRadius:8,padding:"5px 14px",fontSize:12,fontWeight:600}}>{cfg.icon} {typeCounts[t]} {t}{typeCounts[t]!==1?"s":""}</div>):null)}
            <div style={{flex:1}}/>
            <select style={sS2} value={filters.nodeType} onChange={e=>setFilters(f=>({...f,nodeType:e.target.value}))}><option value="">All Types</option>{Object.keys(NODE_TYPE_CONFIG).map(t=><option key={t}>{t}</option>)}</select>
            <select style={sS2} value={filters.status} onChange={e=>setFilters(f=>({...f,status:e.target.value}))}><option value="">All Statuses</option>{Object.keys(STATUS_CONFIG).map(s=><option key={s}>{s}</option>)}</select>
            <select style={sS2} value={filters.owner} onChange={e=>setFilters(f=>({...f,owner:e.target.value}))}><option value="">All Owners</option>{owners.map(o=><option key={o}>{o}</option>)}</select>
            <select style={sS2} value={filters.buildType} onChange={e=>setFilters(f=>({...f,buildType:e.target.value}))}><option value="">All Build Types</option>{Object.keys(BUILD_CONFIG).filter(b=>b!=="—").map(b=><option key={b}>{b}</option>)}</select>
            {anyFilter&&(<button onClick={()=>setFilters({status:"",owner:"",buildType:"",nodeType:""})} style={{background:"none",border:"1px solid #3C405B",borderRadius:7,padding:"6px 12px",color:"#D8D7EE",fontSize:12,cursor:"pointer"}}>✕ Clear</button>)}
          </div>
          <NodeCard node={data} depth={0} filters={filters} onEdit={handleEdit} onDelete={handleDelete} onAddChild={handleAddChild} onMove={handleMove} siblingIndex={0} siblingCount={1} isRoot={true}/>
          <div style={{marginTop:22,display:"flex",gap:20,flexWrap:"wrap",fontSize:11,color:BRAND.coolGray,justifyContent:"center",borderTop:"1px solid #1e2240",paddingTop:14}}>
            <span style={{color:"#4a5068",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",fontSize:10}}>Node Types</span>
            {Object.entries(NODE_TYPE_CONFIG).map(([k,v])=>(<span key={k} style={{color:v.color,fontWeight:600}}>{v.icon} {k}</span>))}
            <span style={{color:"#4a5068",margin:"0 4px"}}>·</span>
            <span style={{color:"#4a5068",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",fontSize:10}}>Build Types</span>
            {Object.entries(BUILD_CONFIG).filter(([k])=>k!=="—").map(([k,v])=>(<span key={k} style={{color:v.color}}>{v.icon} {k}</span>))}
          </div>
        </div>
      </div>);
    }
    ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
  </script>
</body>
</html>`;
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState({ status: "", owner: "", buildType: "", nodeType: "" });
  const [exported, setExported] = useState(false);

  function handleEdit(id, u) { setData(d => updateNode(d, id, u)); }
  function handleDelete(id) { setData(d => deleteNode(d, id)); }
  function handleAddChild(pid, child) { setData(d => addChild(d, pid, child)); }
  function handleMove(id, dir) { setData(d => moveChild(d, id, dir)); }

  const allNodes = useMemo(() => getAllNodes(data), [data]);
  const owners = useMemo(() => [...getAllOwners(data)].sort(), [data]);
  const counts = useMemo(() => {
    const c = { Completed: 0, "In Progress": 0, "Not Started": 0 };
    allNodes.forEach(n => { if (c[n.status] !== undefined) c[n.status]++; });
    return c;
  }, [allNodes]);
  const typeCounts = useMemo(() => {
    const c = {};
    allNodes.forEach(n => { const t = n.nodeType || "AI Agent"; c[t] = (c[t] || 0) + 1; });
    return c;
  }, [allNodes]);

  function handleExport() {
    const html = buildExportHTML(data, EXTRA_FIELDS);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "definian-ai-map.html";
    a.click(); URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2500);
  }

  const anyFilter = filters.status || filters.owner || filters.buildType || filters.nodeType;
  const selStyle = { background: BRAND.midnightLight, border: `1px solid ${BRAND.darkGray}`, color: BRAND.white, borderRadius: 7, padding: "6px 12px", fontSize: 12, cursor: "pointer" };

  return (
    <div style={{ fontFamily: "Roboto, sans-serif", background: BRAND.midnight, minHeight: "100vh", padding: 28 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Titillium+Web:wght@400;600;700;900&family=Roboto:wght@400;500;700&display=swap');`}</style>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 6 }}>
          <svg width="52" height="58" viewBox="0 0 900 1000" fill="none" xmlns="http://www.w3.org/2000/svg" style={{flexShrink:0}}>
            <defs><linearGradient id="cubeGrad" x1="0" y1="0" x2="900" y2="1000" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#00AB63"/><stop offset="100%" stopColor="#0D2C71"/></linearGradient></defs>
            <polygon points="450,60 820,260 450,460 80,260" fill="#00AB63"/>
            <polygon points="80,260 80,680 450,880 450,460" fill="url(#cubeGrad)"/>
            <polygon points="820,260 820,680 450,880 450,460" fill="#0D2C71"/>
            <polygon points="450,140 620,230 450,320 280,230" fill="white"/>
            <path d="M450 195 L465 220 L490 220 L470 238 L478 265 L450 248 L422 265 L430 238 L410 220 L435 220 Z" fill="#00AB63"/>
            <g stroke="#D8D7EE" strokeWidth="8" fill="none" opacity="0.5">
              <polyline points="200,480 160,540 120,540 120,600"/><circle cx="120" cy="610" r="14" fill="#D8D7EE"/>
              <polyline points="200,520 170,580 170,640"/><circle cx="170" cy="652" r="14" fill="#D8D7EE"/>
              <polyline points="300,540 260,600 220,600 220,660"/><circle cx="220" cy="672" r="14" fill="#D8D7EE"/>
              <polyline points="350,600 310,660 310,720"/><circle cx="310" cy="732" r="14" fill="#D8D7EE"/>
            </g>
            <g stroke="#D8D7EE" strokeWidth="8" fill="none" opacity="0.4">
              <polyline points="700,480 740,540 780,540 780,600"/><circle cx="780" cy="610" r="14" fill="#D8D7EE"/>
              <polyline points="680,520 720,580 720,640"/><circle cx="720" cy="652" r="14" fill="#D8D7EE"/>
              <polyline points="600,540 640,600 680,600 680,660"/><circle cx="680" cy="672" r="14" fill="#D8D7EE"/>
              <polyline points="560,580 600,640 560,700"/><circle cx="560" cy="712" r="14" fill="#D8D7EE"/>
            </g>
          </svg>
          <div style={{ flex: 1 }}>
            <svg width="190" height="44" viewBox="0 0 760 176" xmlns="http://www.w3.org/2000/svg">
              <rect x="302" y="0" width="44" height="44" fill="#00AB63"/>
              <rect x="468" y="0" width="44" height="44" fill="#00AB63"/>
              <text x="0" y="160" fontFamily="'Titillium Web',sans-serif" fontWeight="700" fontSize="152" fill="#0D2C71" letterSpacing="-2">definian</text>
            </svg>
            <div style={{ fontSize: 12, color: BRAND.coolGray, marginTop: 2 }}>Data Platform · AI Integration Map</div>
          </div>
          <button onClick={handleExport}
            style={{
              background: exported ? BRAND.green : "transparent",
              border: `1.5px solid ${BRAND.green}`,
              color: exported ? BRAND.midnight : BRAND.green,
              borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              transition: "all 0.2s", whiteSpace: "nowrap",
            }}>
            {exported ? "✓ Downloaded!" : "⬇ Export HTML"}
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: 2, background: `linear-gradient(90deg, ${BRAND.green}, ${BRAND.blue}33)`, borderRadius: 2, marginBottom: 20 }} />

        {/* Summary + Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 20 }}>
          {/* Status counts */}
          {Object.entries(STATUS_CONFIG).map(([status, c]) => (
            <div key={status} style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}44`, borderRadius: 8, padding: "5px 14px", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.dot }} />
              {counts[status]} {status}
            </div>
          ))}
          {/* Type counts — only show types present in the tree */}
          {Object.entries(NODE_TYPE_CONFIG).map(([type, cfg]) =>
            typeCounts[type] ? (
              <div key={type} style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}44`, borderRadius: 8, padding: "5px 14px", fontSize: 12, fontWeight: 600 }}>
                {cfg.icon} {typeCounts[type]} {type}{typeCounts[type] !== 1 ? "s" : ""}
              </div>
            ) : null
          )}
          <div style={{ flex: 1 }} />
          {/* Filters */}
          <select style={selStyle} value={filters.nodeType} onChange={e => setFilters(f => ({ ...f, nodeType: e.target.value }))}>
            <option value="">All Types</option>
            {Object.keys(NODE_TYPE_CONFIG).map(t => <option key={t}>{t}</option>)}
          </select>
          <select style={selStyle} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Statuses</option>
            {Object.keys(STATUS_CONFIG).map(s => <option key={s}>{s}</option>)}
          </select>
          <select style={selStyle} value={filters.owner} onChange={e => setFilters(f => ({ ...f, owner: e.target.value }))}>
            <option value="">All Owners</option>
            {owners.map(o => <option key={o}>{o}</option>)}
          </select>
          <select style={selStyle} value={filters.buildType} onChange={e => setFilters(f => ({ ...f, buildType: e.target.value }))}>
            <option value="">All Build Types</option>
            {Object.keys(BUILD_CONFIG).filter(b => b !== "—").map(b => <option key={b}>{b}</option>)}
          </select>
          {anyFilter && (
            <button onClick={() => setFilters({ status: "", owner: "", buildType: "", nodeType: "" })}
              style={{ background: "none", border: `1px solid ${BRAND.darkGray}`, borderRadius: 7, padding: "6px 12px", color: BRAND.coolGray, fontSize: 12, cursor: "pointer" }}>
              ✕ Clear
            </button>
          )}
        </div>

        <NodeCard node={data} depth={0} filters={filters} onEdit={handleEdit} onDelete={handleDelete} onAddChild={handleAddChild} onMove={handleMove} siblingIndex={0} siblingCount={1} isRoot={true} />

        {/* Legend */}
        <div style={{ marginTop: 22, display: "flex", gap: 18, flexWrap: "wrap", fontSize: 11, color: BRAND.coolGray, justifyContent: "center", borderTop: `1px solid #1e2240`, paddingTop: 14 }}>
          <span style={{ color: "#4a5068", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 10 }}>Node Types</span>
          {Object.entries(NODE_TYPE_CONFIG).map(([k, v]) => (
            <span key={k} style={{ color: v.color, fontWeight: 600 }}>{v.icon} {k}</span>
          ))}
          <span style={{ color: "#4a5068", margin: "0 4px" }}>·</span>
          <span style={{ color: "#4a5068", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 10 }}>Build Types</span>
          {Object.entries(BUILD_CONFIG).filter(([k]) => k !== "—").map(([k, v]) => (
            <span key={k} style={{ color: v.color }}>{v.icon} {k}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
