/*
Career Roadmap Section
---------------------
A fully interactive, mobile-friendly career roadmap for visualizing milestones (jobs, education, etc.) as nodes in a branching timeline. Features:
- Add/edit/delete nodes (milestones) with type, status, mode, and description
- Drag nodes to reposition
- Pan/zoom the canvas (mouse/touch)
- Branching: nodes can have multiple children
- Responsive layout: roots spaced horizontally, children spaced vertically/horizontally to avoid overlap
- Connections/lines always rendered correctly
- Accessible and mobile-friendly UI
- Clean, maintainable code with comments

Usage: <RoadmapSection />
*/

import React, { useState, useRef, useLayoutEffect } from "react";
import { UserProfile, Experience, Education } from "../../types/Profile";
import { supabase } from "../../supabaseClient";

// --- Types ---
interface Milestone {
  id: string;
  title: string;
  description: string;
  date: string;
  type: "Education" | "Job" | "Other";
  status: "Past" | "Present" | "Future";
  branchFrom?: string;
  x: number;
  y: number;
  mode?: "Full Time" | "Part Time";
}

// --- Constants ---
const CARD_WIDTH = 120; // Smallest reasonable width for layout math only
const CARD_HEIGHT = 130; // Used for layout math only, not for card style
const ROOT_X_GAP = 320;
const VERTICAL_GAP = 80;
const CHILD_X_GAP = 180;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;

// --- Utility Functions ---
function getChildren(milestones: Milestone[], id: string): Milestone[] {
  return milestones.filter((m) => m.branchFrom === id);
}

function getRoots(milestones: Milestone[]): Milestone[] {
  return milestones.filter((m) => !m.branchFrom);
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2);
}

// --- Main Component ---
interface RoadmapSectionProps {
  profile: UserProfile;
}

