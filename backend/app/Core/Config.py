from pydantic import BaseModel
from dotenv import load_dotenv
import os
load_dotenv()

class Settings(BaseModel):
    app_name: str = os.getenv("APP_NAME", "DSS Mate API")
    app_port: int = int(os.getenv("APP_PORT", "5000"))

    sql_driver: str = os.getenv("SQL_ODBC_DRIVER", "ODBC Driver 17 for SQL Server")
    sql_server: str = os.getenv("SQL_SERVER", r"localhost\SQLEXPRESS")
    sql_db: str = os.getenv("SQL_DATABASE", "DSS Mate")
    sql_trusted: str = os.getenv("SQL_TRUSTED_CONNECTION", "yes")

    sql_user: str | None = os.getenv("SQL_USERNAME")
    sql_pass: str | None = os.getenv("SQL_PASSWORD")

settings = Settings()
