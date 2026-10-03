import { useEffect, useState } from "react"
import Navbar from "../components/Navbar"
import {
  getTasks,
  saveTasks,
} from "../utils/storage"

function Calendar() {
  const [tasks, setTasks] = useState(() => {
    return getTasks()
  })

  const [currentDate, setCurrentDate] = useState(
    new Date()
  )

  const [selectedDate, setSelectedDate] = useState(
    new Date()
  )

  useEffect(() => {
    saveTasks(tasks)
  }, [tasks])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const monthName = currentDate.toLocaleDateString(
    "en-US",
    {
      month: "long",
      year: "numeric",
    }
  )

  const firstDay = new Date(
    year,
    month,
    1
  ).getDay()

  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate()

  const previousMonth = () => {
    setCurrentDate(
      new Date(year, month - 1, 1)
    )
  }

  const nextMonth = () => {
    setCurrentDate(
      new Date(year, month + 1, 1)
    )
  }

  const goToToday = () => {
    const today = new Date()

    setCurrentDate(today)
    setSelectedDate(today)
  }

  const formatDate = (date) => {
    return date
      .toISOString()
      .split("T")[0]
  }

  const selectedDateString =
    formatDate(selectedDate)

  const getTasksForDate = (dateString) => {
    return tasks.filter(
      (task) =>
        task.date === dateString ||
        task.dueDate === dateString
    )
  }

  const selectedTasks =
    getTasksForDate(selectedDateString)

  const isToday = (dateNumber) => {
    const today = new Date()

    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === dateNumber
    )
  }

  const isSelected = (dateNumber) => {
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === dateNumber
    )
  }

  const getPriorityClass = (priority) => {
    if (priority === "High") {
      return "bg-slate-800 text-white"
    }

    if (priority === "Medium") {
      return "bg-slate-200 text-slate-700"
    }

    return "bg-slate-100 text-slate-500"
  }

  const handleToggleComplete = (id) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== id) {
          return task
        }

        const isCompleting =
          !task.completed

        return {
          ...task,
          completed: isCompleting,
          completedAt: isCompleting
            ? new Date().toISOString()
            : null,
        }
      })
    )
  }

  const calendarCells = []

  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(null)
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    calendarCells.push(day)
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-slate-800">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <p className="text-sm text-slate-500 mb-2">
            Plan your schedule
          </p>

          <h1 className="text-4xl font-semibold tracking-tight">
            Calendar
          </h1>

          <p className="text-slate-500 mt-2">
            View your tasks and deadlines by date.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CALENDAR */}

          <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={previousMonth}
                className="w-10 h-10 rounded-xl border border-slate-200 hover:border-slate-400 transition"
              >
                ←
              </button>

              <div className="text-center">
                <h2 className="text-xl font-semibold">
                  {monthName}
                </h2>

                <button
                  onClick={goToToday}
                  className="text-xs text-slate-400 hover:text-slate-800 mt-1"
                >
                  Today
                </button>
              </div>

              <button
                onClick={nextMonth}
                className="w-10 h-10 rounded-xl border border-slate-200 hover:border-slate-400 transition"
              >
                →
              </button>
            </div>

            <div className="grid grid-cols-7 mb-3">
              {[
                "Sun",
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
              ].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-slate-400 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarCells.map(
                (day, index) => {
                  if (!day) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="min-h-20"
                      />
                    )
                  }

                  const date = new Date(
                    year,
                    month,
                    day
                  )

                  const dateString =
                    formatDate(date)

                  const dayTasks =
                    getTasksForDate(
                      dateString
                    )

                  return (
                    <button
                      key={day}
                      onClick={() =>
                        setSelectedDate(
                          date
                        )
                      }
                      className={`min-h-20 rounded-xl border p-2 text-left transition ${
                        isSelected(day)
                          ? "border-slate-800 bg-slate-50"
                          : "border-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-medium ${
                            isToday(day)
                              ? "bg-slate-800 text-white w-7 h-7 rounded-full flex items-center justify-center"
                              : ""
                          }`}
                        >
                          {day}
                        </span>

                        {dayTasks.length > 0 && (
                          <span className="text-[10px] text-slate-400">
                            {dayTasks.length}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 space-y-1">
                        {dayTasks
                          .slice(0, 2)
                          .map((task) => (
                            <div
                              key={task.id}
                              className={`text-[10px] rounded px-1.5 py-1 truncate ${
                                task.completed
                                  ? "bg-slate-100 text-slate-400 line-through"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {task.title}
                            </div>
                          ))}

                        {dayTasks.length > 2 && (
                          <p className="text-[10px] text-slate-400">
                            +{dayTasks.length - 2} more
                          </p>
                        )}
                      </div>
                    </button>
                  )
                }
              )}
            </div>
          </section>

          {/* SELECTED DATE */}

          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <p className="text-sm text-slate-500">
              Selected date
            </p>

            <h2 className="text-2xl font-semibold mt-1">
              {selectedDate.toLocaleDateString(
                "en-US",
                {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                }
              )}
            </h2>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">
                  Tasks
                </h3>

                <span className="text-xs text-slate-400">
                  {selectedTasks.length}
                </span>
              </div>

              {selectedTasks.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-slate-500">
                    No tasks for this date.
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    Your schedule is clear.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedTasks.map(
                    (task) => (
                      <div
                        key={task.id}
                        className="border border-slate-100 rounded-xl p-4"
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() =>
                              handleToggleComplete(
                                task.id
                              )
                            }
                            className={
                              task.completed
                                ? "w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] shrink-0"
                                : "w-5 h-5 rounded-full border-2 border-slate-300 shrink-0"
                            }
                          >
                            {task.completed
                              ? "✓"
                              : ""}
                          </button>

                          <div className="min-w-0">
                            <p
                              className={
                                task.completed
                                  ? "text-sm text-slate-400 line-through"
                                  : "text-sm font-medium"
                              }
                            >
                              {task.title}
                            </p>

                            <div className="flex flex-wrap gap-2 mt-2">
                              <span
                                className={`text-[10px] px-2 py-1 rounded-full ${getPriorityClass(
                                  task.priority
                                )}`}
                              >
                                {task.priority}
                              </span>

                              {task.dueDate && (
                                <span className="text-[10px] text-slate-400">
                                  Due{" "}
                                  {task.dueDate}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default Calendar