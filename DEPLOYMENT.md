# Campus Placement Portal - Deployment Guide

This guide covers deploying the Campus Placement Portal to production environments.

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

\`\`\`bash
python3 setup.py
\`\`\`

Follow the interactive prompts to set up everything automatically.

### Option 2: Manual Setup

1. **Clone and Install**
   \`\`\`bash
   git clone <repository-url>
   cd campus-placement-portal
   npm install
   \`\`\`

2. **Environment Setup**
   \`\`\`bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   \`\`\`

3. **Database Setup**
   - Go to your Supabase dashboard
   - Run the SQL script from `scripts/setup-database-production.sql`

4. **Start Development**
   \`\`\`bash
   npm run dev
   \`\`\`

## 🌐 Production Deployment

### Vercel (Recommended)

1. **Install Vercel CLI**
   \`\`\`bash
   npm i -g vercel
   \`\`\`

2. **Login to Vercel**
   \`\`\`bash
   vercel login
   \`\`\`

3. **Deploy**
   \`\`\`bash
   vercel
   \`\`\`

4. **Set Environment Variables**
   In your Vercel dashboard, add:
   - `NEXT_PUBLIC_SUPABASE_PROJECT_ID`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Netlify

1. **Build Command**: `npm run build`
2. **Publish Directory**: `.next`
3. **Environment Variables**: Same as Vercel

### Railway

1. **Connect GitHub Repository**
2. **Set Environment Variables**
3. **Deploy automatically on push**

## 🗄️ Database Setup

### Supabase Configuration

1. **Create New Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your Project ID and Anon Key

2. **Run SQL Setup**
   - Go to SQL Editor in Supabase dashboard
   - Copy and paste the entire content of `scripts/setup-database-production.sql`
   - Execute the script

3. **Verify Setup**
   - Check that all tables are created
   - Verify RLS policies are enabled
   - Test storage bucket creation

### Database Schema

The setup script creates:

- **student_details**: Student profiles and data
- **jobs**: Job postings and requirements
- **application_status**: Application tracking
- **grievance_reports**: Student grievances
- **admins**: Admin user management
- **placement_policy**: Placement rules and limits

### Storage Configuration

Branch-wise resume storage structure:
\`\`\`
placements/
└── resumes/
    ├── computer-science/
    ├── information-technology/
    ├── mechanical-engineering/
    └── [other-branches]/
\`\`\`

## 🔐 Security Configuration

### Row Level Security (RLS)

All tables have RLS enabled with policies for:
- Students can only access their own data
- Admins can access all data
- Public read access for job listings

### Environment Variables

**Required:**
- `NEXT_PUBLIC_SUPABASE_PROJECT_ID`: Your Supabase project ID
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

**Optional:**
- `NEXT_PUBLIC_DEMO_MODE`: Set to `true` for demo mode
- `NEXT_PUBLIC_APP_NAME`: Custom app name
- `NEXT_PUBLIC_APP_VERSION`: App version

## 📱 Mobile Optimization

The application is fully responsive and optimized for:
- Mobile phones (320px+)
- Tablets (768px+)
- Desktop (1024px+)

Features:
- Touch-friendly interfaces
- Optimized forms for mobile
- Scroll-to-top functionality
- Mobile-first design approach

## 🔧 Performance Optimization

### Build Optimization

\`\`\`bash
npm run build
npm run start
\`\`\`

### Lighthouse Recommendations

- Enable compression
- Optimize images
- Use CDN for static assets
- Enable caching headers

## 🧪 Testing

### Demo Mode

For testing without Supabase:

1. Set `NEXT_PUBLIC_DEMO_MODE=true`
2. Use demo credentials:
   - **Admin**: admin / admin123
   - **Student**: 22demo001@msruas.ac.in / password123

### Production Testing

1. **Student Registration Flow**
   - Test with valid college email format
   - Verify resume upload (branch-wise storage)
   - Check profile completion tracking

2. **Job Application Process**
   - Test eligibility checking
   - Verify application submission
   - Check status tracking

3. **Admin Functions**
   - Job creation and management
   - Student data export
   - Grievance handling

## 📊 Monitoring

### Error Tracking

Recommended tools:
- Sentry for error tracking
- Vercel Analytics for performance
- Supabase Dashboard for database monitoring

### Key Metrics

Monitor:
- User registration rates
- Job application success rates
- Resume upload success rates
- Page load times
- Error rates

## 🔄 Maintenance

### Regular Tasks

1. **Database Backups**
   - Use Supabase automatic backups
   - Export data regularly using admin panel

2. **Updates**
   - Keep dependencies updated
   - Monitor security advisories
   - Test updates in staging environment

3. **Performance Monitoring**
   - Check database query performance
   - Monitor storage usage
   - Review error logs

### Troubleshooting

**Common Issues:**

1. **Resume Upload Fails**
   - Check storage bucket permissions
   - Verify file size limits
   - Check network connectivity

2. **Database Connection Issues**
   - Verify environment variables
   - Check Supabase project status
   - Review RLS policies

3. **Authentication Problems**
   - Check Supabase auth settings
   - Verify email domain restrictions
   - Review user permissions

## 📞 Support

### Getting Help

1. **Check Demo Mode**: Test functionality in demo mode first
2. **Review Logs**: Check browser console and server logs
3. **Verify Setup**: Ensure all setup steps were completed
4. **Environment Check**: Verify all environment variables

### Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)

## 🎯 Production Checklist

Before going live, ensure:

### ✅ Database
- [ ] All tables created successfully
- [ ] RLS policies enabled and tested
- [ ] Storage bucket configured
- [ ] Sample data removed (if any)
- [ ] Admin user created

### ✅ Environment
- [ ] Production environment variables set
- [ ] Demo mode disabled (`NEXT_PUBLIC_DEMO_MODE=false`)
- [ ] Supabase project in production mode
- [ ] Domain configured (if using custom domain)

### ✅ Security
- [ ] RLS policies tested
- [ ] File upload restrictions verified
- [ ] Admin access restricted
- [ ] HTTPS enabled
- [ ] Environment variables secured

### ✅ Performance
- [ ] Build optimization completed
- [ ] Images optimized
- [ ] Caching configured
- [ ] CDN setup (if applicable)
- [ ] Lighthouse score > 90

### ✅ Functionality
- [ ] Student registration working
- [ ] Job creation and display working
- [ ] Resume upload/download working
- [ ] Application process working
- [ ] Admin dashboard functional
- [ ] Grievance system working
- [ ] Export features working
- [ ] Mobile responsiveness verified

## 🚀 Go Live Steps

1. **Final Testing**
   \`\`\`bash
   npm run build
   npm run start
   \`\`\`

2. **Deploy to Production**
   \`\`\`bash
   vercel --prod
   \`\`\`

3. **Verify Deployment**
   - Test all critical paths
   - Check error monitoring
   - Verify database connections

4. **Monitor Initial Usage**
   - Watch for errors
   - Monitor performance
   - Check user feedback

## 📈 Post-Launch

### Week 1
- Monitor error rates
- Check performance metrics
- Gather user feedback
- Fix critical issues

### Month 1
- Analyze usage patterns
- Optimize based on real data
- Plan feature improvements
- Review security logs

### Ongoing
- Regular backups
- Security updates
- Feature enhancements
- Performance optimization

---

**🎉 Congratulations! Your Campus Placement Portal is now ready for production use.**

For additional support or questions, please refer to the documentation or create an issue in the repository.
\`\`\`

Now let's create the environment example file:
