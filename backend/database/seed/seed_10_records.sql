-- ============================================================================
-- SCRIPT INSERT TOÀN BỘ DỮ LIỆU MẪU CHUẨN HOÁ HỆ THỐNG KHẢO SÁT TVU
-- Thứ tự: Bảng độc lập / Danh mục trước -> Bảng liên kết nghiệp vụ sau
-- Mật khẩu mặc định cho tất cả các tài khoản: 123456
-- ============================================================================

-- ============================================================
-- 1. BẢNG NHÃN CẢM XÚC (sentiment_labels)
-- ============================================================
INSERT INTO sentiment_labels (sentiment_code, sentiment_name, description) VALUES
('positive', 'Tích cực',   'Phản hồi thể hiện sự hài lòng, tích cực về học phần'),
('neutral',  'Trung tính', 'Phản hồi không rõ cảm xúc hoặc mang tính khách quan'),
('negative', 'Tiêu cực',   'Phản hồi thể hiện sự không hài lòng hoặc có vấn đề')
ON CONFLICT (sentiment_code) DO NOTHING;


-- ============================================================
-- 2. BẢNG CHỦ ĐỀ PHẢN HỒI (topic_labels)
-- ============================================================
INSERT INTO topic_labels (topic_code, topic_name, description, status_topic) VALUES
('content',     'Nội dung môn học',         'Phản hồi về nội dung, kiến thức, chương trình môn học', 'active'),
('teaching',    'Phương pháp giảng dạy',    'Phản hồi về cách giảng, truyền đạt của giảng viên', 'active'),
('material',    'Tài liệu học tập',         'Phản hồi về giáo trình, tài liệu tham khảo', 'active'),
('assignment',  'Bài tập',                  'Phản hồi về bài tập về nhà, bài tập nhóm', 'active'),
('practice',    'Thực hành',                'Phản hồi về buổi thực hành, thí nghiệm, lab', 'active'),
('assessment',  'Kiểm tra – Đánh giá',      'Phản hồi về bài kiểm tra, thi, cách đánh giá', 'active'),
('other',       'Vấn đề khác',              'Các phản hồi không thuộc các chủ đề trên', 'active')
ON CONFLICT (topic_code) DO NOTHING;


-- ============================================================
-- 3. BẢNG KHOA / TRƯỜNG TRỰC THUỘC (faculties)
-- ============================================================
INSERT INTO faculties (faculty_code, faculty_name, description, status) VALUES
('SET',     'Trường Kỹ thuật và Công nghệ', 'Đơn vị đào tạo khối kỹ thuật và công nghệ TVU', 'active'),
('CNTT',    'Khoa Công nghệ Thông tin',     'Đào tạo ngành CNTT, Trí tuệ nhân tạo', 'active'),
('KTHH',    'Khoa Kỹ thuật Hóa học',       'Đào tạo ngành Hóa học', 'active'),
('KTXD',    'Khoa Xây dựng',               'Đào tạo ngành Xây dựng', 'active'),
('CKDL',    'Khoa Cơ khí - Động lực',       'Đào tạo ngành Cơ khí', 'active'),
('DDT',     'Khoa Điện - Điện tử',          'Đào tạo ngành Điện công nghiệp, Tự động hóa', 'active'),
('MT',      'Khoa Môi trường',              'Đào tạo ngành về môi trường', 'active')
ON CONFLICT (faculty_code) DO NOTHING;


-- ============================================================
-- 4. BẢNG LỚP SINH VIÊN (student_classes)
-- ============================================================
INSERT INTO student_classes (class_code, class_name, faculty_id, status) VALUES
('DA23TTB', 'Đại học Công nghệ thông tin B khóa 2023', (SELECT faculty_id FROM faculties WHERE faculty_code = 'CNTT' LIMIT 1), 'active'),
('DA23TTA', 'Đại học Công nghệ thông tin A khóa 2023', (SELECT faculty_id FROM faculties WHERE faculty_code = 'CNTT' LIMIT 1), 'active'),
('DA23TTC', 'Đại học Công nghệ thông tin C khóa 2023', (SELECT faculty_id FROM faculties WHERE faculty_code = 'CNTT' LIMIT 1), 'active'),
('DA23TTD', 'Đại học Công nghệ thông tin D khóa 2023', (SELECT faculty_id FROM faculties WHERE faculty_code = 'CNTT' LIMIT 1), 'active'),
('DA22TT',  'Đại học Công nghệ thông tin khóa 2022',   (SELECT faculty_id FROM faculties WHERE faculty_code = 'CNTT' LIMIT 1), 'active'),
('DA21TT',  'Đại học Công nghệ thông tin khóa 2021',   (SELECT faculty_id FROM faculties WHERE faculty_code = 'CNTT' LIMIT 1), 'active'),
('DA23KTA', 'Đại học Kỹ thuật Kỹ sư A khóa 2023',      (SELECT faculty_id FROM faculties WHERE faculty_code = 'SET' LIMIT 1),  'active'),
('DA23XD',  'Đại học Kỹ thuật xây dựng khóa 2023',     (SELECT faculty_id FROM faculties WHERE faculty_code = 'KTXD' LIMIT 1), 'active')
ON CONFLICT (class_code) DO NOTHING;


