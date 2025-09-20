# Production Setup Guide

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

### Supabase Configuration
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Email Configuration (Required for notifications)
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com
EMAIL_FROM_NAME=Campus Placement Portal
```

### SMS Configuration (Optional)
```env
SMS_API_KEY=your_sms_provider_api_key
SMS_SENDER_ID=your_sender_id
```

## Database Setup

1. Run the SQL script in your Supabase SQL editor:
   ```sql
   -- See scripts/setup-database-production.sql
   ```

2. Create an admin user in the admin_users table:
   ```sql
   INSERT INTO public.admin_users (email, username, role) 
   VALUES ('admin@yourdomain.com', 'admin', 'admin');
   ```

3. Create the admin user in Supabase Auth (through Supabase dashboard or auth API)

## Email Service Setup

The application uses Nodemailer for email notifications. Configure your email provider:

### Gmail Setup
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password for the application
3. Use the App Password as `EMAIL_PASS` in your environment variables

### Other SMTP Providers
Update the email configuration in `app/api/send-email/route.ts` according to your provider's specifications.

## Admin Authentication

The admin login has been updated to use proper Supabase authentication instead of hardcoded credentials. Make sure to:

1. Create admin users in both `admin_users` table and Supabase Auth
2. Update the authentication logic if you need custom role-based access control
3. Consider implementing JWT-based authentication for enhanced security

## File Storage

The application uses Supabase Storage for resume uploads. Make sure your storage buckets are configured with appropriate policies:

```sql
-- Resume storage bucket policy
CREATE POLICY "Public resume access" ON storage.objects FOR SELECT USING (bucket_id = 'resumes');
CREATE POLICY "Authenticated resume upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resumes' AND auth.role() = 'authenticated');
```

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database tables created
- [ ] Admin users set up
- [ ] Email service configured and tested
- [ ] Storage policies configured
- [ ] Demo credentials removed
- [ ] Error handling implemented
- [ ] API endpoints secured
- [ ] Rate limiting configured (recommended)
- [ ] Backup strategy in place

## Testing

Before going live:

1. Test email notifications using `/api/send-email` endpoint
2. Verify admin authentication works
3. Test student registration flow
4. Confirm job application process
5. Test grievance submission
6. Verify file uploads work correctly

## Security Considerations

- Use strong passwords for admin accounts
- Enable RLS (Row Level Security) policies in Supabase
- Implement proper input validation
- Add rate limiting for API endpoints
- Regular security audits
- Monitor for suspicious activities

## Support

For deployment issues or questions, ensure you have:
- Supabase project properly configured
- All environment variables set
- Database schema up to date
- Proper authentication setup