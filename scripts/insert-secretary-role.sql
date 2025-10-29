-- Inserir role do secretário de educação diretamente no banco
INSERT INTO user_roles (user_id, role) 
VALUES ('137a0b95-fcb1-4433-8f84-94717ba752c3', 'education_secretary')
ON CONFLICT (user_id, role) DO NOTHING;


