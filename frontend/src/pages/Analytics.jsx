import { useEffect, useState } from "react"
import Navbar from "../components/Navbar"
import {
  getTasks,
  getSessionHistory,
} from "../utils/storage"

function Analytics() {
  const [tasks, setTasks] = useState([])
  const [sessionHistory, setSessionHistory] = useState([])

  const loadData = () => {
    setTasks(getTasks())
    setSessionHistory(getSessionHistory())
  }

  useEffect(() => {
    loadData()

    const handleStorage = () => {
      loadData()
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadData()
      }
    }

    window.addEventListener(
      "storage",
      handleStorage
    )

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    )

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      )

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      )
    }
  }, [])

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

  const today = new Date()
  const todayString = today
    .toISOString()
    .split("T")[0]

  const overdueTasks = tasks.filter(
    (task) =>
      !task.completed &&
      task.dueDate &&
      task.dueDate < todayString
  )

  const tasksWithDeadlines = tasks.filter(
    (task) => task.dueDate
  )

  const completedOnTime = tasks.filter(
    (task) => {
      if (
        !task.completed ||
        !task.dueDate
      ) {
        return false
      }

      if (!task.completedAt) {
        return false
      }

      const completedDate =
        new Date(task.completedAt)
          .toISOString()
          .split("T")[0]

      return completedDate <= task.dueDate
    }
  ).length

  const deadlineRate =
    tasksWithDeadlines.length === 0
      ? 0
      : Math.round(
          (completedOnTime /
            tasksWithDeadlines.length) *
            100
        )

  const highPriority = tasks.filter(
    (task) => task.priority === "High"
  ).length

  const mediumPriority = tasks.filter(
    (task) => task.priority === "Medium"
  ).length

  const lowPriority = tasks.filter(
    (task) => task.priority === "Low"
  ).length

  const totalFocusMinutes =
    sessionHistory.reduce(
      (total, session) =>
        total +
        Number(session.duration || 0),
      0
    )

  const averageFocusMinutes =
    sessionHistory.length === 0
      ? 0
      : Math.round(
          totalFocusMinutes /
            sessionHistory.length
        )

  const getWeekDays = () => {
    const days = []
    const current = new Date()

    const day = current.getDay()

    const difference =
      day === 0
        ? -6
        : 1 - day

    current.setDate(
      current.getDate() + difference
    )

    for (let i = 0; i < 7; i++) {
      const date = new Date(current)

      date.setDate(
        current.getDate() + i
      )

      const dateString =
        date.toISOString().split("T")[0]

      days.push({
        date: dateString,

        label:
          date.toLocaleDateString(
            "en-US",
            {
              weekday: "short",
            }
          ),

        shortDate:
          date.toLocaleDateString(
            "en-US",
            {
              month: "short",
              day: "numeric",
            }
          ),
      })
    }

    return days
  }

  const weekDays = getWeekDays()

  const weeklyTaskData =
    weekDays.map((day) => {
      const completed =
        tasks.filter((task) => {
          if (!task.completed) {
            return false
          }

          if (!task.completedAt) {
            return false
          }

          const completedDate =
            new Date(task.completedAt)
              .toISOString()
              .split("T")[0]

          return (
            completedDate === day.date
          )
        }).length

      return {
        ...day,
        completed,
      }
    })

  const maxCompleted = Math.max(
    ...weeklyTaskData.map(
      (day) => day.completed
    ),
    1
  )

  const weeklyFocusData =
    weekDays.map((day) => {
      const minutes =
        sessionHistory
          .filter(
            (session) =>
              session.date === day.date
          )
          .reduce(
            (total, session) =>
              total +
              Number(
                session.duration || 0
              ),
            0
          )

      return {
        ...day,
        minutes,
      }
    })

  const maxFocusMinutes =
    Math.max(
      ...weeklyFocusData.map(
        (day) => day.minutes
      ),
      1
    )

  const mostProductiveDay =
    weeklyFocusData.reduce(
      (best, current) =>
        current.minutes >
        best.minutes
          ? current
          : best,
      {
        label: "-",
        minutes: 0,
      }
    )

  let productivityMessage =
    "Start completing tasks and focus sessions to build your productivity data."

  if (
    completionRate >= 80 &&
    totalFocusMinutes >= 60
  ) {
    productivityMessage =
      "You are maintaining strong task completion and consistent focus time."
  } else if (completionRate >= 60) {
    productivityMessage =
      "Your task completion is progressing well. Increasing focused work time can strengthen your routine."
  } else if (totalFocusMinutes >= 60) {
    productivityMessage =
      "Your focus sessions are building momentum. Try converting more of that focus into completed tasks."
  } else if (overdueTasks.length > 0) {
    productivityMessage =
      "You have overdue tasks. Clearing those before adding more work can help keep your workload under control."
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-slate-800">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* HEADER */}

        <div className="mb-10">
          <p className="text-sm text-slate-500 mb-2">
            Productivity insights
          </p>

          <h1 className="text-4xl font-semibold tracking-tight">
            Analytics
          </h1>

          <p className="text-slate-500 mt-2">
            Understand your work patterns and productivity over time.
          </p>
        </div>

        {/* KEY METRICS */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <p className="text-sm text-slate-500">
              Completion Rate
            </p>

            <p className="text-3xl font-semibold mt-2">
              {completionRate}%
            </p>

            <p className="text-xs text-slate-400 mt-2">
              {completedTasks} of{" "}
              {totalTasks} tasks completed
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <p className="text-sm text-slate-500">
              Focus Time
            </p>

            <p className="text-3xl font-semibold mt-2">
              {totalFocusMinutes}

              <span className="text-base font-normal ml-1">
                min
              </span>
            </p>

            <p className="text-xs text-slate-400 mt-2">
              {sessionHistory.length} completed sessions
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <p className="text-sm text-slate-500">
              Avg. Focus Session
            </p>

            <p className="text-3xl font-semibold mt-2">
              {averageFocusMinutes}

              <span className="text-base font-normal ml-1">
                min
              </span>
            </p>

            <p className="text-xs text-slate-400 mt-2">
              Per completed session
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <p className="text-sm text-slate-500">
              Overdue Tasks
            </p>

            <p className="text-3xl font-semibold mt-2">
              {overdueTasks.length}
            </p>

            <p className="text-xs text-slate-400 mt-2">
              Currently unfinished
            </p>
          </div>
        </div>

        {/* WEEKLY TASK COMPLETION */}

        <section className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-semibold">
                Weekly Task Completion
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Tasks completed during this week
              </p>
            </div>

            <div className="text-sm text-slate-500">
              {completedTasks} total
            </div>
          </div>

          <div className="flex items-end justify-between gap-4 h-56">
            {weeklyTaskData.map(
              (day) => {
                const height =
                  day.completed === 0
                    ? 4
                    : Math.max(
                        (day.completed /
                          maxCompleted) *
                          100,
                        8
                      )

                return (
                  <div
                    key={day.date}
                    className="flex-1 h-full flex flex-col justify-end items-center"
                  >
                    <p className="text-xs text-slate-500 mb-2">
                      {day.completed}
                    </p>

                    <div
                      className="w-full max-w-12 bg-slate-800 rounded-t-xl transition-all"
                      style={{
                        height: `${height}%`,
                      }}
                    />

                    <p className="text-xs font-medium text-slate-600 mt-3">
                      {day.label}
                    </p>

                    <p className="text-[10px] text-slate-400 mt-1">
                      {day.shortDate}
                    </p>
                  </div>
                )
              }
            )}
          </div>
        </section>

        {/* WEEKLY FOCUS */}

        <section className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-semibold">
                Weekly Focus Time
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Minutes spent in completed focus sessions
              </p>
            </div>

            <div className="text-right">
              <p className="font-semibold">
                {mostProductiveDay.minutes} min
              </p>

              <p className="text-xs text-slate-400">
                Most focused day
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {weeklyFocusData.map(
              (day) => {
                const width =
                  day.minutes === 0
                    ? 0
                    : Math.max(
                        (day.minutes /
                          maxFocusMinutes) *
                          100,
                        4
                      )

                return (
                  <div
                    key={day.date}
                  >
                    <div className="flex justify-between mb-2">
                      <div className="flex gap-3">
                        <span className="w-10 text-sm font-medium">
                          {day.label}
                        </span>

                        <span className="text-xs text-slate-400">
                          {day.shortDate}
                        </span>
                      </div>

                      <span className="text-sm font-medium">
                        {day.minutes} min
                      </span>
                    </div>

                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-700 rounded-full transition-all"
                        style={{
                          width: `${width}%`,
                        }}
                      />
                    </div>
                  </div>
                )
              }
            )}
          </div>
        </section>

        {/* DISTRIBUTION + DEADLINES */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xl font-semibold">
              Task Distribution
            </h2>

            <p className="text-sm text-slate-500 mt-1 mb-7">
              Tasks grouped by priority
            </p>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">
                    High Priority
                  </span>

                  <span className="text-sm font-medium">
                    {highPriority}
                  </span>
                </div>

                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-800 rounded-full"
                    style={{
                      width:
                        totalTasks === 0
                          ? "0%"
                          : `${(highPriority / totalTasks) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">
                    Medium Priority
                  </span>

                  <span className="text-sm font-medium">
                    {mediumPriority}
                  </span>
                </div>

                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-500 rounded-full"
                    style={{
                      width:
                        totalTasks === 0
                          ? "0%"
                          : `${(mediumPriority / totalTasks) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">
                    Low Priority
                  </span>

                  <span className="text-sm font-medium">
                    {lowPriority}
                  </span>
                </div>

                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-300 rounded-full"
                    style={{
                      width:
                        totalTasks === 0
                          ? "0%"
                          : `${(lowPriority / totalTasks) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xl font-semibold">
              Deadline Performance
            </h2>

            <p className="text-sm text-slate-500 mt-1 mb-7">
              How you're handling scheduled work
            </p>

            <div className="flex items-center justify-center mb-7">
              <div className="relative w-36 h-36">
                <div className="absolute inset-0 rounded-full bg-slate-100" />

                <div className="absolute inset-3 rounded-full bg-white flex flex-col items-center justify-center">
                  <span className="text-3xl font-semibold">
                    {deadlineRate}%
                  </span>

                  <span className="text-xs text-slate-400">
                    on track
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">
                  Tasks with deadlines
                </span>

                <span className="font-medium">
                  {tasksWithDeadlines.length}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">
                  Completed on time
                </span>

                <span className="font-medium">
                  {completedOnTime}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">
                  Overdue
                </span>

                <span className="font-medium">
                  {overdueTasks.length}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* PRODUCTIVITY SUMMARY */}

        <section className="bg-slate-900 text-white rounded-2xl p-7 mb-8">
          <p className="text-sm text-slate-400 mb-2">
            Productivity summary
          </p>

          <h2 className="text-2xl font-semibold mb-3">
            Your current pattern
          </h2>

          <p className="text-slate-300 leading-relaxed max-w-3xl">
            {productivityMessage}
          </p>
        </section>

        {/* RECENT SESSIONS */}

        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              Recent Focus Sessions
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Your latest completed sessions
            </p>
          </div>

          {sessionHistory.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-slate-500">
                No focus sessions yet.
              </p>

              <p className="text-sm text-slate-400 mt-1">
                Complete a focus session to start building your analytics.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessionHistory
                .slice()
                .reverse()
                .slice(0, 7)
                .map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">
                        {session.taskTitle ||
                          "General Focus"}
                      </p>

                      <p className="text-xs text-slate-400 mt-1">
                        {session.date}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-medium">
                        {session.duration} min
                      </p>

                      <p className="text-xs text-slate-400">
                        Focus session
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default Analytics