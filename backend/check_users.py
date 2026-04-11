from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text('SELECT userid, email, role FROM users')).fetchall()
    print(f'Users in DB: {len(result)}')
    for row in result:
        print(row)