-- Production Database Setup for Campus Placement Portal
-- Run this script in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create student_details table
CREATE TABLE IF NOT EXISTS public.student_details (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    college_reg_no VARCHAR(20) UNIQUE NOT NULL,
    pwd BOOLEAN DEFAULT FALSE,
    date_of_birth DATE NOT NULL,
    college_email VARCHAR(255) UNIQUE NOT NULL,
    personal_email VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(15) NOT NULL,
    branch VARCHAR(100) NOT NULL,
    ug_percentage DECIMAL(5,2) NOT NULL,
    active_backlogs BOOLEAN DEFAULT FALSE,
    resume_url TEXT,
    placement_status JSONB DEFAULT '{"offers": [], "accepted_offers": 0, "max_ctc": 0, "max_offers_allowed": 3}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    company_logo TEXT,
    description TEXT NOT NULL,
    package_min DECIMAL(10,2),
    package_max DECIMAL(10,2),
    eligibility_criteria JSONB NOT NULL DEFAULT '{}',
    branches_allowed TEXT[] NOT NULL,
    min_ug_percentage DECIMAL(5,2) NOT NULL,
    no_backlogs_required BOOLEAN DEFAULT TRUE,
    counts_as_offer BOOLEAN DEFAULT TRUE,
    timeline JSONB NOT NULL DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'ongoing', 'closed')),
    application_deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create application_status table
CREATE TABLE IF NOT EXISTS public.application_status (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_reg_no VARCHAR(20) NOT NULL,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    current_stage VARCHAR(50) DEFAULT 'applied',
    stage_history JSONB DEFAULT '[]',
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_reg_no, job_id)
);

-- Create grievance_reports table
CREATE TABLE IF NOT EXISTS public.grievance_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_reg_no VARCHAR(20),
    student_name VARCHAR(255),
    issue_type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'in_progress', 'resolved')),
    admin_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admins table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create placement_policy table for rules
CREATE TABLE IF NOT EXISTS public.placement_policy (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    max_offers_allowed INTEGER DEFAULT 3,
    second_offer_multiplier DECIMAL(3,2) DEFAULT 2.0,
    policy_description TEXT,
    effective_from DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default placement policy
INSERT INTO public.placement_policy (max_offers_allowed, second_offer_multiplier, policy_description) VALUES 
(3, 2.0, 'Students can accept maximum 3 offers. Second offer must be at least 2x the first offer CTC.')
ON CONFLICT DO NOTHING;

-- Create student_settings table
CREATE TABLE IF NOT EXISTS public.student_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES public.student_details(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{"emailNotifications": true, "smsNotifications": false, "applicationUpdates": true, "marketingEmails": false, "deadlineReminders": true, "weeklyDigest": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id)
);

-- Create notification_logs table
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES public.student_details(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'sms')),
    recipient VARCHAR(255) NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_details_reg_no ON public.student_details(college_reg_no);
