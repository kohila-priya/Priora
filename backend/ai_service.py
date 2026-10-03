import os
import json
import re
from datetime import date, timedelta

from dotenv import load_dotenv
from openai import OpenAI


load_dotenv()


HF_TOKEN = os.getenv("HF_TOKEN")

HF_MODEL = os.getenv(
    "HF_MODEL",
    "openai/gpt-oss-120b"
)


if not HF_TOKEN:
    raise RuntimeError(
        "HF_TOKEN is missing. Add it to backend/.env."
    )


client = OpenAI(
    base_url="https://router.huggingface.co/v1",
    api_key=HF_TOKEN,
)


# =========================================================
# HELPERS
# =========================================================

def get_today():
    return date.today().isoformat()


def get_model():

    if ":fireworks-ai" in HF_MODEL:
        return HF_MODEL

    return f"{HF_MODEL}:fireworks-ai"


def _looks_like_provider_credit_error(error):

    if error is None:
        return False

    message = str(error).lower()

    return any(
        token in message
        for token in [
            "402",
            "credit",
            "depleted",
            "billing",
            "quota",
            "payment required",
            "insufficient credits",
        ]
    )


def _fallback_parse_task(user_input):

    text = re.sub(r"\s+", " ", (user_input or "").strip())
    lowered = text.lower()

    priority = "Medium"
    if any(word in lowered for word in ["urgent", "asap", "immediately", "today", "tomorrow"]):
        priority = "High"
    elif any(word in lowered for word in ["later", "next week", "someday", "when possible"]):
        priority = "Low"

    due_date = ""
    match = re.search(r"(?:due\s+)?(?:in\s+)?(\d+)\s+days?", lowered)
    if "tomorrow" in lowered:
        due_date = (date.today() + timedelta(days=1)).isoformat()
    elif "today" in lowered:
        due_date = date.today().isoformat()
    elif "day after tomorrow" in lowered:
        due_date = (date.today() + timedelta(days=2)).isoformat()
    elif "next week" in lowered:
        due_date = (date.today() + timedelta(days=7)).isoformat()
    elif match:
        days = int(match.group(1))
        due_date = (date.today() + timedelta(days=days)).isoformat()

    if any(term in lowered for term in ["meeting", "call", "sync", "standup"]):
        category = "meetings"
    elif any(term in lowered for term in ["study", "read", "learn", "practice", "course"]):
        category = "learning"
    elif any(term in lowered for term in ["exercise", "workout", "walk", "run"]):
        category = "health"
    elif any(term in lowered for term in ["report", "assignment", "project", "doc", "design"]):
        category = "work"
    else:
        category = "personal"

    estimated_minutes = 60
    number_match = re.search(r"(\d+)\s*(?:mins?|minutes?|hrs?|hours?)", lowered)
    if number_match:
        hours = int(number_match.group(1))
        estimated_minutes = hours * 60 if "hour" in number_match.group(0).lower() else hours
    elif re.search(r"\b(30|45|60|90|120|180|240)\b", lowered):
        estimated_minutes = int(re.search(r"\b(30|45|60|90|120|180|240)\b", lowered).group(1))

    if "high priority" in lowered or "important" in lowered or "urgent" in lowered:
        priority = "High"
    elif "low priority" in lowered or "not urgent" in lowered:
        priority = "Low"

    title = text
    if len(title) > 120:
        title = title[:117].rstrip() + "..."

    return {
        "title": title,
        "priority": priority,
        "dueDate": due_date,
        "category": category,
        "estimatedMinutes": estimated_minutes,
        "deadlineRisk": "Medium" if due_date else "None",
        "reasoning": "Fallback parser used because the inference provider is out of included credits.",
        "confidence": 0.55,
    }


