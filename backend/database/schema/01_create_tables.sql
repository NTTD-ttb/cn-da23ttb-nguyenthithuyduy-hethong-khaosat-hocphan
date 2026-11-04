-- Xoá bảng cũ nếu tồn tại (chạy lại sẽ tạo mới)
-- Xoá theo thứ tự ngược (con trước, cha sau)
DROP TABLE IF EXISTS feedback_topics        CASCADE;
DROP TABLE IF EXISTS feedback_analyses      CASCADE;
DROP TABLE IF EXISTS survey_answers         CASCADE;
DROP TABLE IF EXISTS survey_responses       CASCADE;
DROP TABLE IF EXISTS survey_assignments     CASCADE;
DROP TABLE IF EXISTS survey_questions       CASCADE;
DROP TABLE IF EXISTS survey_campaigns       CASCADE;
DROP TABLE IF EXISTS survey_templates       CASCADE;
DROP TABLE IF EXISTS course_enrollments     CASCADE;
DROP TABLE IF EXISTS import_batches         CASCADE;
DROP TABLE IF EXISTS course_sections        CASCADE;
DROP TABLE IF EXISTS courses                CASCADE;
DROP TABLE IF EXISTS academic_terms         CASCADE;
DROP TABLE IF EXISTS lecturers              CASCADE;
DROP TABLE IF EXISTS student_profiles       CASCADE;
DROP TABLE IF EXISTS student_classes        CASCADE;
DROP TABLE IF EXISTS faculties              CASCADE;
DROP TABLE IF EXISTS topic_labels           CASCADE;
DROP TABLE IF EXISTS sentiment_labels       CASCADE;
DROP TABLE IF EXISTS notifications          CASCADE;
DROP TABLE IF EXISTS contact_requests       CASCADE;
DROP TABLE IF EXISTS users                  CASCADE;

