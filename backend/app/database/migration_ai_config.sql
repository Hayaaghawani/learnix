-- Structured AI configuration (UUIDs align with existing courses / exercisestype / exercise / users).
-- Prefer running via app ensure_ai_configuration_schema on first API use, or apply manually.

CREATE TABLE IF NOT EXISTS concept (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS course_concept (
    course_id UUID NOT NULL REFERENCES courses(courseid) ON DELETE CASCADE,
    concept_id INTEGER NOT NULL REFERENCES concept(id) ON DELETE CASCADE,
    PRIMARY KEY (course_id, concept_id)
);

CREATE TABLE IF NOT EXISTS forbidden_topic (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS misconception (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS response_type (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS exercise_type_concept (
    exercise_type_id UUID NOT NULL REFERENCES exercisestype(typeid) ON DELETE CASCADE,
    concept_id INTEGER NOT NULL REFERENCES concept(id) ON DELETE CASCADE,
    PRIMARY KEY (exercise_type_id, concept_id)
);

CREATE TABLE IF NOT EXISTS exercise_type_forbidden (
    exercise_type_id UUID NOT NULL REFERENCES exercisestype(typeid) ON DELETE CASCADE,
    forbidden_topic_id INTEGER NOT NULL REFERENCES forbidden_topic(id) ON DELETE CASCADE,
    PRIMARY KEY (exercise_type_id, forbidden_topic_id)
);

CREATE TABLE IF NOT EXISTS exercise_type_misconception (
    exercise_type_id UUID NOT NULL REFERENCES exercisestype(typeid) ON DELETE CASCADE,
    misconception_id INTEGER NOT NULL REFERENCES misconception(id) ON DELETE CASCADE,
    PRIMARY KEY (exercise_type_id, misconception_id)
);

CREATE TABLE IF NOT EXISTS exercise_type_response (
    exercise_type_id UUID NOT NULL REFERENCES exercisestype(typeid) ON DELETE CASCADE,
    response_type_id INTEGER NOT NULL REFERENCES response_type(id) ON DELETE CASCADE,
    PRIMARY KEY (exercise_type_id, response_type_id)
);

CREATE TABLE IF NOT EXISTS student_exercise_ai_state (
    userid UUID NOT NULL REFERENCES users(userid) ON DELETE CASCADE,
    exerciseid UUID NOT NULL REFERENCES exercise(exerciseid) ON DELETE CASCADE,
    hints_used INTEGER NOT NULL DEFAULT 0,
    last_ai_response_at TIMESTAMPTZ,
    PRIMARY KEY (userid, exerciseid)
);

ALTER TABLE exercisestype ADD COLUMN IF NOT EXISTS enable_adaptive_hints BOOLEAN DEFAULT FALSE;
ALTER TABLE exercisestype ADD COLUMN IF NOT EXISTS hint_limit INTEGER;
ALTER TABLE exercisestype ADD COLUMN IF NOT EXISTS cooldown_seconds INTEGER DEFAULT 0;
ALTER TABLE exercisestype ADD COLUMN IF NOT EXISTS enable_error_explanation BOOLEAN DEFAULT TRUE;
ALTER TABLE exercisestype ADD COLUMN IF NOT EXISTS enable_rag BOOLEAN DEFAULT FALSE;
ALTER TABLE exercisestype ADD COLUMN IF NOT EXISTS show_solution_policy VARCHAR(30) DEFAULT 'after_submission';

ALTER TABLE exercise DROP COLUMN IF EXISTS keyconcept;
