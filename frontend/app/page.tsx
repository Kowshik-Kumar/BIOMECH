import DashboardWorkspace from "@/components/DashboardWorkspace";
import Sidebar from "@/components/Sidebar";

export default function EntryPage() {
  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">
      <Sidebar activeKey="dashboard" />
      <div className="ml-64 min-h-screen px-7 py-6">
        <DashboardWorkspace />
      </div>
    </main>
  );
}
