# receiver.py
from flask import Flask, request, abort
import gzip, json

app = Flask(__name__)
API_KEY = "TEST_KEY"

@app.route("/api/traffic", methods=["POST"])
def traffic():
    if request.headers.get("Authorization") != f"Bearer {API_KEY}":
        abort(401, "Invalid API Key")

    try:
        data = gzip.decompress(request.get_data())
        obj = json.loads(data)
    except Exception as e:
        abort(400, f"Invalid payload: {e}")

    print("📦 Received:", obj)
    return "OK", 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
