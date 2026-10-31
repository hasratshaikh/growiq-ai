import {
  BarChart3,
  Camera,
  ChevronLeft,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  Target,
  UserRound,
  X,
} from "lucide-react";

import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { supabase } from "../lib/supabase";

type AppLayoutProps = {
  children: React.ReactNode;
};

const aiTools = [
  {
    label: "AI Consultant",
    path: "/ai-consultant",
    icon: Sparkles,
  },
  {
    label: "Instagram Audit",
    path: "/instagram-audit",
    icon: Camera,
  },
  {
    label: "LinkedIn Audit",
    path: "/linkedin-audit",
    icon: UserRound,
  },
  {
    label: "Resume Analyzer",
    path: "/resume-analyzer",
    icon: FileText,
  },
  {
    label: "Content Strategy",
    path: "/content-strategy",
    icon: BarChart3,
  },
  {
    label: "Goal Planner",
    path: "/goal-planner",
    icon: Target,
  },
];

const growthItems = [
  {
    label: "Reports",
    path: "/reports",
    icon: FileText,
  },
  {
    label: "Subscription",
    path: "/subscription",
    icon: CreditCard,
  },
];

export default function AppLayout({
  children,
}: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [collapsed, setCollapsed] =
    useState(false);

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }

    return location.pathname === path;
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout failed:", error.message);
      return;
    }

    navigate("/login", { replace: true });
  };

  const closeMobile = () => {
    setMobileOpen(false);
  };

  const sidebarWidth = collapsed
    ? "w-[76px]"
    : "w-[260px]";

  return (
    <div className="min-h-screen bg-[#f5f6fa] text-slate-900">

      {/* Mobile Overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex ${sidebarWidth} flex-col border-r border-slate-200 bg-white transition-all duration-200 ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >

        {/* Logo */}
        <div
          className={`flex h-20 items-center border-b border-slate-100 ${
            collapsed
              ? "justify-center px-3"
              : "justify-between px-5"
          }`}
        >
          <Link
            to="/dashboard"
            onClick={closeMobile}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4b3a9b] to-[#3154a4] text-white shadow-sm">
              <Sparkles size={19} />
            </div>

            {!collapsed && (
              <div>
                <p className="text-base font-bold tracking-tight text-slate-900">
                  GrowIQ AI
                </p>

                <p className="text-[11px] text-slate-400">
                  Personal Growth
                </p>
              </div>
            )}
          </Link>

          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:flex"
              title="Collapse sidebar"
            >
              <ChevronLeft size={17} />
            </button>
          )}

          <button
            type="button"
            onClick={closeMobile}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Expand Sidebar */}
        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="mx-auto mt-4 hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:flex"
            title="Expand sidebar"
          >
            <Menu size={17} />
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">

          {/* Dashboard */}
          <SidebarLink
            label="Dashboard"
            path="/dashboard"
            icon={LayoutDashboard}
            collapsed={collapsed}
            active={isActive("/dashboard")}
            onClick={closeMobile}
          />

          {/* AI Tools */}
          {!collapsed && (
            <p className="mb-2 mt-7 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              AI Tools
            </p>
          )}

          {collapsed && (
            <div className="my-5 border-t border-slate-100" />
          )}

          <div className="space-y-1">
            {aiTools.map((item) => (
              <SidebarLink
                key={item.path}
                label={item.label}
                path={item.path}
                icon={item.icon}
                collapsed={collapsed}
                active={isActive(item.path)}
                onClick={closeMobile}
              />
            ))}
          </div>

          {/* My Growth */}
          {!collapsed && (
            <p className="mb-2 mt-7 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              My Growth
            </p>
          )}

          {collapsed && (
            <div className="my-5 border-t border-slate-100" />
          )}

          <div className="space-y-1">
            {growthItems.map((item) => (
              <SidebarLink
                key={item.path}
                label={item.label}
                path={item.path}
                icon={item.icon}
                collapsed={collapsed}
                active={isActive(item.path)}
                onClick={closeMobile}
              />
            ))}
          </div>
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-slate-100 p-3">

          <SidebarLink
            label="Settings"
            path="/settings"
            icon={Settings}
            collapsed={collapsed}
            active={isActive("/settings")}
            onClick={closeMobile}
          />

          <button
            type="button"
            onClick={handleLogout}
            className={`mt-1 flex w-full items-center rounded-xl text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600 ${
              collapsed
                ? "justify-center px-3 py-3"
                : "gap-3 px-3 py-2.5"
            }`}
          >
            <LogOut size={18} />

            {!collapsed && (
              <span>Logout</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`min-h-screen transition-all duration-200 ${
          collapsed
            ? "lg:pl-[76px]"
            : "lg:pl-[260px]"
        }`}
      >

        {/* Mobile Header */}
        <div className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:hidden">

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>

          <div className="ml-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4b3a9b] text-white">
              <Sparkles size={15} />
            </div>

            <span className="text-sm font-bold text-slate-900">
              GrowIQ AI
            </span>
          </div>
        </div>

        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}

type SidebarLinkProps = {
  label: string;
  path: string;
  icon: React.ComponentType<{
    size?: number;
    className?: string;
  }>;
  collapsed: boolean;
  active: boolean;
  onClick: () => void;
};

function SidebarLink({
  label,
  path,
  icon: Icon,
  collapsed,
  active,
  onClick,
}: SidebarLinkProps) {
  return (
    <Link
      to={path}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`flex items-center rounded-xl text-sm font-medium transition ${
        collapsed
          ? "justify-center px-3 py-3"
          : "gap-3 px-3 py-2.5"
      } ${
        active
          ? "bg-[#eeeafd] text-[#49378f]"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
      }`}
    >
      <Icon size={18} />

      {!collapsed && (
        <span>{label}</span>
      )}
    </Link>
  );
}