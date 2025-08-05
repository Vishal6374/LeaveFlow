-- Leave Management System Database Backup
-- Generated on: 2025-08-05

-- Create database tables
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'hod', 'admin');
CREATE TYPE department_name AS ENUM ('CSE', 'AIDS', 'IT', 'ECE', 'EEE', 'CIVIL', 'MECH');
CREATE TYPE leave_type AS ENUM ('sick', 'personal', 'emergency', 'vacation');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');

-- Users table
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role user_role NOT NULL,
    department department_name,
    year INTEGER,
    email TEXT,
    sin_number TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Leave requests table
CREATE TABLE leave_requests (
    id VARCHAR PRIMARY KEY,
    student_id VARCHAR NOT NULL REFERENCES users(id),
    type leave_type NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status leave_status DEFAULT 'pending',
    reviewed_by VARCHAR REFERENCES users(id),
    reviewed_at TIMESTAMP,
    comments TEXT,
    submitted_at TIMESTAMP DEFAULT NOW()
);

-- Department assignments table
CREATE TABLE department_assignments (
    id VARCHAR PRIMARY KEY,
    department department_name NOT NULL,
    year INTEGER NOT NULL,
    class_advisor_id VARCHAR REFERENCES users(id),
    hod_id VARCHAR REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Activity logs table
CREATE TABLE activity_logs (
    id VARCHAR PRIMARY KEY,
    leave_request_id VARCHAR NOT NULL REFERENCES leave_requests(id),
    action_by_id VARCHAR NOT NULL REFERENCES users(id),
    action VARCHAR NOT NULL,
    department department_name,
    year INTEGER,
    action_at TIMESTAMP DEFAULT NOW()
);

-- Insert user data
INSERT INTO users VALUES ('fa1ef030-4f63-4a00-aded-6ca488cc0462', 'admin', 'af351069967d00ab630adfa9648f4cea4e4bb6f0bc4d9bfdbde53ec645f45e1888fe84a6fd4a5faaf82ef7251cdfda3699955b64f6f303a5f2a6613496d61129.131b4c7ff83f645d8d51bc4987b98c93', 'System Administrator', 'admin', NULL, NULL, NULL, NULL, '2025-08-05 13:59:45.616972');
INSERT INTO users VALUES ('19c39678-fb16-455d-8cc2-20a71b55f2fd', 'E23AI045', '0ad6918f2794b074183b26d4de750406a2d366ac698117e429d50cc6147ae0d1559842da42940386cccb3dd07e36dd0411e75859ba023431deb5270139094328.96cf4343e622e14d7ff40354ac236cc9', 'Vishal M', 'student', 'AIDS', 3, NULL, 'E23AI045', '2025-08-05 14:01:49.476361');
INSERT INTO users VALUES ('10bf64dd-4fe4-4f85-91cb-2ab1dfd5814e', 'teacher1', 'af351069967d00ab630adfa9648f4cea4e4bb6f0bc4d9bfdbde53ec645f45e1888fe84a6fd4a5faaf82ef7251cdfda3699955b64f6f303a5f2a6613496d61129.131b4c7ff83f645d8d51bc4987b98c93', 'John Teacher', 'teacher', 'CSE', NULL, NULL, NULL, '2025-08-05 13:59:45.616972');
INSERT INTO users VALUES ('1d1e3dfa-1b45-49b2-b3e7-79bcc59307a5', 'E23CS032', '14e666d466e7305ebaf3773613030419c70e9418b9de235c91df29e3aaabfe0e8ba65539d296c346e3d48211d061df71e8ca805f1eefbb9b0ec157a3c6a3df25.dd520e8d761822691a9584845fd72c31', 'Abhiman Kumar jha', 'student', 'CSE', 3, NULL, 'E23CS032', '2025-08-05 14:22:10.207057');
INSERT INTO users VALUES ('e6577577-d4b9-4e4c-a171-87b220035c28', 'Mouliraj', 'd43d12ae133b110b0a8bd9c774663babb7d8b4e1ac115d00d1054fcc0b3aeabe11c3f3ff34a0c8c26e754cbbb1ab087aa53d4e7541aa92b2f0e8d69b83ec1eb7.2143aa3aebf3e6c1b192ea69575b3717', 'Mouli Raj', 'teacher', 'CSE', 3, NULL, 'Mouliraj', '2025-08-05 14:23:46.429757');
INSERT INTO users VALUES ('0e22e6cc-88c1-4586-8891-375f7a568b40', 'hod1', 'af351069967d00ab630adfa9648f4cea4e4bb6f0bc4d9bfdbde53ec645f45e1888fe84a6fd4a5faaf82ef7251cdfda3699955b64f6f303a5f2a6613496d61129.131b4c7ff83f645d8d51bc4987b98c93', 'Nandhini', 'hod', 'CSE', 4, 'e23cs066@shanmugha.edu.in', 'Nandhini', '2025-08-05 14:18:49.789489');
INSERT INTO users VALUES ('9cc064a3-9918-402f-b5c6-0cdff0a3e6f4', 'student1', 'af351069967d00ab630adfa9648f4cea4e4bb6f0bc4d9bfdbde53ec645f45e1888fe84a6fd4a5faaf82ef7251cdfda3699955b64f6f303a5f2a6613496d61129.131b4c7ff83f645d8d51bc4987b98c93', 'Alice Student', 'student', 'AIDS', 3, 'alice@university.edu', 'STU20230001', '2025-08-05 14:44:55.939716');

-- Default password for all test accounts: admin123
-- Admin login: admin / admin123
-- HOD login: hod1 / admin123  
-- Teacher login: teacher1 / admin123
-- Sample students with their actual usernames and admin123 password

-- Note: In production, make sure to change all default passwords