import os
from pydantic import BaseSettings

class Settings(BaseSettings):
    DB_URL: str = os.getenv("DB_URL", "mssql+pyodbc://@localhost\\SQLEXPRESS/DSSMate?driver=ODBC+Driver+17+for+SQL+Server&trusted_connection=yes")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecret")

settings = Settings()
