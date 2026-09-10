import os

# Project configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Server Settings
PORT = 5000
HOST = '0.0.0.0'
DEBUG = True
SECRET_KEY = 'scholarship_k50_secret_key_fixed'

# Upload Settings
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}
MAX_CONTENT_LENGTH = 30 * 1024 * 1024  # 30 MB max upload size

# Database Settings
DATABASE_PATH = os.path.join(BASE_DIR, 'scholarship.db')

# Admin Settings
ADMIN_PASSWORD = '3287'
