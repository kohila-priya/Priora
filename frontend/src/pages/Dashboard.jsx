import { Link } from "react-router-dom"
import Navbar from "../components/Navbar"
import {
  getTasks,
  getSessions,
} from "../utils/storage"

function Dashboard() {
  const tasks = getTasks()
  const sessions = getSessions()

  const today = new Date()
    .toISOString()
    .split("T")[0]

  const totalTasks = tasks.length

  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length

  const activeTasks = tasks.filter(
    (task) => !task.completed
  ).length

  const completionRate =
    totalTasks === 0
      ? 0
      : Math.round(
          (completedTasks / totalTasks) * 100
        )

  const todayTasks = tasks.filter(
    (task) =>
      task.date === today ||
      task.dueDate === today
  )

  const overdueTasks = tasks.filter(
    (task) =>
      !task.completed &&
      task.dueDate &&
      task.dueDate < today
  )

  const upcomingTasks = tasks.filter(
    (task) =>
      !task.completed &&
      task.dueDate &&
      task.dueDate > today
  )

  const hour = new Date().getHours()

  let greeting = "Good evening"

  if (hour < 12) {
    greeting = "Good morning"
  } else if (hour < 18) {
    greeting = "Good afternoon"
  }

  const formattedDate =
    new Date().toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        month: "long",
        day: "numeric",
      }
    )

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-slate-800">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-10">
          <p className="text-sm text-slate-500 mb-2">
            {formattedDate}
          </p>

          <h1 className="text-4xl font-semibold tracking-tight">
            {greeting} 👋
          </h1>

          <p className="text-slate-500 mt-2">
            Here's your productivity overview.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <p className="text-sm text-slate-500">
              Total Tasks
            </p>

            <p className="text-3xl font-semibold mt-2">
              {totalTasks}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <p className="text-sm text-slate-500">
              Active Tasks
            </p>

            <p className="text-3xl font-semibold mt-2">
              {activeTasks}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <p className="text-sm text-slate-500">
              Completion
            </p>

            <p className="text-3xl font-semibold mt-2">
              {completionRate}%
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <p className="text-sm text-slate-500">
              Focus Sessions
            </p>

            <p className="text-3xl font-semibold mt-2">
              {sessions}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xl font-semibold mb-1">
              Today
            </h2>

            <p className="text-sm text-slate-500 mb-5">
              Tasks scheduled for today
            </p>

            {todayTasks.length === 0 ? (
              <p className="text-sm text-slate-400">
                No tasks for today.
              </p>
            ) : (
              <div className="space-y-3">
                {todayTasks
                  .slice(0, 5)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3"
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          task.completed
                            ? "bg-slate-300"
                            : "bg-slate-700"
                        }`}
                      />

                      <span
                        className={
                          task.completed
                            ? "text-slate-400 line-through"
                            : ""
                        }
                      >
                        {task.title}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xl font-semibold mb-1">
              Overdue
            </h2>

            <p className="text-sm text-slate-500 mb-5">
              Tasks that need attention
            </p>

            {overdueTasks.length === 0 ? (
              <p className="text-sm text-slate-400">
                Nothing overdue.
              </p>
            ) : (
              <div className="space-y-3">
                {overdueTasks
                  .slice(0, 5)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between"
                    >
                      <span>{task.title}</span>

                      <span className="text-xs text-slate-400">
                        {task.dueDate}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xl font-semibold mb-1">
              Upcoming
            </h2>

            <p className="text-sm text-slate-500 mb-5">
              Coming up next
            </p>

            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-slate-400">
                No upcoming tasks.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingTasks
                  .slice(0, 5)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between"
                    >
                      <span>{task.title}</span>

                      <span className="text-xs text-slate-400">
                        {task.dueDate}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </section>
        </div>

        <section className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="text-xl font-semibold">
                Overall Progress
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Keep moving forward.
              </p>
            </div>

            <span className="font-medium">
              {completionRate}%
            </span>
          </div>

          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-800 rounded-full transition-all"
              style={{
                width: `${completionRate}%`,
              }}
            />
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Link
            to="/tasks"
            className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-400 transition"
          >
            <h2 className="text-lg font-semibold">
              Manage Tasks
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              Add, organize and complete your tasks.
            </p>
          </Link>

          <Link
            to="/focus"
            className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-400 transition"
          >
            <h2 className="text-lg font-semibold">
              Start Focus
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              Start a focused work session.
            </p>
          </Link>
        </div>
      </main>
    </div>
  )
}

export default Dashboard