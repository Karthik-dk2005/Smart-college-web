import sys
import os

# Add backend directory to sys.path so app modules and seed script are discovered
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(root_dir, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import sys
import os
import urllib.parse

# Add backend directory to sys.path so app modules and seed script are discovered
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(root_dir, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app as fastapi_app

async def app(scope, receive, send):
    if scope.get("type") == "http":
        headers = {k.decode("utf-8", "ignore").lower(): v.decode("utf-8", "ignore") for k, v in scope.get("headers", [])}
        query_bytes = scope.get("query_string", b"")
        query_str = query_bytes.decode("utf-8", "ignore")

        target_path = None
        if "__path=" in query_str:
            params = urllib.parse.parse_qs(query_str)
            if "__path" in params and params["__path"]:
                target_path = params["__path"][0]
                # Clean __path from query_string so route handler receives clean query params
                cleaned_params = {k: v for k, v in params.items() if k != "__path"}
                scope["query_string"] = urllib.parse.urlencode(cleaned_params, doseq=True).encode("utf-8")

        if not target_path:
            target_path = headers.get("x-forwarded-uri") or headers.get("x-matched-path")

        if target_path:
            if not target_path.startswith("/"):
                target_path = f"/{target_path}"
            scope["path"] = target_path
            print(f"[*] Routed request to: {scope['path']}")

    await fastapi_app(scope, receive, send)
