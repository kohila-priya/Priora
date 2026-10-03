from flask import Flask, request, jsonify
from flask_cors import CORS

from ai_service import (
    parse_task_with_ai,
    plan_day_with_ai,
)


app = Flask(__name__)

CORS(app)


@app.route(
    "/api/health",
    methods=["GET"]
)
def health():

    return jsonify({

        "status": "ok",

        "service": "PRIORA backend"

    })


@app.route(
    "/api/ai/parse-task",
    methods=["POST"]
)
def parse_task():

    data = request.get_json()

    if not data:

        return jsonify({

            "error":
            "Request body is required."

        }), 400

    user_input = data.get(
        "input",
        ""
    ).strip()

    if not user_input:

        return jsonify({

            "error":
            "Task input is required."

        }), 400

    try:

        result = parse_task_with_ai(
            user_input
        )

        return jsonify(result)

    except Exception as error:

        print(
            "AI processing error:",
            error
        )

        message = str(error).lower()

        if "402" in message or "credit" in message or "quota" in message or "billing" in message:
            return jsonify({
                "error": "The AI provider is out of included credits. Add credits or switch to a different model/key in backend/.env."
            }), 503

        return jsonify({

            "error":
            str(error)

        }), 500


@app.route(
    "/api/ai/plan-day",
    methods=["POST"]
)
def plan_day():

    data = request.get_json()

    if not data:

        return jsonify({

            "error":
            "Request body is required."

        }), 400

    tasks = data.get(
        "tasks",
        []
    )

    if not isinstance(tasks, list):

        return jsonify({

            "error":
            "Tasks must be an array."

        }), 400

    if not tasks:

        return jsonify({

            "error":
            "No active tasks available."

        }), 400

    daily_focus_minutes = data.get(
        "dailyFocusMinutes",
        480
    )

    if (
        isinstance(daily_focus_minutes, bool)
        or not isinstance(daily_focus_minutes, int)
        or daily_focus_minutes < 30
        or daily_focus_minutes > 960
    ):

        return jsonify({

            "error":
            "Daily focus time must be between 30 and 960 minutes."

        }), 400

    try:

        result = plan_day_with_ai(
            tasks,
            daily_focus_minutes
        )

        return jsonify(result)

    except Exception as error:

        print(
            "AI planning error:",
            error
        )

        message = str(error).lower()

        if "402" in message or "credit" in message or "quota" in message or "billing" in message:
            return jsonify({
                "error": "The AI provider is out of included credits. Add credits or switch to a different model/key in backend/.env."
            }), 503

        return jsonify({

            "error":
            str(error)

        }), 500


if __name__ == "__main__":

    app.run(

        host="127.0.0.1",

        port=5000,

        debug=True

    )