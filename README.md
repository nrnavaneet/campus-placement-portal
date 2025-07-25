

# Campus Placement Portal

<p align="center">
  <img src="public/placeholder-logo.png" alt="Campus Placement Portal Logo" width="120" />
</p>

<p align="center">
  <b>A modern, full-stack placement management system for universities, built with Next.js, Supabase, and TypeScript.</b>
</p>

<p align="center">
  <a href="https://github.com/yourusername/campus-placement-portal"><img src="https://img.shields.io/github/stars/yourusername/campus-placement-portal?style=social" alt="GitHub stars"></a>
  <a href="https://vercel.com/"><img src="https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel" alt="Vercel"></a>
  <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Backend-Supabase-3ECF8E?logo=supabase" alt="Supabase"></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Frontend-Next.js-black?logo=next.js" alt="Next.js"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License"></a>
</p>

---



## 🚀 Quick Start


### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm/yarn
- Supabase account


### Setup & Development
1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/campus-placement-portal.git
   cd campus-placement-portal
   ```
2. **Install dependencies**
   ```bash
   pnpm install
   ```
3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Settings > API to get your project URL and anon key
   - Run the SQL script from `scripts/setup-database-production.sql` in your Supabase SQL editor
4. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
5. **Run the development server**
   ```bash
   pnpm dev
   ```
6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🌐 Production Deployment

### Vercel (Recommended)
1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```
2. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy automatically or use Vercel CLI:
     ```bash
     npm i -g vercel
     vercel login
     vercel --prod
     ```

### Manual Deployment
1. **Build the application**
   ```bash
   pnpm build
   ```
2. **Start the production server**
   ```bash
   pnpm start
   ```

### Netlify/Railway
Follow similar steps: build, set environment variables, and deploy.

---

## 🗄️ Database & Security

### Supabase Setup
- Create project, run SQL setup script, verify tables and RLS policies
- Storage bucket for resumes (branch-wise structure)
- All tables have Row Level Security (RLS) enabled

### Main Tables
- `student_details` - Student profiles
- `jobs` - Job postings
- `application_status` - Application tracking
- `grievance_reports` - Student grievances
- `admins` - Admin users

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |

---

## 📱 Mobile & Performance
- Fully responsive (mobile, tablet, desktop)
- Touch-friendly, optimized forms
- Build optimization: `pnpm build`, `pnpm start`
- Lighthouse recommendations: compression, CDN, caching

---

## 🧪 Testing & Demo Mode
### Demo Credentials
- **Student**: 22demo001@msruas.ac.in / password123
- **Admin**: admin / admin123

Set `NEXT_PUBLIC_DEMO_MODE=true` for demo mode (no Supabase required).

---

## 📊 Monitoring & Maintenance
- Use Sentry, Vercel Analytics, Supabase Dashboard
- Monitor registration, job applications, resume uploads, error rates
- Regular backups, dependency updates, performance checks

---

## 🎯 Production Checklist
- All tables and RLS policies set up
- Storage bucket configured
- Production environment variables set
- Demo mode disabled
- Security and performance verified
- All features tested (registration, jobs, resume, admin, export, mobile)

---


## 📁 File Structure
```
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard
│   ├── applications/      # Application tracking
│   ├── dashboard/         # Student dashboard
│   ├── jobs/             # Job listings and details
│   ├── profile/          # Profile management
│   ├── register/         # Student registration
│   └── settings/         # User settings
├── components/           # Reusable components
│   ├── auth/            # Authentication components
│   ├── layout/          # Layout components
│   ├── student/         # Student-specific components
│   └── ui/              # shadcn/ui components
├── contexts/            # React contexts
├── lib/                 # Utility functions and configurations
└── scripts/             # Database setup scripts
```

---

## Support & Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)

For support, create an issue in the repository or contact the development team.

---


## 📄 License
MIT License - see LICENSE file for details.

---


<p align="center">
  <b>🎉 Congratulations! Your Campus Placement Portal is now ready for production use.</b>
</p>
### Vercel (Recommended)

1. **Push to GitHub**
   \`\`\`bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   \`\`\`

2. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy automatically

### Manual Deployment

1. **Build the application**
   \`\`\`bash
   npm run build
   \`\`\`

2. **Start the production server**
   \`\`\`bash
   npm start
   \`\`\`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

- All database operations use Row Level Security (RLS)
- File uploads are validated and stored securely
- Authentication is handled by Supabase Auth
- Admin access is properly protected

## Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team

## License

This project is licensed under the MIT License - see the LICENSE file for details.
\`\`\`

The application is now production-ready with:

✅ **Complete Database Integration** - Proper Supabase setup with RLS policies
✅ **Full Admin Dashboard** - Complete CRUD operations, data export, analytics
✅ **All Navigation Working** - Logo redirects, all buttons functional
✅ **Job Application System** - Complete application flow with eligibility checking
✅ **Resume Management** - Secure file upload and storage
✅ **Production Database Schema** - Optimized with indexes and triggers
✅ **Comprehensive Documentation** - Setup guide and deployment instructions
✅ **Security Implementation** - RLS policies and proper authentication
✅ **Export Functionality** - CSV exports for students and jobs data
✅ **Real-time Features** - Live data updates and status tracking

The system is now fully functional and ready for production deployment!
