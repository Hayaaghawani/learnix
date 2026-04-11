from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text('SELECT * FROM courses')).fetchall()
    print(f'Courses in DB: {len(result)}')
    for row in result:
        print(row)