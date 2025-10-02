# traffic_agent.py
"""
traffic_agent.py
- scapy로 패킷 캡처 (src/dst IP, timestamp, protocol, tcp flags, seq, payload, packet size)
- psutil로 인터벌별 rx/tx 바이트 계산 -> bytes/sec (전송 속도)
- 일정 주기(INTERVAL)마다 수집된 패킷 리스트 + 속도정보를 gzip(JSON)으로 전송
- 요구 필드: 출발지, 도착지 ip주소, 타임스탬프, TCP 플래그, 시퀀스 번호, 페이로드(일부), 패킷 크기, 전송 속도, 프로토콜
"""

import gzip
import json
import time
import platform
import requests
from datetime import datetime, timezone
from threading import Thread, Lock
import psutil

# scapy import (설치 필요: pip install scapy)
from scapy.all import sniff, IP, TCP, UDP, Raw

API_KEY = "TEST_KEY"
# 반드시 스킴 포함 (http:// 또는 https://)
REMOTE_URL = "http://localhost:3000/dashboard/traffic"
 # 예: FastAPI 수신 엔드포인트
INTERVAL = 5  # 전송 주기 (초)
MAX_PAYLOAD_BYTES = 100  # 페이로드는 최대 N바이트만 hex로 전송

# 공유 버퍼 및 락
packet_buffer = []
buffer_lock = Lock()

def packet_handler(pkt):
    """scapy sniff 콜백: 패킷에서 필요한 정보를 추출하여 전역 버퍼에 append"""
    try:
        if IP not in pkt:
            return

        ts = datetime.now(timezone.utc).isoformat()
        src_ip = pkt[IP].src
        dst_ip = pkt[IP].dst
        proto_num = pkt[IP].proto
        packet_size = len(pkt)

        protocol = None
        tcp_flags = None
        tcp_seq = None
        payload_hex = None

        if TCP in pkt:
            protocol = "TCP"
            tcp_flags = str(pkt[TCP].flags)
            tcp_seq = int(pkt[TCP].seq)
        elif UDP in pkt:
            protocol = "UDP"
        else:
            protocol = str(proto_num)

        if Raw in pkt:
            # raw payload을 일부만 hex로 전송 (binary 안전)
            raw_bytes = bytes(pkt[Raw].load)[:MAX_PAYLOAD_BYTES]
            try:
                payload_hex = raw_bytes.hex()
            except Exception:
                # fallback: base64 if hex fails (rare)
                import base64
                payload_hex = base64.b64encode(raw_bytes).decode()

        rec = {
            "timestamp": ts,
            "host": platform.node(),
            "src_ip": src_ip,
            "dst_ip": dst_ip,
            "protocol": protocol,
            "tcp_flags": tcp_flags,
            "tcp_seq": tcp_seq,
            "payload": payload_hex,
            "packet_size": packet_size,
        }

        # thread-safe append
        with buffer_lock:
            packet_buffer.append(rec)

    except Exception as e:
        # 캡처 루프에서 예외가 전체를 멈추지 않도록 보호
        print("packet_handler error:", e)

def send_payload(payload_obj):
    """gzip 압축 후 POST 전송"""
    payload_bytes = gzip.compress(json.dumps(payload_obj).encode())
    try:
        r = requests.post(
            REMOTE_URL,
            data=payload_bytes,
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/octet-stream",
                "Content-Encoding": "gzip",
            },
            timeout=10,
        )
        print(f"[{datetime.now().isoformat()}] Sent {len(payload_obj.get('packets', []))} packets; "
              f"status={r.status_code} text_preview={r.text[:200]}")
    except Exception as e:
        print("Failed to send payload:", e)

def reporter_loop():
    """
    INTERVAL마다 packet_buffer를 가져와서 psutil로 인터벌 rx/tx를 계산하고
    JSON에 포함시켜 전송. 전송 후 해당 버퍼는 비웁니다.
    """
    prev_counters = psutil.net_io_counters()
    while True:
        time.sleep(INTERVAL)
        cur_counters = psutil.net_io_counters()

        delta_rx = cur_counters.bytes_recv - prev_counters.bytes_recv
        delta_tx = cur_counters.bytes_sent - prev_counters.bytes_sent
        prev_counters = cur_counters

        # bytes/sec 계산 (인터벌동안의 평균)
        rx_bps = delta_rx / INTERVAL
        tx_bps = delta_tx / INTERVAL

        # 안전하게 버퍼 스냅샷을 가져온 뒤 원본 비움
        with buffer_lock:
            packets_snapshot = packet_buffer.copy()
            packet_buffer.clear()

        payload_obj = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "host": platform.node(),
            "interval_seconds": INTERVAL,
            "interval_rx_bytes": int(delta_rx),
            "interval_tx_bytes": int(delta_tx),
            "interval_rx_bytes_per_sec": rx_bps,
            "interval_tx_bytes_per_sec": tx_bps,
            "packets": packets_snapshot,  # 각 패킷에 대한 상세 레코드
        }

        # 전송 (비동기 전송이 필요하면 Thread로 보낼 수도 있음)
        send_payload(payload_obj)

def start_sniffer():
    """scapy sniff 시작 (blocking => 별도 스레드로 실행)"""
    # 필터는 필요시 변경 가능 (예: "ip and (tcp or udp)")
    sniff(
        prn=packet_handler,
        store=False,
        filter="ip",
        count=0,
        iface=None,  # 특정 iface를 원하면 이름으로 지정하세요
        promisc=True,
    )

def main():
    # 스니퍼를 데몬 스레드로 띄우기
    t_sniff = Thread(target=start_sniffer, daemon=True)
    t_sniff.start()

    # 리포터 루프(메인 스레드 또는 별도 스레드)
    try:
        reporter_loop()
    except KeyboardInterrupt:
        print("Stopping agent...")

if __name__ == "__main__":
    print("Starting traffic agent. Note: root/admin required for packet capture (scapy).")
    print(f"Sending to: {REMOTE_URL} every {INTERVAL}s")
    main()
