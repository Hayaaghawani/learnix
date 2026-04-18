"""Idempotent AI configuration schema (lookup tables, junctions, exercisestype columns, seeds)."""

from sqlalchemy import text


def ensure_ai_configuration_schema(conn) -> None:
    conn.execute(
        text("""
        CREATE TABLE IF NOT EXISTS concept (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL
        )
        """)
    )
    conn.execute(
        text("""
        CREATE TABLE IF NOT EXISTS course_concept (
            course_id UUID NOT NULL REFERENCES courses(courseid) ON DELETE CASCADE,
            concept_id INTEGER NOT NULL REFERENCES concept(id) ON DELETE CASCADE,
            PRIMARY KEY (course_id, concept_id)
        )
        """)
    )
    conn.execute(
        text("""
        CREATE TABLE IF NOT EXISTS forbidden_topic (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL
        )
        """)
    )
    conn.execute(
        text("""
        CREATE TABLE IF NOT EXISTS misconception (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL
        )
        """)
    )
    conn.execute(
        text("""
        CREATE TABLE IF NOT EXISTS response_type (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) UNIQUE NOT NULL
        )
        """)
    )
    conn.execute(
        text("""
        CREATE TABLE IF NOT EXISTS exercise_type_concept (
            exercise_type_id UUID NOT NULL REFERENCES exercisestype(typeid) ON DELETE CASCADE,
            concept_id INTEGER NOT NULL REFERENCES concept(id) ON DELETE CASCADE,
            PRIMARY KEY (exercise_type_id, concept_id)
        )
        """)
    )
    conn.execute(
        text("""
        CREATE TABLE IF NOT EXISTS exercise_type_forbidden (
            exercise_type_id UUID NOT NULL REFERENCES exercisestype(typeid) ON DELETE CASCADE,
            forbidden_topic_id INTEGER NOT NULL REFERENCES forbidden_topic(id) ON DELETE CASCADE,
            PRIMARY KEY (exercise_type_id, forbidden_topic_id)
        )
        """)
    )
    conn.execute(
        text("""
        CREATE TABLE IF NOT EXISTS exercise_type_misconception (
            exercise_type_id UUID NOT NULL REFERENCES exercisestype(typeid) ON DELETE CASCADE,
            misconception_id INTEGER NOT NULL REFERENCES misconception(id) ON DELETE CASCADE,
            PRIMARY KEY (exercise_type_id, misconception_id)
        )
        """)
    )
    conn.execute(
        text("""
        CREATE TABLE IF NOT EXISTS exercise_type_response (
            exercise_type_id UUID NOT NULL REFERENCES exercisestype(typeid) ON DELETE CASCADE,
            response_type_id INTEGER NOT NULL REFERENCES response_type(id) ON DELETE CASCADE,
            PRIMARY KEY (exercise_type_id, response_type_id)
        )
        """)
    )
    conn.execute(
        text("""
        CREATE TABLE IF NOT EXISTS student_exercise_ai_state (
            userid UUID NOT NULL REFERENCES users(userid) ON DELETE CASCADE,
            exerciseid UUID NOT NULL REFERENCES exercise(exerciseid) ON DELETE CASCADE,
            hints_used INTEGER NOT NULL DEFAULT 0,
            last_ai_response_at TIMESTAMPTZ,
            PRIMARY KEY (userid, exerciseid)
        )
        """)
    )

    for stmt in (
        "ALTER TABLE exercisestype ADD COLUMN IF NOT EXISTS enable_adaptive_hints BOOLEAN DEFAULT FALSE",
        "ALTER TABLE exercisestype ADD COLUMN IF NOT EXISTS hint_limit INTEGER",
        "ALTER TABLE exercisestype ADD COLUMN IF NOT EXISTS cooldown_seconds INTEGER DEFAULT 0",
        "ALTER TABLE exercisestype ADD COLUMN IF NOT EXISTS enable_error_explanation BOOLEAN DEFAULT TRUE",
        "ALTER TABLE exercisestype ADD COLUMN IF NOT EXISTS enable_rag BOOLEAN DEFAULT FALSE",
        "ALTER TABLE exercisestype ADD COLUMN IF NOT EXISTS show_solution_policy VARCHAR(30) DEFAULT 'after_submission'",
    ):
        conn.execute(text(stmt))

    conn.execute(text("ALTER TABLE exercise DROP COLUMN IF EXISTS keyconcept"))

    _seed_lookups(conn)


def _seed_lookups(conn) -> None:
    concepts = (
        "variables",
        "data_types",
        "input_output",
        "conditions",
        "loops",
        "functions",
        "arrays_lists",
        "strings",
        "recursion",
        "basic_algorithms",
        "debugging_tracing",
    )
    for n in concepts:
        conn.execute(
            text("INSERT INTO concept (name) VALUES (:n) ON CONFLICT (name) DO NOTHING"),
            {"n": n},
        )

    forbidden = (
        "recursion",
        "built_in_sort",
        "advanced_libraries",
        "file_io",
        "global_variables",
        "pointers",
        "classes_oop",
        "list_comprehension",
        "lambda_functions",
    )
    for n in forbidden:
        conn.execute(
            text("INSERT INTO forbidden_topic (name) VALUES (:n) ON CONFLICT (name) DO NOTHING"),
            {"n": n},
        )

    misc = (
        "off_by_one_error",
        "infinite_loop",
        "wrong_loop_condition",
        "misunderstanding_assignment",
        "confusing_index_and_value",
        "incorrect_base_case",
        "modifying_loop_variable",
        "wrong_data_type_usage",
        "uninitialized_variable",
        "incorrect_function_return",
        "string_number_confusion",
        "array_out_of_bounds",
        "incorrect_comparison_operator",
        "missing_edge_cases",
    )
    for n in misc:
        conn.execute(
            text("INSERT INTO misconception (name) VALUES (:n) ON CONFLICT (name) DO NOTHING"),
            {"n": n},
        )

    responses = ("pseudocode", "partial_code", "test_case_hint", "trace_execution")
    for n in responses:
        conn.execute(
            text("INSERT INTO response_type (name) VALUES (:n) ON CONFLICT (name) DO NOTHING"),
            {"n": n},
        )
