import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import {
  Plus, X, ChevronDown, ChevronUp, Clock, AlertTriangle, CheckCircle2,
  Circle, XCircle, User, Calendar, History, Trophy
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────
interface AdminProfile {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

interface TaskHistoryEntry {
  id: string;
  task_id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  performed_by: string;
  created_at: string;
}

type FilterKey = "all" | "my_tasks" | "assigned_by_me" | "pending" | "in_progress" | "completed" | "urgent";

const STATUS_FLOW: Record<string, string[]> = {
  pending: ["in_progress"],
  in_progress: ["completed"],
  completed: ["closed"],
  closed: [],
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  closed: "Closed",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-neutral-100 text-neutral-600",
  in_progress: "bg-blue-50 text-blue-700",
  completed: "bg-green-50 text-green-700",
  closed: "bg-neutral-200 text-neutral-500",
};

const PRIORITY_BADGE: Record<string, string> = {
  normal: "bg-neutral-100 text-neutral-600",
  urgent: "bg-red-50 text-red-600 ring-1 ring-red-200",
};

// ── Helpers ─────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getAdminName(profiles: AdminProfile[], id: string | null): string {
  if (!id) return "Unassigned";
  const p = profiles.find(a => a.id === id);
  return p?.full_name || p?.email || "Unknown";
}

function getInitials(profiles: AdminProfile[], id: string | null): string {
  const name = getAdminName(profiles, id);
  if (name === "Unassigned" || name === "Unknown") return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

// ── Component ───────────────────────────────────────────────────
const AdminTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<TaskHistoryEntry[]>([]);
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "normal",
    due_date: "",
    assigned_to: "",
  });

  // ── Fetch data ──────────────────────────────────────────────
  const fetchAll = async () => {
    const [tasksRes, historyRes, adminsRes] = await Promise.all([
      supabase
        .from("admin_tasks")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("admin_task_history")
        .select("*")
        .order("created_at", { ascending: false }),
      // Get admin profiles: join user_roles → profiles
      supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin"),
    ]);

    if (tasksRes.data) setTasks(tasksRes.data as Task[]);
    if (historyRes.data) setHistory(historyRes.data as TaskHistoryEntry[]);

    // Fetch profiles for admin user IDs
    if (adminsRes.data && adminsRes.data.length > 0) {
      const adminIds = adminsRes.data.map((r: any) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", adminIds);
      if (profiles) setAdmins(profiles as AdminProfile[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Filters ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!user) return tasks;
    switch (filter) {
      case "my_tasks":
        return tasks.filter(t => t.assigned_to === user.id);
      case "assigned_by_me":
        return tasks.filter(t => t.created_by === user.id && t.assigned_to && t.assigned_to !== user.id);
      case "pending":
        return tasks.filter(t => t.status === "pending");
      case "in_progress":
        return tasks.filter(t => t.status === "in_progress");
      case "completed":
        return tasks.filter(t => t.status === "completed" || t.status === "closed");
      case "urgent":
        return tasks.filter(t => t.priority === "urgent");
      default:
        return tasks;
    }
  }, [tasks, filter, user]);

  // ── Stats ───────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter(t => t.status === "pending").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    completed: tasks.filter(t => t.status === "completed" || t.status === "closed").length,
    urgent: tasks.filter(t => t.priority === "urgent" && t.status !== "closed" && t.status !== "completed").length,
  }), [tasks]);

  // ── Admin leaderboard ───────────────────────────────────────
  const leaderboard = useMemo(() => {
    const map: Record<string, number> = {};
    tasks.forEach(t => {
      if ((t.status === "completed" || t.status === "closed") && t.assigned_to) {
        map[t.assigned_to] = (map[t.assigned_to] || 0) + 1;
      }
    });
    return Object.entries(map)
      .map(([id, count]) => ({ id, count, name: getAdminName(admins, id) }))
      .sort((a, b) => b.count - a.count);
  }, [tasks, admins]);

  // ── Create task ─────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.title.trim()) return;
    setSubmitting(true);

    const taskData: any = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      priority: form.priority,
      due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
      created_by: user.id,
      assigned_to: form.assigned_to || null,
    };

    const { data, error } = await supabase
      .from("admin_tasks")
      .insert(taskData)
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // Log creation
    await supabase.from("admin_task_history").insert({
      task_id: data.id,
      action: "created",
      new_value: form.title.trim(),
      performed_by: user.id,
    } as any);

    // Log assignment if assigned
    if (form.assigned_to) {
      await supabase.from("admin_task_history").insert({
        task_id: data.id,
        action: "assigned",
        new_value: getAdminName(admins, form.assigned_to),
        performed_by: user.id,
      } as any);
    }

    toast({ title: "Task created" });
    setShowForm(false);
    setForm({ title: "", description: "", priority: "normal", due_date: "", assigned_to: "" });
    setSubmitting(false);
    fetchAll();
  };

  // ── Update status ───────────────────────────────────────────
  const handleStatusChange = async (task: Task, newStatus: string) => {
    if (!user) return;
    const oldStatus = task.status;

    const { error } = await supabase
      .from("admin_tasks")
      .update({ status: newStatus } as any)
      .eq("id", task.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    await supabase.from("admin_task_history").insert({
      task_id: task.id,
      action: "status_changed",
      old_value: STATUS_LABELS[oldStatus] || oldStatus,
      new_value: STATUS_LABELS[newStatus] || newStatus,
      performed_by: user.id,
    } as any);

    toast({ title: `Status → ${STATUS_LABELS[newStatus]}` });
    fetchAll();
  };

  // ── Delete task ─────────────────────────────────────────────
  const handleDelete = async (taskId: string) => {
    if (!confirm("Delete this task permanently?")) return;
    const { error } = await supabase.from("admin_tasks").delete().eq("id", taskId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Task deleted" });
    setExpandedTask(null);
    fetchAll();
  };

  // ── Loading ─────────────────────────────────────────────────
  if (loading) return <p className="text-sm text-muted-foreground">Loading tasks...</p>;

  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "my_tasks", label: "My Tasks" },
    { key: "assigned_by_me", label: "Assigned by Me" },
    { key: "pending", label: "Pending" },
    { key: "in_progress", label: "In Progress" },
    { key: "completed", label: "Completed" },
    { key: "urgent", label: "Urgent" },
  ];

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-sm uppercase tracking-[0.15em] font-semibold">Task Management</h2>
          <p className="text-xs text-muted-foreground mt-1">Create, assign, and track internal admin tasks.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-foreground text-background hover:bg-foreground/90 text-sm font-medium tracking-[0.08em] uppercase h-10 px-5 flex items-center gap-2 transition-colors"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "Create Task"}
        </button>
      </div>

      {/* ── Stats Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Tasks", value: stats.total, icon: CheckCircle2, color: "" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-neutral-500" },
          { label: "In Progress", value: stats.in_progress, icon: Circle, color: "text-blue-600" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-green-600" },
          { label: "Urgent", value: stats.urgent, icon: AlertTriangle, color: "text-red-500" },
        ].map((card) => (
          <div key={card.label} className="border border-border p-5 space-y-1.5 bg-background">
            <div className="flex items-center justify-between">
              <p className="text-xs tracking-[0.08em] uppercase text-muted-foreground font-medium">{card.label}</p>
              <card.icon className={`h-4 w-4 ${card.color || "text-muted-foreground/80"}`} />
            </div>
            <p className="text-lg font-mono font-medium tracking-tight">{card.value}</p>
          </div>
        ))}
      </div>

      {/* ── Create Task Form ────────────────────────────────── */}
      {showForm && (
        <form onSubmit={handleCreate} className="border border-border p-6 space-y-4 bg-background">
          <h3 className="text-sm uppercase tracking-[0.1em] font-semibold mb-2">New Task</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs uppercase tracking-[0.05em] text-muted-foreground font-medium">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Update product images"
                required
                className="h-10 px-3 text-sm border border-border bg-transparent outline-none focus:border-foreground transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs uppercase tracking-[0.05em] text-muted-foreground font-medium">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional task details..."
                rows={3}
                className="px-3 py-2 text-sm border border-border bg-transparent outline-none resize-none focus:border-foreground transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-[0.05em] text-muted-foreground font-medium">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="h-10 px-3 text-sm border border-border bg-transparent outline-none"
              >
                <option value="normal">Normal</option>
                <option value="urgent">🔴 Urgent</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-[0.05em] text-muted-foreground font-medium">Due Date</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="h-10 px-3 text-sm border border-border bg-transparent outline-none"
              />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs uppercase tracking-[0.05em] text-muted-foreground font-medium">Assign To</label>
              <select
                value={form.assigned_to}
                onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                className="h-10 px-3 text-sm border border-border bg-transparent outline-none"
              >
                <option value="">— Unassigned —</option>
                {admins.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name || a.email || a.id}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-foreground text-background hover:bg-foreground/90 text-sm font-medium tracking-[0.08em] uppercase h-10 px-6 transition-colors disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Task"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border border-border text-sm font-medium tracking-[0.08em] uppercase h-10 px-6 hover:bg-secondary/40 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Filter Tabs ─────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1 border border-border w-fit">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 sm:px-4 py-2 text-[11px] sm:text-xs uppercase tracking-[0.06em] transition-colors font-medium ${
              filter === f.key
                ? "bg-foreground text-background font-semibold"
                : "text-muted-foreground hover:bg-secondary/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Task List ───────────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{filtered.length} task{filtered.length !== 1 ? "s" : ""}</p>

        {filtered.length === 0 ? (
          <div className="border border-border p-12 text-center">
            <p className="text-sm text-muted-foreground">No tasks match this filter.</p>
          </div>
        ) : (
          <div className="border border-border divide-y divide-border">
            {filtered.map((task) => {
              const isExpanded = expandedTask === task.id;
              const taskHistory = history.filter(h => h.task_id === task.id);
              const nextStatuses = STATUS_FLOW[task.status] || [];
              const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed" && task.status !== "closed";

              return (
                <div key={task.id} className="bg-background">
                  {/* Task Row */}
                  <button
                    onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                    className="w-full px-4 sm:px-5 py-4 flex items-start sm:items-center justify-between gap-3 text-left hover:bg-secondary/20 transition-colors"
                  >
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate">{task.title}</span>
                        {/* Priority badge */}
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] font-semibold rounded-sm ${PRIORITY_BADGE[task.priority]}`}>
                          {task.priority}
                        </span>
                        {/* Status badge */}
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] font-semibold rounded-sm ${STATUS_COLORS[task.status]}`}>
                          {STATUS_LABELS[task.status]}
                        </span>
                        {/* Overdue indicator */}
                        {isOverdue && (
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] font-semibold rounded-sm bg-red-50 text-red-600 ring-1 ring-red-200">
                            Overdue
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {getAdminName(admins, task.assigned_to)}
                        </span>
                        {task.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(task.due_date)}
                          </span>
                        )}
                        <span>{timeAgo(task.created_at)}</span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </button>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="px-4 sm:px-5 pb-5 space-y-5 border-t border-border/50 bg-secondary/5">
                      {/* Description */}
                      {task.description && (
                        <div className="pt-4">
                          <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground font-semibold mb-1.5">Description</p>
                          <p className="text-sm text-foreground/80 whitespace-pre-wrap">{task.description}</p>
                        </div>
                      )}

                      {/* Detail grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-medium">Created By</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-[9px] font-bold shrink-0">
                              {getInitials(admins, task.created_by)}
                            </span>
                            <span className="text-sm truncate">{getAdminName(admins, task.created_by)}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-medium">Assigned To</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${task.assigned_to ? "bg-foreground text-background" : "bg-neutral-200 text-neutral-500"}`}>
                              {getInitials(admins, task.assigned_to)}
                            </span>
                            <span className="text-sm truncate">{getAdminName(admins, task.assigned_to)}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-medium">Due Date</p>
                          <p className={`text-sm mt-1 ${isOverdue ? "text-red-600 font-medium" : ""}`}>{formatDate(task.due_date)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-medium">Created</p>
                          <p className="text-sm mt-1">{formatDate(task.created_at)}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {nextStatuses.map((ns) => (
                          <button
                            key={ns}
                            onClick={() => handleStatusChange(task, ns)}
                            className="bg-foreground text-background hover:bg-foreground/90 text-[11px] font-medium tracking-[0.08em] uppercase h-8 px-4 transition-colors"
                          >
                            Mark {STATUS_LABELS[ns]}
                          </button>
                        ))}
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="border border-red-300 text-red-500 hover:bg-red-50 text-[11px] font-medium tracking-[0.08em] uppercase h-8 px-4 transition-colors"
                        >
                          Delete
                        </button>
                      </div>

                      {/* History timeline */}
                      {taskHistory.length > 0 && (
                        <div className="pt-2">
                          <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground font-semibold mb-3 flex items-center gap-1.5">
                            <History className="h-3.5 w-3.5" /> Activity
                          </p>
                          <div className="space-y-2">
                            {taskHistory.map((h) => (
                              <div key={h.id} className="flex items-start gap-3 text-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mt-1.5 shrink-0" />
                                <div className="flex-1">
                                  <span className="font-medium">{getAdminName(admins, h.performed_by)}</span>
                                  <span className="text-muted-foreground">
                                    {" "}{h.action === "created" && "created this task"}
                                    {h.action === "assigned" && `assigned to ${h.new_value}`}
                                    {h.action === "status_changed" && `changed status from ${h.old_value} → ${h.new_value}`}
                                  </span>
                                  <span className="text-muted-foreground/60 ml-2">{timeAgo(h.created_at)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Admin Activity Summary ──────────────────────────── */}
      {leaderboard.length > 0 && (
        <div className="border border-border bg-background">
          <button
            onClick={() => setShowActivity(!showActivity)}
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-secondary/20 transition-colors"
          >
            <h3 className="text-sm tracking-[0.1em] uppercase font-semibold flex items-center gap-2">
              <Trophy className="h-3.5 w-3.5" /> Admin Activity
            </h3>
            {showActivity ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
          {showActivity && (
            <div className="px-5 pb-4 divide-y divide-border">
              {leaderboard.map((entry, i) => (
                <div key={entry.id} className="py-2.5 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-5 font-mono">#{i + 1}</span>
                    <span className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-bold">
                      {getInitials(admins, entry.id)}
                    </span>
                    <span className="font-medium">{entry.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground font-mono">{entry.count} completed</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminTasks;
