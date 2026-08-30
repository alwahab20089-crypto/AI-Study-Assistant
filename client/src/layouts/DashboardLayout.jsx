import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  HelpCircle,
  Layers,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Folders,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Documents", icon: FileText, path: "/documents" },
  { label: "Subjects", icon: Folders, path: "/subjects" },
  { label: "Study Mode", icon: BookOpen, path: "/study" },
  { label: "Quizzes", icon: HelpCircle, path: "/quizzes" },
  { label: "Flashcards", icon: Layers, path: "/flashcards" },
  { label: "Progress", icon: TrendingUp, path: "/progress" },
];

const DashboardLayout = () => {
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const NavContent = () => (
    <>
      <div className="px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-serif font-semibold text-sm flex items-center justify-center shadow-sm shadow-violet-200 transition-transform duration-300 hover:scale-105">
            N
          </div>
          <span className="font-serif font-semibold text-neutral-900 text-sm leading-tight tracking-tight">
            NovaStudy
            <br />
            <span className="text-violet-600">AI</span>
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-violet-50 to-indigo-50/60 text-violet-700"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-gradient-to-b from-violet-600 to-indigo-500 transition-all duration-200 ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                />
                <Icon
                  size={18}
                  className={`transition-transform duration-200 ${isActive ? "" : "group-hover:scale-105"}`}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-6 space-y-1 border-t border-neutral-100 pt-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors duration-200 w-full"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-neutral-200/70 fixed inset-y-0 left-0">
        <NavContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 h-16 bg-white/90 backdrop-blur-sm border-b border-neutral-200/70 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-serif font-semibold text-xs flex items-center justify-center shadow-sm shadow-violet-200">
            N
          </div>
          <span className="font-serif font-semibold text-neutral-900 text-sm">
            NovaStudy <span className="text-violet-600">AI</span>
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="text-neutral-600 hover:text-violet-600 transition-colors duration-200"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm transition-opacity duration-200"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 bg-white flex flex-col h-full shadow-[0_24px_60px_-12px_rgba(0,0,0,0.35)] animate-[slideIn_0.25s_ease-out]">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-5 right-4 text-neutral-400 hover:text-neutral-700 transition-colors duration-200"
            >
              <X size={20} />
            </button>
            <NavContent />
          </aside>
          <style>{`@keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }`}</style>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;