import os
import uvicorn
# Override ENV for local run
os.environ["QDRANT_HOST"] = "localhost"
os.environ["REDIS_URL"] = "redis://:redis123@localhost:6379/0"
os.environ["ADMIN_SERVICE_INTERNAL_URL"] = "http://localhost:7038"

from main import app

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001, log_level="debug")