-- ============================================================
-- 5. BẢNG HỌC KỲ (academic_terms - 10 học kỳ)
-- ============================================================
INSERT INTO academic_terms (term_code, term_name, academic_year, start_date, end_date) VALUES
('HK1_2024_2025', 'Học kỳ I',   '2024-2025', '2024-09-01', '2025-01-15'),
('HK2_2024_2025', 'Học kỳ II',  '2024-2025', '2025-01-20', '2025-06-30'),
('HK3_2024_2025', 'Học kỳ Hè', '2024-2025', '2025-07-05', '2025-08-25'),
('HK1_2025_2026', 'Học kỳ I',   '2025-2026', '2025-09-05', '2026-01-15'),
('HK2_2025_2026', 'Học kỳ II',  '2025-2026', '2026-01-20', '2026-06-30'),
('HK3_2025_2026', 'Học kỳ Hè', '2025-2026', '2026-07-05', '2026-08-25'),
('HK1_2026_2027', 'Học kỳ I',   '2026-2027', '2026-08-15', '2027-01-15'),
('HK2_2026_2027', 'Học kỳ II',  '2026-2027', '2027-01-20', '2027-06-30'),
('HK3_2026_2027', 'Học kỳ Hè', '2026-2027', '2027-07-05', '2027-08-25'),
('HK1_2027_2028', 'Học kỳ I',   '2027-2028', '2027-09-01', '2028-01-15')
ON CONFLICT (term_code) DO NOTHING;


