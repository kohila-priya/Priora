const getStorage = (key, fallback = []) => {
  try {
    const saved = localStorage.getItem(key)

    if (!saved) {
      return fallback
    }

    return JSON.parse(saved)
  } catch (error) {
    console.error(`Failed to read ${key}:`, error)
    return fallback
  }
}

const setStorage = (key, value) => {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    )
  } catch (error) {
    console.error(`Failed to save ${key}:`, error)
  }
}

export const getTasks = () => {
  return getStorage("priora_tasks", [])
}

export const saveTasks = (tasks) => {
  setStorage("priora_tasks", tasks)
}

export const getSessions = () => {
  return Number(
    localStorage.getItem("priora_sessions") || 0
  )
}

export const saveSessions = (sessions) => {
  localStorage.setItem(
    "priora_sessions",
    String(sessions)
  )
}

export const getSessionHistory = () => {
  return getStorage(
    "priora_session_history",
    []
  )
}

export const saveSessionHistory = (history) => {
  setStorage(
    "priora_session_history",
    history
  )
}