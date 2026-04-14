--
-- PostgreSQL database dump
--

\restrict eU2n4upj07uKhopzba5UovjQtaK4lCbNq9jiLQ3cZGhXSwvQ7yRiVOaTY5bBKL5

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-04-14 23:06:09

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 16389)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5335 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 242 (class 1259 OID 41240)
-- Name: attemptidentifyweakness; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attemptidentifyweakness (
    attemptid uuid NOT NULL,
    userid uuid NOT NULL,
    reportid uuid NOT NULL
);


ALTER TABLE public.attemptidentifyweakness OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 41375)
-- Name: concept; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.concept (
    id integer NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.concept OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 41374)
-- Name: concept_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.concept_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.concept_id_seq OWNER TO postgres;

--
-- TOC entry 5336 (class 0 OID 0)
-- Dependencies: 243
-- Name: concept_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.concept_id_seq OWNED BY public.concept.id;


--
-- TOC entry 235 (class 1259 OID 41092)
-- Name: controls; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.controls (
    userid uuid NOT NULL,
    settid uuid NOT NULL
);


ALTER TABLE public.controls OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 41385)
-- Name: course_concept; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_concept (
    course_id uuid NOT NULL,
    concept_id integer NOT NULL
);


ALTER TABLE public.course_concept OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 24733)
-- Name: courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.courses (
    courseid uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    coursename character varying(50) NOT NULL,
    description character varying(500),
    languageused character varying(50) NOT NULL,
    startdate date NOT NULL,
    enddate date NOT NULL,
    instructorid uuid NOT NULL,
    CONSTRAINT check_dates CHECK ((enddate >= startdate))
);


ALTER TABLE public.courses OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 24753)
-- Name: enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enrollments (
    student_id uuid NOT NULL,
    course_id uuid NOT NULL
);


ALTER TABLE public.enrollments OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 41144)
-- Name: executionsummary; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.executionsummary (
    summaryid uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    attemptid uuid NOT NULL,
    runtimems integer NOT NULL,
    memorykb integer NOT NULL,
    stdout character varying(100),
    stderr character varying(100),
    passedcount integer NOT NULL,
    failedcount integer NOT NULL,
    CONSTRAINT executionsummary_failedcount_check CHECK ((failedcount >= 0)),
    CONSTRAINT executionsummary_memorykb_check CHECK ((memorykb >= 0)),
    CONSTRAINT executionsummary_passedcount_check CHECK ((passedcount >= 0)),
    CONSTRAINT executionsummary_runtimems_check CHECK ((runtimems >= 0))
);


ALTER TABLE public.executionsummary OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 33167)
-- Name: exercise; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exercise (
    exerciseid uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    courseid uuid NOT NULL,
    userid uuid NOT NULL,
    typeid uuid NOT NULL,
    title character varying(100) NOT NULL,
    difficultylevel character varying(20) NOT NULL,
    exercisetype character varying(20) NOT NULL,
    prerequisites character varying(100),
    problem character varying(500) NOT NULL,
    referencesolution character varying(500),
    isactive boolean DEFAULT true NOT NULL,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    duedate date NOT NULL,
    updatedat timestamp without time zone,
    CONSTRAINT exercise_check CHECK ((duedate >= CURRENT_DATE))
);


ALTER TABLE public.exercise OWNER TO postgres;

--
-- TOC entry 252 (class 1259 OID 41435)
-- Name: exercise_type_concept; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exercise_type_concept (
    exercise_type_id uuid NOT NULL,
    concept_id integer NOT NULL
);


ALTER TABLE public.exercise_type_concept OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 41452)
-- Name: exercise_type_forbidden; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exercise_type_forbidden (
    exercise_type_id uuid NOT NULL,
    forbidden_topic_id integer NOT NULL
);


ALTER TABLE public.exercise_type_forbidden OWNER TO postgres;

--
-- TOC entry 254 (class 1259 OID 41469)
-- Name: exercise_type_misconception; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exercise_type_misconception (
    exercise_type_id uuid NOT NULL,
    misconception_id integer NOT NULL
);


ALTER TABLE public.exercise_type_misconception OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 41486)
-- Name: exercise_type_response; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exercise_type_response (
    exercise_type_id uuid NOT NULL,
    response_type_id integer NOT NULL
);


ALTER TABLE public.exercise_type_response OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 41109)
-- Name: exerciseattempt; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exerciseattempt (
    attemptid uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    userid uuid NOT NULL,
    exerciseid uuid NOT NULL,
    reportid uuid NOT NULL,
    attemptnumber integer NOT NULL,
    status character varying(20) NOT NULL,
    score double precision NOT NULL,
    hintcount integer DEFAULT 0 NOT NULL,
    submittedcode character varying(300),
    passedtestcases integer DEFAULT 0 NOT NULL,
    CONSTRAINT exerciseattempt_attemptnumber_check CHECK ((attemptnumber > 0)),
    CONSTRAINT exerciseattempt_score_check CHECK (((score >= (0)::double precision) AND (score <= (100)::double precision))),
    CONSTRAINT exerciseattempt_status_check CHECK (((status)::text = ANY ((ARRAY['Passed'::character varying, 'Failed'::character varying, 'InProgress'::character varying])::text[])))
);


ALTER TABLE public.exerciseattempt OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 33095)
-- Name: exercisestype; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exercisestype (
    typeid uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL,
    issystempresent boolean DEFAULT true NOT NULL,
    defaulthintlimit integer NOT NULL,
    description text NOT NULL,
    defaultcooldownstrategy integer,
    strictlevel integer,
    category text NOT NULL,
    guidancestyle text,
    anticipatedmisconceptions text,
    createdby uuid,
    courseid uuid,
    enable_adaptive_hints boolean DEFAULT false,
    hint_limit integer,
    cooldown_seconds integer DEFAULT 0,
    enable_error_explanation boolean DEFAULT true,
    enable_rag boolean DEFAULT false,
    show_solution_policy character varying(30) DEFAULT 'after_submission'::character varying,
    CONSTRAINT exercisestype_defaultcooldownstrategy_check CHECK (((defaultcooldownstrategy >= 0) AND (defaultcooldownstrategy <= 50))),
    CONSTRAINT exercisestype_defaulthintlimit_check CHECK ((defaulthintlimit >= 0)),
    CONSTRAINT exercisestype_strictlevel_check CHECK ((strictlevel = ANY (ARRAY[0, 1, 2]))),
    CONSTRAINT exercisestype_strictlevel_not_null CHECK (((strictlevel >= 0) AND (strictlevel <= 50)))
);


ALTER TABLE public.exercisestype OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 33234)
-- Name: exercisetypeconfig; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exercisetypeconfig (
    typeid uuid NOT NULL,
    isenabled boolean DEFAULT true NOT NULL,
    isgraded boolean NOT NULL
);


ALTER TABLE public.exercisetypeconfig OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 41403)
-- Name: forbidden_topic; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.forbidden_topic (
    id integer NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.forbidden_topic OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 41402)
-- Name: forbidden_topic_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.forbidden_topic_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.forbidden_topic_id_seq OWNER TO postgres;

--
-- TOC entry 5337 (class 0 OID 0)
-- Dependencies: 246
-- Name: forbidden_topic_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.forbidden_topic_id_seq OWNED BY public.forbidden_topic.id;


--
-- TOC entry 223 (class 1259 OID 24684)
-- Name: instructor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.instructor (
    userid uuid NOT NULL,
    title character varying(20),
    coursecount integer DEFAULT 0,
    CONSTRAINT instructor_coursecount_check CHECK ((coursecount >= 0))
);


ALTER TABLE public.instructor OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 41060)
-- Name: instructorviewedreport; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.instructorviewedreport (
    reportid uuid NOT NULL,
    userid uuid NOT NULL
);


ALTER TABLE public.instructorviewedreport OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16459)
-- Name: login_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.login_logs (
    logid uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    userid uuid,
    emailused character varying(50),
    success boolean NOT NULL,
    ipaddress character varying(45),
    attemptedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.login_logs OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 41208)
-- Name: material; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.material (
    materialid uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    content text NOT NULL,
    courseid uuid,
    title character varying(100),
    filetype character varying(20),
    filename character varying(200),
    uploadedby uuid,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.material OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 41218)
-- Name: materialchunk; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.materialchunk (
    chunkid uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    materialid uuid NOT NULL,
    courseid uuid NOT NULL,
    embeddingvector character varying(100) NOT NULL,
    pagenumber integer NOT NULL,
    content character varying(100) NOT NULL
);


ALTER TABLE public.materialchunk OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 41414)
-- Name: misconception; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.misconception (
    id integer NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.misconception OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 41413)
-- Name: misconception_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.misconception_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.misconception_id_seq OWNER TO postgres;

--
-- TOC entry 5338 (class 0 OID 0)
-- Dependencies: 248
-- Name: misconception_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.misconception_id_seq OWNED BY public.misconception.id;


--
-- TOC entry 222 (class 1259 OID 16473)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    notificationid uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    userid uuid NOT NULL,
    title character varying(100) NOT NULL,
    message text NOT NULL,
    isread boolean DEFAULT false,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    senderid uuid
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 41191)
-- Name: readby; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.readby (
    userid uuid NOT NULL,
    attemptid uuid NOT NULL
);


