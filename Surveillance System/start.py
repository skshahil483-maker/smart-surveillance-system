import os
import sys
import subprocess
import time
import signal

def start_services():
    print("=" * 70)
    print(" 🚀 SMART SURVEILLANCE SYSTEM - SYSTEM LAUNCHER")
    print("=" * 70)

    project_root = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(project_root, "backend")
    frontend_dir = os.path.join(project_root, "frontend")

    processes = []

    try:
        # 1. Start Python FastAPI Backend Server
        print(" [1/2] Starting Python FastAPI AI Backend (Port 8000)...")
        backend_cmd = [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"]
        p_backend = subprocess.Popen(backend_cmd, cwd=backend_dir)
        processes.append(p_backend)

        time.sleep(2)

        # 2. Start React Frontend Server
        print(" [2/2] Starting React Command Center Dashboard (Port 5173)...")
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        p_frontend = subprocess.Popen([npm_cmd, "run", "dev"], cwd=frontend_dir)
        processes.append(p_frontend)

        print("\n" + "=" * 70)
        print(" ✅ Smart Surveillance System Started Successfully!")
        print(" ➜ Dashboard UI:  http://localhost:5173")
        print(" ➜ REST API Docs: http://localhost:8000/docs")
        print("=" * 70)
        print("\nPress Ctrl+C to terminate all services...\n")

        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\nStopping services...")
        for p in processes:
            p.terminate()
        sys.exit(0)

if __name__ == "__main__":
    start_services()
