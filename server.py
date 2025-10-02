from flask import Flask, request
import gzip, json

app = Flask(__name__)

@app.route("/test", methods=["POST"])
def receive():
    raw = request.data
    print("=== 요청 수신 ===")
    print("Raw size:", len(raw), "bytes")
    print("헤더:", dict(request.headers))

    try:
        # gzip 해제
        decompressed = gzip.decompress(raw)
        data = json.loads(decompressed.decode())
        print("JSON preview:", json.dumps(data, indent=2)[:500])
    except Exception as e:
        print("압축 해제/JSON 파싱 실패:", e)

    return {"status": "ok", "received": len(raw)}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