ALTER TABLE public.readby OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 41425)
-- Name: response_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.response_type (
    id integer NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE public.response_type OWNER TO postgres;

--
-- TOC entry 250 (class 1259 OID 41424)
-- Name: response_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.response_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.response_type_id_seq OWNER TO postgres;

--
-- TOC entry 5339 (class 0 OID 0)
-- Dependencies: 250
-- Name: response_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.response_type_id_seq OWNED BY public.response_type.id;


--
-- TOC entry 227 (class 1259 OID 32838)
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    sessionid uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    userid uuid NOT NULL,
    token text NOT NULL,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expiresat timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 24720)
-- Name: student; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student (
    userid uuid NOT NULL,
    enrolledcoursecount integer DEFAULT 0,
    CONSTRAINT student_enrolledcoursecount_check CHECK ((enrolledcoursecount >= 0))
);


ALTER TABLE public.student OWNER TO postgres;

--
-- TOC entry 256 (class 1259 OID 41503)
-- Name: student_exercise_ai_state; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_exercise_ai_state (
    userid uuid NOT NULL,
    exerciseid uuid NOT NULL,
    hints_used integer DEFAULT 0 NOT NULL,
    last_ai_response_at timestamp with time zone
);


ALTER TABLE public.student_exercise_ai_state OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 41035)
-- Name: studentreport; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.studentreport (
    reportid uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    courseid uuid NOT NULL,
    userid uuid NOT NULL,
    completionrate double precision DEFAULT 0 NOT NULL,
    weaknesssummary character varying(100),
    performancesummary character varying(100) NOT NULL,
    recommendations character varying(100),
    createdat date NOT NULL,
    lastupdated date NOT NULL,
    CONSTRAINT studentreport_completionrate_check CHECK (((completionrate >= (0)::double precision) AND (completionrate <= (100)::double precision)))
);


ALTER TABLE public.studentreport OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 41165)
-- Name: studentweakness; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.studentweakness (
    userid uuid NOT NULL,
    reportid uuid NOT NULL,
    occurrencecount integer NOT NULL,
    lastupdated date NOT NULL,
    lastdetectedat date NOT NULL,
    typeid uuid NOT NULL
);


ALTER TABLE public.studentweakness OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 41077)
-- Name: systemsettings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.systemsettings (
    settid uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    updatedby uuid NOT NULL,
    aimodel character varying(50) DEFAULT 'ChatGPT'::character varying NOT NULL
);


ALTER TABLE public.systemsettings OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 33216)
-- Name: testcases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.testcases (
    testcaseid uuid NOT NULL,
    exerciseid uuid NOT NULL,
    input text NOT NULL,
    expectedoutput character varying(100) NOT NULL,
    weight double precision NOT NULL,
    isvisible boolean DEFAULT true NOT NULL,
    CONSTRAINT testcases_weight_check CHECK ((weight > (0)::double precision))
);


