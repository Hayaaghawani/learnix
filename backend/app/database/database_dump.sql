--
-- PostgreSQL database dump
--

\restrict VUOGmrtLn6uHPNiN5i1OdifYkwuTIWBjzotmi3oT5drXI3IV2ZugJc9XXcvdlcc

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-04-04 20:47:42

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
-- TOC entry 5219 (class 0 OID 0)
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
-- TOC entry 235 (class 1259 OID 41092)
-- Name: controls; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.controls (
    userid uuid NOT NULL,
    settid uuid NOT NULL
);


ALTER TABLE public.controls OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 24733)
-- Name: courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.courses (
    courseid uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    coursename character varying(50) NOT NULL,
    description character varying(100),
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
    title character varying(20) NOT NULL,
    difficultylevel character varying(20) NOT NULL,
    exercisetype character varying(20) NOT NULL,
    keyconcept character varying(100),
    prerequisites character varying(100),
    problem character varying(100) NOT NULL,
    referencesolution character varying(100),
    isactive boolean DEFAULT true NOT NULL,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    duedate date NOT NULL,
    updatedat timestamp without time zone,
    CONSTRAINT exercise_check CHECK ((duedate >= createdat))
);


ALTER TABLE public.exercise OWNER TO postgres;

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
    defaultcooldownstrategy integer NOT NULL,
    strictlevel integer NOT NULL,
    category character varying(50) NOT NULL,
    guidancestyle character varying(50),
    anticipatedmisconceptions character varying(200),
    CONSTRAINT exercisestype_defaultcooldownstrategy_check CHECK ((defaultcooldownstrategy = ANY (ARRAY[0, 1, 2]))),
    CONSTRAINT exercisestype_defaulthintlimit_check CHECK ((defaulthintlimit >= 0)),
    CONSTRAINT exercisestype_strictlevel_check CHECK ((strictlevel = ANY (ARRAY[0, 1, 2])))
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
    content text NOT NULL
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
-- TOC entry 222 (class 1259 OID 16473)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    notificationid uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    userid uuid NOT NULL,
    senderid uuid NOT NULL,
    title character varying(100) NOT NULL,
    message text NOT NULL,
    isread boolean DEFAULT false,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP
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
-- TOC entry 5213 (class 0 OID 41240)
-- Dependencies: 242
-- Data for Name: attemptidentifyweakness; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attemptidentifyweakness (attemptid, userid, reportid) FROM stdin;
\.


--
-- TOC entry 5206 (class 0 OID 41092)
-- Dependencies: 235
-- Data for Name: controls; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.controls (userid, settid) FROM stdin;
\.


--
-- TOC entry 5196 (class 0 OID 24733)
-- Dependencies: 225
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.courses (courseid, coursename, description, languageused, startdate, enddate, instructorid) FROM stdin;
df8a4bf7-00b6-4a6d-bad6-c9a10374a3ef	Python Basics	Intro to Python	Python	2026-03-01	2026-06-01	d0f41223-7984-4629-a5a0-bde1b809fc01
e5f122e7-089e-42f9-96cf-ff05833891fa	Structured Programming	Learn Codding basics using C-language	C	2026-03-20	2026-06-20	d0f41223-7984-4629-a5a0-bde1b809fc01
900a6bf1-2654-4a67-92cd-435fc3b2d08f	Data Structure	Learn Coding basics and Algorithms to enhance the problem-solving skill, using C language	C	2026-03-20	2026-06-20	d0f41223-7984-4629-a5a0-bde1b809fc01
605f02ec-1ae9-4c58-b2b0-bbf823638c1e	Physics 101	Intro physics	Python	2026-05-01	2026-07-01	d0f41223-7984-4629-a5a0-bde1b809fc01
\.


--
-- TOC entry 5197 (class 0 OID 24753)
-- Dependencies: 226
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enrollments (student_id, course_id) FROM stdin;
326bb069-1a37-48fb-b236-2d54f9c0523a	df8a4bf7-00b6-4a6d-bad6-c9a10374a3ef
326bb069-1a37-48fb-b236-2d54f9c0523a	e5f122e7-089e-42f9-96cf-ff05833891fa
cfccef0a-d58d-47e4-b919-360f46ce6c76	df8a4bf7-00b6-4a6d-bad6-c9a10374a3ef
\.