-- ============================================================
-- 6. BẢNG TÀI KHOẢN (users - 1 Admin + Sinh viên, Mật khẩu: 123456)
-- ============================================================
INSERT INTO users (email, password_hash, role, must_change_password) VALUES
('admin@tvu.edu.vn',       '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'admin', false),
('110123081@st.tvu.edu.vn', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'student', false),
('110121045@st.tvu.edu.vn', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'student', false),
('110123002@st.tvu.edu.vn', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'student', false),
('110123015@st.tvu.edu.vn', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'student', false),
('110123028@st.tvu.edu.vn', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'student', false),
('110123035@st.tvu.edu.vn', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'student', false),
('110123049@st.tvu.edu.vn', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'student', false),
('110123055@st.tvu.edu.vn', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'student', false),
('110123062@st.tvu.edu.vn', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'student', false),
('110123078@st.tvu.edu.vn', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'student', false)
ON CONFLICT (email) DO NOTHING;


-- ============================================================
-- 7. BẢNG HỒ SƠ SINH VIÊN (student_profiles)
-- ============================================================
INSERT INTO student_profiles (student_id, student_code, full_name, class_id, date_of_birth, phone_student, gender_student)
SELECT u.user_id, '110123081', 'Nguyễn Thị Thúy Duy', c.class_id, '2005-01-15', '0912345678', 'Nữ'
FROM users u, student_classes c WHERE u.email = '110123081@st.tvu.edu.vn' AND c.class_code = 'DA23TTB'
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO student_profiles (student_id, student_code, full_name, class_id, date_of_birth, phone_student, gender_student)
SELECT u.user_id, '110121045', 'Nguyễn Minh Anh', c.class_id, '2003-10-15', '0918765432', 'Nữ'
FROM users u, student_classes c WHERE u.email = '110121045@st.tvu.edu.vn' AND c.class_code = 'DA23TTB'
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO student_profiles (student_id, student_code, full_name, class_id, date_of_birth, phone_student, gender_student)
SELECT u.user_id, '110123002', 'Trần Quốc Bảo', c.class_id, '2005-03-22', '0933112233', 'Nam'
FROM users u, student_classes c WHERE u.email = '110123002@st.tvu.edu.vn' AND c.class_code = 'DA23TTB'
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO student_profiles (student_id, student_code, full_name, class_id, date_of_birth, phone_student, gender_student)
SELECT u.user_id, '110123015', 'Lê Thị Cẩm Tiên', c.class_id, '2005-07-10', '0944223344', 'Nữ'
FROM users u, student_classes c WHERE u.email = '110123015@st.tvu.edu.vn' AND c.class_code = 'DA23TTA'
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO student_profiles (student_id, student_code, full_name, class_id, date_of_birth, phone_student, gender_student)
SELECT u.user_id, '110123028', 'Phạm Hoàng Dũng', c.class_id, '2005-11-05', '0966334455', 'Nam'
FROM users u, student_classes c WHERE u.email = '110123028@st.tvu.edu.vn' AND c.class_code = 'DA23TTA'
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO student_profiles (student_id, student_code, full_name, class_id, date_of_birth, phone_student, gender_student)
SELECT u.user_id, '110123035', 'Võ Hồng Gấm', c.class_id, '2004-05-18', '0977445566', 'Nữ'
FROM users u, student_classes c WHERE u.email = '110123035@st.tvu.edu.vn' AND c.class_code = 'DA22TT'
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO student_profiles (student_id, student_code, full_name, class_id, date_of_birth, phone_student, gender_student)
SELECT u.user_id, '110123049', 'Huỳnh Thanh Hùng', c.class_id, '2004-09-30', '0988556677', 'Nam'
FROM users u, student_classes c WHERE u.email = '110123049@st.tvu.edu.vn' AND c.class_code = 'DA22TT'
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO student_profiles (student_id, student_code, full_name, class_id, date_of_birth, phone_student, gender_student)
SELECT u.user_id, '110123055', 'Đặng Thùy Linh', c.class_id, '2005-02-14', '0909667788', 'Nữ'
FROM users u, student_classes c WHERE u.email = '110123055@st.tvu.edu.vn' AND c.class_code = 'DA23KTA'
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO student_profiles (student_id, student_code, full_name, class_id, date_of_birth, phone_student, gender_student)
SELECT u.user_id, '110123062', 'Phan Nhật Nam', c.class_id, '2005-08-25', '0919778899', 'Nam'
FROM users u, student_classes c WHERE u.email = '110123062@st.tvu.edu.vn' AND c.class_code = 'DA23KTA'
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO student_profiles (student_id, student_code, full_name, class_id, date_of_birth, phone_student, gender_student)
SELECT u.user_id, '110123078', 'Bùi Tuyết Phượng', c.class_id, '2003-12-01', '0929889900', 'Nữ'
FROM users u, student_classes c WHERE u.email = '110123078@st.tvu.edu.vn' AND c.class_code = 'DA21TT'
ON CONFLICT (student_id) DO NOTHING;


-- ============================================================
-- 8. BẢNG GIẢNG VIÊN (lecturers - 10 giảng viên)
-- ============================================================
INSERT INTO lecturers (lecturer_code, full_name, email, phone, faculty_id)
SELECT 'GV001', 'ThS. Trương Minh Tuyên', 'tuyen.tm@tvu.edu.vn', '0903112233', faculty_id FROM faculties WHERE faculty_code = 'CNTT'
ON CONFLICT (lecturer_code) DO NOTHING;

INSERT INTO lecturers (lecturer_code, full_name, email, phone, faculty_id)
SELECT 'GV002', 'TS. Phạm Thị Kim Chi', 'chi.ptk@tvu.edu.vn', '0903223344', faculty_id FROM faculties WHERE faculty_code = 'CNTT'
ON CONFLICT (lecturer_code) DO NOTHING;

INSERT INTO lecturers (lecturer_code, full_name, email, phone, faculty_id)
SELECT 'GV003', 'TS. Nguyễn Văn Dũng', 'dung.nv@tvu.edu.vn', '0903334455', faculty_id FROM faculties WHERE faculty_code = 'CNTT'
ON CONFLICT (lecturer_code) DO NOTHING;

INSERT INTO lecturers (lecturer_code, full_name, email, phone, faculty_id)
SELECT 'GV004', 'ThS. Lê Hoàng Nam', 'nam.lh@tvu.edu.vn', '0903445566', faculty_id FROM faculties WHERE faculty_code = 'CNTT'
ON CONFLICT (lecturer_code) DO NOTHING;

INSERT INTO lecturers (lecturer_code, full_name, email, phone, faculty_id)
SELECT 'GV005', 'PGS.TS. Huỳnh Cao Tuấn', 'tuan.hc@tvu.edu.vn', '0903556677', faculty_id FROM faculties WHERE faculty_code = 'CNTT'
ON CONFLICT (lecturer_code) DO NOTHING;

INSERT INTO lecturers (lecturer_code, full_name, email, phone, faculty_id)
SELECT 'GV006', 'ThS. Trần Thị Bé Bảy', 'bay.ttb@tvu.edu.vn', '0903667788', faculty_id FROM faculties WHERE faculty_code = 'CNTT'
ON CONFLICT (lecturer_code) DO NOTHING;

INSERT INTO lecturers (lecturer_code, full_name, email, phone, faculty_id)
SELECT 'GV007', 'TS. Đặng Minh Tuấn', 'tuan.dm@tvu.edu.vn', '0903778899', faculty_id FROM faculties WHERE faculty_code = 'CNTT'
ON CONFLICT (lecturer_code) DO NOTHING;

INSERT INTO lecturers (lecturer_code, full_name, email, phone, faculty_id)
SELECT 'GV008', 'ThS. Nguyễn Thái Sơn', 'son.nt@tvu.edu.vn', '0903889900', faculty_id FROM faculties WHERE faculty_code = 'CNTT'
ON CONFLICT (lecturer_code) DO NOTHING;

INSERT INTO lecturers (lecturer_code, full_name, email, phone, faculty_id)
SELECT 'GV009', 'ThS. Ngô Thanh Huy', 'huy.nt@tvu.edu.vn', '0903990011', faculty_id FROM faculties WHERE faculty_code = 'CNTT'
ON CONFLICT (lecturer_code) DO NOTHING;

INSERT INTO lecturers (lecturer_code, full_name, email, phone, faculty_id)
SELECT 'GV010', 'TS. Võ Phước Hưng', 'hung.vp@tvu.edu.vn', '0903001122', faculty_id FROM faculties WHERE faculty_code = 'CNTT'
ON CONFLICT (lecturer_code) DO NOTHING;


-- ============================================================
-- 9. BẢNG MÔN HỌC (courses - 10 môn học)
-- ============================================================
INSERT INTO courses (course_code, course_name, description) VALUES
('CNTT103', 'Lập trình Web nâng cao', 'HTML5, CSS3, React, RESTful API và Node.js'),
('CNTT108', 'Cơ sở dữ liệu', 'Kiến trúc dữ liệu phân tán, Replication, Sharding'),
('CNTT214', 'Mạng máy tính', 'Giao thức TCP/IP, mã hóa mạng, bảo mật hệ thống'),
('CNTT102', 'Kiến trúc máy tính', 'Tổ chức CPU, tập lệnh ALU, bộ nhớ cache và I/O'),
('CNTT308', 'Trí tuệ nhân tạo', 'Thuật toán tìm kiếm A*, học máy cơ bản, mạng nơ-ron'),
('CNTT201', 'Kỹ thuật lập trình', 'Thuật toán lập trình C, C++'),
('CNTT210', 'Hệ quản trị cơ sở dữ liệu', 'Tối ưu hóa truy vấn SQL, Indexing, Trigger, Transaction'),
('CNTT118', 'Lập trình hướng đối tượng', 'Lập trình hướng đối tượng OOP, Collections, Java Core'),
('CNTT305', 'Phân tích thiết kế hệ thống thông tin', 'Biểu đồ UML, Use Case, Sequence Diagram'),
('CNTT401', 'Công nghệ phần mềm', 'Quy trình Agile Scrum, CI/CD, DevOps căn bản')
ON CONFLICT (course_code) DO NOTHING;


-- ============================================================
-- 10. BẢNG LỚP HỌC PHẦN (course_sections - 10 lớp học phần)
-- ============================================================
INSERT INTO course_sections (section_code, course_id, lecturer_id, term_id)
SELECT '210103_01', c.course_id, l.lecturer_id, t.term_id 
FROM courses c, lecturers l, academic_terms t 
WHERE c.course_code = 'CNTT103' AND l.lecturer_code = 'GV001' AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (section_code, term_id) DO NOTHING;

INSERT INTO course_sections (section_code, course_id, lecturer_id, term_id)
SELECT '210108_02', c.course_id, l.lecturer_id, t.term_id 
FROM courses c, lecturers l, academic_terms t 
WHERE c.course_code = 'CNTT108' AND l.lecturer_code = 'GV002' AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (section_code, term_id) DO NOTHING;

INSERT INTO course_sections (section_code, course_id, lecturer_id, term_id)
SELECT '210115_01', c.course_id, l.lecturer_id, t.term_id 
FROM courses c, lecturers l, academic_terms t 
WHERE c.course_code = 'CNTT214' AND l.lecturer_code = 'GV003' AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (section_code, term_id) DO NOTHING;

INSERT INTO course_sections (section_code, course_id, lecturer_id, term_id)
SELECT '210002_03', c.course_id, l.lecturer_id, t.term_id 
FROM courses c, lecturers l, academic_terms t 
WHERE c.course_code = 'CNTT102' AND l.lecturer_code = 'GV004' AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (section_code, term_id) DO NOTHING;

INSERT INTO course_sections (section_code, course_id, lecturer_id, term_id)
SELECT '210045_01', c.course_id, l.lecturer_id, t.term_id 
FROM courses c, lecturers l, academic_terms t 
WHERE c.course_code = 'CNTT308' AND l.lecturer_code = 'GV005' AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (section_code, term_id) DO NOTHING;

INSERT INTO course_sections (section_code, course_id, lecturer_id, term_id)
SELECT '210099_02', c.course_id, l.lecturer_id, t.term_id 
FROM courses c, lecturers l, academic_terms t 
WHERE c.course_code = 'CNTT201' AND l.lecturer_code = 'GV006' AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (section_code, term_id) DO NOTHING;

INSERT INTO course_sections (section_code, course_id, lecturer_id, term_id)
SELECT '210020_01', c.course_id, l.lecturer_id, t.term_id 
FROM courses c, lecturers l, academic_terms t 
WHERE c.course_code = 'CNTT210' AND l.lecturer_code = 'GV007' AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (section_code, term_id) DO NOTHING;

INSERT INTO course_sections (section_code, course_id, lecturer_id, term_id)
SELECT '210018_02', c.course_id, l.lecturer_id, t.term_id 
FROM courses c, lecturers l, academic_terms t 
WHERE c.course_code = 'CNTT118' AND l.lecturer_code = 'GV008' AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (section_code, term_id) DO NOTHING;

INSERT INTO course_sections (section_code, course_id, lecturer_id, term_id)
SELECT '210305_01', c.course_id, l.lecturer_id, t.term_id 
FROM courses c, lecturers l, academic_terms t 
WHERE c.course_code = 'CNTT305' AND l.lecturer_code = 'GV009' AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (section_code, term_id) DO NOTHING;

INSERT INTO course_sections (section_code, course_id, lecturer_id, term_id)
SELECT '210401_01', c.course_id, l.lecturer_id, t.term_id 
FROM courses c, lecturers l, academic_terms t 
WHERE c.course_code = 'CNTT401' AND l.lecturer_code = 'GV010' AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (section_code, term_id) DO NOTHING;


-- ============================================================
-- 11. BẢNG IMPORT_BATCHES & COURSE_ENROLLMENTS (Đăng ký học phần)
-- ============================================================
INSERT INTO import_batches (term_id, file_name, file_type, uploaded_by, total_rows, valid_rows, error_rows)
SELECT t.term_id, 'Danh_sach_sinh_vien_HK1_2026_2027.xlsx', 'xlsx', u.user_id, 10, 10, 0
FROM academic_terms t, users u 
WHERE t.term_code = 'HK1_2026_2027' AND u.email = 'admin@tvu.edu.vn'
ON CONFLICT (term_id) DO NOTHING;

-- Đăng ký 10 lớp học phần cho sinh viên Nguyễn Thị Thúy Duy (110123081)
INSERT INTO course_enrollments (student_id, section_id, import_batch_id)
SELECT sp.student_id, cs.section_id, ib.import_batch_id
FROM student_profiles sp, course_sections cs, import_batches ib
WHERE sp.student_code = '110123081' 
  AND cs.section_code IN ('210103_01', '210108_02', '210115_01', '210002_03', '210045_01', '210099_02', '210020_01', '210018_02', '210305_01', '210401_01')
  AND ib.file_name = 'Danh_sach_sinh_vien_HK1_2026_2027.xlsx'
ON CONFLICT (student_id, section_id) DO NOTHING;

-- Đăng ký 6 lớp học phần cho sinh viên Nguyễn Minh Anh (110121045)
INSERT INTO course_enrollments (student_id, section_id, import_batch_id)
SELECT sp.student_id, cs.section_id, ib.import_batch_id
FROM student_profiles sp, course_sections cs, import_batches ib
WHERE sp.student_code = '110121045' 
  AND cs.section_code IN ('210103_01', '210108_02', '210115_01', '210002_03', '210045_01', '210099_02')
  AND ib.file_name = 'Danh_sach_sinh_vien_HK1_2026_2027.xlsx'
ON CONFLICT (student_id, section_id) DO NOTHING;


-- ============================================================
-- 12. BẢNG MẪU PHIẾU & 10 CÂU HỎI KHẢO SÁT
-- ============================================================
INSERT INTO survey_templates (template_name, term_id, version_number, status_survey_template, created_by)
SELECT 'Phiếu khảo sát ý kiến sinh viên về hoạt động giảng dạy', t.term_id, 1, 'active', u.user_id
FROM academic_terms t, users u
WHERE t.term_code = 'HK1_2026_2027' AND u.email = 'admin@tvu.edu.vn'
ON CONFLICT (term_id) DO NOTHING;

-- ============================================================
-- Bộ câu hỏi khảo sát đầy đủ theo chuẩn TVU (32 câu)
-- ============================================================

-- ==================== PHẦN A: GIẢNG VIÊN ====================
-- A-I: Thông tin môn học & CLOs
INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order, min_value, max_value)
SELECT st.template_id, 'Q_A_1_1', 'Giảng viên phổ biến rõ ràng đề cương chi tiết và mục tiêu của học phần ngay từ đầu học kỳ.', 'rating', true, 1, 1.0, 5.0
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order, min_value, max_value)
SELECT st.template_id, 'Q_A_1_2', 'Giảng viên giải thích rõ ràng các chuẩn đầu ra học phần (CLO) mà sinh viên cần đạt được.', 'rating', true, 2, 1.0, 5.0
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order, min_value, max_value)
SELECT st.template_id, 'Q_A_1_3', 'Giảng viên hướng dẫn đầy đủ về nội dung học phần, tài liệu học tập và các quy định kiểm tra, đánh giá.', 'rating', true, 3, 1.0, 5.0
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order, min_value, max_value)
SELECT st.template_id, 'Q_A_1_4', 'Giảng viên thực hiện giảng dạy theo đúng kế hoạch và thời khóa biểu đã công bố.', 'rating', true, 4, 1.0, 5.0
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