ALTER TABLE public.testcases OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16400)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    userid uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    firstname character varying(20) NOT NULL,
    lastname character varying(20) NOT NULL,
    email character varying(50) NOT NULL,
    password text NOT NULL,
    role character varying(20) NOT NULL,
    isactive boolean DEFAULT true,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_format_check CHECK (((email)::text ~~ '%@%'::text)),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['student'::character varying, 'instructor'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 4987 (class 2604 OID 41378)
-- Name: concept id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.concept ALTER COLUMN id SET DEFAULT nextval('public.concept_id_seq'::regclass);


--
-- TOC entry 4988 (class 2604 OID 41406)
-- Name: forbidden_topic id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forbidden_topic ALTER COLUMN id SET DEFAULT nextval('public.forbidden_topic_id_seq'::regclass);


--
-- TOC entry 4989 (class 2604 OID 41417)
-- Name: misconception id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.misconception ALTER COLUMN id SET DEFAULT nextval('public.misconception_id_seq'::regclass);


--
-- TOC entry 4990 (class 2604 OID 41428)
-- Name: response_type id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.response_type ALTER COLUMN id SET DEFAULT nextval('public.response_type_id_seq'::regclass);


--
-- TOC entry 5315 (class 0 OID 41240)
-- Dependencies: 242
-- Data for Name: attemptidentifyweakness; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attemptidentifyweakness (attemptid, userid, reportid) FROM stdin;
\.


--
-- TOC entry 5317 (class 0 OID 41375)
-- Dependencies: 244
-- Data for Name: concept; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.concept (id, name) FROM stdin;
1	variables
2	data_types
3	input_output
4	conditions
5	loops
6	functions
7	arrays_lists
8	strings
9	recursion
10	basic_algorithms
11	debugging_tracing
\.


--
-- TOC entry 5308 (class 0 OID 41092)
-- Dependencies: 235
-- Data for Name: controls; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.controls (userid, settid) FROM stdin;
\.


--
-- TOC entry 5318 (class 0 OID 41385)
-- Dependencies: 245
-- Data for Name: course_concept; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_concept (course_id, concept_id) FROM stdin;
413d40ec-5673-48c5-ae9b-de973890f377	1
413d40ec-5673-48c5-ae9b-de973890f377	2
413d40ec-5673-48c5-ae9b-de973890f377	3
413d40ec-5673-48c5-ae9b-de973890f377	4
413d40ec-5673-48c5-ae9b-de973890f377	5
413d40ec-5673-48c5-ae9b-de973890f377	6
413d40ec-5673-48c5-ae9b-de973890f377	7
413d40ec-5673-48c5-ae9b-de973890f377	8
413d40ec-5673-48c5-ae9b-de973890f377	11
14e844a5-5d59-4fb9-be80-68ca2e1d6f0a	1
14e844a5-5d59-4fb9-be80-68ca2e1d6f0a	2
14e844a5-5d59-4fb9-be80-68ca2e1d6f0a	3
14e844a5-5d59-4fb9-be80-68ca2e1d6f0a	4
14e844a5-5d59-4fb9-be80-68ca2e1d6f0a	5
14e844a5-5d59-4fb9-be80-68ca2e1d6f0a	6
14e844a5-5d59-4fb9-be80-68ca2e1d6f0a	7
14e844a5-5d59-4fb9-be80-68ca2e1d6f0a	8
14e844a5-5d59-4fb9-be80-68ca2e1d6f0a	11
0d55c3e1-3b4f-4ea6-a445-ef941d292cfe	1
0d55c3e1-3b4f-4ea6-a445-ef941d292cfe	2
0d55c3e1-3b4f-4ea6-a445-ef941d292cfe	3
0d55c3e1-3b4f-4ea6-a445-ef941d292cfe	4
0d55c3e1-3b4f-4ea6-a445-ef941d292cfe	5
0d55c3e1-3b4f-4ea6-a445-ef941d292cfe	8
0d55c3e1-3b4f-4ea6-a445-ef941d292cfe	11
b3f44986-5f5b-4489-86cd-57883ea990e1	1
b3f44986-5f5b-4489-86cd-57883ea990e1	2
b3f44986-5f5b-4489-86cd-57883ea990e1	3
b3f44986-5f5b-4489-86cd-57883ea990e1	4
b3f44986-5f5b-4489-86cd-57883ea990e1	5
b3f44986-5f5b-4489-86cd-57883ea990e1	6
b3f44986-5f5b-4489-86cd-57883ea990e1	7
b3f44986-5f5b-4489-86cd-57883ea990e1	8
b3f44986-5f5b-4489-86cd-57883ea990e1	9
b3f44986-5f5b-4489-86cd-57883ea990e1	11
78f4a62a-b133-40b1-9241-2c4ac7c97889	1
78f4a62a-b133-40b1-9241-2c4ac7c97889	2
78f4a62a-b133-40b1-9241-2c4ac7c97889	3
78f4a62a-b133-40b1-9241-2c4ac7c97889	4
78f4a62a-b133-40b1-9241-2c4ac7c97889	5
78f4a62a-b133-40b1-9241-2c4ac7c97889	6
78f4a62a-b133-40b1-9241-2c4ac7c97889	7
78f4a62a-b133-40b1-9241-2c4ac7c97889	8
78f4a62a-b133-40b1-9241-2c4ac7c97889	11
\.


--
-- TOC entry 5298 (class 0 OID 24733)
-- Dependencies: 225
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.courses (courseid, coursename, description, languageused, startdate, enddate, instructorid) FROM stdin;
413d40ec-5673-48c5-ae9b-de973890f377	Python Basics 	This course introduces learners to the fundamentals of programming using Python, one of the most popular and beginner-friendly languages. Students will learn core concepts such as variables, data types, operators, loops, and functions.	Python 	2026-04-14	2026-07-01	d0f41223-7984-4629-a5a0-bde1b809fc01
14e844a5-5d59-4fb9-be80-68ca2e1d6f0a	Intro to CS	This course introduces learners to the fundamentals of programming using C++. Students will learn core concepts such as variables, data types, operators, conditional statements, loops, and functions.	c++	2026-04-14	2026-07-16	d0f41223-7984-4629-a5a0-bde1b809fc01
0d55c3e1-3b4f-4ea6-a445-ef941d292cfe	Structured Programming 	This course introduces the principles of structured programming, a fundamental approach to writing clear, efficient, and maintainable code. Students will learn how to design programs using well-defined control structures such as sequence, selection (if/else), and iteration (loops).	c++	2026-04-14	2026-07-15	d0f41223-7984-4629-a5a0-bde1b809fc01
b3f44986-5f5b-4489-86cd-57883ea990e1	OOP Basics 	This course introduces the core concepts of Object-Oriented Programming (OOP), a programming paradigm widely used in modern software development. Students will learn how to design and build programs using objects and classes.	c++	2026-04-14	2026-08-26	38168ca7-b905-4093-8d13-c4991454b35e
78f4a62a-b133-40b1-9241-2c4ac7c97889	Python Basics 2 	his course introduces learners to the fundamentals of programming using Python, one of the most popular and beginner-friendly languages. Students will learn core concepts such as variables, data types, operators, conditional statements, loops, and functions.	Python 	2026-04-14	2026-07-17	38168ca7-b905-4093-8d13-c4991454b35e
\.


--
-- TOC entry 5299 (class 0 OID 24753)
-- Dependencies: 226
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enrollments (student_id, course_id) FROM stdin;
326bb069-1a37-48fb-b236-2d54f9c0523a	b3f44986-5f5b-4489-86cd-57883ea990e1
326bb069-1a37-48fb-b236-2d54f9c0523a	14e844a5-5d59-4fb9-be80-68ca2e1d6f0a
326bb069-1a37-48fb-b236-2d54f9c0523a	413d40ec-5673-48c5-ae9b-de973890f377
cfccef0a-d58d-47e4-b919-360f46ce6c76	0d55c3e1-3b4f-4ea6-a445-ef941d292cfe
cfccef0a-d58d-47e4-b919-360f46ce6c76	413d40ec-5673-48c5-ae9b-de973890f377
4037103c-c26f-4a27-99b5-1fb37d44334a	b3f44986-5f5b-4489-86cd-57883ea990e1
4037103c-c26f-4a27-99b5-1fb37d44334a	413d40ec-5673-48c5-ae9b-de973890f377
4f2ac042-014c-4bcb-892d-d6a1f26a3ee7	78f4a62a-b133-40b1-9241-2c4ac7c97889
4f2ac042-014c-4bcb-892d-d6a1f26a3ee7	14e844a5-5d59-4fb9-be80-68ca2e1d6f0a
129fc635-f056-4d10-ac8e-fb2de0bbcca7	0d55c3e1-3b4f-4ea6-a445-ef941d292cfe
129fc635-f056-4d10-ac8e-fb2de0bbcca7	413d40ec-5673-48c5-ae9b-de973890f377
3c78b71b-94bd-4ba7-9d72-ed1f5cd4d5d3	78f4a62a-b133-40b1-9241-2c4ac7c97889
3c78b71b-94bd-4ba7-9d72-ed1f5cd4d5d3	0d55c3e1-3b4f-4ea6-a445-ef941d292cfe
\.


--
-- TOC entry 5310 (class 0 OID 41144)
-- Dependencies: 237
-- Data for Name: executionsummary; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.executionsummary (summaryid, attemptid, runtimems, memorykb, stdout, stderr, passedcount, failedcount) FROM stdin;
ded36c60-4e98-43d1-96b2-5ac1ebf22615	1e04aa98-8993-4f03-89e0-7b5da5717b9b	11	3264		  File "script.py", line 2\n    using namespace std;\n          ^\nSyntaxError: invalid syntax\n	0	2
90aff342-e425-40ea-956b-63b141f32c4e	38396513-94f2-414f-bae4-2c5488b22daf	11	3216		  File "script.py", line 2\n    using namespace std;\n          ^\nSyntaxError: invalid syntax\n	0	2
b6dd3bae-e4ac-4f73-985e-57d148c82121	1fe15714-6867-475e-bb5b-44b0be75d54b	11	3264		  File "script.py", line 2\n    using namespace std;\n          ^\nSyntaxError: invalid syntax\n	0	2
\.


--
-- TOC entry 5302 (class 0 OID 33167)
-- Dependencies: 229
-- Data for Name: exercise; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exercise (exerciseid, courseid, userid, typeid, title, difficultylevel, exercisetype, prerequisites, problem, referencesolution, isactive, createdat, duedate, updatedat) FROM stdin;
1dfe790d-c02d-4d00-9199-e7ad30e302d7	0d55c3e1-3b4f-4ea6-a445-ef941d292cfe	d0f41223-7984-4629-a5a0-bde1b809fc01	7f39d2ca-4339-4e43-9cf1-f91f7df65bfe	Sum of numbers 1 to 10	Easy	coding	\N	Write a program that calculates the sum of all integers starting from 1 up to 10. The program should iterate through the numbers in this range and compute their total.\n\nThe final output should display the result of the summation.	#include <iostream>\nusing namespace std;\n\nint main() {\n    int total = 0;\n\n    for (int i = 1; i <= 10; i++) {\n        total += i;\n    }\n\n    cout << total << endl;\n\n    return 0;\n}	t	2026-04-14 19:24:51.108254	2026-06-09	\N
9207dca0-d2e1-4438-9763-5fdb97f2fdcb	0d55c3e1-3b4f-4ea6-a445-ef941d292cfe	d0f41223-7984-4629-a5a0-bde1b809fc01	c6d48e21-034d-4bfb-89bb-5384db77f596	Sum of even numbers only	Easy	coding	\N	Find the sum of all even numbers from 1 to N.	#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n\n    int sum = 0;\n\n    for (int i = 1; i <= n; i++) {\n        if (i % 2 == 0) {\n            sum += i;\n        }\n    }\n\n    cout << sum << endl;\n    return 0;\n}	t	2026-04-14 19:30:51.832097	2026-06-03	\N
4ccc4773-d497-4cf6-8cca-8831752dc0be	0d55c3e1-3b4f-4ea6-a445-ef941d292cfe	d0f41223-7984-4629-a5a0-bde1b809fc01	05e54e91-3ddf-4547-96c2-225fecb7f227	Count Digits	Easy	coding	\N	Write a program that takes a non-negative integer as input and calculates the number of digits in that number.\n\nThe program should repeatedly process the number (e.g., by dividing it by 10) until no digits remain and then output the total count of digits.	#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n\n    int count = 0;\n\n    // Special case for 0\n    if (n == 0) {\n        count = 1;\n    } else {\n        while (n != 0) {\n            n /= 10;   // remove last digit\n            count++;\n        }\n    }\n\n    cout << count << endl;\n    return 0;\n}	t	2026-04-14 19:37:51.355626	2026-06-02	\N
\.


--
-- TOC entry 5325 (class 0 OID 41435)
-- Dependencies: 252
-- Data for Name: exercise_type_concept; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exercise_type_concept (exercise_type_id, concept_id) FROM stdin;
e22fa32b-62ca-4bab-9c25-9ebbfc34a05e	11
e22fa32b-62ca-4bab-9c25-9ebbfc34a05e	4
e22fa32b-62ca-4bab-9c25-9ebbfc34a05e	7
c6d48e21-034d-4bfb-89bb-5384db77f596	2
c6d48e21-034d-4bfb-89bb-5384db77f596	4
c6d48e21-034d-4bfb-89bb-5384db77f596	5
\.


--
-- TOC entry 5326 (class 0 OID 41452)
-- Dependencies: 253
-- Data for Name: exercise_type_forbidden; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exercise_type_forbidden (exercise_type_id, forbidden_topic_id) FROM stdin;
e22fa32b-62ca-4bab-9c25-9ebbfc34a05e	5
e22fa32b-62ca-4bab-9c25-9ebbfc34a05e	7
c6d48e21-034d-4bfb-89bb-5384db77f596	1
c6d48e21-034d-4bfb-89bb-5384db77f596	3
\.


--
-- TOC entry 5327 (class 0 OID 41469)
-- Dependencies: 254
-- Data for Name: exercise_type_misconception; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exercise_type_misconception (exercise_type_id, misconception_id) FROM stdin;
e22fa32b-62ca-4bab-9c25-9ebbfc34a05e	12
e22fa32b-62ca-4bab-9c25-9ebbfc34a05e	14
c6d48e21-034d-4bfb-89bb-5384db77f596	8
c6d48e21-034d-4bfb-89bb-5384db77f596	3
c6d48e21-034d-4bfb-89bb-5384db77f596	10
c6d48e21-034d-4bfb-89bb-5384db77f596	2
\.


--
-- TOC entry 5328 (class 0 OID 41486)
-- Dependencies: 255
-- Data for Name: exercise_type_response; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exercise_type_response (exercise_type_id, response_type_id) FROM stdin;
e22fa32b-62ca-4bab-9c25-9ebbfc34a05e	2
\.


--
-- TOC entry 5309 (class 0 OID 41109)
-- Dependencies: 236
-- Data for Name: exerciseattempt; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exerciseattempt (attemptid, userid, exerciseid, reportid, attemptnumber, status, score, hintcount, submittedcode, passedtestcases) FROM stdin;
1e04aa98-8993-4f03-89e0-7b5da5717b9b	cfccef0a-d58d-47e4-b919-360f46ce6c76	1dfe790d-c02d-4d00-9199-e7ad30e302d7	945e78d6-042c-4236-b6bc-d976c967ebc4	1	Failed	0	0	#include <iostream>\nusing namespace std;\n\nint main() {\n    int total = 0;\n\n    for (int i = 1; i <= 10; i++) {\n        total += i;\n    }\n\n    cout << total << endl;\n\n    return 0;\n}	0
38396513-94f2-414f-bae4-2c5488b22daf	cfccef0a-d58d-47e4-b919-360f46ce6c76	1dfe790d-c02d-4d00-9199-e7ad30e302d7	945e78d6-042c-4236-b6bc-d976c967ebc4	2	Failed	0	0	#include <iostream>\nusing namespace std;\n\nint main() {\n    int total = 0;\n\n    for (int i = 1; i <= 10; i++) {\n        total += i;\n    }\n\n    cout << total << endl;\n\n    return 0;\n}	0
1fe15714-6867-475e-bb5b-44b0be75d54b	cfccef0a-d58d-47e4-b919-360f46ce6c76	1dfe790d-c02d-4d00-9199-e7ad30e302d7	945e78d6-042c-4236-b6bc-d976c967ebc4	3	Failed	0	0	#include <iostream>\nusing namespace std;\n\nint main() {\n    int total = 0;\n\n    for (int i = 1; i <= 10; i++) {\n        total += i;\n    }\n\n    cout << total << endl;\n\n    return 0;\n}	0
\.


--
-- TOC entry 5301 (class 0 OID 33095)
-- Dependencies: 228
-- Data for Name: exercisestype; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exercisestype (typeid, name, issystempresent, defaulthintlimit, description, defaultcooldownstrategy, strictlevel, category, guidancestyle, anticipatedmisconceptions, createdby, courseid, enable_adaptive_hints, hint_limit, cooldown_seconds, enable_error_explanation, enable_rag, show_solution_policy) FROM stdin;
7f39d2ca-4339-4e43-9cf1-f91f7df65bfe	Beginner	t	10	This type is used for Beginners to help in learning and gaining knowledge by asking the chatbot.	0	0	Beginner	Step-by-step guidance	Using the wrong data types for the variables. 	\N	\N	f	\N	0	t	f	after_submission
05e54e91-3ddf-4547-96c2-225fecb7f227	Intermediate	t	8	This type is used for Intermediate after improving and solving the Beginner questions.	1	1	Intermediate	Giving Hints	Incorrect loop conditions leading to infinite loops.	\N	\N	f	\N	0	t	f	after_submission
b90a5a95-ff5e-4704-a361-bebed0853afe	Senior	t	6	This type is used for Senior after improving and solving the Intermediate questions.	1	1	Senior	Giving Hints	Wrong use of data structures (e.g., using a list instead of a hash map	\N	\N	f	\N	0	t	f	after_submission
0e876aca-6ab8-4ed2-b499-5e0ddf6f6570	Professional	t	4	This type is used for Professional after improving and solving the Senior questions.	2	2	Professional	No Hints	Memory leaks or improper resource management	\N	\N	f	\N	0	t	f	after_submission
defa33d2-b479-4c1b-b667-1127f5f5e9a6	testing gggg	f	999		0	1	e5f122e7-089e-42f9-96cf-ff05833891fa	adaptive,disclosure:partial	\N	\N	\N	f	\N	0	t	f	after_submission
e22fa32b-62ca-4bab-9c25-9ebbfc34a05e	TEST	f	999	DS	1	1	a4df200e-9e26-442e-a890-713731a7b0e7	structured	\N	\N	\N	f	\N	30	t	f	after_submission
c6d48e21-034d-4bfb-89bb-5384db77f596	Looping and conditions	f	999		1	1	0d55c3e1-3b4f-4ea6-a445-ef941d292cfe	structured	\N	\N	\N	f	\N	30	t	f	after_submission
\.


--
-- TOC entry 5304 (class 0 OID 33234)
-- Dependencies: 231
-- Data for Name: exercisetypeconfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exercisetypeconfig (typeid, isenabled, isgraded) FROM stdin;
\.


--
-- TOC entry 5320 (class 0 OID 41403)
-- Dependencies: 247
-- Data for Name: forbidden_topic; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.forbidden_topic (id, name) FROM stdin;
1	recursion
2	built_in_sort
3	advanced_libraries
4	file_io
5	global_variables
6	pointers
7	classes_oop
8	list_comprehension
9	lambda_functions
\.


--
-- TOC entry 5296 (class 0 OID 24684)
-- Dependencies: 223
-- Data for Name: instructor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.instructor (userid, title, coursecount) FROM stdin;
d0f41223-7984-4629-a5a0-bde1b809fc01	Coding Professor	3
38168ca7-b905-4093-8d13-c4991454b35e	Professor	2
\.


--
-- TOC entry 5306 (class 0 OID 41060)
-- Dependencies: 233
-- Data for Name: instructorviewedreport; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.instructorviewedreport (reportid, userid) FROM stdin;
\.


--
-- TOC entry 5294 (class 0 OID 16459)
-- Dependencies: 221
-- Data for Name: login_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.login_logs (logid, userid, emailused, success, ipaddress, attemptedat) FROM stdin;
f6edaed9-35e7-41fc-bd4a-8eeea4582fe7	d0f41223-7984-4629-a5a0-bde1b809fc01	anas.abu@example.com	t	\N	2026-04-14 15:38:23.945668
fb8bb6bf-a03b-423f-88b7-b0a880e5cecf	d0f41223-7984-4629-a5a0-bde1b809fc01	anas.abu@example.com	t	\N	2026-04-14 15:58:52.379304
2ac774c8-aac0-4543-bc79-8db03aeb7dc7	d0f41223-7984-4629-a5a0-bde1b809fc01	anas.abu@example.com	t	\N	2026-04-14 15:59:23.080966
b1501f31-4839-42ea-a18e-445a04d40609	d0f41223-7984-4629-a5a0-bde1b809fc01	anas.abu@example.com	t	\N	2026-04-14 16:01:46.944864
fdeca0f6-0b1e-455a-9406-23cbfbe5b6ca	38168ca7-b905-4093-8d13-c4991454b35e	ibr.ham@example.com	t	\N	2026-04-14 16:03:21.212387
4a13fcd7-aaed-4b00-a28f-73ac6f12e454	326bb069-1a37-48fb-b236-2d54f9c0523a	tala.doe@email.com	t	\N	2026-04-14 16:09:09.831564
51cc5be6-21d1-4726-9ede-580b5c354836	cfccef0a-d58d-47e4-b919-360f46ce6c76	Omar.osa@email.com	t	\N	2026-04-14 16:09:53.956266
ffa03748-8918-4ddb-88da-8c10f06023ec	4037103c-c26f-4a27-99b5-1fb37d44334a	sal.iss@example.com	t	\N	2026-04-14 16:10:28.063773
d7279b14-c2d6-4fc6-90e8-f22c31c4323a	4f2ac042-014c-4bcb-892d-d6a1f26a3ee7	jac.iss@example.com	t	\N	2026-04-14 16:11:13.646827
b1e8056d-f76c-413b-b2d3-02314d20a100	129fc635-f056-4d10-ac8e-fb2de0bbcca7	nan.iss@example.com	t	\N	2026-04-14 16:11:40.105714
6ef154a2-b535-479c-a952-fb76d3962ae2	3c78b71b-94bd-4ba7-9d72-ed1f5cd4d5d3	hala.ess@example.com	t	\N	2026-04-14 16:12:28.694285
c38ef234-4bbb-443e-943c-6489fdfd872e	9848392a-27fd-4c5a-aaf5-1e0c3ffea782	haya.ala@example.com	t	\N	2026-04-14 16:19:46.688575
14e83efc-dabf-401e-9aeb-713d33aa6527	9848392a-27fd-4c5a-aaf5-1e0c3ffea782	haya.ala@example.com	t	\N	2026-04-14 16:20:04.355227
3992a1ee-6068-4401-8031-022e5eccdfd0	d0f41223-7984-4629-a5a0-bde1b809fc01	anas.abu@example.com	t	\N	2026-04-14 16:21:32.903489
44398390-5ad6-46d1-8057-04319e81af6e	cfccef0a-d58d-47e4-b919-360f46ce6c76	Omar.osa@email.com	t	\N	2026-04-14 16:38:56.278631
deaa2240-1a6b-4c7e-9e68-80f60ef2d313	cfccef0a-d58d-47e4-b919-360f46ce6c76	Omar.osa@email.com	t	\N	2026-04-14 18:33:16.557411
6282b6a8-6153-465c-86fe-922f52af141b	d0f41223-7984-4629-a5a0-bde1b809fc01	anas.abu@example.com	t	\N	2026-04-14 18:33:37.624114
3565e5ac-4736-4f55-ba72-14f729dd6565	cfccef0a-d58d-47e4-b919-360f46ce6c76	Omar.osa@email.com	t	\N	2026-04-14 18:33:50.195263
66cb97ca-27af-441e-b8d0-168b6ad4b0f0	cfccef0a-d58d-47e4-b919-360f46ce6c76	Omar.osa@email.com	t	\N	2026-04-14 18:35:56.642491
\.


--
-- TOC entry 5313 (class 0 OID 41208)
-- Dependencies: 240
-- Data for Name: material; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.material (materialid, content, courseid, title, filetype, filename, uploadedby, createdat) FROM stdin;
\.


--
-- TOC entry 5314 (class 0 OID 41218)
-- Dependencies: 241
-- Data for Name: materialchunk; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.materialchunk (chunkid, materialid, courseid, embeddingvector, pagenumber, content) FROM stdin;
\.


--
-- TOC entry 5322 (class 0 OID 41414)
-- Dependencies: 249
-- Data for Name: misconception; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.misconception (id, name) FROM stdin;
1	off_by_one_error
2	infinite_loop
3	wrong_loop_condition
4	misunderstanding_assignment
5	confusing_index_and_value
6	incorrect_base_case
7	modifying_loop_variable
8	wrong_data_type_usage
9	uninitialized_variable
10	incorrect_function_return
11	string_number_confusion
12	array_out_of_bounds
13	incorrect_comparison_operator
14	missing_edge_cases
\.


--
-- TOC entry 5295 (class 0 OID 16473)
-- Dependencies: 222
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (notificationid, userid, title, message, isread, createdat, senderid) FROM stdin;
b82a5ad9-b2f5-46b8-ae6f-8ddef4c174fa	3c78b71b-94bd-4ba7-9d72-ed1f5cd4d5d3	Python Basics 2 	http://localhost:5173/join-course/ibr.ham78f4a62a-b133-40b1-9241-2c4ac7c97889	f	2026-04-14 19:07:57.030484	38168ca7-b905-4093-8d13-c4991454b35e
6b3b3fb4-f95e-4ca3-895f-f17c6bff744c	4f2ac042-014c-4bcb-892d-d6a1f26a3ee7	Python Basics 2	http://localhost:5173/join-course/ibr.ham78f4a62a-b133-40b1-9241-2c4ac7c97889	f	2026-04-14 19:08:28.090334	38168ca7-b905-4093-8d13-c4991454b35e
694fbfdd-dc29-41be-a83a-5f7a705ea67b	326bb069-1a37-48fb-b236-2d54f9c0523a	OOP	http://localhost:5173/join-course/ibr.hamb3f44986-5f5b-4489-86cd-57883ea990e1	t	2026-04-14 19:07:01.991642	38168ca7-b905-4093-8d13-c4991454b35e
7820ca0d-4dec-4a14-9c5f-6eb671046b21	326bb069-1a37-48fb-b236-2d54f9c0523a	Python Basics 	http://localhost:5173/join-course/anas.abu413d40ec-5673-48c5-ae9b-de973890f377	f	2026-04-14 18:54:29.356903	d0f41223-7984-4629-a5a0-bde1b809fc01
44a8d546-cc1b-4e79-9f0a-967ca37ef750	cfccef0a-d58d-47e4-b919-360f46ce6c76	Python Basics 	http://localhost:5173/join-course/anas.abu413d40ec-5673-48c5-ae9b-de973890f377	f	2026-04-14 18:55:04.394476	d0f41223-7984-4629-a5a0-bde1b809fc01
e52c6297-9a1e-4894-813e-b6956559010f	4037103c-c26f-4a27-99b5-1fb37d44334a	Python Basics 	http://localhost:5173/join-course/anas.abu413d40ec-5673-48c5-ae9b-de973890f377	f	2026-04-14 18:55:41.326578	d0f41223-7984-4629-a5a0-bde1b809fc01
9e8a79eb-c301-4c92-a9f1-3488c88575d0	129fc635-f056-4d10-ac8e-fb2de0bbcca7	Python Basics 	http://localhost:5173/join-course/anas.abu413d40ec-5673-48c5-ae9b-de973890f377	f	2026-04-14 18:56:01.765688	d0f41223-7984-4629-a5a0-bde1b809fc01
ddfb6952-b953-445b-b852-4c06352f5f46	326bb069-1a37-48fb-b236-2d54f9c0523a	Intro to CS 	http://localhost:5173/join-course/anas.abu14e844a5-5d59-4fb9-be80-68ca2e1d6f0a	f	2026-04-14 18:56:44.341135	d0f41223-7984-4629-a5a0-bde1b809fc01
e7e0251f-a019-440e-a721-2ae63f6d1120	4f2ac042-014c-4bcb-892d-d6a1f26a3ee7	Intro to CS 	http://localhost:5173/join-course/anas.abu14e844a5-5d59-4fb9-be80-68ca2e1d6f0a	f	2026-04-14 18:57:20.847496	d0f41223-7984-4629-a5a0-bde1b809fc01
1c801bed-aa02-4314-891a-f8b0a7dfed2c	3c78b71b-94bd-4ba7-9d72-ed1f5cd4d5d3	Structured Programming 	http://localhost:5173/join-course/anas.abu0d55c3e1-3b4f-4ea6-a445-ef941d292cfe	f	2026-04-14 18:59:34.336787	d0f41223-7984-4629-a5a0-bde1b809fc01
85f4bb87-cd09-4ed7-ad9b-1d2bae161809	cfccef0a-d58d-47e4-b919-360f46ce6c76	Structured Programming	http://localhost:5173/join-course/anas.abu0d55c3e1-3b4f-4ea6-a445-ef941d292cfe	f	2026-04-14 19:02:31.867911	d0f41223-7984-4629-a5a0-bde1b809fc01
ad6a990e-d18f-4072-8c59-08ba148cddc7	129fc635-f056-4d10-ac8e-fb2de0bbcca7	Structured 	http://localhost:5173/join-course/anas.abu0d55c3e1-3b4f-4ea6-a445-ef941d292cfe	f	2026-04-14 19:03:03.149722	d0f41223-7984-4629-a5a0-bde1b809fc01
dad72371-5d54-4e91-a1a7-e52c685d9553	4037103c-c26f-4a27-99b5-1fb37d44334a	OOP	http://localhost:5173/join-course/ibr.hamb3f44986-5f5b-4489-86cd-57883ea990e1	f	2026-04-14 19:07:22.465788	38168ca7-b905-4093-8d13-c4991454b35e
\.


--
-- TOC entry 5312 (class 0 OID 41191)
-- Dependencies: 239
-- Data for Name: readby; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.readby (userid, attemptid) FROM stdin;
\.


--
-- TOC entry 5324 (class 0 OID 41425)
-- Dependencies: 251
-- Data for Name: response_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.response_type (id, name) FROM stdin;
1	pseudocode
2	partial_code
3	test_case_hint
4	trace_execution
\.


--
-- TOC entry 5300 (class 0 OID 32838)
-- Dependencies: 227
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (sessionid, userid, token, createdat, expiresat) FROM stdin;
36060c7d-c1f6-4f37-99bd-f83987acbc79	3c78b71b-94bd-4ba7-9d72-ed1f5cd4d5d3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyaWQiOiIzYzc4YjcxYi05NGJkLTRiYTctOWQ3Mi1lZDFmNWNkNGQ1ZDMiLCJleHAiOjE3NzYxOTc1NDh9.oE5Ro4LFfUPaxDwIvh9KtsLBSQM6rj0x_R_vvOyiHe8	2026-04-14 19:12:28.498202	2026-04-14 20:12:28.692461
76112f0b-19c1-465d-b18e-020f3431f968	9848392a-27fd-4c5a-aaf5-1e0c3ffea782	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyaWQiOiI5ODQ4MzkyYS0yN2ZkLTRjNWEtYWFmNS0xZTBjM2ZmZWE3ODIiLCJleHAiOjE3NzYxOTc5ODZ9.Jn7mqWdopxfnlR7FfX_q9DmoiqDg_usbL-CkUsbv2y0	2026-04-14 19:19:46.482251	2026-04-14 20:19:46.686709
f14ce09b-86fc-4997-a3d0-8bb911ffe62d	cfccef0a-d58d-47e4-b919-360f46ce6c76	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyaWQiOiJjZmNjZWYwYS1kNThkLTQ3ZTQtYjkxOS0zNjBmNDZjZTZjNzYiLCJleHAiOjE3NzYyMDYwMzB9.Q4jJOYHKaSWxd-2vXAupAZjBGdkleYcNTOzRt-tiZBg	2026-04-14 21:33:49.990973	2026-04-14 22:33:50.191769
0b4a8a00-e386-4976-adee-59389ce7d993	326bb069-1a37-48fb-b236-2d54f9c0523a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyaWQiOiIzMjZiYjA2OS0xYTM3LTQ4ZmItYjIzNi0yZDU0ZjljMDUyM2EiLCJleHAiOjE3NzYxOTczNDl9.PIFpl4GDVoMu7Csq4pyXYXrln5SuYppRngckyWmsCd0	2026-04-14 19:09:09.614661	2026-04-14 20:09:09.829845
4e72f933-9b41-40dd-bae4-96a61473f855	cfccef0a-d58d-47e4-b919-360f46ce6c76	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyaWQiOiJjZmNjZWYwYS1kNThkLTQ3ZTQtYjkxOS0zNjBmNDZjZTZjNzYiLCJleHAiOjE3NzYxOTkxMzZ9.Mv7QHZ1rTzS_D5QR3auZps8Dg6vSubbQ61OfGUiF-1c	2026-04-14 19:38:56.079317	2026-04-14 20:38:56.275813
ed93743d-2567-4e1b-9873-294d9327f235	d0f41223-7984-4629-a5a0-bde1b809fc01	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyaWQiOiJkMGY0MTIyMy03OTg0LTQ2MjktYTVhMC1iZGUxYjgwOWZjMDEiLCJleHAiOjE3NzYxOTY3MzJ9.tvdFHkunbDzvbYpPgiDBbNNzDN0mF45RDLqiVE5Bx98	2026-04-14 18:58:52.174605	2026-04-14 19:58:52.377278
\.


--
-- TOC entry 5297 (class 0 OID 24720)
-- Dependencies: 224
-- Data for Name: student; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student (userid, enrolledcoursecount) FROM stdin;
3c78b71b-94bd-4ba7-9d72-ed1f5cd4d5d3	2
4f2ac042-014c-4bcb-892d-d6a1f26a3ee7	2
4037103c-c26f-4a27-99b5-1fb37d44334a	2
129fc635-f056-4d10-ac8e-fb2de0bbcca7	2
326bb069-1a37-48fb-b236-2d54f9c0523a	3
cfccef0a-d58d-47e4-b919-360f46ce6c76	2
\.


--
-- TOC entry 5329 (class 0 OID 41503)
-- Dependencies: 256
-- Data for Name: student_exercise_ai_state; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_exercise_ai_state (userid, exerciseid, hints_used, last_ai_response_at) FROM stdin;
cfccef0a-d58d-47e4-b919-360f46ce6c76	1dfe790d-c02d-4d00-9199-e7ad30e302d7	0	2026-04-14 22:07:48.288439+03
\.


--
-- TOC entry 5305 (class 0 OID 41035)
-- Dependencies: 232
-- Data for Name: studentreport; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.studentreport (reportid, courseid, userid, completionrate, weaknesssummary, performancesummary, recommendations, createdat, lastupdated) FROM stdin;
945e78d6-042c-4236-b6bc-d976c967ebc4	0d55c3e1-3b4f-4ea6-a445-ef941d292cfe	cfccef0a-d58d-47e4-b919-360f46ce6c76	0				2026-04-14	2026-04-14
\.


--
-- TOC entry 5311 (class 0 OID 41165)
-- Dependencies: 238
-- Data for Name: studentweakness; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.studentweakness (userid, reportid, occurrencecount, lastupdated, lastdetectedat, typeid) FROM stdin;
\.


--
-- TOC entry 5307 (class 0 OID 41077)
-- Dependencies: 234
-- Data for Name: systemsettings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.systemsettings (settid, updatedby, aimodel) FROM stdin;
\.


--
-- TOC entry 5303 (class 0 OID 33216)
-- Dependencies: 230
-- Data for Name: testcases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.testcases (testcaseid, exerciseid, input, expectedoutput, weight, isvisible) FROM stdin;
d50ddc66-f4d4-43e2-a889-c84cae80642e	1dfe790d-c02d-4d00-9199-e7ad30e302d7	1	1	1	t
11f8f738-4105-44cc-9b8b-14079e0dde2a	1dfe790d-c02d-4d00-9199-e7ad30e302d7	5	15	1	t
f4153d44-e68d-44e6-83ff-8936d3a85bb8	9207dca0-d2e1-4438-9763-5fdb97f2fdcb	2	2	1	t
c20633f6-8107-4e5c-a518-da30d78939a6	9207dca0-d2e1-4438-9763-5fdb97f2fdcb	10	30	1	t
9a29cb08-2281-4ecc-af24-a40d83d3c7a8	9207dca0-d2e1-4438-9763-5fdb97f2fdcb	1	0	1	t
55618fcc-0724-46a6-b4fd-ae1094af9962	4ccc4773-d497-4cf6-8cca-8831752dc0be	0	1	1	t
b96f1910-7105-4b34-b79a-df72fd53beef	4ccc4773-d497-4cf6-8cca-8831752dc0be	71	2	1	t
87c43ae8-fe35-413c-9744-045c591480ef	4ccc4773-d497-4cf6-8cca-8831752dc0be	200	3	1	t
\.


--
-- TOC entry 5293 (class 0 OID 16400)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (userid, firstname, lastname, email, password, role, isactive, createdat) FROM stdin;
d0f41223-7984-4629-a5a0-bde1b809fc01	Anas	Abu Taleb	anas.abu@example.com	$2b$12$AjMrJ99Qw30lAZNSK1uG/ubsxrZmPoQRDEzfA9pQRCcVBri1I5eB2	instructor	t	2026-03-02 22:01:14.571465
326bb069-1a37-48fb-b236-2d54f9c0523a	Tala	Doe	tala.doe@email.com	$2b$12$kd9H4DuWouAnylcgEkAGZOUNI4odX0IFqyca.vfPpIi3r3CzWQA1e	student	t	2026-03-10 23:36:48.370856
cfccef0a-d58d-47e4-b919-360f46ce6c76	Omar	Osama	Omar.osa@email.com	$2b$12$OsfOAI7vFQWHQXYRdgotoOHPyh4OEW9QxKiz.bmI5d3CjAQ53jrZq	student	t	2026-03-16 21:46:18.373197
3c78b71b-94bd-4ba7-9d72-ed1f5cd4d5d3	Hala	Essa	hala.ess@example.com	$2b$12$D4Q0zrzIQ2g4vv.hDfUmGuhsg7nR5fQ3m3zqVsueOM.2KQUDIFcla	student	t	2026-04-04 20:14:25.645107
9848392a-27fd-4c5a-aaf5-1e0c3ffea782	haya	Alaghawani	haya.ala@example.com	$2b$12$57F45oby8lP.tbpK2zxe8.PUakAIZpYqWM5n4m789Ygk0YN4tlFt.	admin	t	2026-04-04 20:15:19.515268
38168ca7-b905-4093-8d13-c4991454b35e	Ibrahim	Hamdan	ibr.ham@example.com	$2b$12$Y4UHqhJ2j9ReZy20DCwB/OKh.cNGLFgymv7cTXjup/t13zt.6r5m6	instructor	t	2026-04-10 23:03:00.46872
4f2ac042-014c-4bcb-892d-d6a1f26a3ee7	Jacoub	Issa	jac.iss@example.com	$2b$12$OQqAr3oOcuQzMpGWda3T2.eq1bINuhDUM0IjcTkFRUNXMxVZAMJ/2	student	t	2026-04-10 23:06:48.717176
4037103c-c26f-4a27-99b5-1fb37d44334a	Saleh	Issa	sal.iss@example.com	$2b$12$PnOypu3tUyTa1tEVAfYMiug18o3BUCH1/2sJYexzEQimH/mu8Y.LO	student	t	2026-04-10 23:08:49.856175
129fc635-f056-4d10-ac8e-fb2de0bbcca7	Nancy	Issa	nan.iss@example.com	$2b$12$fLIsUek81NWxO4b3SstwOOYuH8dGCBe.bpCqGh2qCqAOcs5D1pLJW	student	t	2026-04-10 23:10:52.799797
\.


--
-- TOC entry 5340 (class 0 OID 0)
-- Dependencies: 243
-- Name: concept_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.concept_id_seq', 1969, true);


--
-- TOC entry 5341 (class 0 OID 0)
-- Dependencies: 246
-- Name: forbidden_topic_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.forbidden_topic_id_seq', 1611, true);


--
-- TOC entry 5342 (class 0 OID 0)
-- Dependencies: 248
-- Name: misconception_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.misconception_id_seq', 2506, true);


--
-- TOC entry 5343 (class 0 OID 0)
-- Dependencies: 250
-- Name: response_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.response_type_id_seq', 716, true);


--
-- TOC entry 5067 (class 2606 OID 41247)
-- Name: attemptidentifyweakness attemptidentifyweakness_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attemptidentifyweakness
    ADD CONSTRAINT attemptidentifyweakness_pkey PRIMARY KEY (attemptid, userid, reportid);


--
-- TOC entry 5069 (class 2606 OID 41384)
-- Name: concept concept_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.concept
    ADD CONSTRAINT concept_name_key UNIQUE (name);


--
-- TOC entry 5071 (class 2606 OID 41382)
-- Name: concept concept_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.concept
    ADD CONSTRAINT concept_pkey PRIMARY KEY (id);


--
-- TOC entry 5053 (class 2606 OID 41098)
-- Name: controls controls_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.controls
    ADD CONSTRAINT controls_pkey PRIMARY KEY (userid, settid);


--
-- TOC entry 5073 (class 2606 OID 41391)
-- Name: course_concept course_concept_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_concept
    ADD CONSTRAINT course_concept_pkey PRIMARY KEY (course_id, concept_id);


--
-- TOC entry 5024 (class 2606 OID 24747)
-- Name: courses courses_coursename_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_coursename_key UNIQUE (coursename);


--
-- TOC entry 5026 (class 2606 OID 24745)
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (courseid);


--
-- TOC entry 5057 (class 2606 OID 41159)
-- Name: executionsummary executionsummary_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.executionsummary
    ADD CONSTRAINT executionsummary_pkey PRIMARY KEY (summaryid);


--
-- TOC entry 5039 (class 2606 OID 33186)
-- Name: exercise exercise_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise
    ADD CONSTRAINT exercise_pkey PRIMARY KEY (exerciseid);


--
-- TOC entry 5041 (class 2606 OID 41340)
-- Name: exercise exercise_title_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise
    ADD CONSTRAINT exercise_title_key UNIQUE (title);


--
-- TOC entry 5087 (class 2606 OID 41441)
-- Name: exercise_type_concept exercise_type_concept_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise_type_concept
    ADD CONSTRAINT exercise_type_concept_pkey PRIMARY KEY (exercise_type_id, concept_id);


--
-- TOC entry 5089 (class 2606 OID 41458)
-- Name: exercise_type_forbidden exercise_type_forbidden_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise_type_forbidden
    ADD CONSTRAINT exercise_type_forbidden_pkey PRIMARY KEY (exercise_type_id, forbidden_topic_id);


--
-- TOC entry 5091 (class 2606 OID 41475)
-- Name: exercise_type_misconception exercise_type_misconception_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise_type_misconception
    ADD CONSTRAINT exercise_type_misconception_pkey PRIMARY KEY (exercise_type_id, misconception_id);


--
-- TOC entry 5093 (class 2606 OID 41492)
-- Name: exercise_type_response exercise_type_response_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise_type_response
    ADD CONSTRAINT exercise_type_response_pkey PRIMARY KEY (exercise_type_id, response_type_id);


--
-- TOC entry 5055 (class 2606 OID 41128)
-- Name: exerciseattempt exerciseattempt_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exerciseattempt
    ADD CONSTRAINT exerciseattempt_pkey PRIMARY KEY (attemptid);


--
-- TOC entry 5034 (class 2606 OID 33116)
-- Name: exercisestype exercisestype_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercisestype
    ADD CONSTRAINT exercisestype_name_key UNIQUE (name);


--
-- TOC entry 5036 (class 2606 OID 33114)
-- Name: exercisestype exercisestype_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercisestype
    ADD CONSTRAINT exercisestype_pkey PRIMARY KEY (typeid);


--
-- TOC entry 5045 (class 2606 OID 33242)
-- Name: exercisetypeconfig exercisetypeconfig_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercisetypeconfig
    ADD CONSTRAINT exercisetypeconfig_pkey PRIMARY KEY (typeid);


--
-- TOC entry 5075 (class 2606 OID 41412)
-- Name: forbidden_topic forbidden_topic_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forbidden_topic
    ADD CONSTRAINT forbidden_topic_name_key UNIQUE (name);


--
-- TOC entry 5077 (class 2606 OID 41410)
-- Name: forbidden_topic forbidden_topic_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forbidden_topic
    ADD CONSTRAINT forbidden_topic_pkey PRIMARY KEY (id);


--
-- TOC entry 5020 (class 2606 OID 24691)
-- Name: instructor instructor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instructor
    ADD CONSTRAINT instructor_pkey PRIMARY KEY (userid);


--
-- TOC entry 5049 (class 2606 OID 41066)
-- Name: instructorviewedreport instructorviewedreport_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instructorviewedreport
    ADD CONSTRAINT instructorviewedreport_pkey PRIMARY KEY (reportid, userid);


--
-- TOC entry 5016 (class 2606 OID 16467)
-- Name: login_logs login_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_logs
    ADD CONSTRAINT login_logs_pkey PRIMARY KEY (logid);


--
-- TOC entry 5063 (class 2606 OID 41217)
-- Name: material material_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material
    ADD CONSTRAINT material_pkey PRIMARY KEY (materialid);


--
-- TOC entry 5065 (class 2606 OID 41229)
-- Name: materialchunk materialchunk_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materialchunk
    ADD CONSTRAINT materialchunk_pkey PRIMARY KEY (chunkid);


--
-- TOC entry 5079 (class 2606 OID 41423)
-- Name: misconception misconception_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.misconception
    ADD CONSTRAINT misconception_name_key UNIQUE (name);


--
-- TOC entry 5081 (class 2606 OID 41421)
-- Name: misconception misconception_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.misconception
    ADD CONSTRAINT misconception_pkey PRIMARY KEY (id);


--
-- TOC entry 5018 (class 2606 OID 16486)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notificationid);


--
-- TOC entry 5061 (class 2606 OID 41197)
-- Name: readby readby_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.readby
    ADD CONSTRAINT readby_pkey PRIMARY KEY (userid, attemptid);


--
-- TOC entry 5083 (class 2606 OID 41434)
-- Name: response_type response_type_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.response_type
    ADD CONSTRAINT response_type_name_key UNIQUE (name);


--
-- TOC entry 5085 (class 2606 OID 41432)
-- Name: response_type response_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.response_type
    ADD CONSTRAINT response_type_pkey PRIMARY KEY (id);


--
-- TOC entry 5030 (class 2606 OID 32850)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sessionid);


