import Header from "@/components/common/Header";
import Dashboard from "@/components/dashboard/Dashboard";

export default function App() {
  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <main>
        <Dashboard />
      </main>
    </div>
  );
}
