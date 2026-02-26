import os
from flask import Flask, request, render_template, abort
import requests

app = Flask(__name__)

EMPLOYEES = [
    {"id": 1, "name": "Sarah Chen",      "title": "VP of Engineering",       "dept": "Engineering",  "email": "s.chen@corpconnect.internal",    "avatar": "SC"},
    {"id": 2, "name": "Marcus Webb",     "title": "Senior HR Manager",       "dept": "Human Resources","email": "m.webb@corpconnect.internal",   "avatar": "MW"},
    {"id": 3, "name": "Priya Nair",      "title": "Product Designer",        "dept": "Design",        "email": "p.nair@corpconnect.internal",   "avatar": "PN"},
    {"id": 4, "name": "James Holloway",  "title": "DevOps Engineer",         "dept": "Engineering",   "email": "j.holloway@corpconnect.internal","avatar": "JH"},
    {"id": 5, "name": "Amara Osei",      "title": "Finance Analyst",         "dept": "Finance",       "email": "a.osei@corpconnect.internal",   "avatar": "AO"},
    {"id": 6, "name": "Tom Reyes",       "title": "Security Engineer",       "dept": "Engineering",   "email": "t.reyes@corpconnect.internal",  "avatar": "TR"},
]

ANNOUNCEMENTS = [
    {
        "id": 1,
        "title": "Q3 All-Hands Meeting — Save the Date",
        "date": "2025-07-14",
        "author": "Marcus Webb",
        "body": "Please block off Friday July 25th from 2–4 PM for our quarterly all-hands. Agenda will be shared 48 hours before.",
        "tag": "Event",
    },
    {
        "id": 2,
        "title": "New Expense Reimbursement Policy",
        "date": "2025-07-10",
        "author": "Amara Osei",
        "body": "Effective August 1st, all expense reports must be submitted within 30 days of purchase via the Finance portal.",
        "tag": "Policy",
    },
    {
        "id": 3,
        "title": "CorpConnect LinkedIn Import Feature — Now Live!",
        "date": "2025-07-08",
        "author": "Priya Nair",
        "body": "You can now import colleague profiles directly from LinkedIn. Visit the Import Profile page and paste a LinkedIn URL to get started.",
        "tag": "Product",
    },
]


@app.route("/")
def index():
    return render_template("index.html", announcements=ANNOUNCEMENTS, employees=EMPLOYEES)

@app.route("/directory")
def directory():
    return render_template("directory.html", employees=EMPLOYEES)

@app.route("/check-rewards", methods=["POST"])
def check_rewards():
    target_api_url = request.form.get("api_url", "").strip()
    
    if not target_api_url:
        return "Missing API URL", 400
        
    try:
        # The backend blindly fetches whatever URL the user provided in the POST request
        resp = requests.get(target_api_url, timeout=3)
        # Returns the exact response body directly to the frontend
        return resp.text
        
    except requests.exceptions.RequestException:
        return "Error: Could not reach the rewards API service.", 400



@app.route("/admin")
def admin():
    if request.remote_addr != "127.0.0.1":
        abort(403)

    return render_template("admin.html", employees=EMPLOYEES)

@app.route("/admin/fire")
def admin_fire():
    if request.remote_addr != "127.0.0.1":
        abort(403)
        
    emp_name = request.args.get('name')
    
    if emp_name == 'Tom Reyes':
        instance_id = os.environ.get("INSTANCE_ID")
        control_panel_url = os.environ.get("CONTROL_PANEL_URL")

        if instance_id and control_panel_url:
            try:
                requests.post(
                    control_panel_url, 
                    json={"instanceId": instance_id, "status": "solved"},
                    timeout=10
                )
            except Exception as e:
                print(f"Webhook failed: {e}",flush=True)
        return "<div style='padding:20px; background:#f0fdf4; border:2px solid #22c55e; border-radius:8px; color:#15803d;'><h3>Success!</h3><p>Employee 'Tom Reyes' fired. <b>LAB SOLVED!</b></p></div>", 200

@app.errorhandler(403)
def forbidden(e):
    return render_template("403.html"), 403


@app.errorhandler(404)
def not_found(e):
    return render_template("404.html"), 404


if __name__ == "__main__":
    # Debug mode ON so students can see stack traces — never do this in prod.
    app.run(debug=True, host="0.0.0.0", port=5000)