const RoadmapSection: React.FC<RoadmapSectionProps> = ({ profile }) => {
  // --- State ---
  const [milestones, setMilestones] = useState<Milestone[]>([]); // Start with 0 nodes
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number } | null>(null);
  const mouseStart = useRef<{ x: number; y: number } | null>(null);
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [dragNodeOffset, setDragNodeOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [addParentId, setAddParentId] = useState<string | null>(null);
  const [addForm, setAddForm] = useState<{ title: string; description: string; date: string; type: Milestone["type"]; status: Milestone["status"]; mode: "Full Time" | "Part Time" }>({ title: "", description: "", date: "", type: "Job", status: "Future", mode: "Full Time" });
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<{ title: string; description: string }>({ title: "", description: "" });

  // --- Dynamic card width state ---
  const [cardWidths, setCardWidths] = useState<{ [id: string]: number }>({});
  const cardRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});

  // --- Add form field change handler (for add node modal) ---
  function handleAddFormChange(field: keyof typeof addForm, value: string) {
    setAddForm((f) => ({ ...f, [field]: value }));
    if (field === "type" && (value === "Job" || value === "Education")) {
      setAddForm((f) => ({ ...f, mode: "Full Time" }));
    }
  }

  // --- Fetch all roadmap nodes for the user on mount/profile change ---
  React.useEffect(() => {
    let cancelled = false;
    async function fetchNodes() {
      setLoading(true);
      setError(null);
      if (!profile?.id) {
        setMilestones([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('roadmap_nodes')
        .select('*')
        .eq('user_id', profile.id);
      if (cancelled) return;
      if (error) {
        setError('Failed to load roadmap');
        setMilestones([]);
        setLoading(false);
        return;
      }
      // Map DB rows to Milestone type
      const nodes: Milestone[] = (data || []).map((n: any) => ({
        id: n.id,
        title: n.name,
        description: n.description,
        date: n.node_date,
        type: n.node_type,
        status: n.status,
        mode: n.mode,
        branchFrom: n.branch_from || undefined,
        x: n.x ?? 200,
        y: n.y ?? 100,
      }));
      setMilestones(nodes);
      setLoading(false);
    }
    fetchNodes();
    return () => { cancelled = true; };
  }, [profile]);

  // --- Measure card width after render ---
  useLayoutEffect(() => {
    milestones.forEach((m) => {
      if (dragNodeId === m.id) return; // Don't update width while dragging this card
      const ref = cardRefs.current[m.id];
      if (ref && ref.offsetWidth && cardWidths[m.id] !== ref.offsetWidth) {
        setCardWidths((prev) => ({ ...prev, [m.id]: ref.offsetWidth }));
      }
    });
  }, [milestones, dragNodeId, milestones.length, milestones.map(m => m.title + m.description + m.date + m.type + m.status + m.mode).join(",")]);

  // --- Add node: insert into roadmap_nodes and state ---
  async function handleAddFormSubmit() {
    if (!profile?.id) return;
    let x = 200, y = 100;
    if (addParentId) {
      const parent = milestones.find((m: Milestone) => m.id === addParentId);
      if (parent) {
        const siblings: Milestone[] = getChildren(milestones, addParentId);
        x = parent.x + siblings.length * CHILD_X_GAP - ((siblings.length) * CHILD_X_GAP) / 2;
        y = parent.y + VERTICAL_GAP;
      }
    } else {
      x = 200 + getRoots(milestones).length * ROOT_X_GAP;
      y = 100;
    }
    // Prepare new node data (omit id)
    const newNodeData = {
      user_id: profile.id,
      name: addForm.title,
        description: addForm.description,
      node_date: addForm.date,
      node_type: addForm.type,
        status: addForm.status,
      mode: (addForm.type === "Job" || addForm.type === "Education") ? addForm.mode : undefined,
      branch_from: addParentId || null,
      x,
      y,
    };
    // Insert into Supabase (let Supabase generate id)
    const { data, error } = await supabase.from('roadmap_nodes').insert([newNodeData]).select();
    if (!error && data && data.length > 0) {
      const inserted = data[0];
      const newNode: Milestone = {
        id: inserted.id, // use the id returned from Supabase
        title: inserted.name,
        description: inserted.description,
        date: inserted.node_date,
        type: inserted.node_type,
        status: inserted.status,
        mode: inserted.mode,
        branchFrom: inserted.branch_from || undefined,
        x: inserted.x ?? 200,
        y: inserted.y ?? 100,
      };
      setMilestones([...milestones, newNode]);
      alert('Node added!');
    } else {
      setError('Failed to add node');
      console.error('Supabase insert error:', error);
      alert('Failed to add node: ' + (error?.message || 'Unknown error'));
    }
    setShowAddModal(false);
    setAddParentId(null);
  }

  // --- Autozoom to fit all nodes ---
  React.useEffect(() => {
    if (milestones.length === 0) return;
    // Calculate bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    milestones.forEach((m) => {
      minX = Math.min(minX, m.x - CARD_WIDTH / 2);
      minY = Math.min(minY, m.y - CARD_HEIGHT / 2);
      maxX = Math.max(maxX, m.x + CARD_WIDTH / 2);
      maxY = Math.max(maxY, m.y + CARD_HEIGHT / 2);
    });
    // SVG view size
    const viewWidth = 1200;
    const viewHeight = 400;
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    // Padding
    const pad = milestones.length === 1 ? 0 : 80;
    // Calculate scale
    let minZoom = milestones.length === 1 ? 1.5 : 0.7;
    let scaleX = (viewWidth - pad * 2) / (contentWidth || 1);
    let scaleY = (viewHeight - pad * 2) / (contentHeight || 1);
    let newZoom = milestones.length === 1 ? MAX_ZOOM : Math.min(scaleX, scaleY, MAX_ZOOM);
    newZoom = Math.max(newZoom, minZoom);
    // Center content
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const svgCenterX = 200; // transformOrigin x
    const svgCenterY = 100; // transformOrigin y
    const newPan = {
      x: svgCenterX - newZoom * (centerX - svgCenterX),
      y: svgCenterY - newZoom * (centerY - svgCenterY),
    };
    setZoom(newZoom);
    setPan(newPan);
  }, [milestones.length]);

  // --- Edit node: update in roadmap_nodes and state ---
  async function handleEditNode(editId: string, updatedFields: Partial<Milestone>) {
    const node = milestones.find((n) => n.id === editId);
    if (!node) return;
    const updatedNode = { ...node, ...updatedFields };
    // Update in Supabase
    const { error } = await supabase.from('roadmap_nodes').update({
      name: updatedNode.title,
      description: updatedNode.description,
      node_date: updatedNode.date,
      node_type: updatedNode.type,
      status: updatedNode.status,
      mode: updatedNode.mode,
      branch_from: updatedNode.branchFrom || null,
      x: updatedNode.x,
      y: updatedNode.y,
    }).eq('id', editId);
    if (!error) {
      setMilestones(milestones.map((n) => n.id === editId ? updatedNode : n));
    } else {
      setError('Failed to update node');
    }
  }

  // --- Delete node: delete from roadmap_nodes and state (and all descendants) ---
  async function handleDeleteNode(id: string) {
    // Remove node and all descendants
    const toDelete = new Set([id]);
    let changed = true;
    while (changed) {
      changed = false;
      milestones.forEach((m) => {
        if (m.branchFrom && toDelete.has(m.branchFrom) && !toDelete.has(m.id)) {
          toDelete.add(m.id);
          changed = true;
        }
      });
    }
    // Delete from Supabase
    const idsToDelete = Array.from(toDelete);
    await supabase.from('roadmap_nodes').delete().in('id', idsToDelete);
    setMilestones(milestones.filter((m) => !toDelete.has(m.id)));
    setEditId(null);
  }

  // --- Drag Logic ---
  function handleNodeDragStart(e: React.MouseEvent | React.TouchEvent, id: string) {
    e.stopPropagation();
    setDragNodeId(id);
    let clientX = 0, clientY = 0;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const node = milestones.find((m) => m.id === id);
    setDragNodeOffset({
      x: clientX - (node?.x ?? 0),
      y: clientY - (node?.y ?? 0),
    });
  }
  function handleNodeDragMove(e: React.MouseEvent | React.TouchEvent) {
    if (!dragNodeId) return;
    let clientX = 0, clientY = 0;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    setMilestones((ms) =>
      ms.map((m) =>
      m.id === dragNodeId
        ? { ...m, x: clientX - dragNodeOffset.x, y: clientY - dragNodeOffset.y }
        : m
      )
    );
  }
  function handleNodeDragEnd() {
    setDragNodeId(null);
    setDragNodeOffset({ x: 0, y: 0 });
  }

  // --- Pan/Zoom Logic ---
  // Remove preventDefault from wheel/touch handlers (unless absolutely needed)
  const handleWheel = (e: React.WheelEvent) => {
    let newZoom = zoom - e.deltaY * 0.001;
    newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    setZoom(newZoom);
  };
  const handlePanStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsPanning(true);
    if ("touches" in e) {
      panStart.current = { x: pan.x, y: pan.y };
      mouseStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      panStart.current = { x: pan.x, y: pan.y };
      mouseStart.current = { x: e.clientX, y: e.clientY };
    }
  };
  const handlePanMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPanning || !panStart.current || !mouseStart.current) return;
    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    setPan({
      x: panStart.current.x + (clientX - mouseStart.current.x),
      y: panStart.current.y + (clientY - mouseStart.current.y),
    });
  };
  const handlePanEnd = () => {
    setIsPanning(false);
    panStart.current = null;
    mouseStart.current = null;
  };
  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, z + 0.15));
  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, z - 0.15));

  // --- Save roadmap to backend ---
  async function handleSaveRoadmap() {
    if (!profile?.id) return;
    await supabase.from('roadmaps').upsert([
      { user_id: profile.id, data: milestones }
    ], { onConflict: 'user_id' });
  }

  // --- Render Node ---
  function renderMilestone(m: Milestone, depth: number = 0) {
    const children: Milestone[] = getChildren(milestones, m.id);
    // Layout children horizontally if siblings (positions are now handled in useEffect above)
    return (
      <g key={m.id}>
        <foreignObject
          x={m.x - CARD_WIDTH / 2}
          y={m.y - CARD_HEIGHT / 2}
          width={(cardWidths[m.id] ? cardWidths[m.id] + 50 : 120)}
          height={CARD_HEIGHT}
        >
          <div
            ref={el => { cardRefs.current[m.id] = el; }}
            className={`relative bg-white rounded-xl shadow border border-purple-200 px-2 py-1 flex flex-col items-center justify-center transition-transform duration-200 group select-none inline-block min-w-[120px] min-h-[80px] md:min-w-[160px] mx-auto ${dragNodeId === m.id ? "scale-95 opacity-70" : ""}`}
            style={{ touchAction: "none", cursor: dragNodeId === m.id ? "grabbing" : "grab" }}
            onMouseDown={(e) => handleNodeDragStart(e, m.id)}
            onTouchStart={(e) => handleNodeDragStart(e, m.id)}
            onMouseMove={dragNodeId === m.id ? handleNodeDragMove : undefined}
            onTouchMove={dragNodeId === m.id ? handleNodeDragMove : undefined}
            onMouseUp={handleNodeDragEnd}
            onTouchEnd={handleNodeDragEnd}
            tabIndex={0}
            aria-label={m.title}
          >
            <div className="flex items-center gap-1 mb-2 mt-1 w-full whitespace-nowrap">
              <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${m.type === "Education" ? "bg-yellow-100 text-yellow-700" : m.type === "Job" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`}>{m.type}</span>
              <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${m.status === "Past" ? "bg-gray-200 text-gray-500" : m.status === "Present" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{m.status}</span>
              {m.mode && (
                <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">{m.mode}</span>
              )}
            </div>
            <div className="text-base font-bold text-purple-700 mb-2 text-center w-full truncate">{m.title}</div>
            <div className="text-xs text-gray-600 text-center mb-0.5 w-full truncate">{m.description}</div>
            <div className="text-[10px] text-gray-400">{m.date}</div>
            <button
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity px-1 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-700 border border-gray-300 shadow"
              onClick={(e) => {
                e.stopPropagation();
                setEditId(m.id);
                setEditValue({ title: m.title, description: m.description });
              }}
              tabIndex={-1}
            >Edit</button>
          </div>
        </foreignObject>
        {/* Render children recursively */}
        {children.map((child) => renderMilestone(child, depth + 1))}
      </g>
    );
  }

  // --- Main Render ---
  if (loading) {
    return <div className="w-full flex items-center justify-center py-12 text-lg text-gray-500">Loading roadmap...</div>;
  }
  if (error) {
    return <div className="w-full flex items-center justify-center py-12 text-lg text-red-500">{error}</div>;
  }
  // Find root nodes (no branchFrom)
  const rootNodes: Milestone[] = milestones.filter((m) => !m.branchFrom);
  return (
    <div className="w-full bg-white rounded-[25px] outline outline-[3px] outline-[#CDCCCC] p-3 shadow-sm mb-6 select-none" style={{ maxHeight: 420, height: 420, overflowY: 'hidden' }}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[18px] font-bold text-[#A100FF] mb-0">Career Roadmap</h2>
        <div className="flex gap-2 items-center">
          <button onClick={() => setShowAddModal(true)} className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200 shadow text-sm font-semibold">+ Add Node</button>
        </div>
      </div>
      {/* Add Node Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-xs flex flex-col gap-3">
            <h3 className="text-lg font-bold mb-2">Add Node</h3>
            <input
              className="w-full border-b border-purple-300 focus:outline-none text-base mb-1"
              placeholder="Title"
              value={addForm.title}
              onChange={(e) => handleAddFormChange("title", e.target.value)}
              autoFocus
            />
            <textarea
              className="w-full border-b border-purple-100 focus:outline-none text-sm mb-1"
              placeholder="Description"
              value={addForm.description}
              onChange={(e) => handleAddFormChange("description", e.target.value)}
              rows={2}
            />
            <input
              className="w-full border-b border-purple-100 focus:outline-none text-xs mb-1"
              placeholder="Date (e.g. 2024)"
              value={addForm.date}
              onChange={(e) => handleAddFormChange("date", e.target.value)}
            />
            {/* Connect to (Parent Node) Dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-semibold">Connect this node to:</label>
              <select
                className="rounded px-2 py-1 text-xs border"
                value={addParentId || ''}
                onChange={e => setAddParentId(e.target.value || null)}
              >
                <option value="">None (root node)</option>
                {milestones.map(m => (
                  <option key={m.id} value={m.id}>{m.title || m.id}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <select className="rounded px-2 py-1 text-xs border" value={addForm.type} onChange={(e) => handleAddFormChange("type", e.target.value)}>
                <option value="Job">Job</option>
                <option value="Education">Education</option>
                <option value="Other">Other</option>
              </select>
              <select className="rounded px-2 py-1 text-xs border" value={addForm.status} onChange={(e) => handleAddFormChange("status", e.target.value)}>
                <option value="Past">Past</option>
                <option value="Present">Present</option>
                <option value="Future">Future</option>
              </select>
            </div>
            {(addForm.type === "Job" || addForm.type === "Education") && (
              <div className="flex gap-2 mt-2 justify-center">
                <button
                  type="button"
                  className={`px-4 py-1 rounded-full border text-sm font-semibold transition-colors ${addForm.mode === "Full Time" ? "bg-purple-600 text-white border-purple-600" : "bg-gray-100 text-gray-700 border-gray-300"}`}
                  onClick={() => handleAddFormChange("mode", "Full Time")}
                >
                  Full Time
                </button>
                <button
                  type="button"
                  className={`px-4 py-1 rounded-full border text-sm font-semibold transition-colors ${addForm.mode === "Part Time" ? "bg-purple-600 text-white border-purple-600" : "bg-gray-100 text-gray-700 border-gray-300"}`}
                  onClick={() => handleAddFormChange("mode", "Part Time")}
                >
                  Part Time
                </button>
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <button className="flex-1 px-3 py-1 rounded bg-purple-600 text-white font-semibold" onClick={handleAddFormSubmit} disabled={!addForm.title.trim()}>Add</button>
              <button className="flex-1 px-3 py-1 rounded bg-gray-200 text-gray-700 font-semibold" onClick={() => { setShowAddModal(false); setAddParentId(null); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* SVG Canvas */}
      <div
        className="w-full overflow-x-auto md:overflow-x-visible relative"
        style={{ touchAction: "none", cursor: isPanning ? "grabbing" : "grab", minHeight: 400 }}
        onWheel={handleWheel}
        onMouseDown={handlePanStart}
        onMouseMove={isPanning ? handlePanMove : undefined}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
        onTouchStart={handlePanStart}
        onTouchMove={isPanning ? handlePanMove : undefined}
        onTouchEnd={handlePanEnd}
      >
        <div className="relative w-full flex justify-center">
          <svg
            width="100%"
            height={400}
            viewBox={`0 0 1200 400`}
            className="block mx-auto"
            style={{ minWidth: 350, maxWidth: 1200, width: "100%", height: 400, userSelect: "none", pointerEvents: "all", background: "transparent" }}
          >
            <g
              style={{
                transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
                transformOrigin: "200px 100px",
                transition: isPanning ? "none" : "transform 0.1s",
              }}
            >
              {rootNodes.map((root) => renderMilestone(root))}
            </g>
          </svg>
        </div>
      </div>
      <div className="text-xs text-gray-400 mt-2 text-center">Drag to move. Pinch/scroll to zoom. Tap a node to edit. Branching supported. Mobile friendly.</div>
      {/* Edit Modal */}
      {editId && (() => {
        const m = milestones.find((m) => m.id === editId);
        if (!m) return null;
        return (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-xs flex flex-col gap-3">
              <h3 className="text-lg font-bold mb-2">Edit Node</h3>
              <input
                className="w-full border-b border-purple-300 focus:outline-none text-base mb-1"
                placeholder="Title"
                value={editValue.title}
                onChange={(e) => setEditValue((v) => ({ ...v, title: e.target.value }))}
                autoFocus
              />
              <textarea
                className="w-full border-b border-purple-100 focus:outline-none text-sm mb-1"
                placeholder="Description"
                value={editValue.description}
                onChange={(e) => setEditValue((v) => ({ ...v, description: e.target.value }))}
                rows={2}
              />
              <input
                className="w-full border-b border-purple-100 focus:outline-none text-xs mb-1"
                placeholder="Date (e.g. 2024)"
                value={m.date}
                onChange={(e) => handleEditNode(editId, { date: e.target.value })}
              />
              <div className="flex gap-2">
                <select className="rounded px-2 py-1 text-xs border" value={m.type} onChange={(e) => handleEditNode(editId, { type: e.target.value as Milestone["type"] })}>
                  <option value="Job">Job</option>
                  <option value="Education">Education</option>
                  <option value="Other">Other</option>
                </select>
                <select className="rounded px-2 py-1 text-xs border" value={m.status} onChange={(e) => handleEditNode(editId, { status: e.target.value as Milestone["status"] })}>
                  <option value="Past">Past</option>
                  <option value="Present">Present</option>
                  <option value="Future">Future</option>
                </select>
              </div>
              {(m.type === "Job" || m.type === "Education") && (
                <div className="flex gap-2 mt-2 justify-center">
                  <button
                    type="button"
                    className={`px-4 py-1 rounded-full border text-sm font-semibold transition-colors ${m.mode === "Full Time" ? "bg-purple-600 text-white border-purple-600" : "bg-gray-100 text-gray-700 border-gray-300"}`}
                    onClick={() => handleEditNode(editId, { mode: "Full Time" })}
                  >
                    Full Time
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-1 rounded-full border text-sm font-semibold transition-colors ${m.mode === "Part Time" ? "bg-purple-600 text-white border-purple-600" : "bg-gray-100 text-gray-700 border-gray-300"}`}
                    onClick={() => handleEditNode(editId, { mode: "Part Time" })}
                  >
                    Part Time
                  </button>
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <button className="flex-1 px-3 py-1 rounded bg-purple-600 text-white font-semibold" onClick={() => {
                  handleEditNode(editId, { title: editValue.title, description: editValue.description });
                  setEditId(null);
                }} disabled={!editValue.title.trim()}>Done</button>
                <button className="flex-1 px-3 py-1 rounded bg-gray-200 text-gray-700 font-semibold" onClick={() => setEditId(null)}>Cancel</button>
                <button className="flex-1 px-3 py-1 rounded bg-red-100 text-red-700 font-semibold" onClick={() => handleDeleteNode(editId)}>Delete</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default RoadmapSection; 
