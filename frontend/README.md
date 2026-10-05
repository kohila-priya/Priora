# PRIORA

### Prioritize. Plan. Adapt.

**PRIORA** is an AI-powered academic planning assistant designed to help college students manage assignments, exams, projects, and deadlines through intelligent prioritization and adaptive scheduling.

Instead of simply listing tasks, PRIORA analyzes **urgency, importance, effort, and deadlines** to help students decide what they should work on first.

---

## 🎯 Problem

College students often have multiple assignments, exams, projects, and deadlines competing for their limited time.

Traditional to-do lists answer:

> **"What do I have to do?"**

PRIORA aims to answer:

> **"What should I do first, and why?"**

The system is designed to create a practical study plan based on deadlines, task effort, priority, and the student's available time.

---

## 💡 Core Features

### 📋 Task Management

Add academic tasks such as:

* Assignments
* Exams
* Projects
* Deadlines
* Other academic activities

Each task can include information such as its deadline and estimated effort.

### 🔥 AI Priority Analysis

PRIORA evaluates tasks based on factors such as:

* Urgency
* Importance
* Estimated effort
* Consequences of delaying the task

It then determines which tasks deserve attention first.

### 📅 Today's Plan

Given a student's available study time, PRIORA generates an ordered plan for the day.

For example:

```text
Available study time: 3 hours

1. DBMS Exam       → 90 min
2. Java Assignment → 60 min
3. OS Assignment   → 30 min
```

### 🔄 Adaptive Replanning

Plans are not permanent.

If a student cannot complete a task, PRIORA can reconsider the remaining tasks and generate an updated plan.

### 🤖 AI Explanation

PRIORA aims to explain **why** a task was prioritized instead of simply producing an unexplained ranking.

---

## 🧠 AI Approach

PRIORA is being developed around an **AI agent architecture**.

The agent can reason about academic tasks and use tools to:

1. Understand the student's tasks
2. Analyze deadlines and workload
3. Prioritize tasks
4. Build a study schedule
5. Recalculate the plan when circumstances change

The project is designed to explore the use of **open-weight models and open-source AI tooling** in a practical student-focused application.

---

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS

### Backend

* Python
* FastAPI

### AI

* Open-weight LLM
* AI agent / tool-calling architecture

### Database

* SQLite

### Deployment

* Planned cloud deployment

---

## 🏗️ Project Structure

```text
PRIORA/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── index.css
│   └── package.json
│
├── backend/
│
├── README.md
└── .gitignore
```

---

## 🚀 Development Roadmap

### Phase 1 — MVP

* [x] Project setup
* [x] React + Vite setup
* [x] Tailwind CSS setup
* [x] Initial dashboard
* [ ] Task creation
* [ ] Task display
* [ ] AI prioritization
* [ ] Daily planning
* [ ] Adaptive replanning

### Phase 2 — AI Agent

* [ ] Open-weight LLM integration
* [ ] Tool calling
* [ ] Agent reasoning
* [ ] Priority analysis
* [ ] Planning tool
* [ ] Replanning tool

### Phase 3 — Advanced AI

* [ ] Academic knowledge retrieval
* [ ] Agent state and memory
* [ ] Evaluation
* [ ] Observability
* [ ] Guardrails
* [ ] Improved planning reliability

### Phase 4 — Production

* [ ] Backend deployment
* [ ] Frontend deployment
* [ ] Database deployment
* [ ] Error handling
* [ ] Logging
* [ ] Testing
* [ ] Documentation

---

## 🎓 Example Use Case

A student has:

```text
DBMS Exam       → Tomorrow
Java Assignment → Tomorrow
OS Assignment   → 5 days
AI Project      → 8 days

Available time → 3 hours
```

Instead of treating every task equally, PRIORA can generate a plan such as:

```text
TODAY'S PLAN

1. DBMS Exam
   90 minutes
   High priority

2. Java Assignment
   60 minutes
   High priority

3. OS Assignment
   30 minutes
   Medium priority
```

If the student later reports that the DBMS preparation was not completed, PRIORA can reconsider the remaining workload and generate a new plan.

---

## 🌱 Why Open-Source AI?

PRIORA is also an exploration of how **open-weight models and open-source AI tools** can be used to build useful applications without depending entirely on closed AI systems.

This makes the project useful not only as an academic planner, but also as a practical learning project in:

* AI agents
* LLM applications
* Tool calling
* Open-weight models
* AI evaluation
* Full-stack AI engineering

---

## 📌 Project Status

**Currently in active development.**

The initial frontend foundation has been established, and the project is being developed incrementally from an MVP into a more capable AI academic planning system.

---

## 👩‍💻 Author

**Kohila Priya**

Computer Science Engineering Student
Interested in Software Development, AI/ML, LLMs, and Agentic AI.

---

## ⭐ Vision

PRIORA is being built around a simple idea:

> **A planner should not only remember your tasks. It should help you decide what matters most.**

**Prioritize. Plan. Adapt.**