--
-- TOC entry 5208 (class 0 OID 41144)
-- Dependencies: 237
-- Data for Name: executionsummary; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.executionsummary (summaryid, attemptid, runtimems, memorykb, stdout, stderr, passedcount, failedcount) FROM stdin;
5dabeb14-f9df-4518-b29f-9a6f10ebfbae	bdb57242-a737-49ec-aa26-3a3b6cd50ace	120	2048	hello		3	1
\.


--
-- TOC entry 5200 (class 0 OID 33167)
-- Dependencies: 229
-- Data for Name: exercise; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exercise (exerciseid, courseid, userid, typeid, title, difficultylevel, exercisetype, keyconcept, prerequisites, problem, referencesolution, isactive, createdat, duedate, updatedat) FROM stdin;
8b785b14-996c-4150-a347-20bf7a25691b	e5f122e7-089e-42f9-96cf-ff05833891fa	d0f41223-7984-4629-a5a0-bde1b809fc01	7f39d2ca-4339-4e43-9cf1-f91f7df65bfe	Loops Basics	beginner	Coding	For Loops	Variables, Conditions	Write a loop that prints numbers from 1 to 10	for(int i=1;i<=10;i++) print(i);	t	2026-03-17 23:41:31.06144	2026-03-24	2026-03-17 23:41:31.06144
25e1390e-1940-47fa-9a0e-e8b4e0fe8e0a	e5f122e7-089e-42f9-96cf-ff05833891fa	d0f41223-7984-4629-a5a0-bde1b809fc01	7f39d2ca-4339-4e43-9cf1-f91f7df65bfe	Sorting Problem	Easy	Coding	Sorting	Arrays	Write a function that sorts an array.	Use Python sorted().	t	2026-03-29 22:31:20.873473	2026-06-01	\N
\.


--
-- TOC entry 5207 (class 0 OID 41109)
-- Dependencies: 236
-- Data for Name: exerciseattempt; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exerciseattempt (attemptid, userid, exerciseid, reportid, attemptnumber, status, score, hintcount, submittedcode, passedtestcases) FROM stdin;
bdb57242-a737-49ec-aa26-3a3b6cd50ace	326bb069-1a37-48fb-b236-2d54f9c0523a	8b785b14-996c-4150-a347-20bf7a25691b	37308d9a-86af-4a39-babf-b0abf06a902e	1	InProgress	0	0	print('hello world')	0
7d546021-23ca-4ca5-90ac-77390ba263e7	326bb069-1a37-48fb-b236-2d54f9c0523a	8b785b14-996c-4150-a347-20bf7a25691b	37308d9a-86af-4a39-babf-b0abf06a902e	2	InProgress	0	0	print('hello world')	0
3031e5b2-28a1-4f61-a92a-24bae84f20f2	326bb069-1a37-48fb-b236-2d54f9c0523a	8b785b14-996c-4150-a347-20bf7a25691b	37308d9a-86af-4a39-babf-b0abf06a902e	3	InProgress	0	0	print('hello world')	0
\.


