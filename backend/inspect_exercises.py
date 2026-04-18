import sys
sys.path.append('.')
from app.core.database import engine
from sqlalchemy import text

course_id = 'e5f122e7-089e-42f9-96cf-ff05833891fa'
with engine.connect() as conn:
    rows = conn.execute(text('SELECT exerciseid, title, difficultylevel, exercisetype, duedate FROM exercise WHERE courseid = :course_id'), {'course_id': course_id}).fetchall()
    for r in rows:
        print(tuple(r))
