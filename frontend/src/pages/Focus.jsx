import { useEffect, useState } from "react"
import Navbar from "../components/Navbar"
import {
  getTasks,
  saveTasks,
  getSessions,
  saveSessions,
  getSessionHistory,
  saveSessionHistory,
} from "../utils/storage"

function Focus() {
  const [tasks, setTasks] = useState(() =>
    getTasks()
  )

  const [sessions, setSessions] =
    useState(() => getSessions())

  const [sessionHistory, setSessionHistory] =
    useState(() =>
      getSessionHistory()
    )

  const [selectedTask, setSelectedTask] =
    useState("")

  const [duration, setDuration] =
    useState(25)

  const [timeLeft, setTimeLeft] =
    useState(25 * 60)

  const [isRunning, setIsRunning] =
    useState(false)

  useEffect(() => {
    saveTasks(tasks)
  }, [tasks])

  useEffect(() => {
    saveSessions(sessions)
  }, [sessions])

  useEffect(() => {
    saveSessionHistory(
      sessionHistory
    )
  }, [sessionHistory])

  useEffect(() => {
    if (!isRunning) {
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((currentTime) => {
        if (currentTime <= 1) {
          clearInterval(timer)
          setIsRunning(false)

          handleSessionComplete()

          return 0
        }

        return currentTime - 1
      })
    }, 1000)

    return () => {
      clearInterval(timer)
    }
  }, [isRunning])

  const handleDurationChange = (
    newDuration
  ) => {
    if (isRunning) {
      return
    }

    setDuration(newDuration)
    setTimeLeft(newDuration * 60)
  }

  const handleStart = () => {
    if (timeLeft <= 0) {
      setTimeLeft(duration * 60)
    }

    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setTimeLeft(duration * 60)
  }

  const handleSessionComplete = () => {
    const selectedTaskObject =
      tasks.find(
        (task) =>
          String(task.id) ===
          String(selectedTask)
      )

    const taskTitle =
      selectedTaskObject?.title ||
      "General Focus"

    const today =
      new Date()
        .toISOString()
        .split("T")[0]

    const newSession = {
      id: Date.now(),
      date: today,
      duration: duration,
      taskId:
        selectedTaskObject?.id ||
        null,
      taskTitle: taskTitle,
      completedAt:
        new Date().toISOString(),
    }

    setSessions(
      (currentSessions) =>
        currentSessions + 1
    )

    setSessionHistory(
      (currentHistory) => [
        ...currentHistory,
        newSession,
      ]
    )

    if (selectedTaskObject) {
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id ===
          selectedTaskObject.id
            ? {
                ...task,
                completed: true,
                completedAt:
                  new Date().toISOString(),
              }
            : task
        )
      )
    }
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(
      seconds / 60
    )

    const remainingSeconds =
      seconds % 60

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(
      remainingSeconds
    ).padStart(2, "0")}`
  }

  const activeTasks = tasks.filter(
    (task) => !task.completed
  )

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-slate-800">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-10">
          <p className="text-sm text-slate-500 mb-2">
            Deep work
          </p>

          <h1 className="text-4xl font-semibold tracking-tight">
            Focus
          </h1>

          <p className="text-slate-500 mt-2">
            Choose a task and give it your full attention.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* TIMER */}

          <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-8">
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-6">
                {selectedTask
                  ? tasks.find(
                      (task) =>
                        String(task.id) ===
                        String(selectedTask)
                    )?.title ||
                    "Selected task"
                  : "General Focus"}
              </p>

              <div className="text-7xl font-semibold tracking-tight tabular-nums">
                {formatTime(timeLeft)}
              </div>

              <div className="flex justify-center gap-3 mt-8">
                <button
                  onClick={handleStart}
                  disabled={isRunning}
                  className="bg-slate-800 text-white rounded-xl px-6 py-3 hover:bg-slate-700 disabled:opacity-40 transition"
                >
                  Start
                </button>

                <button
                  onClick={handlePause}
                  disabled={!isRunning}
                  className="border border-slate-200 rounded-xl px-6 py-3 hover:border-slate-400 disabled:opacity-40 transition"
                >
                  Pause
                </button>

                <button
                  onClick={handleReset}
                  className="border border-slate-200 rounded-xl px-6 py-3 hover:border-slate-400 transition"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="mt-10">
              <p className="text-sm text-slate-500 mb-3">
                Session length
              </p>

              <div className="flex flex-wrap gap-2">
                {[15, 25, 45, 60].map(
                  (minutes) => (
                    <button
                      key={minutes}
                      onClick={() =>
                        handleDurationChange(
                          minutes
                        )
                      }
                      className={
                        duration ===
                        minutes
                          ? "px-4 py-2 rounded-full bg-slate-800 text-white text-sm"
                          : "px-4 py-2 rounded-full border border-slate-200 text-sm hover:border-slate-400"
                      }
                    >
                      {minutes} min
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="mt-8">
              <label className="block text-sm text-slate-500 mb-2">
                Focus task
              </label>

              <select
                value={selectedTask}
                onChange={(event) =>
                  setSelectedTask(
                    event.target.value
                  )
                }
                disabled={isRunning}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white outline-none focus:border-slate-500 disabled:bg-slate-50"
              >
                <option value="">
                  General Focus
                </option>

                {activeTasks.map(
                  (task) => (
                    <option
                      key={task.id}
                      value={task.id}
                    >
                      {task.title}
                    </option>
                  )
                )}
              </select>
            </div>
          </section>

          {/* STATS */}

          <section className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-sm text-slate-500">
                Completed Sessions
              </p>

              <p className="text-4xl font-semibold mt-2">
                {sessions}
              </p>

              <p className="text-xs text-slate-400 mt-2">
                Total focus sessions
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-sm text-slate-500">
                Focus Time
              </p>

              <p className="text-4xl font-semibold mt-2">
                {sessionHistory.reduce(
                  (total, session) =>
                    total +
                    Number(
                      session.duration ||
                        0
                    ),
                  0
                )}
              </p>

              <p className="text-xs text-slate-400 mt-2">
                Total minutes
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-sm text-slate-500">
                Active Tasks
              </p>

              <p className="text-4xl font-semibold mt-2">
                {activeTasks.length}
              </p>

              <p className="text-xs text-slate-400 mt-2">
                Available for focus
              </p>
            </div>
          </section>
        </div>

        {/* RECENT SESSIONS */}

        <section className="bg-white rounded-2xl border border-slate-200 p-6 mt-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              Recent Sessions
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Your latest completed focus sessions
            </p>
          </div>

          {sessionHistory.length ===
          0 ? (
            <div className="py-8 text-center">
              <p className="text-slate-500">
                No sessions yet.
              </p>

              <p className="text-sm text-slate-400 mt-1">
                Complete your first focus session to start tracking your progress.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessionHistory
                .slice()
                .reverse()
                .slice(0, 5)
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
                        Completed
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

export default Focus