--
-- TOC entry 5199 (class 0 OID 33095)
-- Dependencies: 228
-- Data for Name: exercisestype; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exercisestype (typeid, name, issystempresent, defaulthintlimit, description, defaultcooldownstrategy, strictlevel, category, guidancestyle, anticipatedmisconceptions) FROM stdin;
7f39d2ca-4339-4e43-9cf1-f91f7df65bfe	Beginner	t	10	This type is used for Beginners to help in learning and gaining knowledge by asking the chatbot.	0	0	Beginner	Step-by-step guidance	Using the wrong data types for the variables. 
05e54e91-3ddf-4547-96c2-225fecb7f227	Intermediate	t	8	This type is used for Intermediate after improving and solving the Beginner questions.	1	1	Intermediate	Giving Hints	Incorrect loop conditions leading to infinite loops.
b90a5a95-ff5e-4704-a361-bebed0853afe	Senior	t	6	This type is used for Senior after improving and solving the Intermediate questions.	1	1	Senior	Giving Hints	Wrong use of data structures (e.g., using a list instead of a hash map
0e876aca-6ab8-4ed2-b499-5e0ddf6f6570	Professional	t	4	This type is used for Professional after improving and solving the Senior questions.	2	2	Professional	No Hints	Memory leaks or improper resource management
\.


--
-- TOC entry 5202 (class 0 OID 33234)
-- Dependencies: 231
-- Data for Name: exercisetypeconfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exercisetypeconfig (typeid, isenabled, isgraded) FROM stdin;
\.


--
-- TOC entry 5194 (class 0 OID 24684)
-- Dependencies: 223
-- Data for Name: instructor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.instructor (userid, title, coursecount) FROM stdin;
d0f41223-7984-4629-a5a0-bde1b809fc01	Coding Professor	3
\.


--
-- TOC entry 5204 (class 0 OID 41060)
-- Dependencies: 233
-- Data for Name: instructorviewedreport; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.instructorviewedreport (reportid, userid) FROM stdin;
\.


--
-- TOC entry 5192 (class 0 OID 16459)
-- Dependencies: 221
-- Data for Name: login_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.login_logs (logid, userid, emailused, success, ipaddress, attemptedat) FROM stdin;
fdeb9311-b6fb-4536-9ca6-1d97c4ca661e	326bb069-1a37-48fb-b236-2d54f9c0523a	tala.doe@email.com	t	\N	2026-04-01 18:44:45.506117
7179e353-7d8b-42cc-a450-3cfc36b4744c	326bb069-1a37-48fb-b236-2d54f9c0523a	tala.doe@email.com	t	\N	2026-04-02 11:17:16.745234
6ee4ed3e-7fa7-4904-bb86-6edc1a1b96f2	326bb069-1a37-48fb-b236-2d54f9c0523a	tala.doe@email.com	t	\N	2026-04-02 13:01:55.088658
cb27714a-2da9-4417-bef2-ac68656eb7fa	326bb069-1a37-48fb-b236-2d54f9c0523a	tala.doe@email.com	t	\N	2026-04-03 10:35:29.837657
854a5a59-6a8f-42db-a466-f61719d3e25c	326bb069-1a37-48fb-b236-2d54f9c0523a	tala.doe@email.com	t	\N	2026-04-03 20:44:16.611193
5c1b5b07-e11a-4042-a9a0-792397695996	\N	user@example.com	f	\N	2026-04-03 22:04:59.023583
9f572d38-8b98-43dd-9a7d-4a0a8f65d4d5	326bb069-1a37-48fb-b236-2d54f9c0523a	tala.doe@email.com	t	\N	2026-04-04 17:00:22.146046
ddeaec8f-1118-4b2d-9bb9-83d8c440546a	\N	Omar.osa@email.com	f	\N	2026-04-04 17:00:51.640697
d836e1d4-10d4-4612-8a32-cb9b73b5d873	cfccef0a-d58d-47e4-b919-360f46ce6c76	Omar.osa@email.com	t	\N	2026-04-04 17:01:06.081719
d3829030-1a3f-4b45-aa60-465ef7d52296	326bb069-1a37-48fb-b236-2d54f9c0523a	tala.doe@email.com	t	\N	2026-04-04 17:02:17.684352
f7804edc-1965-4254-8338-c24e46b79454	d0f41223-7984-4629-a5a0-bde1b809fc01	anas.abu@example.com	t	\N	2026-04-04 17:02:38.846502
acd0bafb-6f3e-42d1-9535-f9d86608d011	\N	hala.Alaghawani@example.com	f	\N	2026-04-04 17:03:44.486494
08e063bf-63f4-4ced-add3-34424152d456	\N	Hala.Alaghawani@email.com	f	\N	2026-04-04 17:05:06.361812
52c05316-d377-4ec2-9518-c309e9fcd69c	\N	hala.Alaghawani@example.com	f	\N	2026-04-04 17:10:21.922683
a40d4321-d9ac-479b-a63f-3c457eec1adf	\N	hala.ess@example.com	f	\N	2026-04-04 17:10:46.351211
eb0ea46d-9726-42a9-94bf-519c4747e023	\N	hala.ess@example.com	f	\N	2026-04-04 17:10:49.483527
f8a518a5-178d-4069-878e-6926da3c7a24	9848392a-27fd-4c5a-aaf5-1e0c3ffea782	haya.ala@example.com	t	\N	2026-04-04 17:17:26.991358
0bb7d7e8-ff56-4118-a1d7-e60123572b4c	3c78b71b-94bd-4ba7-9d72-ed1f5cd4d5d3	hala.ess@example.com	t	\N	2026-04-04 17:17:47.604818
\.


--
-- TOC entry 5211 (class 0 OID 41208)
-- Dependencies: 240
-- Data for Name: material; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.material (materialid, content) FROM stdin;
\.


--
-- TOC entry 5212 (class 0 OID 41218)
-- Dependencies: 241
-- Data for Name: materialchunk; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.materialchunk (chunkid, materialid, courseid, embeddingvector, pagenumber, content) FROM stdin;
\.


--
-- TOC entry 5193 (class 0 OID 16473)
-- Dependencies: 222
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (notificationid, userid, title, message, isread, createdat) FROM stdin;
59abaa20-e07e-439c-ae4d-f316320ae7a5	326bb069-1a37-48fb-b236-2d54f9c0523a	Answered!	No hints will be given	t	2026-03-28 19:10:39.270612
\.


--
-- TOC entry 5210 (class 0 OID 41191)
-- Dependencies: 239
-- Data for Name: readby; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.readby (userid, attemptid) FROM stdin;
\.


--
-- TOC entry 5198 (class 0 OID 32838)
-- Dependencies: 227
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (sessionid, userid, token, createdat, expiresat) FROM stdin;
\.


--
-- TOC entry 5195 (class 0 OID 24720)
-- Dependencies: 224
-- Data for Name: student; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student (userid, enrolledcoursecount) FROM stdin;
326bb069-1a37-48fb-b236-2d54f9c0523a	2
cfccef0a-d58d-47e4-b919-360f46ce6c76	1
\.


--
-- TOC entry 5203 (class 0 OID 41035)
-- Dependencies: 232
-- Data for Name: studentreport; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.studentreport (reportid, courseid, userid, completionrate, weaknesssummary, performancesummary, recommendations, createdat, lastupdated) FROM stdin;
37308d9a-86af-4a39-babf-b0abf06a902e	e5f122e7-089e-42f9-96cf-ff05833891fa	326bb069-1a37-48fb-b236-2d54f9c0523a	0	\N	No attempts yet	Start solving exercises to build your report	2026-04-01	2026-04-01
\.


--
-- TOC entry 5209 (class 0 OID 41165)
-- Dependencies: 238
-- Data for Name: studentweakness; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.studentweakness (userid, reportid, occurrencecount, lastupdated, lastdetectedat, typeid) FROM stdin;
\.


--
-- TOC entry 5205 (class 0 OID 41077)
-- Dependencies: 234
-- Data for Name: systemsettings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.systemsettings (settid, updatedby, aimodel) FROM stdin;
\.


--
-- TOC entry 5201 (class 0 OID 33216)
-- Dependencies: 230
-- Data for Name: testcases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.testcases (testcaseid, exerciseid, input, expectedoutput, weight) FROM stdin;
eaded2a1-531a-434c-aa36-33ea28b40d7c	8b785b14-996c-4150-a347-20bf7a25691b	5	1 2 3 4 5	1
b7b93072-38c8-4826-a207-f074c97427c4	8b785b14-996c-4150-a347-20bf7a25691b	3	1 2 3	1
\.


--
-- TOC entry 5191 (class 0 OID 16400)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (userid, firstname, lastname, email, password, role, isactive, createdat) FROM stdin;
d0f41223-7984-4629-a5a0-bde1b809fc01	Anas	Abu Taleb	anas.abu@example.com	$2b$12$AjMrJ99Qw30lAZNSK1uG/ubsxrZmPoQRDEzfA9pQRCcVBri1I5eB2	instructor	t	2026-03-02 22:01:14.571465
326bb069-1a37-48fb-b236-2d54f9c0523a	Tala	Doe	tala.doe@email.com	$2b$12$kd9H4DuWouAnylcgEkAGZOUNI4odX0IFqyca.vfPpIi3r3CzWQA1e	student	t	2026-03-10 23:36:48.370856
cfccef0a-d58d-47e4-b919-360f46ce6c76	Omar	Osama	Omar.osa@email.com	$2b$12$OsfOAI7vFQWHQXYRdgotoOHPyh4OEW9QxKiz.bmI5d3CjAQ53jrZq	student	t	2026-03-16 21:46:18.373197
3c78b71b-94bd-4ba7-9d72-ed1f5cd4d5d3	Hala	Essa	hala.ess@example.com	$2b$12$D4Q0zrzIQ2g4vv.hDfUmGuhsg7nR5fQ3m3zqVsueOM.2KQUDIFcla	student	t	2026-04-04 20:14:25.645107
9848392a-27fd-4c5a-aaf5-1e0c3ffea782	haya	Alaghawani	haya.ala@example.com	$2b$12$57F45oby8lP.tbpK2zxe8.PUakAIZpYqWM5n4m789Ygk0YN4tlFt.	admin	t	2026-04-04 20:15:19.515268
\.


--
-- TOC entry 5009 (class 2606 OID 41247)
-- Name: attemptidentifyweakness attemptidentifyweakness_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attemptidentifyweakness
    ADD CONSTRAINT attemptidentifyweakness_pkey PRIMARY KEY (attemptid, userid, reportid);


--
-- TOC entry 4995 (class 2606 OID 41098)
-- Name: controls controls_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.controls
    ADD CONSTRAINT controls_pkey PRIMARY KEY (userid, settid);


--
-- TOC entry 4967 (class 2606 OID 24747)
-- Name: courses courses_coursename_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_coursename_key UNIQUE (coursename);


--
-- TOC entry 4969 (class 2606 OID 24745)
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (courseid);


--
-- TOC entry 4999 (class 2606 OID 41159)
-- Name: executionsummary executionsummary_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.executionsummary
    ADD CONSTRAINT executionsummary_pkey PRIMARY KEY (summaryid);


--
-- TOC entry 4981 (class 2606 OID 33186)
-- Name: exercise exercise_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise
    ADD CONSTRAINT exercise_pkey PRIMARY KEY (exerciseid);


--
-- TOC entry 4983 (class 2606 OID 33188)
-- Name: exercise exercise_title_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise
    ADD CONSTRAINT exercise_title_key UNIQUE (title);


--
-- TOC entry 4997 (class 2606 OID 41128)
-- Name: exerciseattempt exerciseattempt_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exerciseattempt
    ADD CONSTRAINT exerciseattempt_pkey PRIMARY KEY (attemptid);


--
-- TOC entry 4977 (class 2606 OID 33116)
-- Name: exercisestype exercisestype_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercisestype
    ADD CONSTRAINT exercisestype_name_key UNIQUE (name);


--
-- TOC entry 4979 (class 2606 OID 33114)
-- Name: exercisestype exercisestype_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercisestype
    ADD CONSTRAINT exercisestype_pkey PRIMARY KEY (typeid);


--
-- TOC entry 4987 (class 2606 OID 33242)
-- Name: exercisetypeconfig exercisetypeconfig_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercisetypeconfig
    ADD CONSTRAINT exercisetypeconfig_pkey PRIMARY KEY (typeid);


--
-- TOC entry 4963 (class 2606 OID 24691)
-- Name: instructor instructor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instructor
    ADD CONSTRAINT instructor_pkey PRIMARY KEY (userid);


--
-- TOC entry 4991 (class 2606 OID 41066)
-- Name: instructorviewedreport instructorviewedreport_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instructorviewedreport
    ADD CONSTRAINT instructorviewedreport_pkey PRIMARY KEY (reportid, userid);


--
-- TOC entry 4959 (class 2606 OID 16467)
-- Name: login_logs login_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_logs
    ADD CONSTRAINT login_logs_pkey PRIMARY KEY (logid);


--
-- TOC entry 5005 (class 2606 OID 41217)
-- Name: material material_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material
    ADD CONSTRAINT material_pkey PRIMARY KEY (materialid);


--
-- TOC entry 5007 (class 2606 OID 41229)
-- Name: materialchunk materialchunk_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materialchunk
    ADD CONSTRAINT materialchunk_pkey PRIMARY KEY (chunkid);


--
-- TOC entry 4961 (class 2606 OID 16486)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notificationid);


