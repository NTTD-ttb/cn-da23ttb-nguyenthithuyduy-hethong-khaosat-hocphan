-- Chạy dữ liệu mẫu
-- ============================================================
-- 1. Nhãn cảm xúc (sentiment_labels)
-- ============================================================
INSERT INTO sentiment_labels (sentiment_code, sentiment_name, description) VALUES
('positive', 'Tích cực',   'Phản hồi thể hiện sự hài lòng, tích cực về học phần'),
('neutral',  'Trung tính', 'Phản hồi không rõ cảm xúc hoặc mang tính khách quan'),
('negative', 'Tiêu cực',   'Phản hồi thể hiện sự không hài lòng hoặc có vấn đề');

-- ============================================================
-- 2. Nhãn chủ đề (topic_labels)
-- ============================================================
INSERT INTO topic_labels (topic_code, topic_name, description, status_topic) VALUES
('content',     'Nội dung môn học',         'Phản hồi về nội dung, kiến thức, chương trình môn học', 'active'),
('teaching',    'Phương pháp giảng dạy',    'Phản hồi về cách giảng, truyền đạt của giảng viên', 'active'),
('material',    'Tài liệu học tập',         'Phản hồi về giáo trình, tài liệu tham khảo', 'active'),
('assignment',  'Bài tập',                  'Phản hồi về bài tập về nhà, bài tập nhóm', 'active'),
('practice',    'Thực hành',                'Phản hồi về buổi thực hành, thí nghiệm, lab', 'active'),
('assessment',  'Kiểm tra – Đánh giá',      'Phản hồi về bài kiểm tra, thi, cách đánh giá', 'active'),
('other',       'Vấn đề khác',              'Các phản hồi không thuộc các chủ đề trên', 'active');

-- ============================================================
-- 3. Khoa (faculties) — dữ liệu Trường Kỹ thuật và Công nghệ TVU
-- ============================================================
INSERT INTO faculties (faculty_code, faculty_name, description, status) VALUES
('CNTT',    'Khoa Công nghệ Thông tin','Đào tạo ngành CNTT, Trí tuệ nhân tạo', 'active'),
('KTHH',    'Khoa Kỹ thuật Hóa học', 'Đào tạo ngành Hóa học', 'active'),
('KTXD',    'Khoa Xây dựng', 'Đào tạo ngành Xây dựng', 'active'),
('CKDL',      'Khoa Cơ khí - Động lực', 'Đào tạo ngành Cơ khí', 'active'),
('DDT',    'Khoa Điện - Điện tử','Đào tạo ngành Điện công nghiệp, Tự động hóa', 'active'),
('MT',    'Khoa Môi trường','Đào tạo ngành về môi trường', 'active');

-- ============================================================
-- 4. Lớp sinh viên (student_classes) — dữ liệu mẫu
-- ============================================================
-- Lưu ý: faculty_id = 1 là CNTT, faculty_id = 2 là DTVT
INSERT INTO student_classes (class_code, class_name, faculty_id, status) VALUES
('DA23TTA',   'Đại học Công nghệ thông tin A khóa 2023',           1, 'active'),
('DA23TTB',   'Đại học Công nghệ thông tin B khóa 2023',           1, 'active'),
('DA23XD',   'Đại học Kỹ thuật xây dựng khóa 2023',            1, 'active'),
('DA23TTD',   'Đại học Công nghệ thông tin D khóa 2023',          3, 'active'),
('DA23TTC',   'Đại học Công nghệ thông tin C khóa 2023',      1, 'active');

-- ============================================================
-- 5. Học kỳ (academic_terms) — dữ liệu mẫu
-- ============================================================
INSERT INTO academic_terms (term_code, term_name, academic_year, start_date, end_date) VALUES
('HK1-2023-2024', 'Học kỳ 1', '2024-2025', '2023-09-01', '2024-01-15'),
('HK2-2023-2024', 'Học kỳ 2', '2024-2025', '2024-02-01', '2024-06-15'),
('HK1-2024-2025', 'Học kỳ 1', '2025-2026', '2024-09-01', '2025-01-15'),
('HK2-2024-2025', 'Học kỳ 2', '2025-2026', '2025-02-01', '2025-06-15'),
('HK1-2025-2026', 'Học kỳ 1', '2026-2027', '2025-09-01', '2026-01-15');

-- ============================================================
-- Xác nhận dữ liệu đã được thêm
-- ============================================================
SELECT 'sentiment_labels' AS bang, COUNT(*) AS so_luong FROM sentiment_labels
UNION ALL
SELECT 'topic_labels',    COUNT(*) FROM topic_labels
UNION ALL
SELECT 'faculties',       COUNT(*) FROM faculties
UNION ALL
SELECT 'student_classes', COUNT(*) FROM student_classes
UNION ALL
SELECT 'academic_terms',  COUNT(*) FROM academic_terms;