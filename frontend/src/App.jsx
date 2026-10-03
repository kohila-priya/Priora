import { BrowserRouter, Routes, Route } from "react-router-dom"

import Dashboard from "./pages/Dashboard"
import Tasks from "./pages/Tasks"
import Calendar from "./pages/Calendar"
import Focus from "./pages/Focus"
import Analytics from "./pages/Analytics"
import AI from "./pages/AI"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/tasks"
          element={<Tasks />}
        />

        <Route
          path="/calendar"
          element={<Calendar />}
        />

        <Route
          path="/focus"
          element={<Focus />}
        />

        <Route
          path="/analytics"
          element={<Analytics />}
        />

        <Route
          path="/ai"
          element={<AI />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App