--
-- TOC entry 5003 (class 2606 OID 41197)
-- Name: readby readby_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.readby
    ADD CONSTRAINT readby_pkey PRIMARY KEY (userid, attemptid);


--
-- TOC entry 4973 (class 2606 OID 32850)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sessionid);


--
-- TOC entry 4975 (class 2606 OID 32852)
-- Name: sessions sessions_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key UNIQUE (token);


--
-- TOC entry 4965 (class 2606 OID 24727)
-- Name: student student_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student
    ADD CONSTRAINT student_pkey PRIMARY KEY (userid);


--
-- TOC entry 4989 (class 2606 OID 41049)
-- Name: studentreport studentreport_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.studentreport
    ADD CONSTRAINT studentreport_pkey PRIMARY KEY (reportid);


--
-- TOC entry 5001 (class 2606 OID 41175)
-- Name: studentweakness studentweakness_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.studentweakness
    ADD CONSTRAINT studentweakness_pkey PRIMARY KEY (userid, reportid);


--
-- TOC entry 4993 (class 2606 OID 41086)
-- Name: systemsettings systemsettings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.systemsettings
    ADD CONSTRAINT systemsettings_pkey PRIMARY KEY (settid);


--
-- TOC entry 4985 (class 2606 OID 33228)
-- Name: testcases testcases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.testcases
    ADD CONSTRAINT testcases_pkey PRIMARY KEY (testcaseid);


