--
-- PostgreSQL database dump
--

\restrict Tt9IrZm9pj8IRaa5ncDyAfCNxMjk6zjBPhFyhnzb9XcuX9c4Xj38h446ABi8n1m

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-03-08 13:58:48

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
-- TOC entry 5056 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 226 (class 1259 OID 24733)
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
-- TOC entry 227 (class 1259 OID 24753)
-- Name: enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enrollments (
    student_id uuid NOT NULL,
    course_id uuid NOT NULL
);


ALTER TABLE public.enrollments OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 24684)
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
-- TOC entry 222 (class 1259 OID 16459)
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
-- TOC entry 223 (class 1259 OID 16473)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    notificationid uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    userid uuid NOT NULL,
    title character varying(100) NOT NULL,
    message text NOT NULL,
    isread boolean DEFAULT false,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16434)
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    session_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    userid uuid NOT NULL,
    token text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 24720)
-- Name: student; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student (
    userid uuid NOT NULL,
    enrolledcoursecount integer DEFAULT 0,
    CONSTRAINT student_enrolledcoursecount_check CHECK ((enrolledcoursecount >= 0))
);


ALTER TABLE public.student OWNER TO postgres;

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
-- TOC entry 5049 (class 0 OID 24733)
-- Dependencies: 226
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.courses (courseid, coursename, description, languageused, startdate, enddate, instructorid) FROM stdin;
df8a4bf7-00b6-4a6d-bad6-c9a10374a3ef	Python Basics	Intro to Python	Python	2026-03-01	2026-06-01	d0f41223-7984-4629-a5a0-bde1b809fc01
\.


--
-- TOC entry 5050 (class 0 OID 24753)
-- Dependencies: 227
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enrollments (student_id, course_id) FROM stdin;
77f7d4df-e2b3-4365-928f-9cf7b478ad2c	df8a4bf7-00b6-4a6d-bad6-c9a10374a3ef
84a9df82-03b4-475b-b2f8-72a144c1115a	df8a4bf7-00b6-4a6d-bad6-c9a10374a3ef
\.


--
-- TOC entry 5047 (class 0 OID 24684)
-- Dependencies: 224
-- Data for Name: instructor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.instructor (userid, title, coursecount) FROM stdin;
d0f41223-7984-4629-a5a0-bde1b809fc01	English	1
\.


--
-- TOC entry 5045 (class 0 OID 16459)
-- Dependencies: 222
-- Data for Name: login_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.login_logs (logid, userid, emailused, success, ipaddress, attemptedat) FROM stdin;
54cefe71-bbe9-4fdd-a54b-6576810990c2	\N	wrong@learnix.com	f	192.168.1.11	2026-03-03 23:22:30.592283
b9c87d91-8999-4088-852b-8f1b7cd50f9b	\N	teststudent@learnix.com	t	192.168.1.10	2026-03-03 23:22:11.681184
2b0c1282-b96f-4924-bab4-97493d449f79	84a9df82-03b4-475b-b2f8-72a144c1115a	teststudent@learnix.com	t	192.168.1.10	2026-03-03 23:28:05.770754
e2289be4-6441-486d-aecd-c6fbc161a5d4	\N	wrong@learnix.com	f	192.168.1.11	2026-03-03 23:28:24.758736
19565af4-3edf-4fc1-a673-23766bac38ba	\N	alice@example.com	t	127.0.0.1	2026-03-04 17:20:57.936438
d56c0cb8-c59d-4e2b-94c6-234b0c2a4531	\N	alice@example.com	t	127.0.0.1	2026-03-04 17:21:07.790506
\.


--
-- TOC entry 5046 (class 0 OID 16473)
-- Dependencies: 223
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (notificationid, userid, title, message, isread, createdat) FROM stdin;
8947427d-9e58-4a67-b34a-724f838f27c3	84a9df82-03b4-475b-b2f8-72a144c1115a	Welcome to Learnix	Your account has been created successfully.	f	2026-03-03 23:28:49.226243
\.


--
-- TOC entry 5044 (class 0 OID 16434)
-- Dependencies: 221
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (session_id, userid, token, created_at, expires_at) FROM stdin;
\.


