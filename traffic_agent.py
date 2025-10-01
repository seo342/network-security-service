# traffic_agent.py (테스트용)
import time, json, gzip, psutil, requests
from datetime import datetime, timezone
import platform

API_KEY = "TEST_KEY"
REMOTE_URL = "https://network-security-service.vercel.app/api-management/traffic/"  # 로컬 Flask 서버로 보냄
INTERVAL = 5

def read_bytes():
    counters = psutil.net_io_counters()
    return {"rx_bytes": counters.bytes_recv, "tx_bytes": counters.bytes_sent}

def make_payload(delta_rx, delta_tx, total_rx, total_tx):
    obj = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "host": platform.node(),
        "delta_rx_bytes": delta_rx,
        "delta_tx_bytes": delta_tx,
        "total_rx_bytes": total_rx,
        "total_tx_bytes": total_tx,
    }
    return gzip.compress(json.dumps(obj).encode())

def main():
    prev = read_bytes()
    while True:
        time.sleep(INTERVAL)
        cur = read_bytes()
        delta_rx = cur["rx_bytes"] - prev["rx_bytes"]
        delta_tx = cur["tx_bytes"] - prev["tx_bytes"]
        prev = cur

        payload = make_payload(delta_rx, delta_tx, cur["rx_bytes"], cur["tx_bytes"])
        try:
            r = requests.post(
                REMOTE_URL,
                data=payload,
                headers={
                    "Authorization": f"Bearer {API_KEY}",
                    "Content-Type": "application/octet-stream",
                    "Content-Encoding": "gzip",
                },
                timeout=5,
            )
            print("Response:",r.status_code, r.text)
        except Exception as e:
            print("Failed:", e)

if __name__ == "__main__":
    main()