-- A-II: Phương pháp giảng dạy & thúc đẩy học tập tích cực
INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order, min_value, max_value)
SELECT st.template_id, 'Q_A_1_5', 'Phương pháp giảng dạy của giảng viên giúp sinh viên dễ hiểu và tiếp thu kiến thức.', 'rating', true, 5, 1.0, 5.0
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order, min_value, max_value)
SELECT st.template_id, 'Q_A_1_6', 'Giảng viên khuyến khích sinh viên chủ động tham gia trao đổi, thảo luận và phản biện trong quá trình học tập.', 'rating', true, 6, 1.0, 5.0
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order, min_value, max_value)
SELECT st.template_id, 'Q_A_1_7', 'Giảng viên hướng dẫn sinh viên phương pháp tự học, tự nghiên cứu và giải quyết vấn đề.', 'rating', true, 7, 1.0, 5.0
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order, min_value, max_value)
SELECT st.template_id, 'Q_A_1_8', 'Giảng viên ứng dụng hiệu quả công nghệ thông tin và các hệ thống hỗ trợ dạy học như LMS/TMS trong quá trình giảng dạy.', 'rating', true, 8, 1.0, 5.0
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order, min_value, max_value)
SELECT st.template_id, 'Q_A_1_9', 'Giảng viên tạo điều kiện để sinh viên rèn luyện các kỹ năng mềm như làm việc nhóm, giao tiếp và thuyết trình.', 'rating', true, 9, 1.0, 5.0
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

