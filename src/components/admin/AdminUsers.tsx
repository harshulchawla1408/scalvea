import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (profiles) {
      const enriched = await Promise.all(profiles.map(async (p: any) => {
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", p.id);
        const { data: orders } = await supabase.from("orders").select("id").eq("user_id", p.id);
        return { ...p, roles: roles?.map((r: any) => r.role) || [], orderCount: orders?.length || 0 };
      }));
      setUsers(enriched);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleBlock = async (userId: string, blocked: boolean) => {
    await supabase.from("profiles").update({ is_blocked: !blocked } as any).eq("id", userId);
    toast({ title: blocked ? "User unblocked" : "User blocked" });
    fetchUsers();
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{users.length} users</p>
      <div className="border border-border divide-y divide-border">
        {users.map((u) => (
          <div key={u.id} className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm">{u.full_name || u.email || "—"}</p>
              <p className="text-xs text-muted-foreground">{u.email} · {u.roles.join(", ")} · {u.orderCount} orders</p>
            </div>
            <div className="flex items-center gap-3">
              {u.is_blocked && <span className="text-[10px] uppercase tracking-[0.1em] text-red-500">Blocked</span>}
              <button
                onClick={() => toggleBlock(u.id, u.is_blocked)}
                className={`text-xs px-3 py-1 border transition-colors ${u.is_blocked ? "border-green-500 text-green-500 hover:bg-green-50" : "border-red-500 text-red-500 hover:bg-red-50"}`}
              >
                {u.is_blocked ? "Unblock" : "Block"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminUsers;
