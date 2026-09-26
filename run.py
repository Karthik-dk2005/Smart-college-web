"""
Smart Department - Single Unified Full-Stack Launcher
Starts the combined FastAPI backend that directly serves the React SPA frontend on port 8000.
"""
import os
import sys
import subprocess

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")
    dist_dir = os.path.join(frontend_dir, "dist")

    print("=" * 60)
    print("SMART DEPARTMENT: UNIFIED FULL-STACK APPLICATION")
    print("=" * 60)

    # 1. Build frontend if dist doesn't exist
    if not os.path.exists(dist_dir) or not os.path.exists(os.path.join(dist_dir, "index.html")):
        print("[*] Building React frontend production bundle...")
        subprocess.run(["npm", "run", "build"], cwd=frontend_dir, shell=True, check=True)
        print("[+] Frontend bundle compiled successfully!")
    else:
        print("[*] Found compiled frontend bundle in frontend/dist.")

    # 2. Launch FastAPI with uvicorn
    print("\n>>> Starting unified server on http://localhost:8000 ...")
    print("   - Web Application : http://localhost:8000")
    print("   - Swagger API Docs: http://localhost:8000/docs")
    print("   - Health Check    : http://localhost:8000/health")
    print("=" * 60)

    venv_python = os.path.join(backend_dir, ".venv", "Scripts", "python.exe")
    if os.path.exists(venv_python):
        cmd = [venv_python, "-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]
    else:
        os.environ["PATH"] = f"C:\\Users\\User\\.local\\bin;{os.environ.get('PATH', '')}"
        cmd = ["uv", "run", "python", "-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]

    subprocess.run(cmd, cwd=backend_dir)

if __name__ == "__main__":
    main()
