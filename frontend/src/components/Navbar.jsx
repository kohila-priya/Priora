import { Link, useLocation } from "react-router-dom"

function Navbar() {
  const location = useLocation()

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <nav className="border-b border-slate-200 bg-[#f8f7f4]">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link
          to="/"
          className="text-3xl text-slate-800"
          style={{
            fontFamily:
              "'Dancing Script', cursive",
          }}
        >
          Priora
        </Link>

        <div className="flex gap-7 text-sm text-slate-500">
          <Link
            to="/"
            className={
              isActive("/")
                ? "text-slate-900 font-medium"
                : "hover:text-slate-900"
            }
          >
            Dashboard
          </Link>

          <Link
            to="/tasks"
            className={
              isActive("/tasks")
                ? "text-slate-900 font-medium"
                : "hover:text-slate-900"
            }
          >
            Tasks
          </Link>

          <Link
            to="/calendar"
            className={
              isActive("/calendar")
                ? "text-slate-900 font-medium"
                : "hover:text-slate-900"
            }
          >
            Calendar
          </Link>

          <Link
            to="/focus"
            className={
              isActive("/focus")
                ? "text-slate-900 font-medium"
                : "hover:text-slate-900"
            }
          >
            Focus
          </Link>

          <Link
            to="/analytics"
            className={
              isActive("/analytics")
                ? "text-slate-900 font-medium"
                : "hover:text-slate-900"
            }
          >
            Analytics
          </Link>

          <Link
            to="/ai"
            className={
              isActive("/ai")
                ? "text-slate-900 font-medium"
                : "hover:text-slate-900"
            }
          >
            AI
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar