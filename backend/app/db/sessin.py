import pyodbc
from backend.app.Core.Config import settings

def _conn_str() -> str:
    if settings.sql_user and settings.sql_pass:
        return (
            f"Driver={{{settings.sql_driver}}};"
            f"Server={settings.sql_server};"
            f"Database={settings.sql_db};"
            f"UID={settings.sql_user};PWD={settings.sql_pass};"
            "TrustServerCertificate=yes;"
        )
    return (
        f"Driver={{{settings.sql_driver}}};"
        f"Server={settings.sql_server};"
        f"Database={settings.sql_db};"
        f"Trusted_Connection={settings.sql_trusted};"
        "TrustServerCertificate=yes;"
    )

def get_conn():
    # tạo kết nối mới mỗi request (pyodbc không share thread-safe)
    return pyodbc.connect(_conn_str())