--
-- TOC entry 5032 (class 2606 OID 32852)
-- Name: sessions sessions_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key UNIQUE (token);


--
-- TOC entry 5095 (class 2606 OID 41511)
-- Name: student_exercise_ai_state student_exercise_ai_state_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_exercise_ai_state
    ADD CONSTRAINT student_exercise_ai_state_pkey PRIMARY KEY (userid, exerciseid);


--
-- TOC entry 5022 (class 2606 OID 24727)
-- Name: student student_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student
    ADD CONSTRAINT student_pkey PRIMARY KEY (userid);


--
-- TOC entry 5047 (class 2606 OID 41049)
-- Name: studentreport studentreport_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.studentreport
    ADD CONSTRAINT studentreport_pkey PRIMARY KEY (reportid);


--
-- TOC entry 5059 (class 2606 OID 41175)
-- Name: studentweakness studentweakness_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.studentweakness
    ADD CONSTRAINT studentweakness_pkey PRIMARY KEY (userid, reportid);


--
-- TOC entry 5051 (class 2606 OID 41086)
-- Name: systemsettings systemsettings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.systemsettings
    ADD CONSTRAINT systemsettings_pkey PRIMARY KEY (settid);


--
-- TOC entry 5043 (class 2606 OID 33228)
-- Name: testcases testcases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.testcases
    ADD CONSTRAINT testcases_pkey PRIMARY KEY (testcaseid);