-- A-III: Kiểm tra, đánh giá & phản hồi kết quả
INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order, min_value, max_value)
SELECT st.template_id, 'Q_A_1_10', 'Các hình thức kiểm tra, đánh giá phù hợp với nội dung và chuẩn đầu ra của học phần.', 'rating', true, 10, 1.0, 5.0
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order, min_value, max_value)
SELECT st.template_id, 'Q_A_1_11', 'Tiêu chí đánh giá và thang điểm được công khai, minh bạch trước khi thực hiện đánh giá.', 'rating', true, 11, 1.0, 5.0
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order, min_value, max_value)
SELECT st.template_id, 'Q_A_1_12', 'Giảng viên công bố kết quả kiểm tra, đánh giá đúng thời hạn.', 'rating', true, 12, 1.0, 5.0
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order, min_value, max_value)
SELECT st.template_id, 'Q_A_1_13', 'Giảng viên cung cấp nhận xét, góp ý giúp sinh viên nhận biết những điểm mạnh và điểm cần cải thiện trong quá trình học tập.', 'rating', true, 13, 1.0, 5.0
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

-- A-IV: Tác phong, thái độ & hỗ trợ sinh viên
INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order, min_value, max_value)
SELECT st.template_id, 'Q_A_1_14', 'Giảng viên thể hiện sự nhiệt tình và trách nhiệm trong quá trình giảng dạy.', 'rating', true, 14, 1.0, 5.0
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order, min_value, max_value)
SELECT st.template_id, 'Q_A_1_15', 'Giảng viên sẵn sàng giải đáp thắc mắc và hỗ trợ sinh viên trong quá trình học tập.', 'rating', true, 15, 1.0, 5.0
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order, min_value, max_value)
SELECT st.template_id, 'Q_A_1_16', 'Giảng viên có thái độ tôn trọng và ứng xử chuẩn mực với sinh viên.', 'rating', true, 16, 1.0, 5.0
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order, min_value, max_value)
SELECT st.template_id, 'Q_A_1_17', 'Giảng viên thể hiện sự công bằng và khách quan trong quá trình giảng dạy, đánh giá sinh viên.', 'rating', true, 17, 1.0, 5.0
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

-- A-V: Đánh giá chung về giảng viên
INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order, min_value, max_value)
SELECT st.template_id, 'Q_A_1_18', 'Bạn hài lòng ở mức độ nào đối với hoạt động giảng dạy của giảng viên trong học phần này?', 'rating', true, 18, 1.0, 5.0
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

-- ==================== PHẦN B: NỘI DUNG MÔN HỌC & HỌC LIỆU ====================
INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order, min_value, max_value)
SELECT st.template_id, 'Q_B_2_1', 'Giáo trình, bài giảng và tài liệu tham khảo của học phần có nội dung phù hợp với kiến thức cần học.', 'rating', true, 19, 1.0, 5.0
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order, min_value, max_value)
SELECT st.template_id, 'Q_B_2_2', 'Tài liệu học tập của học phần được cập nhật và cung cấp đầy đủ cho sinh viên.', 'rating', true, 20, 1.0, 5.0
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order, min_value, max_value)
SELECT st.template_id, 'Q_B_2_3', 'Sinh viên có thể dễ dàng tiếp cận và sử dụng các tài liệu học tập của học phần.', 'rating', true, 21, 1.0, 5.0
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order, min_value, max_value)
SELECT st.template_id, 'Q_B_2_4', 'Bài tập và các hoạt động học tập giúp sinh viên củng cố kiến thức đã học.', 'rating', true, 22, 1.0, 5.0
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order, min_value, max_value)
SELECT st.template_id, 'Q_B_2_5', 'Nội dung bài tập, thảo luận và thực hành có tính ứng dụng thực tiễn.', 'rating', true, 23, 1.0, 5.0
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order, min_value, max_value)
SELECT st.template_id, 'Q_B_2_6', 'Kiến thức và kỹ năng của học phần hữu ích đối với ngành học và định hướng nghề nghiệp của sinh viên.', 'rating', true, 24, 1.0, 5.0
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

