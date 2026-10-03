import types
import unittest
import json

import ai_service


class DummyResponse:
    choices = [types.SimpleNamespace(message=types.SimpleNamespace(content='{}'))]


class AIFallbackTests(unittest.TestCase):
    def test_parse_task_falls_back_when_ai_credits_are_exhausted(self):
        def raise_402(*args, **kwargs):
            raise Exception("402 - {'error': 'You have depleted your monthly included credits.'}")

        original = ai_service.client.chat.completions.create
        ai_service.client.chat.completions.create = raise_402
        try:
            result = ai_service.parse_task_with_ai("Finish project report due tomorrow")
            self.assertIn("title", result)
            self.assertIn(result["priority"], {"High", "Medium", "Low"})
            self.assertIsInstance(result["estimatedMinutes"], int)
        finally:
            ai_service.client.chat.completions.create = original

    def test_plan_day_falls_back_when_ai_credits_are_exhausted(self):
        def raise_402(*args, **kwargs):
            raise Exception("402 - {'error': 'You have depleted your monthly included credits.'}")

        original = ai_service.client.chat.completions.create
        ai_service.client.chat.completions.create = raise_402
        try:
            tasks = [{
                "id": 1,
                "title": "Design doc",
                "priority": "High",
                "dueDate": "2026-10-17",
                "estimatedMinutes": 240,
                "category": "work",
            }]

            result = ai_service.plan_day_with_ai(tasks)
            self.assertIn("todayTasks", result)
            self.assertIn("pendingTasks", result)
            self.assertEqual(result["todayTasks"][0]["id"], 1)
        finally:
            ai_service.client.chat.completions.create = original

    def test_sleep_is_promoted_from_pending_to_today(self):
        ai_result = {
            "summary": "Plan created",
            "totalMinutes": 30,
            "recommendedBreaks": 0,
            "todayTasks": [{
                "id": 2,
                "order": 1,
                "plannedMinutes": 30,
                "reason": "Work on the report.",
            }],
            "pendingTasks": [{
                "id": 1,
                "scheduledDate": "2026-10-04",
                "reason": "Scheduled later.",
            }],
        }

        def return_plan(*args, **kwargs):
            return types.SimpleNamespace(choices=[
                types.SimpleNamespace(message=types.SimpleNamespace(content=json.dumps(ai_result)))
            ])

        original = ai_service.client.chat.completions.create
        ai_service.client.chat.completions.create = return_plan
        try:
            tasks = [
                {
                    "id": 1,
                    "title": "Sleep every day",
                    "priority": "Medium",
                    "estimatedMinutes": 480,
                    "category": "personal",
                },
                {
                    "id": 2,
                    "title": "Write report",
                    "priority": "Medium",
                    "estimatedMinutes": 60,
                    "category": "work",
                },
            ]

            result = ai_service.plan_day_with_ai(tasks)

            today_ids = {item["id"] for item in result["todayTasks"]}
            pending_ids = {item["id"] for item in result["pendingTasks"]}
            sleep_item = next(item for item in result["todayTasks"] if item["id"] == 1)

            self.assertIn(1, today_ids)
            self.assertNotIn(1, pending_ids)
            self.assertEqual(sleep_item["plannedMinutes"], 480)
            self.assertEqual(result["totalMinutes"], 30)
        finally:
            ai_service.client.chat.completions.create = original

    def test_custom_focus_limit_is_applied_to_fallback_plan(self):
        def raise_402(*args, **kwargs):
            raise Exception("402 - {'error': 'You have depleted your monthly included credits.'}")

        original = ai_service.client.chat.completions.create
        ai_service.client.chat.completions.create = raise_402
        try:
            tasks = [
                {"id": 1, "title": "Urgent report", "priority": "High", "estimatedMinutes": 120},
                {"id": 2, "title": "Urgent presentation", "priority": "High", "estimatedMinutes": 120},
            ]

            result = ai_service.plan_day_with_ai(tasks, 60)

            self.assertEqual(result["dailyFocusMinutes"], 60)
            self.assertLessEqual(result["totalMinutes"], 60)
        finally:
            ai_service.client.chat.completions.create = original


if __name__ == "__main__":
    unittest.main()
