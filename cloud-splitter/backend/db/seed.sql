INSERT INTO users(email, password_hash, name)
VALUES
 ('alice@example.com', '$2a$10$Gv8o5gqWTbGkqfOH3p8EEeOiN5gJ9j0plv2vY3B5i4wCRXb7e9V5W', 'Alice'),
 ('bob@example.com',   '$2a$10$Gv8o5gqWTbGkqfOH3p8EEeOiN5gJ9j0plv2vY3B5i4wCRXb7e9V5W', 'Bob')
ON CONFLICT DO NOTHING;
-- INSERT INTO users(email, password_hash, name)
-- VALUES
--  ('19kz38@queensu.ca', '$2a$10$Gv8o5gqWTbGkqfOH3p8EEeOiN5gJ9j0plv2vY3B5i4wCRXb7e9V5W', 'Martin'),
--  ('20ac134@queensu.ca', '$2a$10$Gv8o5gqWTbGkqfOH3p8EEeOiN5gJ9j0plv2vY3B5i4wCRXb7e9V5W', 'Alvin'),
--  ('zuoyuanlin@gmail.com', '$2a$10$Gv8o5gqWTbGkqfOH3p8EEeOiN5gJ9j0plv2vY3B5i4wCRXb7e9V5W', 'David')
-- ON CONFLICT DO NOTHING;