import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Terminal, Info, AlertTriangle, XCircle, Search, RefreshCw } from "lucide-react";

const AdminLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");

  const fetchLogs = async () => {
    setRefreshing(true);
    const { data } = await supabase
      .from("system_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
      
    setLogs(data || []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "INFO": return <Info className="h-4 w-4 text-blue-500" />;
      case "WARN": return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "ERROR": return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "CRITICAL": return <XCircle className="h-4 w-4 text-rose-600" />;
      default: return <Terminal className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "INFO": return "bg-blue-50 text-blue-700 border-blue-200";
      case "WARN": return "bg-amber-50 text-amber-700 border-amber-200";
      case "ERROR": return "bg-red-50 text-red-700 border-red-200";
      case "CRITICAL": return "bg-rose-100 text-rose-800 border-rose-300 font-bold";
      default: return "bg-secondary text-muted-foreground border-border";
    }
  };

  const filteredLogs = logs.filter(log => {
    if (levelFilter !== "ALL" && log.level !== levelFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (log.source || "").toLowerCase().includes(q) ||
        (log.message || "").toLowerCase().includes(q) ||
        JSON.stringify(log.metadata || {}).toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) return <p className="text-sm text-muted-foreground">Loading system logs...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">System Logs</h2>
          <p className="text-xs text-muted-foreground">Monitoring webhooks, transactions, and background tasks.</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 text-[11px] uppercase tracking-[0.1em] border border-border bg-background hover:bg-secondary transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search logs..."
            className="w-full h-9 pl-9 pr-4 text-xs bg-transparent border border-border outline-none focus:border-foreground transition-colors"
          />
        </div>
        <select
          value={levelFilter}
          onChange={e => setLevelFilter(e.target.value)}
          className="h-9 text-xs tracking-[0.08em] uppercase bg-transparent border border-border px-3 outline-none"
        >
          <option value="ALL">All Levels</option>
          <option value="INFO">Info</option>
          <option value="WARN">Warning</option>
          <option value="ERROR">Error</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="border border-border p-8 text-center text-sm text-muted-foreground bg-background">
          No logs found matching your criteria.
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map(log => (
            <div key={log.id} className="border border-border bg-background p-3 hover:bg-secondary/20 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getLevelIcon(log.level)}</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase tracking-widest px-1.5 py-0.5 border ${getLevelBadge(log.level)}`}>
                        {log.level}
                      </span>
                      <span className="text-xs font-mono font-medium">{log.source}</span>
                      <span className="text-[10px] text-muted-foreground border-l border-border pl-2">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{log.message}</p>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <pre className="text-[10px] font-mono bg-secondary/50 p-2 border border-border/50 text-muted-foreground mt-2 max-w-3xl overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminLogs;
