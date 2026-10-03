import { useState } from "react"

import Navbar from "../components/Navbar"

import {
  getTasks,
  saveTasks,
} from "../utils/storage"

import {
  parseTaskWithAI,
  planDayWithAI,
} from "../services/aiService"


function AI() {

  const [input, setInput] =
    useState("")

  const [result, setResult] =
    useState(null)

  const [dayPlan, setDayPlan] =
    useState(null)

  const [message, setMessage] =
    useState("")

  const [isProcessing, setIsProcessing] =
    useState(false)

  const [isPlanning, setIsPlanning] =
    useState(false)

  const [focusHours, setFocusHours] =
    useState(() => {
      const savedMinutes = Number(
        localStorage.getItem("prioraDailyFocusMinutes")
      )

      return savedMinutes >= 30 && savedMinutes <= 960
        ? String(savedMinutes / 60)
        : "8"
    })


  // =====================================================
  // ANALYZE TASK
  // =====================================================

  const handleAnalyze =
    async () => {

      if (!input.trim()) {
        return
      }

      setIsProcessing(true)

      setMessage("")

      setResult(null)

      try {

        const parsed =
          await parseTaskWithAI(
            input
          )

        setResult(parsed)

      } catch (error) {

        console.error(error)

        setMessage(
          error.message ||
          "Unable to analyze the task."
        )

      }

      setIsProcessing(false)
    }


  // =====================================================
  // ADD AI TASK
  // =====================================================

  const handleAddTask =
    () => {

      if (!result) {
        return
      }

      const tasks =
        getTasks()


      const newTask = {

        id: Date.now(),

        title:
          result.title,

        completed:
          false,

        priority:
          result.priority,

        date:
          new Date()
            .toISOString()
            .split("T")[0],

        dueDate:
          result.dueDate,

        completedAt:
          null,

        category:
          result.category,

        estimatedMinutes:
          result.estimatedMinutes,

        deadlineRisk:
          result.deadlineRisk,

        aiReasoning:
          result.reasoning,

        aiGenerated:
          true,

      }


      saveTasks([
        ...tasks,
        newTask,
      ])


      setMessage(
        "AI task added to PRIORA."
      )

      setInput("")

      setResult(null)
    }


  // =====================================================
  // PLAN MY DAY
  // =====================================================

  const handlePlanDay =
    async () => {

      const dailyFocusMinutes = Math.round(
        Number(focusHours) * 60
      )

      if (
        !Number.isFinite(dailyFocusMinutes) ||
        dailyFocusMinutes < 30 ||
        dailyFocusMinutes > 960
      ) {
        setMessage("Choose a daily focus time between 0.5 and 16 hours.")
        return
      }

      const tasks =
        getTasks()


      const activeTasks =
        tasks.filter(
          (task) =>
            !task.completed
        )


      if (
        activeTasks.length === 0
      ) {

        setMessage(
          "You have no active tasks to plan."
        )

        return
      }


      setIsPlanning(true)

      setMessage("")

      setDayPlan(null)


      try {

        const plan =
          await planDayWithAI(
            activeTasks,
            dailyFocusMinutes
          )


        setDayPlan({
          ...plan,
          dailyFocusMinutes,
          taskDetails:
            activeTasks,
        })


      } catch (error) {

        console.error(error)

        setMessage(
          error.message ||
          "Unable to create your day plan."
        )

      }


      setIsPlanning(false)
    }


  // =====================================================
  // FIND TASK
  // =====================================================

  const getTaskDetails =
    (id) => {

      return dayPlan?.taskDetails?.find(
        (task) =>
          String(task.id) ===
          String(id)
      )
    }


  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate =
    (value) => {

      if (!value) {
        return ""
      }

      const date =
        new Date(
          `${value}T00:00:00`
        )

      return date.toLocaleDateString(
        "en-IN",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      )
    }


  return (

    <div className="min-h-screen bg-[#f8f7f4] text-slate-800">

      <Navbar />


      <main className="max-w-5xl mx-auto px-6 py-10">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-10">

          <p className="text-sm text-slate-500 mb-2">
            Intelligent productivity
          </p>

          <h1 className="text-4xl font-semibold tracking-tight">
            PRIORA AI
          </h1>

          <p className="text-slate-500 mt-2 max-w-2xl">
            Turn natural language into structured work
            and let PRIORA decide what actually needs
            your attention today.
          </p>

        </div>


        {/* =================================================
            TASK ANALYZER
        ================================================= */}

        <section className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">

          <label className="block text-sm text-slate-500 mb-3">
            Tell PRIORA what you need to do
          </label>


          <textarea

            value={input}

            onChange={(event) =>
              setInput(
                event.target.value
              )
            }

            placeholder="Example: Submit DBMS assignment tomorrow"

            rows={5}

            className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none resize-none focus:border-slate-500"

          />


          <div className="flex items-center justify-between mt-4">

            <p className="text-xs text-slate-400">
              Natural language → structured task
            </p>


            <button

              onClick={
                handleAnalyze
              }

              disabled={
                !input.trim() ||
                isProcessing
              }

              className="bg-slate-800 text-white rounded-xl px-5 py-3 hover:bg-slate-700 disabled:opacity-40 transition"

            >

              {isProcessing
                ? "Thinking..."
                : "Analyze Task"}

            </button>

          </div>

        </section>


        {/* =================================================
            AI TASK RESULT
        ================================================= */}

        {result && (

          <section className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">

            <div className="flex items-center justify-between mb-6">

              <div>

                <p className="text-sm text-slate-500">
                  AI task interpretation
                </p>

                <h2 className="text-xl font-semibold mt-1">
                  Here's what PRIORA understood
                </h2>

              </div>


              <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-500">

                {Math.round(
                  result.confidence * 100
                )}

                % confidence

              </span>

            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


              <div className="border border-slate-100 rounded-xl p-4 md:col-span-2">

                <p className="text-xs text-slate-400 mb-1">
                  Task
                </p>

                <p className="font-medium">
                  {result.title}
                </p>

              </div>


              <div className="border border-slate-100 rounded-xl p-4">

                <p className="text-xs text-slate-400 mb-1">
                  Priority
                </p>

                <p className="font-medium">
                  {result.priority}
                </p>

              </div>


              <div className="border border-slate-100 rounded-xl p-4">

                <p className="text-xs text-slate-400 mb-1">
                  Deadline
                </p>

                <p className="font-medium">

                  {result.dueDate ||
                    "No deadline detected"}

                </p>

              </div>


              <div className="border border-slate-100 rounded-xl p-4">

                <p className="text-xs text-slate-400 mb-1">
                  Category
                </p>

                <p className="font-medium">
                  {result.category}
                </p>

              </div>


              <div className="border border-slate-100 rounded-xl p-4">

                <p className="text-xs text-slate-400 mb-1">
                  Estimated Time
                </p>

                <p className="font-medium">
                  {result.estimatedMinutes} minutes
                </p>

              </div>


              <div className="border border-slate-100 rounded-xl p-4">

                <p className="text-xs text-slate-400 mb-1">
                  Deadline Risk
                </p>

                <p className="font-medium">
                  {result.deadlineRisk}
                </p>

              </div>


              <div className="border border-slate-100 rounded-xl p-4 md:col-span-2">

                <p className="text-xs text-slate-400 mb-1">
                  AI Reasoning
                </p>

                <p className="text-sm text-slate-600">
                  {result.reasoning}
                </p>

              </div>

            </div>


            <div className="flex gap-3 mt-6">


              <button

                onClick={
                  handleAddTask
                }

                className="bg-slate-800 text-white rounded-xl px-5 py-3 hover:bg-slate-700 transition"

              >
                Add to Tasks
              </button>


              <button

                onClick={() =>
                  setResult(null)
                }

                className="border border-slate-200 rounded-xl px-5 py-3 hover:border-slate-400 transition"

              >
                Discard
              </button>

            </div>

          </section>

        )}


        {/* =================================================
            PLAN MY DAY
        ================================================= */}

        <section className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

            <div>

              <p className="text-sm text-slate-500">
                AI planning
              </p>

              <h2 className="text-xl font-semibold mt-1">
                Plan My Day
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                PRIORA calculates exactly how many minutes
                each task deserves today.
              </p>

            </div>


            <button

              onClick={
                handlePlanDay
              }

              disabled={
                isPlanning
              }

              className="bg-slate-800 text-white rounded-xl px-5 py-3 hover:bg-slate-700 disabled:opacity-40 transition whitespace-nowrap"

            >

              {isPlanning
                ? "Planning..."
                : "Plan My Day"}

            </button>

          </div>


          <div className="mt-6 flex flex-wrap items-center gap-3">

            <label htmlFor="daily-focus-hours" className="text-sm font-medium text-slate-700">
              Daily focus time
            </label>

            <input
              id="daily-focus-hours"
              type="number"
              min="0.5"
              max="16"
              step="0.5"
              value={focusHours}
              onChange={(event) => {
                const nextHours = event.target.value
                const nextMinutes = Math.round(Number(nextHours) * 60)

                setFocusHours(nextHours)

                if (nextHours && nextMinutes >= 30 && nextMinutes <= 960) {
                  localStorage.setItem("prioraDailyFocusMinutes", String(nextMinutes))
                }
              }}
              className="w-24 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800"
              aria-label="Daily focus time in hours"
            />

            <span className="text-sm text-slate-500">hours</span>

          </div>

        </section>


        {/* =================================================
            DAY PLAN
        ================================================= */}

        {dayPlan && (

          <section className="mb-8">


            {/* =============================================
                SUMMARY
            ============================================= */}

            <div className="bg-slate-800 text-white rounded-2xl p-6 mb-8">

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">


                <div>

                  <p className="text-sm text-slate-300">
                    Today's focus
                  </p>

                  <p className="text-3xl font-semibold mt-1">
                    {dayPlan.totalMinutes} min
                  </p>

                </div>


                <div>

                  <p className="text-sm text-slate-300">
                    Tasks today
                  </p>

                  <p className="text-3xl font-semibold mt-1">
                    {dayPlan.todayTasks.length}
                  </p>

                </div>


                <div>

                  <p className="text-sm text-slate-300">
                    Scheduled later
                  </p>

                  <p className="text-3xl font-semibold mt-1">
                    {dayPlan.pendingTasks.length}
                  </p>

                </div>

              </div>

            </div>


            {/* =============================================
                TODAY
            ============================================= */}

            <div className="mb-8">

              <div className="mb-4">

                <p className="text-sm text-slate-500">
                  PRIORA's recommendation
                </p>

                <h2 className="text-2xl font-semibold mt-1">
                  THINGS TO DO TODAY
                </h2>

              </div>


              {dayPlan.todayTasks.length === 0 ? (

                <div className="bg-white border border-slate-200 rounded-2xl p-6">

                  <p className="text-slate-500">
                    Nothing requires your attention today.
                  </p>

                </div>

              ) : (

                <div className="space-y-4">

                  {dayPlan.todayTasks.map(
                    (plannedTask) => {

                      const task =
                        getTaskDetails(
                          plannedTask.id
                        )


                      if (!task) {
                        return null
                      }


                      return (

                        <div

                          key={
                            plannedTask.id
                          }

                          className="bg-white border border-slate-200 rounded-2xl p-6"

                        >

                          <div className="flex items-start gap-4">


                            <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">

                              {plannedTask.order}

                            </div>


                            <div className="flex-1">


                              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">


                                <div>

                                  <h3 className="font-semibold text-lg">
                                    {task.title}
                                  </h3>


                                  <p className="text-sm text-slate-500 mt-1">

                                    Due{" "}

                                    {task.dueDate
                                      ? formatDate(
                                          task.dueDate
                                        )
                                      : "no deadline"}

                                  </p>

                                </div>


                                <div className="flex items-center gap-2">


                                  <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-600">

                                    {task.priority}

                                  </span>


                                  <span className="text-sm font-semibold px-3 py-1 rounded-full bg-slate-800 text-white">

                                    {plannedTask.plannedMinutes} min

                                  </span>

                                </div>

                              </div>


                              <p className="text-sm text-slate-600 mt-4">

                                {plannedTask.reason}

                              </p>


                            </div>

                          </div>

                        </div>

                      )

                    }
                  )}

                </div>

              )}

            </div>


            {/* =============================================
                PENDING
            ============================================= */}

            <div>


              <div className="mb-4">

                <p className="text-sm text-slate-500">
                  Scheduled for later
                </p>

                <h2 className="text-2xl font-semibold mt-1">
                  THINGS PENDING BUT NOT TODAY
                </h2>

              </div>


              {dayPlan.pendingTasks.length === 0 ? (

                <div className="bg-white border border-slate-200 rounded-2xl p-6">

                  <p className="text-slate-500">
                    Nothing is waiting for later.
                  </p>

                </div>

              ) : (

                <div className="space-y-4">

                  {dayPlan.pendingTasks.map(
                    (pendingTask) => {

                      const task =
                        getTaskDetails(
                          pendingTask.id
                        )


                      if (!task) {
                        return null
                      }


                      return (

                        <div

                          key={
                            pendingTask.id
                          }

                          className="bg-white border border-slate-200 rounded-2xl p-6"

                        >

                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">


                            <div>

                              <h3 className="font-semibold text-lg">
                                {task.title}
                              </h3>


                              <p className="text-sm text-slate-500 mt-1">

                                Due{" "}

                                {task.dueDate
                                  ? formatDate(
                                      task.dueDate
                                    )
                                  : "no deadline"}

                              </p>

                            </div>


                            <div className="text-left md:text-right">


                              <p className="text-xs text-slate-400">
                                Scheduled for
                              </p>


                              <p className="font-semibold mt-1">

                                {formatDate(
                                  pendingTask.scheduledDate
                                )}

                              </p>

                            </div>

                          </div>


                          <p className="text-sm text-slate-600 mt-4">

                            {pendingTask.reason}

                          </p>

                        </div>

                      )

                    }
                  )}

                </div>

              )}

            </div>


          </section>

        )}


        {/* =================================================
            MESSAGE
        ================================================= */}

        {message && (

          <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6">

            <p className="text-sm text-slate-600">
              {message}
            </p>

          </div>

        )}


        {/* =================================================
            EXAMPLES
        ================================================= */}

        <section className="mt-8">

          <h2 className="text-xl font-semibold">
            Try examples
          </h2>


          <p className="text-sm text-slate-500 mt-1 mb-4">
            See how natural language becomes structured work.
          </p>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">


            {[
              "Submit DBMS assignment tomorrow",
              "Prepare for my coding interview next week",
              "Read about system design",
            ].map(
              (example) => (

                <button

                  key={example}

                  onClick={() =>
                    setInput(example)
                  }

                  className="text-left bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-400 transition"

                >

                  <p className="text-sm font-medium">
                    {example}
                  </p>

                  <p className="text-xs text-slate-400 mt-2">
                    Use example
                  </p>

                </button>

              )
            )}

          </div>

        </section>


      </main>

    </div>
  )
}


export default AI