def _fallback_plan_day(tasks, daily_focus_limit=480):

    today = date.today()
    today_tasks = []
    pending_tasks = []
    total_minutes = 0

    for task in sorted(tasks, key=lambda t: (
        not _task_is_sleep(t),
        _task_days_remaining(t, today) is None,
        _task_days_remaining(t, today) if _task_days_remaining(t, today) is not None else 999,
        {"High": 0, "Medium": 1, "Low": 2}.get(str(t.get("priority", "Medium")).title(), 3),
    )):
        task_id = task.get("id")
        estimated_minutes = int(task.get("estimatedMinutes", 480 if _task_is_sleep(task) else 45))
        priority = str(task.get("priority", "Medium")).title()
        days_remaining = _task_days_remaining(task, today)

        planned_minutes = 0
        if _task_is_sleep(task):
            planned_minutes = estimated_minutes
        elif _is_explicit_daily_routine(task):
            planned_minutes = min(estimated_minutes, 30)
        elif days_remaining is not None and days_remaining <= 1:
            planned_minutes = min(estimated_minutes, max(30, estimated_minutes))
        elif days_remaining is not None and days_remaining <= 3:
            planned_minutes = min(estimated_minutes, max(25, estimated_minutes // 2))
        elif days_remaining is not None and days_remaining <= 7:
            planned_minutes = min(estimated_minutes, max(20, estimated_minutes // 3))
        elif days_remaining is not None and days_remaining <= 14:
            planned_minutes = min(estimated_minutes, max(20, int((estimated_minutes / max(days_remaining, 1)) * ({"High": 1.2, "Medium": 0.9, "Low": 0.7}.get(priority, 0.9)))))
        elif priority == "High":
            planned_minutes = min(estimated_minutes, 30)

        if planned_minutes <= 0:
            due_date = task.get("dueDate", "") or (today + timedelta(days=7)).isoformat()
            pending_tasks.append({
                "id": task_id,
                "scheduledDate": due_date,
                "reason": "Fallback scheduling kept this for a later window while the AI provider was unavailable.",
            })
            continue

        allowed_minutes = daily_focus_limit if _task_is_sleep(task) else max(0, daily_focus_limit - total_minutes)
        if allowed_minutes <= 0:
            pending_tasks.append({
                "id": task_id,
                "scheduledDate": task.get("dueDate", (today + timedelta(days=3)).isoformat()),
                "reason": "Reached the daily focus cap while the provider was unavailable.",
            })
            continue

        planned_minutes = min(planned_minutes, allowed_minutes)
        today_tasks.append({
            "id": task_id,
            "order": len(today_tasks) + 1,
            "plannedMinutes": int(planned_minutes),
            "reason": "Fallback progress block for steady daily progress until the task is due.",
        })
        if not _task_is_sleep(task):
            total_minutes += planned_minutes

    if not today_tasks:
        for task in tasks:
            pending_tasks.append({
                "id": task.get("id"),
                "scheduledDate": task.get("dueDate", (today + timedelta(days=3)).isoformat()),
                "reason": "Fallback scheduling kept this task pending until the next planning pass.",
            })

    return {
        "summary": "AI provider credits were exhausted, so PRIORA used a local scheduling fallback to keep planning moving.",
        "totalMinutes": int(total_minutes),
        "dailyFocusMinutes": daily_focus_limit,
        "recommendedBreaks": max(1, len(today_tasks) // 2),
        "todayTasks": today_tasks,
        "pendingTasks": pending_tasks,
    }


def _task_days_remaining(task, today):
    due_date = task.get("dueDate", "")

    if not due_date:
        return None

    try:
        return (date.fromisoformat(due_date) - today).days
    except ValueError:
        return None


def _task_is_habit(task):
    category = str(task.get("category", "")).lower()
    title = str(task.get("title", "")).lower()

    habit_words = [
        "daily",
        "habit",
        "routine",
        "exercise",
        "walk",
        "reading",
        "journal",
        "meditation",
        "practice",
        "review",
        "study",
        "learning",
        "sleep",
        "bedtime",
        "night routine",
    ]

    return any(word in category or word in title for word in habit_words)


def _task_is_sleep(task):
    text = f"{task.get('title', '')} {task.get('category', '')}".lower()
    return bool(re.search(r"\b(sleep|bedtime|night routine)\b", text))


def _is_explicit_daily_routine(task):
    text = f"{task.get('title', '')} {task.get('category', '')}".lower()
    return any(word in text for word in ["daily", "every day", "each day", "habit", "routine"])


def _progressive_daily_minutes(task, today):

    if _task_is_sleep(task):
        return int(task.get("estimatedMinutes", 480))

    if _is_explicit_daily_routine(task):
        return min(int(task.get("estimatedMinutes", 30)), 30)

    due_date = task.get("dueDate", "")

    if not due_date:
        return None

    days_remaining = _task_days_remaining(task, today)

    if days_remaining is None or days_remaining <= 0:
        return None

    estimated_minutes = int(task.get("estimatedMinutes", 30))
    priority = str(task.get("priority", "Medium")).lower()
    priority_factor = {
        "high": 1.2,
        "medium": 0.9,
        "low": 0.7,
    }.get(priority, 0.9)

    if days_remaining >= 14 and (
        priority in {"high", "medium"} or _task_is_habit(task)
    ):
        return max(20, min(estimated_minutes, int((estimated_minutes / days_remaining) * priority_factor)))

    if days_remaining >= 7 and priority == "high":
        return max(25, min(estimated_minutes, int((estimated_minutes / days_remaining) * priority_factor)))

    return None


def clean_json_text(text):

    if not text:
        return ""

    text = text.strip()

    text = re.sub(
        r"^```json\s*",
        "",
        text,
        flags=re.IGNORECASE
    )

    text = re.sub(
        r"^```\s*",
        "",
        text
    )

    text = re.sub(
        r"\s*```$",
        "",
        text
    )

    return text.strip()


def extract_json(text):

    text = clean_json_text(text)

    if not text:
        raise ValueError(
            "AI returned no text content."
        )

    try:
        return json.loads(text)

    except json.JSONDecodeError:
        pass

    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end == -1:
        raise ValueError(
            "AI returned text, but no valid JSON object was found."
        )

    try:

        return json.loads(
            text[start:end + 1]
        )

    except json.JSONDecodeError as error:

        raise ValueError(
            f"AI returned invalid JSON: {error}"
        )


# =========================================================
# TASK PARSING
# =========================================================

TASK_SCHEMA = {

    "type": "json_schema",

    "json_schema": {

        "name": "priora_task",

        "strict": True,

        "schema": {

            "type": "object",

            "properties": {

                "title": {
                    "type": "string"
                },

                "priority": {
                    "type": "string",
                    "enum": [
                        "High",
                        "Medium",
                        "Low"
                    ]
                },

                "dueDate": {
                    "type": "string"
                },

                "category": {
                    "type": "string"
                },

                "estimatedMinutes": {
                    "type": "integer"
                },

                "deadlineRisk": {
                    "type": "string",
                    "enum": [
                        "High",
                        "Medium",
                        "Low",
                        "None"
                    ]
                },

                "reasoning": {
                    "type": "string"
                },

                "confidence": {
                    "type": "number"
                }

            },

            "required": [
                "title",
                "priority",
                "dueDate",
                "category",
                "estimatedMinutes",
                "deadlineRisk",
                "reasoning",
                "confidence"
            ],

            "additionalProperties": False
        }
    }
}


def parse_task_with_ai(user_input):

    today = get_today()

    tomorrow = (
        date.today() +
        timedelta(days=1)
    ).isoformat()


    prompt = f"""
Analyze this task for the PRIORA productivity application.

Today's date is {today}.
Tomorrow's date is {tomorrow}.

User input:
{user_input}

Return a structured task.

Rules:

1. Preserve the meaning of the task.
2. Remove unnecessary conversational wording.
3. Choose High, Medium, or Low priority.
4. Convert relative deadlines into ISO dates when possible.
5. If there is no deadline, use an empty string.
6. Estimate realistic effort in minutes.
7. Choose a useful category.
8. Explain the reasoning briefly.
9. Confidence must be between 0 and 1.
"""


    try:

        response = client.chat.completions.create(

            model=get_model(),

            messages=[

                {
                    "role": "system",
                    "content":
                    "You are PRIORA's task intelligence engine. "
                    "Return only structured JSON."
                },

                {
                    "role": "user",
                    "content": prompt
                }

            ],

            response_format=TASK_SCHEMA,

            temperature=0.2
        )


        content = (
            response
            .choices[0]
            .message
            .content
        )


        print(
            "AI TASK RESPONSE:",
            content
        )


        if not content:

            raise ValueError(
                "AI returned no text content."
            )


        return extract_json(content)

    except Exception as error:

        print("AI TASK FALLBACK USED:", error)

        if _looks_like_provider_credit_error(error):
            return _fallback_parse_task(user_input)

        raise


# =========================================================
# DAY PLANNER
# =========================================================

PLAN_SCHEMA = {

    "type": "json_schema",

    "json_schema": {

        "name": "priora_day_plan",

        "strict": True,

        "schema": {

            "type": "object",

            "properties": {

                "summary": {
                    "type": "string"
                },

                "totalMinutes": {
                    "type": "integer"
                },

                "recommendedBreaks": {
                    "type": "integer"
                },

                "todayTasks": {

                    "type": "array",

                    "items": {

                        "type": "object",

                        "properties": {

                            "id": {
                                "type": [
                                    "string",
                                    "number"
                                ]
                            },

                            "order": {
                                "type": "integer"
                            },

                            "plannedMinutes": {
                                "type": "integer"
                            },

                            "reason": {
                                "type": "string"
                            }

                        },

                        "required": [
                            "id",
                            "order",
                            "plannedMinutes",
                            "reason"
                        ],

                        "additionalProperties": False
                    }
                },

                "pendingTasks": {

                    "type": "array",

                    "items": {

                        "type": "object",

                        "properties": {

                            "id": {
                                "type": [
                                    "string",
                                    "number"
                                ]
                            },

                            "scheduledDate": {
                                "type": "string"
                            },

                            "reason": {
                                "type": "string"
                            }

                        },

                        "required": [
                            "id",
                            "scheduledDate",
                            "reason"
                        ],

                        "additionalProperties": False
                    }
                }

            },

            "required": [
                "summary",
                "totalMinutes",
                "recommendedBreaks",
                "todayTasks",
                "pendingTasks"
            ],

            "additionalProperties": False
        }
    }
}


def plan_day_with_ai(tasks, daily_focus_limit=480):

    if not tasks:

        raise ValueError(
            "No active tasks available."
        )


    # -----------------------------------------------------
    # DAILY CAPACITY
    # -----------------------------------------------------

    DAILY_FOCUS_LIMIT = daily_focus_limit

    today = date.today()

    # -----------------------------------------------------
    # PROGRESSIVE DAILY PLANNING
    # -----------------------------------------------------

    progressive_plan = {
        "todayTasks": [],
        "pendingTasks": [],
    }

    for task in tasks:
        task_id = task.get("id")
        daily_minutes = _progressive_daily_minutes(task, today)

        if daily_minutes is None:
            continue

        progressive_plan["todayTasks"].append({
            "id": task_id,
            "order": len(progressive_plan["todayTasks"]) + 1,
            "plannedMinutes": min(int(task.get("estimatedMinutes", 30)), daily_minutes),
            "reason": "Break this task into small daily progress blocks so it continues steadily until its due date.",
        })

    # -----------------------------------------------------
    # PREPARE TASK DATA
    # -----------------------------------------------------

    simplified_tasks = []


    for task in tasks:

        due_date = task.get(
            "dueDate",
            ""
        )


        days_remaining = None


        if due_date:

            try:

                due = date.fromisoformat(
                    due_date
                )

                days_remaining = (
                    due - today
                ).days

            except ValueError:

                days_remaining = None


        estimated_minutes = int(
            task.get(
                "estimatedMinutes",
                30
            )
        )


        simplified_tasks.append({

            "id":
                task.get("id"),

            "title":
                task.get("title", ""),

            "priority":
                task.get(
                    "priority",
                    "Medium"
                ),

            "dueDate":
                due_date,

            "daysRemaining":
                days_remaining,

            "estimatedMinutes":
                estimated_minutes,

            "deadlineRisk":
                task.get(
                    "deadlineRisk",
                    "None"
                ),

            "category":
                task.get(
                    "category",
                    "other"
                )

        })


    tasks_json = json.dumps(
        simplified_tasks,
        ensure_ascii=False
    )


    # -----------------------------------------------------
    # AI PLANNING RULES
    # -----------------------------------------------------

    prompt = f"""
You are PRIORA's rolling deadline-aware planner.

Today's date:
{today.isoformat()}

Today's maximum practical focus capacity:
{DAILY_FOCUS_LIMIT} minutes.

Active tasks:

{tasks_json}


Your job is to divide the tasks into TWO sections:

1. THINGS TO DO TODAY
2. THINGS PENDING BUT NOT TODAY


=========================================================
IMPORTANT PRINCIPLE
=========================================================

Do NOT simply sort all tasks.

Decide whether each task genuinely needs attention TODAY.

The closer the deadline, the more attention the task
should receive.

The farther the deadline, the less attention it should
receive.

If a task is due weeks away, do NOT leave it completely
for the last minute. Break it into small daily progress
blocks, and schedule a manageable amount each day until
its due date.

High-priority tasks due in 7–14 days should be spread across
multiple days with modest daily time blocks instead of one
large effort binge.

Daily habits or routine work should also be treated as
repeat actions: small daily sessions are better than waiting
for a big block later.

Sleep, bedtime, and explicit daily routines are recurring
actions. Always include today's occurrence in todayTasks,
even when they have no due date. Never put them in pendingTasks.
Sleep duration is not focus time and does not count against
the configured daily focus capacity.


=========================================================
EXACT TIME ALLOCATION
=========================================================

For EVERY task placed in todayTasks:

plannedMinutes MUST be an exact number.

Never write:

"substantial time"
"some time"
"significant time"
"as much as possible"

Use exact values such as:

30
45
60
90
120
180


=========================================================
DEADLINE LOGIC
=========================================================

DUE TODAY:

Allocate as much of its remaining estimated effort as
practically possible today.

DUE TOMORROW:

Allocate a large portion of its remaining effort today.

DUE IN 2 DAYS:

Allocate meaningful progress today while leaving enough
work for the remaining day.

DUE IN 3–5 DAYS:

Allocate moderate progress today.

DUE IN 6–7 DAYS:

Allocate a smaller amount today if useful.

DUE IN 8–14 DAYS:

Usually do NOT schedule it today when more urgent tasks
exist.

DUE MORE THAN 14 DAYS:

Normally do NOT schedule it today.

NO DEADLINE:

Use priority, deadline risk, and estimated effort.


=========================================================
PENDING TASKS
=========================================================

A task that does not need attention today must go into
pendingTasks.

For these tasks:

planned time = 0

Do NOT calculate today's work for them.

Instead, give them a scheduledDate.

Example:

System Design
scheduledDate: 2026-10-10


When that date arrives, PRIORA will run the planner again.

The planner will then calculate a NEW exact number of
minutes based on:

- how close the deadline is
- remaining estimated effort
- priority
- deadline risk
- other active tasks


=========================================================
EXAMPLE
=========================================================

Suppose:

DBMS Assignment
Estimated: 240 minutes
Due: tomorrow

Hackathon
Estimated: 600 minutes
Due: 5 days

System Design
Estimated: 360 minutes
Due: 14 days


A reasonable plan could be:

TODAY:

DBMS Assignment
180 minutes

Hackathon
90 minutes


PENDING:

System Design
scheduled for a later date


Do NOT force System Design into today's schedule just
because there is unused capacity.


=========================================================
DAILY CAPACITY
=========================================================

The total of all plannedMinutes in todayTasks MUST NOT
exceed:

{DAILY_FOCUS_LIMIT} minutes.


=========================================================
TASK ORDER
=========================================================

Order today's tasks using:

1. Deadline proximity
2. Deadline risk
3. Priority
4. Estimated effort


=========================================================
OUTPUT
=========================================================

Every active task must appear exactly once.

todayTasks contains:

- id
- order
- plannedMinutes
- reason

pendingTasks contains:

- id
- scheduledDate
- reason

Do not invent IDs.

Do not change IDs.

Do not put pending tasks in todayTasks.

Do not give vague time allocations.
"""


    print(
        "PLANNER INPUT:",
        tasks_json
    )

    try:

        response = client.chat.completions.create(

            model=get_model(),

            messages=[

                {
                    "role": "system",
                    "content":
                    "You are PRIORA's intelligent "
                    "rolling productivity planner. "
                    "Return only structured JSON."
                },

                {
                    "role": "user",
                    "content": prompt
                }

            ],

            response_format=PLAN_SCHEMA,

            temperature=0.2
        )


        content = (
            response
            .choices[0]
            .message
            .content
        )


        print(
            "AI PLANNER RESPONSE:",
            content
        )


        if not content:

            raise ValueError(
                "AI did not return a task plan."
            )


        result = extract_json(content)

    except Exception as error:

        print("AI PLANNER FALLBACK USED:", error)

        if _looks_like_provider_credit_error(error):
            return _fallback_plan_day(tasks, DAILY_FOCUS_LIMIT)

        raise

    if not result.get("todayTasks"):
        result["todayTasks"] = []

    if not result.get("pendingTasks"):
        result["pendingTasks"] = []

    for progressive_task in progressive_plan["todayTasks"]:
        task_id = str(progressive_task["id"])

        result["pendingTasks"] = [
            item for item in result["pendingTasks"]
            if str(item["id"]) != task_id
        ]

        if any(str(item["id"]) == task_id for item in result["todayTasks"]):
            for item in result["todayTasks"]:
                if str(item["id"]) == task_id:
                    item["plannedMinutes"] = min(
                        item.get("plannedMinutes", 0),
                        progressive_task["plannedMinutes"],
                    )
                    item["reason"] = (
                        item.get("reason", "")
                        + " Small daily progress block until due date."
                    ).strip()
            continue

        result["todayTasks"].append(progressive_task)

    # =====================================================
    # VALIDATION
    # =====================================================

    original_ids = {

        str(task["id"])

        for task in tasks

    }


    today_ids = {

        str(task["id"])

        for task in result["todayTasks"]

    }


    pending_ids = {

        str(task["id"])

        for task in result["pendingTasks"]

    }


    all_returned_ids = (
        today_ids |
        pending_ids
    )


    if original_ids != all_returned_ids:

        raise ValueError(
            "AI planner did not return "
            "every active task exactly once."
        )


    if today_ids & pending_ids:

        raise ValueError(
            "A task appeared in both "
            "today and pending sections."
        )


    # =====================================================
    # VALIDATE TODAY'S MINUTES
    # =====================================================

    task_lookup = {

        str(task["id"]):
            task

        for task in tasks

    }


    total_minutes = 0


    for planned_task in result["todayTasks"]:

        task_id = str(
            planned_task["id"]
        )


        original_task = task_lookup[
            task_id
        ]


        estimated_minutes = int(
            original_task.get(
                "estimatedMinutes",
                30
            )
        )


        planned_minutes = int(
            planned_task[
                "plannedMinutes"
            ]
        )


        if planned_minutes < 0:

            planned_minutes = 0


        if planned_minutes > estimated_minutes:

            planned_minutes = (
                estimated_minutes
            )


        planned_task[
            "plannedMinutes"
        ] = planned_minutes


        if not _task_is_sleep(original_task):
            total_minutes += planned_minutes


    # =====================================================
    # DAILY LIMIT
    # =====================================================

    if total_minutes > DAILY_FOCUS_LIMIT:

        raise ValueError(
            "The AI planned more than "
            "the daily focus capacity."
        )


    # =====================================================
    # BREAKS
    # =====================================================

    recommended_breaks = 0


    if total_minutes >= 90:

        recommended_breaks = (
            total_minutes // 90
        )


    # =====================================================
    # SUMMARY
    # =====================================================

    result["totalMinutes"] = (
        total_minutes
    )

    result["dailyFocusMinutes"] = DAILY_FOCUS_LIMIT


    result["recommendedBreaks"] = (
        recommended_breaks
    )


    result["summary"] = (

        f"{len(result['todayTasks'])} task(s) "
        f"need attention today, using "
        f"{total_minutes} minutes of focus time. "
        f"{len(result['pendingTasks'])} task(s) "
        f"are scheduled for later."
    )


    return result