-- B-chung: Đánh giá chung về nội dung học phần
INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order, min_value, max_value)
SELECT st.template_id, 'Q_B_2_7', 'Bạn hài lòng ở mức độ nào đối với nội dung và chất lượng của học phần này?', 'rating', true, 25, 1.0, 5.0
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

-- ==================== PHẦN C: KHỐI LƯỢNG & THỜI LƯỢNG HỌC TẬP ====================
INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order, min_value, max_value)
SELECT st.template_id, 'Q_C_3_1', 'Thời lượng dành cho học lý thuyết phù hợp với nội dung kiến thức cần truyền đạt của học phần.', 'rating', true, 26, 1.0, 5.0
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order, min_value, max_value)
SELECT st.template_id, 'Q_C_3_2', 'Thời lượng dành cho các hoạt động thực hành phù hợp với yêu cầu và nội dung học phần.', 'rating', true, 27, 1.0, 5.0
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order, min_value, max_value)
SELECT st.template_id, 'Q_C_3_3', 'Khối lượng công việc và thời gian tự học mà học phần yêu cầu là phù hợp.', 'rating', true, 28, 1.0, 5.0
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

-- C-3.4: Có lựa chọn "Không áp dụng" nên dùng single_choice thay cho rating, is_required = false
INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order, options_json)
SELECT st.template_id, 'Q_C_3_4', 'Thời lượng dành cho hoạt động thực tập, thực tế phù hợp với mục tiêu học phần (nếu có).', 'single_choice', false, 29,
  '["1 - Hoàn toàn không phù hợp", "2 - Không phù hợp", "3 - Bình thường", "4 - Phù hợp", "5 - Hoàn toàn phù hợp", "Không áp dụng"]'::jsonb
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

-- ==================== PHẦN D: Ý KIẾN ĐÓNG GÓP (NLP) ====================
INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order)
SELECT st.template_id, 'Q_D_4_1', 'Những điểm bạn đánh giá tích cực hoặc hài lòng nhất về học phần và hoạt động giảng dạy của giảng viên là gì?', 'text', false, 30
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order)
SELECT st.template_id, 'Q_D_4_2', 'Những khó khăn hoặc hạn chế nào bạn gặp phải trong quá trình học học phần này?', 'text', false, 31
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;

INSERT INTO survey_questions (template_id, question_code, question_text, question_type, is_required, display_order)
SELECT st.template_id, 'Q_D_4_3', 'Bạn có đề xuất gì để cải thiện chất lượng giảng dạy và học phần trong các học kỳ tiếp theo?', 'text', false, 32
FROM survey_templates st, academic_terms t WHERE st.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
ON CONFLICT (question_code) DO NOTHING;


-- ============================================================
-- 13. BẢNG ĐỢT KHẢO SÁT & PHÂN CÔNG (survey_campaigns & survey_assignments)
-- ============================================================
INSERT INTO survey_campaigns (term_id, template_id, campaign_name, start_survey_campaigns, end_survey_campaigns, status, created_by)
SELECT t.term_id, st.template_id, 'Khảo sát ý kiến sinh viên Học kỳ I (2026 - 2027)', NOW() - INTERVAL '10 days', NOW() + INTERVAL '25 days', 'open', u.user_id
FROM academic_terms t, survey_templates st, users u
WHERE t.term_code = 'HK1_2026_2027' AND st.term_id = t.term_id AND u.email = 'admin@tvu.edu.vn'
ON CONFLICT (term_id) DO NOTHING;

-- Phân công khảo sát cho sinh viên Nguyễn Thị Thúy Duy (110123081)
INSERT INTO survey_assignments (campaign_id, enrollment_id, status_survey_assignment)
SELECT sc.campaign_id, ce.enrollment_id, 'not_started'
FROM survey_campaigns sc, course_enrollments ce, student_profiles sp, academic_terms t
WHERE sc.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
  AND ce.student_id = sp.student_id AND sp.student_code = '110123081'
ON CONFLICT (campaign_id, enrollment_id) DO NOTHING;

-- Phân công khảo sát cho sinh viên Nguyễn Minh Anh (110121045)
INSERT INTO survey_assignments (campaign_id, enrollment_id, status_survey_assignment)
SELECT sc.campaign_id, ce.enrollment_id, 'not_started'
FROM survey_campaigns sc, course_enrollments ce, student_profiles sp, academic_terms t
WHERE sc.term_id = t.term_id AND t.term_code = 'HK1_2026_2027'
  AND ce.student_id = sp.student_id AND sp.student_code = '110121045'
ON CONFLICT (campaign_id, enrollment_id) DO NOTHING;