--
-- TOC entry 5028 (class 2606 OID 24759)
-- Name: enrollments unique_enrollment; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT unique_enrollment UNIQUE (student_id, course_id);


--
-- TOC entry 5012 (class 2606 OID 16418)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5014 (class 2606 OID 16416)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (userid);


--
-- TOC entry 5037 (class 1259 OID 41337)
-- Name: idx_exercisestype_createdby_courseid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_exercisestype_createdby_courseid ON public.exercisestype USING btree (createdby, courseid);


--
-- TOC entry 5134 (class 2606 OID 41397)
-- Name: course_concept course_concept_concept_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_concept
    ADD CONSTRAINT course_concept_concept_id_fkey FOREIGN KEY (concept_id) REFERENCES public.concept(id) ON DELETE CASCADE;


--
-- TOC entry 5135 (class 2606 OID 41392)
-- Name: course_concept course_concept_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_concept
    ADD CONSTRAINT course_concept_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(courseid) ON DELETE CASCADE;


--
-- TOC entry 5136 (class 2606 OID 41447)
-- Name: exercise_type_concept exercise_type_concept_concept_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise_type_concept
    ADD CONSTRAINT exercise_type_concept_concept_id_fkey FOREIGN KEY (concept_id) REFERENCES public.concept(id) ON DELETE CASCADE;


