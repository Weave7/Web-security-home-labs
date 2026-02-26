from flask import Flask

app = Flask(__name__)

@app.route("/api/internal/rewards")
def internal_rewards_api():
    return '{"employee_tier": "Gold", "kudos_points": 1250, "next_reward": "Amazon $50 Gift Card"}'

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5001)