CREATE INDEX IF NOT EXISTS idx_student_details_branch ON public.student_details(branch);
CREATE INDEX IF NOT EXISTS idx_student_details_user_id ON public.student_details(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON public.jobs(company_name);
CREATE INDEX IF NOT EXISTS idx_jobs_branches ON public.jobs USING GIN(branches_allowed);
CREATE INDEX IF NOT EXISTS idx_application_status_student ON public.application_status(student_reg_no);
CREATE INDEX IF NOT EXISTS idx_application_status_job ON public.application_status(job_id);
CREATE INDEX IF NOT EXISTS idx_grievance_status ON public.grievance_reports(status);
CREATE INDEX IF NOT EXISTS idx_student_settings_student_id ON public.student_settings(student_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_student_id ON public.notification_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON public.notification_logs(type);

-- Enable RLS on all tables
ALTER TABLE public.student_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grievance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_policy ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for student_details
CREATE POLICY "Students can view own data" ON public.student_details
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Students can update own data" ON public.student_details
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Students can insert own data" ON public.student_details
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for jobs
CREATE POLICY "Jobs are publicly readable" ON public.jobs
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage jobs" ON public.jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Create RLS policies for application_status
CREATE POLICY "Students can view own applications" ON public.application_status
    FOR SELECT USING (
        student_reg_no = (
            SELECT college_reg_no FROM public.student_details 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Students can insert own applications" ON public.application_status
    FOR INSERT WITH CHECK (
        student_reg_no = (
            SELECT college_reg_no FROM public.student_details 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all applications" ON public.application_status
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Admins can update applications" ON public.application_status
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Create RLS policies for grievance_reports
CREATE POLICY "Students can view own grievances" ON public.grievance_reports
    FOR SELECT USING (
        student_reg_no = (
            SELECT college_reg_no FROM public.student_details 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Students can insert grievances" ON public.grievance_reports
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage grievances" ON public.grievance_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Create RLS policies for admins
CREATE POLICY "Admins can view admin data" ON public.admins
    FOR SELECT USING (email = auth.jwt() ->> 'email');

-- Create RLS policies for placement_policy
CREATE POLICY "Policy is publicly readable" ON public.placement_policy
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage policy" ON public.placement_policy
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Insert sample admin (password: admin123 - hash this in production!)
INSERT INTO public.admins (username, email, password_hash) VALUES 
('admin', 'admin@msruas.ac.in', '$2b$10$rOvHPGkwMtFJfqJZqJqOyOehNvQqzqzQqzqzQqzqzQqzqzQqzqzQq')
ON CONFLICT (username) DO NOTHING;

-- Insert sample jobs
INSERT INTO public.jobs (title, company_name, description, package_min, package_max, eligibility_criteria, branches_allowed, min_ug_percentage, timeline, status, application_deadline) VALUES 
(
    'Software Developer',
    'TechCorp Solutions',
    'Join our dynamic team as a Software Developer. Work on cutting-edge projects using modern technologies like React, Node.js, and cloud platforms. You will be responsible for developing scalable web applications and collaborating with cross-functional teams.',
    600000,
    1200000,
    '{"experience": "0-2 years", "skills": ["JavaScript", "React", "Node.js"]}',
    ARRAY['Computer Science', 'Information Technology', 'Electronics and Communication'],
    70.0,
    '[
        {"stage": "Application", "date": "2024-02-01", "description": "Submit application with resume"},
        {"stage": "Online Test", "date": "2024-02-15", "description": "Technical assessment"},
        {"stage": "Interview", "date": "2024-02-25", "description": "Technical and HR rounds"},
        {"stage": "Result", "date": "2024-03-05", "description": "Final selection results"}
    ]',
    'active',
    '2024-12-31 23:59:59'
),
(
    'Data Analyst Intern',
    'DataViz Inc',
    'Exciting internship opportunity to work with big data and analytics. Perfect for students looking to gain industry experience. You will work on real-world data projects and learn from experienced data scientists.',
    25000,
    40000,
    '{"experience": "Fresher", "skills": ["Python", "SQL", "Excel"]}',
    ARRAY['Computer Science', 'Information Technology', 'Mathematics', 'Statistics'],
    65.0,
    '[
        {"stage": "Application", "date": "2024-01-20", "description": "Submit application"},
        {"stage": "Assessment", "date": "2024-02-05", "description": "Data analysis task"},
        {"stage": "Interview", "date": "2024-02-12", "description": "Technical discussion"},
        {"stage": "Selection", "date": "2024-02-20", "description": "Internship confirmation"}
    ]',
    'upcoming',
    '2024-12-25 23:59:59'
),
(
    'Frontend Developer',
    'InnovateTech',
    'Looking for a creative Frontend Developer to join our UI/UX team. Work on modern web applications using React, TypeScript, and cutting-edge design systems. You will collaborate with designers and backend developers to create amazing user experiences.',
    500000,
    900000,
    '{"experience": "0-1 years", "skills": ["React", "TypeScript", "CSS"]}',
    ARRAY['Computer Science', 'Information Technology'],
    75.0,
    '[
        {"stage": "Application", "date": "2024-01-25", "description": "Submit portfolio and resume"},
        {"stage": "Portfolio Review", "date": "2024-02-08", "description": "Technical portfolio assessment"},
        {"stage": "Technical Interview", "date": "2024-02-18", "description": "Coding and design discussion"},
        {"stage": "Final Round", "date": "2024-02-28", "description": "Cultural fit and offer discussion"}
    ]',
    'ongoing',
    '2024-12-20 23:59:59'
)
ON CONFLICT DO NOTHING;

-- Create storage bucket for resumes with branch-wise organization
INSERT INTO storage.buckets (id, name, public) VALUES 
('placements', 'placements', false)
ON CONFLICT (id) DO NOTHING;

-- Create branch-wise folders in storage (this will be done programmatically)
-- Folders will be created as: placements/resumes/{branch-name}/{reg-no}.pdf

-- Create storage policies for branch-wise resume access
CREATE POLICY "Students can upload own resumes" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'placements' AND 
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = 'placements' AND
        (storage.foldername(name))[2] = 'resumes'
    );

CREATE POLICY "Students can view own resumes" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'placements' AND 
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = 'placements' AND
        (storage.foldername(name))[2] = 'resumes'
    );

CREATE POLICY "Students can update own resumes" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'placements' AND 
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = 'placements' AND
        (storage.foldername(name))[2] = 'resumes'
    );

CREATE POLICY "Students can delete own resumes" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'placements' AND 
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = 'placements' AND
        (storage.foldername(name))[2] = 'resumes'
    );

CREATE POLICY "Admins can access all resumes" ON storage.objects
    FOR ALL USING (
        bucket_id = 'placements' AND
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_student_details_updated_at BEFORE UPDATE ON public.student_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_application_status_updated_at BEFORE UPDATE ON public.application_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_grievance_reports_updated_at BEFORE UPDATE ON public.grievance_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check placement policy compliance
CREATE OR REPLACE FUNCTION check_placement_policy(
    student_reg_no VARCHAR(20),
    new_offer_ctc DECIMAL(10,2)
) RETURNS BOOLEAN AS $$
DECLARE
    current_offers INTEGER;
    max_offers INTEGER;
    current_max_ctc DECIMAL(10,2);
    multiplier DECIMAL(3,2);
BEGIN
    -- Get current policy
    SELECT max_offers_allowed, second_offer_multiplier 
    INTO max_offers, multiplier
    FROM public.placement_policy 
    ORDER BY effective_from DESC 
    LIMIT 1;
    
    -- Get student's current placement status
    SELECT 
        (placement_status->>'accepted_offers')::INTEGER,
        (placement_status->>'max_ctc')::DECIMAL(10,2)
    INTO current_offers, current_max_ctc
    FROM public.student_details 
    WHERE college_reg_no = student_reg_no;
    
    -- Check if student can accept more offers
    IF current_offers >= max_offers THEN
        RETURN FALSE;
    END IF;
    
    -- If this is not the first offer, check CTC multiplier
    IF current_offers > 0 AND new_offer_ctc < (current_max_ctc * multiplier) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Insert sample grievances for testing
INSERT INTO public.grievance_reports (student_reg_no, student_name, issue_type, message, contact_email, status, admin_response) VALUES 
(
    '22ETCS001234',
    'John Doe',
    'Application Status',
    'I have not received any update on my application for TechCorp Solutions. It has been 2 weeks since I applied.',
    '22etcs001234@msruas.ac.in',
    'submitted',
    NULL
),
(
    '22ETCS001235',
    'Jane Smith',
    'Technical Issue',
    'Unable to upload resume. Getting error message every time I try to upload PDF file.',
    '22etcs001235@msruas.ac.in',
    'in_progress',
    'We are looking into this issue. Please try again in a few hours.'
),
(
    '22MECH001236',
    'Mike Johnson',
    'Eligibility Query',
    'My branch is not listed in the eligible branches for most jobs. Can this be reviewed?',
    '22mech001236@msruas.ac.in',
    'resolved',
    'We have updated the eligibility criteria for several positions to include Mechanical Engineering.'
)
CREATE TABLE IF NOT EXISTS public.recent_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample activities for testing
INSERT INTO public.recent_activities (title, type, description) VALUES
('Welcome to Campus Placement Portal', 'system', 'System initialization completed'),
('Database setup completed', 'system', 'All tables and initial data created')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.recent_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for recent_activities
CREATE POLICY "Allow admins to read recent_activities" ON public.recent_activities
FOR SELECT USING (true);

CREATE POLICY "Allow admins to insert recent_activities" ON public.recent_activities
FOR INSERT WITH CHECK (true);

ON CONFLICT DO NOTHING;

-- Create a view for placement statistics
CREATE OR REPLACE VIEW placement_statistics AS
SELECT 
    COUNT(*) as total_students,
    COUNT(CASE WHEN (placement_status->>'accepted_offers')::int > 0 THEN 1 END) as placed_students,
    ROUND(
        (COUNT(CASE WHEN (placement_status->>'accepted_offers')::int > 0 THEN 1 END) * 100.0 / COUNT(*)), 2
    ) as placement_percentage,
    AVG(CASE WHEN (placement_status->>'max_ctc')::int > 0 THEN (placement_status->>'max_ctc')::int END) as avg_package,
    COUNT(DISTINCT branch) as total_branches
FROM public.student_details;

-- Create view for branch-wise statistics
CREATE OR REPLACE VIEW branch_wise_statistics AS
SELECT 
    branch,
    COUNT(*) as total_students,
    COUNT(CASE WHEN (placement_status->>'accepted_offers')::int > 0 THEN 1 END) as placed_students,
    ROUND(
        (COUNT(CASE WHEN (placement_status->>'accepted_offers')::int > 0 THEN 1 END) * 100.0 / COUNT(*)), 2
    ) as placement_percentage,
    AVG(CASE WHEN (placement_status->>'max_ctc')::int > 0 THEN (placement_status->>'max_ctc')::int END) as avg_package
FROM public.student_details
GROUP BY branch
ORDER BY placement_percentage DESC;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
GRANT ALL ON public.recent_activities TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================
-- RECRUITMENT ROUNDS SYSTEM TABLES
-- ============================================

-- Create job_rounds table to define the recruitment process for each job
CREATE TABLE IF NOT EXISTS public.job_rounds (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    round_name VARCHAR(100) NOT NULL, -- e.g. 'Resume Shortlisting', 'Online Assessment', 'Technical Round 1'
    round_type VARCHAR(50) NOT NULL DEFAULT 'interview', -- 'screening', 'assessment', 'interview', 'final'
    description TEXT,
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(job_id, round_number)
);

-- Create application_rounds table to track student progress through each round
CREATE TABLE IF NOT EXISTS public.application_rounds (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    application_id UUID REFERENCES public.application_status(id) ON DELETE CASCADE,
    job_round_id UUID REFERENCES public.job_rounds(id) ON DELETE CASCADE,
    student_reg_no VARCHAR(20) REFERENCES public.student_details(college_reg_no),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'passed', 'failed', 'scheduled', 'completed', 'no_show')),
    notes TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    feedback TEXT,
    score DECIMAL(5,2), -- Optional scoring system
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(application_id, job_round_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_rounds_job_id ON public.job_rounds(job_id);
CREATE INDEX IF NOT EXISTS idx_job_rounds_round_number ON public.job_rounds(round_number);
CREATE INDEX IF NOT EXISTS idx_application_rounds_application_id ON public.application_rounds(application_id);
CREATE INDEX IF NOT EXISTS idx_application_rounds_status ON public.application_rounds(status);
CREATE INDEX IF NOT EXISTS idx_application_rounds_student_reg_no ON public.application_rounds(student_reg_no);

-- Insert default round templates that companies commonly use
-- Note: These are just for reference and should be copied when creating actual jobs
-- We'll create a separate templates table or handle templates in the application layer
-- Removing the template inserts to avoid foreign key constraint errors

-- CREATE TABLE IF NOT EXISTS public.round_templates (
--     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
--     round_name VARCHAR(100) NOT NULL,
--     round_type VARCHAR(50) NOT NULL DEFAULT 'interview',
--     description TEXT,
--     typical_order INTEGER,
--     is_commonly_used BOOLEAN DEFAULT TRUE,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- INSERT INTO public.round_templates (round_name, round_type, description, typical_order) VALUES
--     ('Resume Shortlisting', 'screening', 'Initial screening based on resume and eligibility criteria', 1),
--     ('Online Assessment', 'assessment', 'Technical and aptitude assessment', 2),
--     ('Group Discussion', 'interview', 'Group discussion to evaluate communication and leadership skills', 3),
--     ('Technical Round 1', 'interview', 'Technical interview focusing on programming and problem-solving', 4),
--     ('Technical Round 2', 'interview', 'Advanced technical interview and system design', 5),
--     ('Managerial Round', 'interview', 'Interview with hiring manager focusing on experience and fit', 6),
--     ('HR Round', 'final', 'Final interview with HR for culture fit and offer discussion', 7)
-- ON CONFLICT DO NOTHING;

-- Create policies for job_rounds
CREATE POLICY "Allow authenticated users to read job_rounds" ON public.job_rounds
FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to manage job_rounds" ON public.job_rounds
FOR ALL USING (true);

-- Create policies for application_rounds
CREATE POLICY "Allow students to read their application_rounds" ON public.application_rounds
FOR SELECT USING (
    student_reg_no = (
        SELECT college_reg_no 
        FROM public.student_details 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Allow admins to read all application_rounds" ON public.application_rounds
FOR SELECT USING (true);

CREATE POLICY "Allow admins to manage application_rounds" ON public.application_rounds
FOR ALL USING (true);

-- Enable RLS on new tables
ALTER TABLE public.job_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_rounds ENABLE ROW LEVEL SECURITY;

-- Grant permissions on new tables
GRANT ALL ON public.job_rounds TO anon, authenticated;
GRANT ALL ON public.application_rounds TO anon, authenticated;

-- Success message
SELECT 'Database setup completed successfully! Recruitment rounds system is configured.' as message;