--
-- TOC entry 5137 (class 2606 OID 41442)
-- Name: exercise_type_concept exercise_type_concept_exercise_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise_type_concept
    ADD CONSTRAINT exercise_type_concept_exercise_type_id_fkey FOREIGN KEY (exercise_type_id) REFERENCES public.exercisestype(typeid) ON DELETE CASCADE;


--
-- TOC entry 5138 (class 2606 OID 41459)
-- Name: exercise_type_forbidden exercise_type_forbidden_exercise_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise_type_forbidden
    ADD CONSTRAINT exercise_type_forbidden_exercise_type_id_fkey FOREIGN KEY (exercise_type_id) REFERENCES public.exercisestype(typeid) ON DELETE CASCADE;


--
-- TOC entry 5139 (class 2606 OID 41464)
-- Name: exercise_type_forbidden exercise_type_forbidden_forbidden_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise_type_forbidden
    ADD CONSTRAINT exercise_type_forbidden_forbidden_topic_id_fkey FOREIGN KEY (forbidden_topic_id) REFERENCES public.forbidden_topic(id) ON DELETE CASCADE;


--
-- TOC entry 5140 (class 2606 OID 41476)
-- Name: exercise_type_misconception exercise_type_misconception_exercise_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise_type_misconception
    ADD CONSTRAINT exercise_type_misconception_exercise_type_id_fkey FOREIGN KEY (exercise_type_id) REFERENCES public.exercisestype(typeid) ON DELETE CASCADE;


