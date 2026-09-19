import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Calendar,
  History,
  Trophy,
  MoreVertical,
  Trash2,
  Edit3,
  Check,
  ArrowRight,
  ShieldAlert,
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
  pending: "bg-neutral-100 text-neutral-700 border-neutral-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-neutral-200 text-neutral-600 border-neutral-300",
};

const PRIORITY_BADGE: Record<string, string> = {
  normal: "bg-neutral-100 text-neutral-600 border-neutral-200",
  urgent: "bg-red-50 text-red-700 border-red-200 font-bold",
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
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getAdminName(profiles: AdminProfile[], id: string | null): string {
  if (!id) return "Unassigned";
  const p = profiles.find((a) => a.id === id);
  return p?.full_name || p?.email || "Unknown";
}

function getInitials(profiles: AdminProfile[], id: string | null): string {
  const name = getAdminName(profiles, id);
  if (name === "Unassigned" || name === "Unknown") return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── Component ───────────────────────────────────────────────────
const AdminTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<TaskHistoryEntry[]>([]);
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & UI States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [filter, setFilter] = useState<FilterKey>("all");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  // Form State (used for both Create & Edit)
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "normal",
    due_date: "",
    assigned_to: "",
  });

  // ── Fetch data ──────────────────────────────────────────────
  const fetchAll = async () => {
    try {
      const [tasksRes, historyRes, adminsRes] = await Promise.all([
        supabase.from("admin_tasks").select("*").order("created_at", { ascending: false }),
        supabase.from("admin_task_history").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id").eq("role", "admin"),
      ]);

      if (tasksRes.data) setTasks(tasksRes.data as Task[]);
      if (historyRes.data) setHistory(historyRes.data as TaskHistoryEntry[]);

      if (adminsRes.data && adminsRes.data.length > 0) {
        const adminIds = adminsRes.data.map((r: any) => r.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", adminIds);
        if (profiles) setAdmins(profiles as AdminProfile[]);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".task-menu-container")) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  // ── Filters ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!user) return tasks;
    switch (filter) {
      case "my_tasks":
        return tasks.filter((t) => t.assigned_to === user.id);
      case "assigned_by_me":
        return tasks.filter((t) => t.created_by === user.id && t.assigned_to && t.assigned_to !== user.id);
      case "pending":
        return tasks.filter((t) => t.status === "pending");
      case "in_progress":
        return tasks.filter((t) => t.status === "in_progress");
      case "completed":
        return tasks.filter((t) => t.status === "completed" || t.status === "closed");
      case "urgent":
        return tasks.filter((t) => t.priority === "urgent");
      default:
        return tasks;
    }
  }, [tasks, filter, user]);

  // ── Stats ───────────────────────────────────────────────────
  const stats = useMemo(
    () => ({
      total: tasks.length,
      pending: tasks.filter((t) => t.status === "pending").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      completed: tasks.filter((t) => t.status === "completed" || t.status === "closed").length,
      urgent: tasks.filter(
        (t) => t.priority === "urgent" && t.status !== "closed" && t.status !== "completed"
      ).length,
    }),
    [tasks]
  );

  // ── Admin leaderboard ───────────────────────────────────────
  const leaderboard = useMemo(() => {
    const map: Record<string, number> = {};
    tasks.forEach((t) => {
      if ((t.status === "completed" || t.status === "closed") && t.assigned_to) {
        map[t.assigned_to] = (map[t.assigned_to] || 0) + 1;
      }
    });
    return Object.entries(map)
      .map(([id, count]) => ({ id, count, name: getAdminName(admins, id) }))
      .sort((a, b) => b.count - a.count);
  }, [tasks, admins]);

  // ── Open Create Form ─────────────────────────────────────────
  const openCreateModal = () => {
    setEditingTask(null);
    setForm({
      title: "",
      description: "",
      priority: "normal",
      due_date: "",
      assigned_to: "",
    });
    setShowCreateModal(true);
  };

  // ── Open Edit Form ───────────────────────────────────────────
  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority || "normal",
      due_date: task.due_date ? task.due_date.split("T")[0] : "",
      assigned_to: task.assigned_to || "",
    });
    setShowCreateModal(true);
    setActiveMenuId(null);
  };

  // ── Create or Update Task ────────────────────────────────────
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.title.trim()) return;
    setSubmitting(true);

    try {
      if (editingTask) {
        // Update existing task
        const updateData: any = {
          title: form.title.trim(),
          description: form.description.trim() || null,
          priority: form.priority,
          due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
          assigned_to: form.assigned_to || null,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("admin_tasks")
          .update(updateData)
          .eq("id", editingTask.id);

        if (error) throw error;

        await supabase.from("admin_task_history").insert({
          task_id: editingTask.id,
          action: "edited",
          new_value: form.title.trim(),
          performed_by: user.id,
        } as any);

        toast({ title: "Task updated successfully" });
      } else {
        // Create new task
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

        if (error) throw error;

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

        toast({ title: "Task created successfully" });
      }

      setShowCreateModal(false);
      setEditingTask(null);
      setForm({ title: "", description: "", priority: "normal", due_date: "", assigned_to: "" });
      fetchAll();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Update status ───────────────────────────────────────────
  const handleStatusChange = async (task: Task, newStatus: string) => {
    if (!user) return;
    const oldStatus = task.status;

    try {
      const { error } = await supabase
        .from("admin_tasks")
        .update({ status: newStatus, updated_at: new Date().toISOString() } as any)
        .eq("id", task.id);

      if (error) throw error;

      await supabase.from("admin_task_history").insert({
        task_id: task.id,
        action: "status_changed",
        old_value: STATUS_LABELS[oldStatus] || oldStatus,
        new_value: STATUS_LABELS[newStatus] || newStatus,
        performed_by: user.id,
      } as any);

      toast({ title: `Status → ${STATUS_LABELS[newStatus]}` });
      setActiveMenuId(null);
      fetchAll();
    } catch (err: any) {
      toast({ title: "Error updating status", description: err.message, variant: "destructive" });
    }
  };

  // ── Delete task confirmation & execution ────────────────────
  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      const { error } = await supabase.from("admin_tasks").delete().eq("id", deleteTargetId);
      if (error) throw error;

      toast({ title: "Task deleted successfully" });
      if (expandedTask === deleteTargetId) {
        setExpandedTask(null);
      }
      setDeleteTargetId(null);
      setActiveMenuId(null);
      fetchAll();
    } catch (err: any) {
      toast({ title: "Error deleting task", description: err.message, variant: "destructive" });
    }
  };

  // ── Loading ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
          <span>Loading tasks...</span>
        </div>
      </div>
    );
  }

  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "my_tasks", label: "My Tasks" },
    { key: "assigned_by_me", label: "Assigned" },
    { key: "pending", label: "Pending" },
    { key: "in_progress", label: "In Progress" },
    { key: "completed", label: "Done" },
    { key: "urgent", label: "Urgent" },
  ];

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* ── Top Header Section ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-foreground">
            Task Management
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-light">
            Create, assign, and track internal admin tasks.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="w-full sm:w-auto h-11 px-5 rounded-lg bg-foreground text-background hover:bg-foreground/90 text-xs font-bold tracking-[0.08em] uppercase flex items-center justify-center gap-2 transition-all shadow-xs active:scale-98"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Create Task</span>
        </button>
      </div>

      {/* ── Compact Statistics Grid ─────────────────────────────── */}
      <div className="space-y-3">
        {/* 2-column on mobile, 4-column on sm/desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="rounded-xl border border-border bg-white p-3.5 sm:p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground">
                Total Tasks
              </span>
              <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground/60" />
            </div>
            <p className="text-xl sm:text-2xl font-mono font-extrabold text-foreground mt-2">
              {stats.total}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-white p-3.5 sm:p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground">
                Pending
              </span>
              <Clock className="h-3.5 w-3.5 text-neutral-500" />
            </div>
            <p className="text-xl sm:text-2xl font-mono font-extrabold text-neutral-700 mt-2">
              {stats.pending}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-white p-3.5 sm:p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground">
                In Progress
              </span>
              <Circle className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <p className="text-xl sm:text-2xl font-mono font-extrabold text-blue-700 mt-2">
              {stats.in_progress}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-white p-3.5 sm:p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground">
                Completed
              </span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <p className="text-xl sm:text-2xl font-mono font-extrabold text-emerald-700 mt-2">
              {stats.completed}
            </p>
          </div>
        </div>

        {/* Urgent Alert Bar / Card */}
        {stats.urgent > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50/70 p-3 sm:p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-red-900 uppercase tracking-wide">
                  {stats.urgent} Urgent {stats.urgent === 1 ? "Task" : "Tasks"} Requiring Attention
                </p>
                <p className="text-[11px] text-red-700/80 font-light">
                  Review and prioritize urgent action items.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFilter("urgent")}
              className="text-[11px] font-bold text-red-800 bg-white border border-red-200 px-2.5 py-1 rounded-md uppercase tracking-wider hover:bg-red-50 transition-colors shrink-0"
            >
              View Urgent
            </button>
          </div>
        )}
      </div>

      {/* ── Compact Horizontal Filter Pills (Scrollable on mobile) ─ */}
      <div className="w-full overflow-hidden">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none no-scrollbar flex-nowrap">
          {filters.map((f) => {
            const isActive = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`h-9 px-3.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? "bg-foreground text-background shadow-xs"
                    : "bg-white border border-border text-muted-foreground hover:text-foreground hover:bg-neutral-50"
                }`}
              >
                <span>{f.label}</span>
                {f.key === "urgent" && stats.urgent > 0 && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Task Cards List ─────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-medium">
            Showing <span className="font-bold text-foreground">{filtered.length}</span> {filtered.length === 1 ? "task" : "tasks"}
          </p>
          {filter !== "all" && (
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Clear filter
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-muted-foreground">
              <CheckSquareIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">No tasks match this filter</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Try selecting a different filter or create a new task.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Create Task
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((task) => {
              const isExpanded = expandedTask === task.id;
              const taskHistory = history.filter((h) => h.task_id === task.id);
              const nextStatuses = STATUS_FLOW[task.status] || [];
              const isOverdue =
                task.due_date &&
                new Date(task.due_date) < new Date() &&
                task.status !== "completed" &&
                task.status !== "closed";
              const isMenuOpen = activeMenuId === task.id;

              return (
                <div
                  key={task.id}
                  className={`rounded-2xl border transition-all bg-white overflow-hidden shadow-xs ${
                    isExpanded ? "border-foreground/30 ring-1 ring-foreground/10" : "border-border hover:border-neutral-300"
                  }`}
                >
                  {/* Task Card Header Area */}
                  <div className="p-4 sm:p-5 space-y-3">
                    {/* Top Row: Title + Menu */}
                    <div className="flex items-start justify-between gap-3">
                      {/* Full readable title without aggressive cutoff */}
                      <h3
                        onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                        className="text-sm sm:text-base font-bold text-foreground leading-snug break-words cursor-pointer hover:text-foreground/80 transition-colors flex-1 min-w-0"
                      >
                        {task.title}
                      </h3>

                      {/* 3-dots Action Menu */}
                      <div className="relative task-menu-container flex-shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(isMenuOpen ? null : task.id);
                          }}
                          aria-label="Task actions"
                          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-neutral-50 transition-colors active:scale-95"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                          <div className="absolute right-0 top-9 z-20 w-44 rounded-xl border border-border bg-white shadow-lg py-1 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedTask(isExpanded ? null : task.id);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3.5 py-2.5 text-left font-medium text-foreground hover:bg-neutral-50 flex items-center gap-2"
                            >
                              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                              {isExpanded ? "Collapse Details" : "View Details"}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(task)}
                              className="w-full px-3.5 py-2.5 text-left font-medium text-foreground hover:bg-neutral-50 flex items-center gap-2"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                              Edit Task
                            </button>
                            {nextStatuses.map((ns) => (
                              <button
                                key={ns}
                                type="button"
                                onClick={() => handleStatusChange(task, ns)}
                                className="w-full px-3.5 py-2.5 text-left font-medium text-foreground hover:bg-neutral-50 flex items-center gap-2"
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                Mark {STATUS_LABELS[ns]}
                              </button>
                            ))}
                            <div className="h-px bg-border my-1" />
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteTargetId(task.id);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3.5 py-2.5 text-left font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              Delete Task
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Badges Row: Priority, Status, Overdue */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {task.priority === "urgent" && (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.08em] rounded-md border ${PRIORITY_BADGE.urgent}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                          Urgent
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-[10px] uppercase tracking-[0.08em] font-semibold rounded-md border ${STATUS_COLORS[task.status]}`}>
                        {STATUS_LABELS[task.status]}
                      </span>
                      {isOverdue && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.08em] font-bold rounded-md bg-red-50 text-red-600 border border-red-200">
                          <Clock className="w-3 h-3" /> Overdue
                        </span>
                      )}
                    </div>

                    {/* Metadata summary (Clean, Stacked & Readable on mobile) */}
                    <div className="pt-2 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${task.assigned_to ? "bg-foreground text-background" : "bg-neutral-200 text-neutral-600"}`}>
                            {getInitials(admins, task.assigned_to)}
                          </div>
                          <span className="font-medium text-foreground truncate max-w-[140px] sm:max-w-[180px]">
                            {getAdminName(admins, task.assigned_to)}
                          </span>
                        </div>
                        {task.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span className={isOverdue ? "text-red-600 font-semibold" : ""}>
                              Due {formatDate(task.due_date)}
                            </span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 justify-between sm:justify-end">
                        <span className="text-[11px] text-muted-foreground/70">
                          {timeAgo(task.created_at)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                          className="flex items-center gap-1 text-xs font-bold text-foreground hover:underline uppercase tracking-wider"
                        >
                          {isExpanded ? (
                            <>
                              Hide <ChevronUp className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <>
                              Details <ChevronDown className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ── EXPANDED TASK DETAILS ──────────────────────── */}
                  {isExpanded && (
                    <div className="px-4 sm:px-6 pb-6 pt-2 space-y-5 border-t border-border bg-[#fafafa]">
                      {/* Description */}
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-1.5">
                          Description
                        </p>
                        {task.description ? (
                          <div className="p-3.5 rounded-xl bg-white border border-border text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                            {task.description}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground/70 italic">No description provided.</p>
                        )}
                      </div>

                      {/* Detail Grid / Stack on mobile */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl bg-white border border-border text-xs">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold">
                            Created By
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-[9px] font-bold shrink-0">
                              {getInitials(admins, task.created_by)}
                            </span>
                            <span className="font-semibold text-foreground truncate">
                              {getAdminName(admins, task.created_by)}
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold">
                            Assigned To
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${task.assigned_to ? "bg-foreground text-background" : "bg-neutral-200 text-neutral-600"}`}>
                              {getInitials(admins, task.assigned_to)}
                            </span>
                            <span className="font-semibold text-foreground truncate">
                              {getAdminName(admins, task.assigned_to)}
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold">
                            Due Date
                          </p>
                          <p className={`font-semibold mt-1 ${isOverdue ? "text-red-600" : "text-foreground"}`}>
                            {formatDate(task.due_date)}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold">
                            Created Date
                          </p>
                          <p className="font-semibold text-foreground mt-1">
                            {formatDate(task.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        {nextStatuses.map((ns) => (
                          <button
                            key={ns}
                            type="button"
                            onClick={() => handleStatusChange(task, ns)}
                            className="h-10 px-4 rounded-lg bg-foreground text-background hover:bg-foreground/90 text-xs font-bold tracking-[0.08em] uppercase flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            Mark {STATUS_LABELS[ns]}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => openEditModal(task)}
                          className="h-10 px-4 rounded-lg border border-border bg-white text-foreground hover:bg-neutral-50 text-xs font-bold tracking-[0.08em] uppercase flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit Task
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetId(task.id)}
                          className="h-10 px-4 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold tracking-[0.08em] uppercase flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Task
                        </button>
                      </div>

                      {/* History timeline */}
                      {taskHistory.length > 0 && (
                        <div className="pt-2">
                          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-bold mb-3 flex items-center gap-1.5">
                            <History className="h-3.5 w-3.5" /> Activity Log
                          </p>
                          <div className="space-y-2 p-3.5 rounded-xl bg-white border border-border">
                            {taskHistory.map((h) => (
                              <div key={h.id} className="flex items-start gap-2.5 text-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mt-1.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <span className="font-semibold text-foreground">
                                    {getAdminName(admins, h.performed_by)}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {" "}
                                    {h.action === "created" && "created this task"}
                                    {h.action === "assigned" && `assigned to ${h.new_value}`}
                                    {h.action === "status_changed" && `changed status from ${h.old_value} → ${h.new_value}`}
                                    {h.action === "edited" && "updated task details"}
                                  </span>
                                  <span className="text-muted-foreground/60 ml-2 text-[10px]">
                                    {timeAgo(h.created_at)}
                                  </span>
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

      {/* ── Admin Activity / Leaderboard Collapsible Card ───────── */}
      {leaderboard.length > 0 && (
        <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setShowActivity(!showActivity)}
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-neutral-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <Trophy className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-[0.1em] uppercase text-foreground">
                  Admin Task Leaderboard
                </h3>
                <p className="text-[11px] text-muted-foreground font-light">
                  Completed task metrics by admin
                </p>
              </div>
            </div>
            {showActivity ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {showActivity && (
            <div className="px-5 pb-4 pt-1 divide-y divide-border border-t border-border/60">
              {leaderboard.map((entry, i) => (
                <div key={entry.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4 font-mono font-bold">
                      #{i + 1}
                    </span>
                    <span className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-bold">
                      {getInitials(admins, entry.id)}
                    </span>
                    <span className="font-semibold text-foreground">{entry.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono font-bold text-[11px]">
                      {entry.count} completed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CREATE / EDIT TASK MODAL (Mobile-First Full Viewport) ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-foreground/60 backdrop-blur-xs overflow-y-auto">
          <div
            className="w-full max-w-lg rounded-2xl bg-white border border-border shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-[#fafafa]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-foreground text-background flex items-center justify-center text-xs font-bold">
                  {editingTask ? <Edit3 className="w-3.5 h-3.5" /> : <Plus className="w-4 h-4" />}
                </div>
                <h3 className="text-sm font-bold tracking-[0.1em] uppercase text-foreground">
                  {editingTask ? "Edit Task" : "New Task"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-neutral-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveTask} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  Task Title *
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Website cart UI & checkout flow update"
                  required
                  className="w-full h-11 px-3.5 text-sm rounded-lg border border-border bg-white outline-none focus:border-foreground transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Add detailed task notes or checklist..."
                  rows={3}
                  className="w-full p-3 text-sm rounded-lg border border-border bg-white outline-none resize-none focus:border-foreground transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full h-11 px-3 text-sm rounded-lg border border-border bg-white outline-none focus:border-foreground cursor-pointer"
                  >
                    <option value="normal">Normal Priority</option>
                    <option value="urgent">🔴 Urgent</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="w-full h-11 px-3 text-sm rounded-lg border border-border bg-white outline-none focus:border-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  Assign To
                </label>
                <select
                  value={form.assigned_to}
                  onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                  className="w-full h-11 px-3 text-sm rounded-lg border border-border bg-white outline-none focus:border-foreground cursor-pointer"
                >
                  <option value="">— Unassigned —</option>
                  {admins.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.full_name || a.email || a.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:flex-1 h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 text-xs font-bold tracking-[0.1em] uppercase transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  )}
                  {submitting ? "Saving..." : editingTask ? "Save Changes" : "Create Task"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-full sm:w-auto h-12 px-6 rounded-xl border border-border text-xs font-bold tracking-[0.08em] uppercase hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ───────────────────────────── */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-xs">
          <div
            className="w-full max-w-sm rounded-2xl bg-white border border-border shadow-2xl p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Delete this task?
              </h3>
              <p className="text-xs text-muted-foreground">
                This action cannot be undone and will permanently remove this task and its history.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="h-11 rounded-xl border border-border text-xs font-bold tracking-wider uppercase hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="h-11 rounded-xl bg-red-600 text-white hover:bg-red-700 text-xs font-bold tracking-wider uppercase transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function CheckSquareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export default AdminTasks;
