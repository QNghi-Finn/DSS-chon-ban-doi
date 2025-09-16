from backend.app.db.sessin import get_conn
def db_conn():
    # dùng trong router (FastAPI Depends)
    return get_conn()
from backend.app.db.sessin import get_conn
def db_conn():
    # dùng trong router (FastAPI Depends)
    return get_conn()