--
-- TOC entry 4971 (class 2606 OID 24759)
-- Name: enrollments unique_enrollment; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT unique_enrollment UNIQUE (student_id, course_id);


--
-- TOC entry 4955 (class 2606 OID 16418)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4957 (class 2606 OID 16416)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (userid);


--
-- TOC entry 5041 (class 2606 OID 41248)
-- Name: attemptidentifyweakness fk_attempt; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attemptidentifyweakness
    ADD CONSTRAINT fk_attempt FOREIGN KEY (attemptid) REFERENCES public.exerciseattempt(attemptid) ON DELETE CASCADE;


--
-- TOC entry 5037 (class 2606 OID 41203)
-- Name: readby fk_attempt_readby; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.readby
    ADD CONSTRAINT fk_attempt_readby FOREIGN KEY (attemptid) REFERENCES public.exerciseattempt(attemptid) ON DELETE CASCADE;


--
-- TOC entry 5033 (class 2606 OID 41160)
-- Name: executionsummary fk_attempt_summary; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.executionsummary
    ADD CONSTRAINT fk_attempt_summary FOREIGN KEY (attemptid) REFERENCES public.exerciseattempt(attemptid) ON DELETE CASCADE;


--
-- TOC entry 5028 (class 2606 OID 41104)
-- Name: controls fk_control_settings; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.controls
    ADD CONSTRAINT fk_control_settings FOREIGN KEY (settid) REFERENCES public.systemsettings(settid) ON DELETE CASCADE;