--
-- TOC entry 5141 (class 2606 OID 41481)
-- Name: exercise_type_misconception exercise_type_misconception_misconception_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise_type_misconception
    ADD CONSTRAINT exercise_type_misconception_misconception_id_fkey FOREIGN KEY (misconception_id) REFERENCES public.misconception(id) ON DELETE CASCADE;


--
-- TOC entry 5142 (class 2606 OID 41493)
-- Name: exercise_type_response exercise_type_response_exercise_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise_type_response
    ADD CONSTRAINT exercise_type_response_exercise_type_id_fkey FOREIGN KEY (exercise_type_id) REFERENCES public.exercisestype(typeid) ON DELETE CASCADE;


--
-- TOC entry 5143 (class 2606 OID 41498)
-- Name: exercise_type_response exercise_type_response_response_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise_type_response
    ADD CONSTRAINT exercise_type_response_response_type_id_fkey FOREIGN KEY (response_type_id) REFERENCES public.response_type(id) ON DELETE CASCADE;


--
-- TOC entry 5104 (class 2606 OID 41332)
-- Name: exercisestype exercisestype_courseid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercisestype
    ADD CONSTRAINT exercisestype_courseid_fkey FOREIGN KEY (courseid) REFERENCES public.courses(courseid) ON DELETE CASCADE;