-- ============================================================
-- 14. BẢNG THÔNG BÁO (notifications - 10 thông báo)
-- ============================================================
INSERT INTO notifications (title, content_notification, notification_type, is_read) VALUES
('Thông báo mở đợt khảo sát ý kiến sinh viên Học kỳ mới', 'Phòng Đảm bảo chất lượng thông báo mở đợt khảo sát đánh giá giảng viên. Sinh viên vui lòng hoàn thành trước ngày hết hạn.', 'survey', false),
('Quy định mở khóa điểm tổng kết học phần', 'Sinh viên hoàn thành 100% phiếu khảo sát sẽ được tự động mở điểm thi học phần trên TVU Student Portal.', 'deadline', false),
('Bảo mật thông tin sinh viên tham gia khảo sát', 'Nhà trường cam kết bảo mật 100% danh tính người tham gia khảo sát. Ý kiến đóng góp được ẩn danh hoàn toàn.', 'general', false),
('Nhắc nhở hạn chót khảo sát môn Lập trình Web', 'Chỉ còn 5 ngày nữa sẽ kết thúc thời gian khảo sát học phần Lập trình Web nâng cao. Sinh viên chưa làm vui lòng hoàn thiện sớm.', 'deadline', false),
('Cập nhật tính năng lưu nháp phiếu khảo sát', 'Hệ thống đã bổ sung tính năng tự động lưu nháp câu trả lời, giúp sinh viên yên tâm khi làm bài khảo sát dài.', 'general', false),
('Lịch thi kết thúc học phần và điều kiện dự thi', 'Phòng Đào tạo công bố lịch thi chính thức. Sinh viên lưu ý hoàn thành nghĩa vụ học vụ và khảo sát đúng hạn.', 'general', false),
('Hỗ trợ sinh viên giải đáp thắc mắc về phiếu khảo sát', 'Mọi sai sót về danh sách môn học hoặc giảng viên phụ trách, vui lòng gửi phản hồi qua mục Gửi hỗ trợ trên hệ thống.', 'support', false),
('Tổng kết kết quả khảo sát học kỳ trước', 'Nhà trường trân trọng cảm ơn các ý kiến đóng góp quý báu của sinh viên, nhiều cơ sở vật chất đã được nâng cấp.', 'survey', false),
('Hướng dẫn thực hiện khảo sát trên thiết bị di động', 'Hệ thống khảo sát đã được tối ưu hiển thị tốt trên điện thoại thông minh, sinh viên có thể làm bài mọi lúc mọi nơi.', 'general', false),
('Cảnh báo an toàn tài khoản sinh viên TVU', 'Khuyến cáo sinh viên đổi mật khẩu định kỳ và không chia sẻ tài khoản cá nhân cho người khác.', 'general', false);


-- ============================================================
-- 15. BẢNG YÊU CẦU HỖ TRỢ (contact_requests - 10 ticket)
-- ============================================================
INSERT INTO contact_requests (user_id, request_type, subject, content_contact_request, status_contact_request, admin_note, resolved_contact_request)
SELECT u.user_id, 'Lỗi kỹ thuật hệ thống', 'Không thể bấm nút gửi khảo sát môn Lập trình Web', 'Em làm bài xong nhưng bấm nút Gửi khảo sát thì bị quay vòng tròn mãi không chuyển trang.', 'resolved', 'Em vui lòng kiểm tra lại kết nối mạng và bấm gửi lại nhé, hệ thống đã mở khóa tiến trình cho em.', NOW()
FROM users u WHERE u.email = '110123081@st.tvu.edu.vn';

INSERT INTO contact_requests (user_id, request_type, subject, content_contact_request, status_contact_request, admin_note, resolved_contact_request)
SELECT u.user_id, 'Sai lệch danh sách học phần', 'Không thấy hiển thị khảo sát môn Triết học Mác - Lênin', 'Em kiểm tra danh sách môn nhưng không thấy môn Triết học dù em đã đăng ký học phần đầy đủ.', 'resolved', 'Hệ thống đã cập nhật bổ sung học phần cho em, em vào mục Khảo sát của tôi để làm nhé!', NOW()
FROM users u WHERE u.email = '110123081@st.tvu.edu.vn';

INSERT INTO contact_requests (user_id, request_type, subject, content_contact_request, status_contact_request, admin_note, resolved_contact_request)
SELECT u.user_id, 'Lỗi kỹ thuật hệ thống', 'Lỗi tải ảnh minh chứng đề tài nghiên cứu khoa học', 'Khi bấm tải ảnh minh chứng lên thì báo lỗi quá dung lượng dù file chỉ có 1.5MB.', 'in_progress', 'Kỹ thuật viên đang kiểm tra lại dung lượng upload server.', NULL
FROM users u WHERE u.email = '110123081@st.tvu.edu.vn';

INSERT INTO contact_requests (user_id, request_type, subject, content_contact_request, status_contact_request, admin_note, resolved_contact_request)
SELECT u.user_id, 'Góp ý giao diện', 'Đề xuất hiển thị số lượng câu hỏi đã hoàn thành trên thanh tiến trình', 'Em mong muốn có hiển thị số câu trả lời / tổng số câu để dễ theo dõi.', 'resolved', 'Cảm ơn em đã góp ý, tính năng này đã được cập nhật trên giao diện mới.', NOW()
FROM users u WHERE u.email = '110123081@st.tvu.edu.vn';

INSERT INTO contact_requests (user_id, request_type, subject, content_contact_request, status_contact_request, admin_note, resolved_contact_request)
SELECT u.user_id, 'Thắc mắc về điểm thi', 'Sau khi hoàn thành khảo sát bao lâu thì xem được điểm thi?', 'Em đã làm đủ các phiếu khảo sát rồi thì khi nào điểm trên cổng sinh viên mới mở vậy ạ?', 'resolved', 'Điểm thi sẽ tự động đồng bộ sang cổng sinh viên trong vòng 30 phút sau khi hoàn thành.', NOW()
FROM users u WHERE u.email = '110123081@st.tvu.edu.vn';

INSERT INTO contact_requests (user_id, request_type, subject, content_contact_request, status_contact_request, admin_note, resolved_contact_request)
SELECT u.user_id, 'Sai lệch danh sách học phần', 'Sai tên giảng viên phụ trách môn Cơ sở dữ liệu', 'Học phần này kỳ này lớp em học cô Chi chứ không phải thầy Tuấn ạ.', 'resolved', 'Phòng Đào tạo đã hiệu chỉnh lại đúng tên giảng viên phụ trách.', NOW()
FROM users u WHERE u.email = '110123081@st.tvu.edu.vn';

