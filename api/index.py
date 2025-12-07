import os
import sys

# Add the parent directory to sys.path so we can import app.py
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app import app

# Vercel expects a variable named 'app' (or the WSGI application)
# We already imported it.
