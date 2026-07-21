import sys, os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.window import launch_app

if __name__ == "__main__":
    launch_app()