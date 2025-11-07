import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import StaffDashboard from "@/components/dashboard/StaffDashboard";
import PatientDashboard from "@/components/dashboard/PatientDashboard";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchUserRole = async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("active", true)
        .single();

      if (error) {
        console.error("Error fetching user role:", error);
        setLoading(false);
        return;
      }

      setUserRole(data?.role || null);
      setLoading(false);
    };

    fetchUserRole();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">
          Você não tem permissões atribuídas. Entre em contato com o administrador.
        </p>
      </div>
    );
  }

  return (
    <>
      {userRole === "admin" && <AdminDashboard user={user!} />}
      {userRole === "staff" && <StaffDashboard user={user!} />}
      {userRole === "patient" && <PatientDashboard user={user!} />}
    </>
  );
};

export default Dashboard;
