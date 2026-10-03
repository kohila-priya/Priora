const API_BASE_URL =
  "http://127.0.0.1:5000"


export const parseTaskWithAI =
  async (input) => {

    if (!input.trim()) {
      return null
    }

    const response =
      await fetch(
        `${API_BASE_URL}/api/ai/parse-task`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            input: input.trim(),
          }),
        }
      )

    const data =
      await response.json()

    if (!response.ok) {

      throw new Error(
        data.error ||
        "AI service failed."
      )

    }

    return data
  }


export const planDayWithAI =
  async (tasks, dailyFocusMinutes = 480) => {

    if (!tasks || tasks.length === 0) {

      throw new Error(
        "No active tasks available."
      )

    }

    const response =
      await fetch(
        `${API_BASE_URL}/api/ai/plan-day`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            tasks,
            dailyFocusMinutes,
          }),
        }
      )

    const data =
      await response.json()

    if (!response.ok) {

      throw new Error(
        data.error ||
        "AI day planning failed."
      )

    }

    return data
  }