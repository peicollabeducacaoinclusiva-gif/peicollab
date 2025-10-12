-- Limpar todas as tabelas relacionadas (mantendo apenas o superadmin)
DELETE FROM student_access;
DELETE FROM pei_comments;
DELETE FROM pei_history;
DELETE FROM family_access_tokens;
DELETE FROM peis;
DELETE FROM students;
DELETE FROM profiles WHERE role != 'superadmin';