--
-- TOC entry 5105 (class 2606 OID 41327)
-- Name: exercisestype exercisestype_createdby_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercisestype
    ADD CONSTRAINT exercisestype_createdby_fkey FOREIGN KEY (createdby) REFERENCES public.users(userid);


--
-- TOC entry 5131 (class 2606 OID 41248)
-- Name: attemptidentifyweakness fk_attempt; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attemptidentifyweakness
    ADD CONSTRAINT fk_attempt FOREIGN KEY (attemptid) REFERENCES public.exerciseattempt(attemptid) ON DELETE CASCADE;


--
-- TOC entry 5125 (class 2606 OID 41203)
-- Name: readby fk_attempt_readby; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.readby
    ADD CONSTRAINT fk_attempt_readby FOREIGN KEY (attemptid) REFERENCES public.exerciseattempt(attemptid) ON DELETE CASCADE;


--
-- TOC entry 5121 (class 2606 OID 41160)
-- Name: executionsummary fk_attempt_summary; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.executionsummary
    ADD CONSTRAINT fk_attempt_summary FOREIGN KEY (attemptid) REFERENCES public.exerciseattempt(attemptid) ON DELETE CASCADE;


--
-- TOC entry 5116 (class 2606 OID 41104)
-- Name: controls fk_control_settings; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.controls
    ADD CONSTRAINT fk_control_settings FOREIGN KEY (settid) REFERENCES public.systemsettings(settid) ON DELETE CASCADE;


--
-- TOC entry 5117 (class 2606 OID 41099)
-- Name: controls fk_control_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.controls
    ADD CONSTRAINT fk_control_user FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5101 (class 2606 OID 24765)
-- Name: enrollments fk_course; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT fk_course FOREIGN KEY (course_id) REFERENCES public.courses(courseid) ON DELETE CASCADE;


--
-- TOC entry 5106 (class 2606 OID 33189)
-- Name: exercise fk_course; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise
    ADD CONSTRAINT fk_course FOREIGN KEY (courseid) REFERENCES public.courses(courseid) ON DELETE CASCADE;


--
-- TOC entry 5129 (class 2606 OID 41235)
-- Name: materialchunk fk_course; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materialchunk
    ADD CONSTRAINT fk_course FOREIGN KEY (courseid) REFERENCES public.courses(courseid) ON DELETE CASCADE;


--
-- TOC entry 5111 (class 2606 OID 41050)
-- Name: studentreport fk_course_report; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.studentreport
    ADD CONSTRAINT fk_course_report FOREIGN KEY (courseid) REFERENCES public.courses(courseid) ON DELETE CASCADE;


--
-- TOC entry 5109 (class 2606 OID 33229)
-- Name: testcases fk_exercise; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.testcases
    ADD CONSTRAINT fk_exercise FOREIGN KEY (exerciseid) REFERENCES public.exercise(exerciseid) ON DELETE CASCADE;


--
-- TOC entry 5118 (class 2606 OID 41134)
-- Name: exerciseattempt fk_exercise_attempt; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exerciseattempt
    ADD CONSTRAINT fk_exercise_attempt FOREIGN KEY (exerciseid) REFERENCES public.exercise(exerciseid) ON DELETE CASCADE;


--
-- TOC entry 5100 (class 2606 OID 24748)
-- Name: courses fk_instructor; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT fk_instructor FOREIGN KEY (instructorid) REFERENCES public.instructor(userid) ON DELETE RESTRICT;


--
-- TOC entry 5113 (class 2606 OID 41072)
-- Name: instructorviewedreport fk_instructor; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instructorviewedreport
    ADD CONSTRAINT fk_instructor FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5098 (class 2606 OID 24692)
-- Name: instructor fk_instructor_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instructor
    ADD CONSTRAINT fk_instructor_user FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5096 (class 2606 OID 16468)
-- Name: login_logs fk_log_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_logs
    ADD CONSTRAINT fk_log_user FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE SET NULL;


--
-- TOC entry 5130 (class 2606 OID 41230)
-- Name: materialchunk fk_material; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materialchunk
    ADD CONSTRAINT fk_material FOREIGN KEY (materialid) REFERENCES public.material(materialid) ON DELETE CASCADE;


--
-- TOC entry 5097 (class 2606 OID 16487)
-- Name: notifications fk_notification_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT fk_notification_user FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5132 (class 2606 OID 41258)
-- Name: attemptidentifyweakness fk_report; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attemptidentifyweakness
    ADD CONSTRAINT fk_report FOREIGN KEY (reportid) REFERENCES public.studentreport(reportid) ON DELETE CASCADE;


--
-- TOC entry 5114 (class 2606 OID 41067)
-- Name: instructorviewedreport fk_report; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instructorviewedreport
    ADD CONSTRAINT fk_report FOREIGN KEY (reportid) REFERENCES public.studentreport(reportid) ON DELETE CASCADE;


--
-- TOC entry 5119 (class 2606 OID 41139)
-- Name: exerciseattempt fk_report_attempt; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exerciseattempt
    ADD CONSTRAINT fk_report_attempt FOREIGN KEY (reportid) REFERENCES public.studentreport(reportid) ON DELETE CASCADE;


--
-- TOC entry 5122 (class 2606 OID 41181)
-- Name: studentweakness fk_report_weakness; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.studentweakness
    ADD CONSTRAINT fk_report_weakness FOREIGN KEY (reportid) REFERENCES public.studentreport(reportid) ON DELETE CASCADE;


--
-- TOC entry 5102 (class 2606 OID 24760)
-- Name: enrollments fk_student; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES public.student(userid) ON DELETE CASCADE;


--
-- TOC entry 5099 (class 2606 OID 24728)
-- Name: student fk_student_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student
    ADD CONSTRAINT fk_student_user FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5107 (class 2606 OID 33199)
-- Name: exercise fk_type; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise
    ADD CONSTRAINT fk_type FOREIGN KEY (typeid) REFERENCES public.exercisestype(typeid) ON DELETE CASCADE;


--
-- TOC entry 5110 (class 2606 OID 33243)
-- Name: exercisetypeconfig fk_type_config; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercisetypeconfig
    ADD CONSTRAINT fk_type_config FOREIGN KEY (typeid) REFERENCES public.exercisestype(typeid) ON DELETE CASCADE;


--
-- TOC entry 5123 (class 2606 OID 41186)
-- Name: studentweakness fk_type_weakness; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.studentweakness
    ADD CONSTRAINT fk_type_weakness FOREIGN KEY (typeid) REFERENCES public.exercisestype(typeid) ON DELETE CASCADE;


--
-- TOC entry 5133 (class 2606 OID 41253)
-- Name: attemptidentifyweakness fk_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attemptidentifyweakness
    ADD CONSTRAINT fk_user FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5108 (class 2606 OID 33194)
-- Name: exercise fk_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise
    ADD CONSTRAINT fk_user FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5103 (class 2606 OID 32853)
-- Name: sessions fk_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT fk_user FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5120 (class 2606 OID 41129)
-- Name: exerciseattempt fk_user_attempt; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exerciseattempt
    ADD CONSTRAINT fk_user_attempt FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5126 (class 2606 OID 41198)
-- Name: readby fk_user_readby; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.readby
    ADD CONSTRAINT fk_user_readby FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5112 (class 2606 OID 41055)
-- Name: studentreport fk_user_report; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.studentreport
    ADD CONSTRAINT fk_user_report FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5115 (class 2606 OID 41087)
-- Name: systemsettings fk_user_settings; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.systemsettings
    ADD CONSTRAINT fk_user_settings FOREIGN KEY (updatedby) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5124 (class 2606 OID 41176)
-- Name: studentweakness fk_user_weakness; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.studentweakness
    ADD CONSTRAINT fk_user_weakness FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5127 (class 2606 OID 41346)
-- Name: material material_courseid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material
    ADD CONSTRAINT material_courseid_fkey FOREIGN KEY (courseid) REFERENCES public.courses(courseid) ON DELETE CASCADE;


--
-- TOC entry 5128 (class 2606 OID 41351)
-- Name: material material_uploadedby_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material
    ADD CONSTRAINT material_uploadedby_fkey FOREIGN KEY (uploadedby) REFERENCES public.users(userid);


--
-- TOC entry 5144 (class 2606 OID 41517)
-- Name: student_exercise_ai_state student_exercise_ai_state_exerciseid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_exercise_ai_state
    ADD CONSTRAINT student_exercise_ai_state_exerciseid_fkey FOREIGN KEY (exerciseid) REFERENCES public.exercise(exerciseid) ON DELETE CASCADE;


--
-- TOC entry 5145 (class 2606 OID 41512)
-- Name: student_exercise_ai_state student_exercise_ai_state_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_exercise_ai_state
    ADD CONSTRAINT student_exercise_ai_state_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


-- Completed on 2026-04-14 23:06:10

--
-- PostgreSQL database dump complete
--

\unrestrict eU2n4upj07uKhopzba5UovjQtaK4lCbNq9jiLQ3cZGhXSwvQ7yRiVOaTY5bBKL5