-- ============================================================
-- 1. BẢNG users
-- ============================================================
CREATE TABLE users (
    user_id             BIGSERIAL       PRIMARY KEY,
    email               VARCHAR(255)    NOT NULL UNIQUE,
    password_hash       VARCHAR(255)    NOT NULL,
    role                VARCHAR(20)     NOT NULL CHECK (role IN ('student', 'admin')),
    must_change_password BOOLEAN        NOT NULL DEFAULT FALSE,
    created_account     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_account     TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. BẢNG faculties
-- ============================================================
CREATE TABLE faculties (
    faculty_id      BIGSERIAL       PRIMARY KEY,
    faculty_code    VARCHAR(20)     NOT NULL UNIQUE,
    faculty_name    VARCHAR(150)    NOT NULL,
    description     TEXT,
    status          VARCHAR(20)     NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_faculty TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. BẢNG student_classes
-- ============================================================
CREATE TABLE student_classes (
    class_id                BIGSERIAL       PRIMARY KEY,
    class_code              VARCHAR(30)     NOT NULL UNIQUE,
    class_name              VARCHAR(150)    NOT NULL,
    faculty_id              BIGINT          NOT NULL REFERENCES faculties(faculty_id),
    status                  VARCHAR(20)     NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_student_classes TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. BẢNG student_profiles
-- ============================================================
CREATE TABLE student_profiles (
    student_id      BIGINT          PRIMARY KEY REFERENCES users(user_id),
    student_code    VARCHAR(20)     NOT NULL UNIQUE,
    full_name       VARCHAR(150)    NOT NULL,
    class_id        BIGINT          REFERENCES student_classes(class_id),
    date_of_birth   DATE,
    phone_student   VARCHAR(20),
    gender_student  VARCHAR(20),
    avatar_url      TEXT,
    address_student TEXT
);

-- ============================================================
-- 5. BẢNG lecturers
-- ============================================================
CREATE TABLE lecturers (
    lecturer_id     BIGSERIAL       PRIMARY KEY,
    lecturer_code   VARCHAR(20)     NOT NULL UNIQUE,
    full_name       VARCHAR(150)    NOT NULL,
    email           VARCHAR(255)    UNIQUE,
    phone           VARCHAR(20),
    faculty_id      BIGINT          REFERENCES faculties(faculty_id)
);

-- ============================================================
-- 6. BẢNG courses
-- ============================================================
CREATE TABLE courses (
    course_id       BIGSERIAL       PRIMARY KEY,
    course_code     VARCHAR(30)     NOT NULL UNIQUE,
    course_name     VARCHAR(200)    NOT NULL,
    description     TEXT
);

-- ============================================================
-- 7. BẢNG academic_terms
-- ============================================================
CREATE TABLE academic_terms (
    term_id         BIGSERIAL       PRIMARY KEY,
    term_code       VARCHAR(30)     NOT NULL UNIQUE,
    term_name       VARCHAR(50)     NOT NULL,
    academic_year   VARCHAR(9)      NOT NULL,
    start_date      DATE,
    end_date        DATE
);

-- ============================================================
-- 8. BẢNG course_sections
-- ============================================================
CREATE TABLE course_sections (
    section_id      BIGSERIAL       PRIMARY KEY,
    section_code    VARCHAR(30)     NOT NULL,
    course_id       BIGINT          NOT NULL REFERENCES courses(course_id),
    lecturer_id     BIGINT          NOT NULL REFERENCES lecturers(lecturer_id),
    term_id         BIGINT          NOT NULL REFERENCES academic_terms(term_id),
    UNIQUE (section_code, term_id)
);

-- ============================================================
-- 9. BẢNG import_batches
-- ============================================================
CREATE TABLE import_batches (
    import_batch_id         BIGSERIAL       PRIMARY KEY,
    term_id                 BIGINT          NOT NULL UNIQUE REFERENCES academic_terms(term_id),
    file_name               VARCHAR(255)    NOT NULL,
    file_type               VARCHAR(10)     NOT NULL,
    uploaded_by             BIGINT          NOT NULL REFERENCES users(user_id),
    uploaded_import_batch   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    total_rows              INTEGER         NOT NULL,
    valid_rows              INTEGER         NOT NULL,
    error_rows              INTEGER         NOT NULL,
    file_checksum           VARCHAR(128)
);

-- ============================================================
-- 10. BẢNG course_enrollments
-- ============================================================
CREATE TABLE course_enrollments (
    enrollment_id               BIGSERIAL   PRIMARY KEY,
    student_id                  BIGINT      NOT NULL REFERENCES student_profiles(student_id),
    section_id                  BIGINT      NOT NULL REFERENCES course_sections(section_id),
    import_batch_id             BIGINT      NOT NULL REFERENCES import_batches(import_batch_id),
    created_course_enrollments  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, section_id)
);

-- ============================================================
-- 11. BẢNG sentiment_labels
-- ============================================================
CREATE TABLE sentiment_labels (
    sentiment_id    SMALLSERIAL     PRIMARY KEY,
    sentiment_code  VARCHAR(20)     NOT NULL UNIQUE,
    sentiment_name  VARCHAR(50)     NOT NULL,
    description     TEXT
);

-- ============================================================
-- 12. BẢNG topic_labels
-- ============================================================
CREATE TABLE topic_labels (
    topic_id        BIGSERIAL       PRIMARY KEY,
    topic_code      VARCHAR(30)     NOT NULL UNIQUE,
    topic_name      VARCHAR(100)    NOT NULL,
    description     TEXT,
    status_topic    VARCHAR(20)     NOT NULL DEFAULT 'active' CHECK (status_topic IN ('active', 'inactive'))
);

-- ============================================================
-- 13. BẢNG survey_templates
-- ============================================================
CREATE TABLE survey_templates (
    template_id             BIGSERIAL       PRIMARY KEY,
    template_name           VARCHAR(200)    NOT NULL,
    term_id                 BIGINT          NOT NULL UNIQUE REFERENCES academic_terms(term_id),
    version_number          INTEGER         NOT NULL DEFAULT 1,
    status_survey_template  VARCHAR(20)     NOT NULL DEFAULT 'draft'
                                CHECK (status_survey_template IN ('draft', 'active', 'archived')),
    created_by              BIGINT          REFERENCES users(user_id),
    created_survey_templates TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 14. BẢNG survey_questions
-- ============================================================
CREATE TABLE survey_questions (
    question_id     BIGSERIAL       PRIMARY KEY,
    template_id     BIGINT          NOT NULL REFERENCES survey_templates(template_id),
    question_code   VARCHAR(30)     NOT NULL UNIQUE,
    question_text   TEXT            NOT NULL,
    question_type   VARCHAR(30)     NOT NULL CHECK (question_type IN ('rating', 'text', 'single_choice', 'multiple_choice')),
    topic_id        BIGINT          REFERENCES topic_labels(topic_id),
    is_required     BOOLEAN         NOT NULL DEFAULT TRUE,
    display_order   INTEGER         NOT NULL,
    options_json    JSONB,
    min_value       NUMERIC(5,2),
    max_value       NUMERIC(5,2),
    created_question TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 15. BẢNG survey_campaigns
-- ============================================================
CREATE TABLE survey_campaigns (
    campaign_id             BIGSERIAL       PRIMARY KEY,
    term_id                 BIGINT          NOT NULL UNIQUE REFERENCES academic_terms(term_id),
    template_id             BIGINT          NOT NULL REFERENCES survey_templates(template_id),
    campaign_name           VARCHAR(200)    NOT NULL,
    start_survey_campaigns  TIMESTAMPTZ     NOT NULL,
    end_survey_campaigns    TIMESTAMPTZ     NOT NULL,
    status                  VARCHAR(20)     NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft', 'scheduled', 'open', 'closed')),
    created_by              BIGINT          REFERENCES users(user_id),
    created_survey_campaigns TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 16. BẢNG survey_assignments
-- ============================================================
CREATE TABLE survey_assignments (
    assignment_id               BIGSERIAL   PRIMARY KEY,
    campaign_id                 BIGINT      NOT NULL REFERENCES survey_campaigns(campaign_id),
    enrollment_id               BIGINT      NOT NULL REFERENCES course_enrollments(enrollment_id),
    status_survey_assignment    VARCHAR(20) NOT NULL DEFAULT 'not_started'
                                    CHECK (status_survey_assignment IN ('not_started', 'in_progress', 'completed')),
    assigned_survey_assignment  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_survey_assignment TIMESTAMPTZ,
    UNIQUE (campaign_id, enrollment_id)
);

-- ============================================================
-- 17. BẢNG survey_responses
-- ============================================================
CREATE TABLE survey_responses (
    response_id             BIGSERIAL       PRIMARY KEY,
    assignment_id           BIGINT          NOT NULL UNIQUE REFERENCES survey_assignments(assignment_id),
    response_status         VARCHAR(20)     NOT NULL DEFAULT 'draft'
                                CHECK (response_status IN ('draft', 'submitted')),
    started_survey_response     TIMESTAMPTZ,
    last_saved_survey_response  TIMESTAMPTZ,
    submitted_survey_response   TIMESTAMPTZ,
    created_survey_response     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_survey_response     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 18. BẢNG survey_answers
-- ============================================================
CREATE TABLE survey_answers (
    answer_id           BIGSERIAL       PRIMARY KEY,
    response_id         BIGINT          NOT NULL REFERENCES survey_responses(response_id),
    question_id         BIGINT          NOT NULL REFERENCES survey_questions(question_id),
    answer_text         TEXT,
    answer_number       NUMERIC(6,2),
    answer_json         JSONB,
    created_survey_answer   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_survey_answer   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (response_id, question_id)
);

-- ============================================================
-- 19. BẢNG feedback_analyses
-- ============================================================
CREATE TABLE feedback_analyses (
    analysis_id             BIGSERIAL       PRIMARY KEY,
    answer_id               BIGINT          NOT NULL UNIQUE REFERENCES survey_answers(answer_id),
    cleaned_text            TEXT,
    sentiment_id            SMALLINT        REFERENCES sentiment_labels(sentiment_id),
    sentiment_confidence    NUMERIC(5,4),
    model_version           VARCHAR(100)
);

-- ============================================================
-- 20. BẢNG feedback_topics
-- ============================================================
CREATE TABLE feedback_topics (
    analysis_id         BIGINT          NOT NULL REFERENCES feedback_analyses(analysis_id),
    topic_id            BIGINT          NOT NULL REFERENCES topic_labels(topic_id),
    topic_confidence    NUMERIC(5,4),
    PRIMARY KEY (analysis_id, topic_id)
);

-- ============================================================
-- 21. BẢNG contact_requests
-- ============================================================
CREATE TABLE contact_requests (
    request_id              BIGSERIAL       PRIMARY KEY,
    user_id                 BIGINT          NOT NULL REFERENCES users(user_id),
    request_type            VARCHAR(50)     NOT NULL,
    subject                 VARCHAR(200),
    content_contact_request TEXT            NOT NULL,
    status_contact_request  VARCHAR(30)     NOT NULL DEFAULT 'pending'
                                CHECK (status_contact_request IN ('pending', 'in_progress', 'resolved', 'closed')),
    assigned_admin_id       BIGINT          REFERENCES users(user_id),
    admin_note              TEXT,
    created_contact_request TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    resolved_contact_request TIMESTAMPTZ
);

-- ============================================================
-- 22. BẢNG notifications
-- ============================================================
CREATE TABLE notifications (
    notification_id     BIGSERIAL       PRIMARY KEY,
    user_id             BIGINT          REFERENCES users(user_id),
    title               VARCHAR(200)    NOT NULL,
    content_notification TEXT           NOT NULL,
    notification_type   VARCHAR(30)     NOT NULL,
    is_read             BOOLEAN         NOT NULL DEFAULT FALSE,
    created_notification TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEX — Tăng tốc truy vấn thường dùng
-- ============================================================

-- users
CREATE INDEX idx_users_email     ON users(email);
CREATE INDEX idx_users_role      ON users(role);

-- student_profiles
CREATE INDEX idx_student_code    ON student_profiles(student_code);
CREATE INDEX idx_student_class   ON student_profiles(class_id);

-- student_classes
CREATE INDEX idx_class_faculty   ON student_classes(faculty_id);

-- lecturers
CREATE INDEX idx_lecturer_faculty ON lecturers(faculty_id);

-- course_sections
CREATE INDEX idx_section_course  ON course_sections(course_id);
CREATE INDEX idx_section_term    ON course_sections(term_id);
CREATE INDEX idx_section_lect    ON course_sections(lecturer_id);

-- course_enrollments
CREATE INDEX idx_enroll_student  ON course_enrollments(student_id);
CREATE INDEX idx_enroll_section  ON course_enrollments(section_id);

-- survey_assignments
CREATE INDEX idx_assign_campaign ON survey_assignments(campaign_id);
CREATE INDEX idx_assign_status   ON survey_assignments(status_survey_assignment);

-- survey_answers
CREATE INDEX idx_answer_response ON survey_answers(response_id);

-- feedback_analyses
CREATE INDEX idx_fa_sentiment    ON feedback_analyses(sentiment_id);

-- feedback_topics
CREATE INDEX idx_ft_topic        ON feedback_topics(topic_id);

-- notifications
CREATE INDEX idx_notif_user      ON notifications(user_id);
CREATE INDEX idx_notif_read      ON notifications(is_read);