--
-- TOC entry 5048 (class 0 OID 24720)
-- Dependencies: 225
-- Data for Name: student; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student (userid, enrolledcoursecount) FROM stdin;
84a9df82-03b4-475b-b2f8-72a144c1115a	1
77f7d4df-e2b3-4365-928f-9cf7b478ad2c	1
\.


--
-- TOC entry 5043 (class 0 OID 16400)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (userid, firstname, lastname, email, password, role, isactive, createdat) FROM stdin;
d0f41223-7984-4629-a5a0-bde1b809fc01	Anas	Abu Taleb	anas.abu@example.com	instructorpassword123	instructor	t	2026-03-02 22:01:14.571465
9f99614e-1538-45d4-b8aa-f6d9a38696ee	Haya	Alaghawani	hala.Alaghawani@example.com	adminpassword123	admin	t	2026-03-02 22:02:16.525667
84a9df82-03b4-475b-b2f8-72a144c1115a	Test	Student	teststudent@learnix.com	$2b$12$examplehashedpasswordstring1234567890abcdef	student	t	2026-03-03 23:27:14.420475
77f7d4df-e2b3-4365-928f-9cf7b478ad2c	Alice	Smith	alice@example.com	hashedpassword	student	t	2026-03-04 17:08:43.173409
\.


--
-- TOC entry 4882 (class 2606 OID 24747)
-- Name: courses courses_coursename_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_coursename_key UNIQUE (coursename);


--
-- TOC entry 4884 (class 2606 OID 24745)
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (courseid);


--
-- TOC entry 4878 (class 2606 OID 24691)
-- Name: instructor instructor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instructor
    ADD CONSTRAINT instructor_pkey PRIMARY KEY (userid);


--
-- TOC entry 4874 (class 2606 OID 16467)
-- Name: login_logs login_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_logs
    ADD CONSTRAINT login_logs_pkey PRIMARY KEY (logid);


--
-- TOC entry 4876 (class 2606 OID 16486)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notificationid);


--
-- TOC entry 4870 (class 2606 OID 16446)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (session_id);


--
-- TOC entry 4872 (class 2606 OID 16448)
-- Name: sessions sessions_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key UNIQUE (token);


--
-- TOC entry 4880 (class 2606 OID 24727)
-- Name: student student_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student
    ADD CONSTRAINT student_pkey PRIMARY KEY (userid);


--
-- TOC entry 4886 (class 2606 OID 24759)
-- Name: enrollments unique_enrollment; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT unique_enrollment UNIQUE (student_id, course_id);


--
-- TOC entry 4866 (class 2606 OID 16418)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4868 (class 2606 OID 16416)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (userid);


--
-- TOC entry 4894 (class 2606 OID 24765)
-- Name: enrollments fk_course; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT fk_course FOREIGN KEY (course_id) REFERENCES public.courses(courseid) ON DELETE CASCADE;


--
-- TOC entry 4893 (class 2606 OID 24748)
-- Name: courses fk_instructor; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT fk_instructor FOREIGN KEY (instructorid) REFERENCES public.instructor(userid) ON DELETE RESTRICT;


--
-- TOC entry 4891 (class 2606 OID 24692)
-- Name: instructor fk_instructor_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instructor
    ADD CONSTRAINT fk_instructor_user FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 4889 (class 2606 OID 16468)
-- Name: login_logs fk_log_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_logs
    ADD CONSTRAINT fk_log_user FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE SET NULL;


--
-- TOC entry 4890 (class 2606 OID 16487)
-- Name: notifications fk_notification_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT fk_notification_user FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 4887 (class 2606 OID 16454)
-- Name: sessions fk_sessions_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT fk_sessions_user FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 4895 (class 2606 OID 24760)
-- Name: enrollments fk_student; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES public.student(userid) ON DELETE CASCADE;


--
-- TOC entry 4892 (class 2606 OID 24728)
-- Name: student fk_student_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student
    ADD CONSTRAINT fk_student_user FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- TOC entry 4888 (class 2606 OID 16449)
-- Name: sessions fk_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT fk_user FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


-- Completed on 2026-03-08 13:58:48

--
-- PostgreSQL database dump complete
--

\unrestrict Tt9IrZm9pj8IRaa5ncDyAfCNxMjk6zjBPhFyhnzb9XcuX9c4Xj38h446ABi8n1m