--
-- TOC entry 5029 (class 2606 OID 41099)
-- Name: controls fk_control_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.controls
    ADD CONSTRAINT fk_control_user FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5015 (class 2606 OID 24765)
-- Name: enrollments fk_course; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT fk_course FOREIGN KEY (course_id) REFERENCES public.courses(courseid) ON DELETE CASCADE;


--
-- TOC entry 5018 (class 2606 OID 33189)
-- Name: exercise fk_course; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise
    ADD CONSTRAINT fk_course FOREIGN KEY (courseid) REFERENCES public.courses(courseid) ON DELETE CASCADE;


--
-- TOC entry 5039 (class 2606 OID 41235)
-- Name: materialchunk fk_course; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materialchunk
    ADD CONSTRAINT fk_course FOREIGN KEY (courseid) REFERENCES public.courses(courseid) ON DELETE CASCADE;


--
-- TOC entry 5023 (class 2606 OID 41050)
-- Name: studentreport fk_course_report; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.studentreport
    ADD CONSTRAINT fk_course_report FOREIGN KEY (courseid) REFERENCES public.courses(courseid) ON DELETE CASCADE;


--
-- TOC entry 5021 (class 2606 OID 33229)
-- Name: testcases fk_exercise; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.testcases
    ADD CONSTRAINT fk_exercise FOREIGN KEY (exerciseid) REFERENCES public.exercise(exerciseid) ON DELETE CASCADE;


--
-- TOC entry 5030 (class 2606 OID 41134)
-- Name: exerciseattempt fk_exercise_attempt; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exerciseattempt
    ADD CONSTRAINT fk_exercise_attempt FOREIGN KEY (exerciseid) REFERENCES public.exercise(exerciseid) ON DELETE CASCADE;


--
-- TOC entry 5014 (class 2606 OID 24748)
-- Name: courses fk_instructor; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT fk_instructor FOREIGN KEY (instructorid) REFERENCES public.instructor(userid) ON DELETE RESTRICT;


--
-- TOC entry 5025 (class 2606 OID 41072)
-- Name: instructorviewedreport fk_instructor; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instructorviewedreport
    ADD CONSTRAINT fk_instructor FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5012 (class 2606 OID 24692)
