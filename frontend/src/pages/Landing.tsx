import {
  ArrowRight,
  Check,
  FileText,
  Menu,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const heroImage =
  "https://images.unsplash.com/photo-1762341121210-6bd877d766b0?auto=format&fit=crop&q=85&w=1400";

const tools = [
  {
    icon: TrendingUp,
    title: "Instagram Audit",
    description:
      "Get personalized insights to improve your profile, content and growth.",
    className: "bg-pink-50 text-pink-600",
  },
  {
    icon: Users,
    title: "LinkedIn Audit",
    description:
      "Optimize your professional profile and build a stronger personal brand.",
    className: "bg-blue-50 text-blue-600",
  },
  {
    icon: FileText,
    title: "Resume Analyzer",
    description:
      "Find gaps in your resume and get AI-powered recommendations.",
    className: "bg-violet-50 text-violet-600",
  },
  {
    icon: Sparkles,
    title: "Content Strategy",
    description:
      "Generate content ideas, hooks and strategies around your goals.",
    className: "bg-purple-50 text-purple-600",
  },
  {
    icon: Target,
    title: "Goal Planner",
    description:
      "Turn your goals into practical action plans with personalized guidance.",
    className: "bg-red-50 text-red-600",
  },
  {
    icon: Zap,
    title: "AI Consultant",
    description:
      "Ask questions and get personalized guidance for your career and growth.",
    className: "bg-indigo-50 text-indigo-600",
  },
];

const steps = [
  {
    number: "01",
    title: "Tell us about yourself",
    description:
      "Share your profile, goals, career or content information with GrowIQ.",
  },
  {
    number: "02",
    title: "AI analyzes your situation",
    description:
      "Our AI identifies opportunities, gaps and areas where you can improve.",
  },
  {
    number: "03",
    title: "Get personalized insights",
    description:
      "Receive practical recommendations designed around your specific goals.",
  },
  {
    number: "04",
    title: "Keep growing",
    description:
      "Save reports, continue AI conversations and track your progress.",
  },
];

const benefits = [
  "Personalized AI recommendations",
  "Career & personal brand insights",
  "Actionable growth strategies",
  "Reports saved in one place",
];

function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fafafd] text-[#11131a]">
      {/* NAVBAR */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-black/5 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-bold tracking-tight"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 text-white shadow-lg shadow-violet-500/20">
              <Sparkles size={17} />
            </span>

            <span>
              GrowIQ<span className="text-violet-600"> AI</span>
            </span>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden items-center gap-8 lg:flex">
            <a
              href="#features"
              className="text-sm font-medium text-gray-600 transition hover:text-black"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="text-sm font-medium text-gray-600 transition hover:text-black"
            >
              How It Works
            </a>

            <a
              href="#tools"
              className="text-sm font-medium text-gray-600 transition hover:text-black"
            >
              AI Tools
            </a>

            <a
              href="#why-growiq"
              className="text-sm font-medium text-gray-600 transition hover:text-black"
            >
              Why GrowIQ
            </a>
          </nav>

          {/* DESKTOP BUTTONS */}
          <div className="hidden items-center gap-2 sm:flex">
            <Link
              to="/login"
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Login
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full bg-[#111827] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-black"
            >
              Get Started
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* MOBILE MENU */}
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white sm:hidden"
          >
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-black/5 bg-white px-5 py-5 sm:hidden">
            <nav className="flex flex-col gap-1">
              {[
                ["Features", "#features"],
                ["How It Works", "#how-it-works"],
                ["AI Tools", "#tools"],
                ["Why GrowIQ", "#why-growiq"],
              ].map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {label}
                </a>
              ))}

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-black/5 pt-4">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-11 items-center justify-center rounded-full border border-black/10 text-sm font-semibold"
                >
                  Login
                </Link>

                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-11 items-center justify-center gap-2 rounded-full bg-black text-sm font-semibold text-white"
                >
                  Get Started
                  <ArrowRight size={15} />
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden pt-[72px]">
          <div className="pointer-events-none absolute left-1/2 top-20 -z-10 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-violet-200/40 blur-[130px]" />

          <div className="mx-auto max-w-7xl px-5 pb-20 pt-14 sm:px-6 sm:pt-20 lg:px-8 lg:pb-28 lg:pt-24">
            <div className="grid items-center gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:gap-12">
              {/* LEFT */}
              <div className="relative z-10 text-center lg:text-left">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-semibold text-violet-700 sm:text-sm">
                  <Sparkles size={14} />
                  Your Personal AI Growth Partner
                </div>

                <h1 className="text-[43px] font-bold leading-[1.02] tracking-[-0.05em] sm:text-6xl lg:text-[74px]">
                  Plan.
                  <br />
                  Create.
                  <br />
                  <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Grow Smarter
                  </span>
                  <br />
                  with AI.
                </h1>

                <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-gray-600 sm:text-lg lg:mx-0">
                  All-in-one AI tools to audit, plan, create and grow your
                  social media, personal brand and career.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                  <Link
                    to="/login"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#111827] px-7 text-sm font-semibold text-white shadow-xl shadow-black/10 transition hover:-translate-y-0.5 hover:bg-black"
                  >
                    Get Started
                    <ArrowRight size={17} />
                  </Link>

                  <Link
                    to="/login"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-black/10 bg-white px-7 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                  >
                    Login
                  </Link>
                </div>

                <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 lg:justify-start">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                    <Sparkles size={14} className="text-violet-600" />
                    AI Powered
                  </div>

                  <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                    <Zap size={14} className="text-violet-600" />
                    Save Time
                  </div>

                  <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                    <Users size={14} className="text-violet-600" />
                    For Creators & Businesses
                  </div>
                </div>
              </div>

              {/* IMAGE */}
              <div className="relative mx-auto w-full max-w-2xl">
                <div className="relative overflow-hidden rounded-[32px] border border-white bg-white p-2 shadow-2xl shadow-violet-900/10">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[25px]">
                    <img
                      src={heroImage}
                      alt="Professional working with GrowIQ AI"
                      className="h-full w-full object-cover"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/5" />
                  </div>
                </div>

                {/* FLOATING CARD */}
                <div className="absolute -left-4 top-8 hidden rounded-2xl border border-white bg-white/95 p-4 shadow-xl shadow-black/10 backdrop-blur sm:block lg:-left-8">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                      <TrendingUp size={19} />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-500">
                        Growth Insights
                      </p>
                      <p className="mt-0.5 text-lg font-bold">+62%</p>
                    </div>
                  </div>
                </div>

                {/* FLOATING CARD */}
                <div className="absolute -right-4 bottom-10 hidden rounded-2xl border border-white bg-white/95 p-4 shadow-xl shadow-black/10 backdrop-blur sm:block lg:-right-8">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Target size={19} />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-500">
                        Goal Planner
                      </p>
                      <p className="mt-0.5 text-sm font-bold">
                        Plan Generated
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section
          id="features"
          className="border-y border-black/5 bg-white py-20 sm:py-24"
        >
          <div
            id="tools"
            className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8"
          >
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600 sm:text-sm">
                Powerful AI Tools
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-[-0.035em] sm:text-5xl">
                Everything you need to
                <span className="text-violet-600"> grow.</span>
              </h2>

              <p className="mt-5 text-sm leading-6 text-gray-600 sm:text-base">
                One intelligent workspace for your career, personal brand,
                content and growth.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => {
                const Icon = tool.icon;

                return (
                  <div
                    key={tool.title}
                    className="group rounded-3xl border border-black/7 bg-[#fcfcfd] p-6 transition duration-300 hover:-translate-y-1 hover:border-violet-200 hover:bg-violet-50/30 hover:shadow-xl hover:shadow-violet-100/40"
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tool.className}`}
                    >
                      <Icon size={21} />
                    </div>

                    <h3 className="mt-6 text-lg font-bold">{tool.title}</h3>

                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      {tool.description}
                    </p>

                    <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-violet-600">
                      Explore
                      <ArrowRight
                        size={15}
                        className="transition group-hover:translate-x-1"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600 sm:text-sm">
                  How It Works
                </p>

                <h2 className="mt-4 text-3xl font-bold tracking-[-0.035em] sm:text-5xl">
                  From where you are
                  <br />
                  to where you want to be.
                </h2>

                <p className="mt-6 max-w-lg text-sm leading-7 text-gray-600 sm:text-base">
                  GrowIQ turns your information into personalized insights
                  and practical next steps so you can make progress with
                  clarity.
                </p>

                <Link
                  to="/login"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Start Growing
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className="space-y-3">
                {steps.map((step) => (
                  <div
                    key={step.number}
                    className="flex gap-4 rounded-2xl border border-black/7 bg-white p-5 transition hover:border-violet-200 hover:shadow-lg sm:gap-6 sm:p-6"
                  >
                    <span className="text-sm font-bold text-violet-600">
                      {step.number}
                    </span>

                    <div>
                      <h3 className="font-bold">{step.title}</h3>

                      <p className="mt-1 text-sm leading-6 text-gray-600">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* WHY GROWIQ */}
        <section
          id="why-growiq"
          className="bg-[#111827] py-20 text-white sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300 sm:text-sm">
                  Built For Progress
                </p>

                <h2 className="mt-4 text-3xl font-bold tracking-[-0.035em] sm:text-5xl">
                  Stop guessing.
                  <br />
                  Start growing.
                </h2>

                <p className="mt-6 max-w-xl text-sm leading-7 text-gray-300 sm:text-base">
                  GrowIQ brings your career, content, personal brand and goals
                  into one intelligent workspace.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {benefits.map((benefit) => (
                  <div
                    key={benefit}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5"
                  >
                    <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/20 text-violet-300">
                      <Check size={17} />
                    </div>

                    <p className="text-sm font-medium leading-6 text-gray-200">
                      {benefit}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden py-24 sm:py-32">
          <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[350px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-200/40 blur-[120px]" />

          <div className="mx-auto max-w-3xl px-5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
              <Sparkles size={21} />
            </div>

            <h2 className="mt-6 text-3xl font-bold tracking-[-0.04em] sm:text-6xl">
              Your next level
              <span className="text-violet-600"> starts here.</span>
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-gray-600 sm:text-base">
              Get personalized AI guidance for your career, personal brand,
              content and goals.
            </p>

            <Link
              to="/login"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-[#111827] px-7 text-sm font-semibold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-black"
            >
              Get Started with GrowIQ AI
              <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-black/5 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 font-semibold text-gray-700">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-white">
              <Sparkles size={13} />
            </span>
            GrowIQ AI
          </div>

          <span>
            © {new Date().getFullYear()} GrowIQ AI. All rights reserved.
          </span>

          <span>Personal growth, powered by AI.</span>
        </div>
      </footer>
    </div>
  );
}

export default Landing;