INSERT INTO contact_requests (user_id, request_type, subject, content_contact_request, status_contact_request, admin_note, resolved_contact_request)
SELECT u.user_id, 'Lỗi kỹ thuật hệ thống', 'Mất kết nối mạng khi đang làm dở bài khảo sát', 'Em đang làm dở bị rớt mạng thì câu trả lời trước đó có bị mất không ạ?', 'resolved', 'Hệ thống có chế độ Lưu bản nháp tự động nên toàn bộ câu trả lời trước đó đều được giữ nguyên.', NOW()
FROM users u WHERE u.email = '110123081@st.tvu.edu.vn';

INSERT INTO contact_requests (user_id, request_type, subject, content_contact_request, status_contact_request, admin_note, resolved_contact_request)
SELECT u.user_id, 'Vấn đề khác', 'Xin cấp lại mật khẩu tài khoản khảo sát', 'Em lỡ quên mật khẩu đăng nhập tài khoản sinh viên khảo sát.', 'resolved', 'Mật khẩu đã được cấp lại mặc định là 123456, em vui lòng đăng nhập và đổi mật khẩu mới.', NOW()
FROM users u WHERE u.email = '110123081@st.tvu.edu.vn';

INSERT INTO contact_requests (user_id, request_type, subject, content_contact_request, status_contact_request, admin_note, resolved_contact_request)
SELECT u.user_id, 'Góp ý giao diện', 'Đề xuất thêm chế độ Dark Mode trên điện thoại', 'Giao diện dùng buổi tối hơi chói, mong nhà trường xem xét thêm chế độ nền tối.', 'pending', 'Ý kiến của em đã được chuyển sang ban phát triển phần mềm.', NULL
FROM users u WHERE u.email = '110123081@st.tvu.edu.vn';

INSERT INTO contact_requests (user_id, request_type, subject, content_contact_request, status_contact_request, admin_note, resolved_contact_request)
SELECT u.user_id, 'Bảo mật thông tin', 'Hỏi về tính ẩn danh của câu nhận xét tự do', 'Phần nhận xét tự do viết văn bản thì giảng viên có biết MSSV của em không?', 'resolved', 'Hoàn toàn ẩn danh 100%, giảng viên chỉ đọc được nội dung nhận xét đã xóa mọi thông tin định danh.', NOW()
FROM users u WHERE u.email = '110123081@st.tvu.edu.vn';


-- ============================================================
-- 16. KIỂM TRA SỐ LƯỢNG BẢN GHI ĐÃ NẠP
-- ============================================================
SELECT 'sentiment_labels' AS bang, COUNT(*) AS so_luong FROM sentiment_labels
UNION ALL SELECT 'topic_labels',       COUNT(*) FROM topic_labels
UNION ALL SELECT 'faculties',          COUNT(*) FROM faculties
UNION ALL SELECT 'student_classes',    COUNT(*) FROM student_classes
UNION ALL SELECT 'academic_terms',     COUNT(*) FROM academic_terms
UNION ALL SELECT 'users',              COUNT(*) FROM users
UNION ALL SELECT 'student_profiles',   COUNT(*) FROM student_profiles
UNION ALL SELECT 'lecturers',          COUNT(*) FROM lecturers
UNION ALL SELECT 'courses',            COUNT(*) FROM courses
UNION ALL SELECT 'course_sections',    COUNT(*) FROM course_sections
UNION ALL SELECT 'course_enrollments', COUNT(*) FROM course_enrollments
UNION ALL SELECT 'survey_templates',   COUNT(*) FROM survey_templates
UNION ALL SELECT 'survey_questions',   COUNT(*) FROM survey_questions
UNION ALL SELECT 'survey_campaigns',   COUNT(*) FROM survey_campaigns
UNION ALL SELECT 'survey_assignments', COUNT(*) FROM survey_assignments
UNION ALL SELECT 'notifications',      COUNT(*) FROM notifications
UNION ALL SELECT 'contact_requests',   COUNT(*) FROM contact_requests;



-- ============================================================
-- 16. KIỂM TRA SỐ LƯỢNG BẢN GHI ĐÃ NẠP
-- ============================================================
SELECT 'sentiment_labels' AS bang, COUNT(*) AS so_luong FROM sentiment_labels
UNION ALL SELECT 'topic_labels',       COUNT(*) FROM topic_labels
UNION ALL SELECT 'faculties',          COUNT(*) FROM faculties
UNION ALL SELECT 'student_classes',    COUNT(*) FROM student_classes
UNION ALL SELECT 'academic_terms',     COUNT(*) FROM academic_terms
UNION ALL SELECT 'users',              COUNT(*) FROM users
UNION ALL SELECT 'student_profiles',   COUNT(*) FROM student_profiles
UNION ALL SELECT 'lecturers',          COUNT(*) FROM lecturers
UNION ALL SELECT 'courses',            COUNT(*) FROM courses
UNION ALL SELECT 'course_sections',    COUNT(*) FROM course_sections
UNION ALL SELECT 'course_enrollments', COUNT(*) FROM course_enrollments
UNION ALL SELECT 'survey_templates',   COUNT(*) FROM survey_templates
UNION ALL SELECT 'survey_questions',   COUNT(*) FROM survey_questions
UNION ALL SELECT 'survey_campaigns',   COUNT(*) FROM survey_campaigns
UNION ALL SELECT 'survey_assignments', COUNT(*) FROM survey_assignments
UNION ALL SELECT 'notifications',      COUNT(*) FROM notifications
UNION ALL SELECT 'contact_requests',   COUNT(*) FROM contact_requests;