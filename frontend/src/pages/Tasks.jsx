import { useEffect, useState } from "react"
import Navbar from "../components/Navbar"
import {
  getTasks,
  saveTasks,
} from "../utils/storage"

function Tasks() {
  const [tasks, setTasks] = useState(() => {
    return getTasks()
  })

  const [title, setTitle] = useState("")
  const [priority, setPriority] = useState("Medium")
  const [dueDate, setDueDate] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [filter, setFilter] = useState("All")

  useEffect(() => {
    saveTasks(tasks)
  }, [tasks])

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!title.trim()) {
      return
    }

    if (editingId !== null) {
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === editingId
            ? {
                ...task,
                title: title.trim(),
                priority,
                dueDate,
              }
            : task
        )
      )

      setEditingId(null)
    } else {
      const newTask = {
        id: Date.now(),
        title: title.trim(),
        completed: false,
        priority,
        date: new Date()
          .toISOString()
          .split("T")[0],
        dueDate,
        completedAt: null,
      }

      setTasks((currentTasks) => [
        ...currentTasks,
        newTask,
      ])
    }

    setTitle("")
    setPriority("Medium")
    setDueDate("")
  }

  const handleEdit = (task) => {
    setEditingId(task.id)
    setTitle(task.title)
    setPriority(task.priority || "Medium")
    setDueDate(task.dueDate || "")

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setTitle("")
    setPriority("Medium")
    setDueDate("")
  }

  const handleDelete = (id) => {
    setTasks((currentTasks) =>
      currentTasks.filter(
        (task) => task.id !== id
      )
    )
  }

  const handleToggleComplete = (id) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== id) {
          return task
        }

        const isCompleting = !task.completed

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

  const getStatus = (task) => {
    if (task.completed) {
      return "Completed"
    }

    if (!task.dueDate) {
      return "No deadline"
    }

    const today = new Date()
      .toISOString()
      .split("T")[0]

    if (task.dueDate < today) {
      return "Overdue"
    }

    if (task.dueDate === today) {
      return "Due today"
    }

    return "Upcoming"
  }

  const today = new Date()
    .toISOString()
    .split("T")[0]

  const filteredTasks = tasks.filter(
    (task) => {
      if (filter === "All") {
        return true
      }

      if (filter === "Active") {
        return !task.completed
      }

      if (filter === "Completed") {
        return task.completed
      }

      if (filter === "Today") {
        return (
          task.date === today ||
          task.dueDate === today
        )
      }

      if (filter === "Overdue") {
        return (
          !task.completed &&
          task.dueDate &&
          task.dueDate < today
        )
      }

      return true
    }
  )

  const totalTasks = tasks.length

  const activeTasks = tasks.filter(
    (task) => !task.completed
  ).length

  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length

  const overdueTasks = tasks.filter(
    (task) =>
      !task.completed &&
      task.dueDate &&
      task.dueDate < today
  ).length

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-slate-800">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <p className="text-sm text-slate-500 mb-2">
            Stay organized
          </p>

          <h1 className="text-4xl font-semibold tracking-tight">
            Tasks
          </h1>

          <p className="text-slate-500 mt-2">
            Plan your work and keep track of what matters.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">
              Total
            </p>
            <p className="text-2xl font-semibold mt-1">
              {totalTasks}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">
              Active
            </p>
            <p className="text-2xl font-semibold mt-1">
              {activeTasks}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">
              Completed
            </p>
            <p className="text-2xl font-semibold mt-1">
              {completedTasks}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">
              Overdue
            </p>
            <p className="text-2xl font-semibold mt-1">
              {overdueTasks}
            </p>
          </div>
        </div>

        <section className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-5">
            {editingId !== null
              ? "Edit Task"
              : "Add a Task"}
          </h2>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm text-slate-500 mb-2">
                Task
              </label>

              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="What needs to be done?"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-slate-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-500 mb-2">
                  Priority
                </label>

                <select
                  value={priority}
                  onChange={(event) =>
                    setPriority(event.target.value)
                  }
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white outline-none focus:border-slate-500"
                >
                  <option value="High">
                    High
                  </option>

                  <option value="Medium">
                    Medium
                  </option>

                  <option value="Low">
                    Low
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-500 mb-2">
                  Due Date
                </label>

                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) =>
                    setDueDate(event.target.value)
                  }
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-slate-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-slate-800 text-white rounded-xl px-5 py-3 hover:bg-slate-700 transition"
              >
                {editingId !== null
                  ? "Update Task"
                  : "Add Task"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="border border-slate-200 rounded-xl px-5 py-3 hover:border-slate-400 transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <div className="flex flex-wrap gap-2 mb-6">
          {[
            "All",
            "Active",
            "Today",
            "Overdue",
            "Completed",
          ].map((filterName) => (
            <button
              key={filterName}
              onClick={() =>
                setFilter(filterName)
              }
              className={
                filter === filterName
                  ? "px-4 py-2 rounded-full bg-slate-800 text-white text-sm"
                  : "px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-500 text-sm hover:border-slate-400"
              }
            >
              {filterName}
            </button>
          ))}
        </div>

        <section className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
              <p className="text-slate-500">
                No tasks found.
              </p>

              <p className="text-sm text-slate-400 mt-1">
                Add a task or change the current filter.
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const status = getStatus(task)

              return (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() =>
                          handleToggleComplete(
                            task.id
                          )
                        }
                        className={
                          task.completed
                            ? "w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs shrink-0"
                            : "w-6 h-6 rounded-full border-2 border-slate-300 shrink-0 hover:border-slate-600"
                        }
                      >
                        {task.completed
                          ? "✓"
                          : ""}
                      </button>

                      <div>
                        <h3
                          className={
                            task.completed
                              ? "font-medium text-slate-400 line-through"
                              : "font-medium"
                          }
                        >
                          {task.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span
                            className={
                              task.priority === "High"
                                ? "text-xs px-2 py-1 rounded-full bg-slate-800 text-white"
                                : task.priority === "Medium"
                                ? "text-xs px-2 py-1 rounded-full bg-slate-200 text-slate-700"
                                : "text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-500"
                            }
                          >
                            {task.priority}
                          </span>

                          <span className="text-xs text-slate-400">
                            {status}
                          </span>

                          {task.dueDate && (
                            <span className="text-xs text-slate-400">
                              Due {task.dueDate}
                            </span>
                          )}
                        </div>

                        {task.completed &&
                          task.completedAt && (
                            <p className="text-xs text-slate-400 mt-2">
                              Completed{" "}
                              {new Date(
                                task.completedAt
                              ).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </p>
                          )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleEdit(task)
                        }
                        className="px-4 py-2 rounded-xl border border-slate-200 text-sm hover:border-slate-400 transition"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(task.id)
                        }
                        className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-500 hover:border-slate-400 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </section>
      </main>
    </div>
  )
}

export default Tasks