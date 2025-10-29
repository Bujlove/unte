-- Insert essential skills into skills_knowledge table

INSERT INTO skills_knowledge (skill_name, category, subcategory, aliases, related_skills, industry_usage, experience_levels) VALUES
('JavaScript', 'programming', 'frontend', ARRAY['JS', 'ECMAScript', 'Node.js'], ARRAY['TypeScript', 'React', 'Vue', 'Angular', 'Node.js'], '{"web_development": 0.95, "mobile_development": 0.7, "data_science": 0.3}', ARRAY['junior', 'middle', 'senior', 'lead']),
('Python', 'programming', 'backend', ARRAY['Python3', 'Py'], ARRAY['Django', 'Flask', 'FastAPI', 'Pandas', 'NumPy', 'Machine Learning'], '{"web_development": 0.8, "data_science": 0.95, "ai_ml": 0.9, "automation": 0.7}', ARRAY['junior', 'middle', 'senior', 'lead']),
('React', 'framework', 'frontend', ARRAY['React.js', 'ReactJS'], ARRAY['JavaScript', 'TypeScript', 'Redux', 'Next.js', 'JSX'], '{"web_development": 0.9, "mobile_development": 0.6}', ARRAY['junior', 'middle', 'senior', 'lead']),
('Node.js', 'framework', 'backend', ARRAY['Node', 'NodeJS'], ARRAY['JavaScript', 'Express', 'Nest.js', 'Socket.io'], '{"web_development": 0.8, "api_development": 0.9}', ARRAY['junior', 'middle', 'senior', 'lead']),
('TypeScript', 'programming', 'frontend', ARRAY['TS'], ARRAY['JavaScript', 'React', 'Angular', 'Vue', 'Node.js'], '{"web_development": 0.8, "mobile_development": 0.6}', ARRAY['middle', 'senior', 'lead']),
('PostgreSQL', 'database', 'relational', ARRAY['Postgres', 'PostgresQL'], ARRAY['SQL', 'MySQL', 'MongoDB', 'Redis'], '{"web_development": 0.8, "data_science": 0.7, "enterprise": 0.9}', ARRAY['junior', 'middle', 'senior', 'lead']),
('MongoDB', 'database', 'nosql', ARRAY['Mongo'], ARRAY['NoSQL', 'Mongoose', 'Redis', 'Elasticsearch'], '{"web_development": 0.7, "startup": 0.8, "data_science": 0.6}', ARRAY['junior', 'middle', 'senior', 'lead']),
('AWS', 'cloud', 'platform', ARRAY['Amazon Web Services', 'Amazon AWS'], ARRAY['Docker', 'Kubernetes', 'Terraform', 'CI/CD'], '{"cloud": 0.9, "enterprise": 0.8, "startup": 0.7}', ARRAY['middle', 'senior', 'lead']),
('Docker', 'devops', 'containerization', ARRAY['Docker Engine', 'Docker Compose'], ARRAY['Kubernetes', 'AWS', 'CI/CD', 'Microservices'], '{"devops": 0.9, "cloud": 0.8, "enterprise": 0.7}', ARRAY['middle', 'senior', 'lead']),
('Project Management', 'soft_skills', 'leadership', ARRAY['PM', 'Project Leadership'], ARRAY['Agile', 'Scrum', 'Team Leadership', 'Communication'], '{"management": 0.9, "tech": 0.7, "consulting": 0.8}', ARRAY['middle', 'senior', 'lead'])
ON CONFLICT (skill_name) DO NOTHING;