-- Name: instructor fk_instructor_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instructor
    ADD CONSTRAINT fk_instructor_user FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5010 (class 2606 OID 16468)
-- Name: login_logs fk_log_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_logs
    ADD CONSTRAINT fk_log_user FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE SET NULL;


--
-- TOC entry 5040 (class 2606 OID 41230)
-- Name: materialchunk fk_material; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materialchunk
    ADD CONSTRAINT fk_material FOREIGN KEY (materialid) REFERENCES public.material(materialid) ON DELETE CASCADE;


--
-- TOC entry 5011 (class 2606 OID 16487)
-- Name: notifications fk_notification_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT fk_notification_user FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5042 (class 2606 OID 41258)
-- Name: attemptidentifyweakness fk_report; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attemptidentifyweakness
    ADD CONSTRAINT fk_report FOREIGN KEY (reportid) REFERENCES public.studentreport(reportid) ON DELETE CASCADE;


--
-- TOC entry 5026 (class 2606 OID 41067)
-- Name: instructorviewedreport fk_report; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instructorviewedreport
    ADD CONSTRAINT fk_report FOREIGN KEY (reportid) REFERENCES public.studentreport(reportid) ON DELETE CASCADE;


--
-- TOC entry 5031 (class 2606 OID 41139)
-- Name: exerciseattempt fk_report_attempt; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exerciseattempt
    ADD CONSTRAINT fk_report_attempt FOREIGN KEY (reportid) REFERENCES public.studentreport(reportid) ON DELETE CASCADE;


--
-- TOC entry 5034 (class 2606 OID 41181)
-- Name: studentweakness fk_report_weakness; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.studentweakness
    ADD CONSTRAINT fk_report_weakness FOREIGN KEY (reportid) REFERENCES public.studentreport(reportid) ON DELETE CASCADE;


--
-- TOC entry 5016 (class 2606 OID 24760)
-- Name: enrollments fk_student; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES public.student(userid) ON DELETE CASCADE;


--
-- TOC entry 5013 (class 2606 OID 24728)
-- Name: student fk_student_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student
    ADD CONSTRAINT fk_student_user FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5019 (class 2606 OID 33199)
-- Name: exercise fk_type; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise
    ADD CONSTRAINT fk_type FOREIGN KEY (typeid) REFERENCES public.exercisestype(typeid) ON DELETE CASCADE;


--
-- TOC entry 5022 (class 2606 OID 33243)
-- Name: exercisetypeconfig fk_type_config; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercisetypeconfig
    ADD CONSTRAINT fk_type_config FOREIGN KEY (typeid) REFERENCES public.exercisestype(typeid) ON DELETE CASCADE;


--
-- TOC entry 5035 (class 2606 OID 41186)
-- Name: studentweakness fk_type_weakness; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.studentweakness
    ADD CONSTRAINT fk_type_weakness FOREIGN KEY (typeid) REFERENCES public.exercisestype(typeid) ON DELETE CASCADE;


--
-- TOC entry 5043 (class 2606 OID 41253)
-- Name: attemptidentifyweakness fk_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attemptidentifyweakness
    ADD CONSTRAINT fk_user FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5020 (class 2606 OID 33194)
-- Name: exercise fk_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise
    ADD CONSTRAINT fk_user FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5017 (class 2606 OID 32853)
-- Name: sessions fk_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT fk_user FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5032 (class 2606 OID 41129)
-- Name: exerciseattempt fk_user_attempt; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exerciseattempt
    ADD CONSTRAINT fk_user_attempt FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5038 (class 2606 OID 41198)
-- Name: readby fk_user_readby; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.readby
    ADD CONSTRAINT fk_user_readby FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5024 (class 2606 OID 41055)
-- Name: studentreport fk_user_report; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.studentreport
    ADD CONSTRAINT fk_user_report FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5027 (class 2606 OID 41087)
-- Name: systemsettings fk_user_settings; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.systemsettings
    ADD CONSTRAINT fk_user_settings FOREIGN KEY (updatedby) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 5036 (class 2606 OID 41176)
-- Name: studentweakness fk_user_weakness; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.studentweakness
    ADD CONSTRAINT fk_user_weakness FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


-- Completed on 2026-04-04 20:47:42

--
-- PostgreSQL database dump complete
--

\unrestrict VUOGmrtLn6uHPNiN5i1OdifYkwuTIWBjzotmi3oT5drXI3IV2ZugJc9XXcvdlcc

