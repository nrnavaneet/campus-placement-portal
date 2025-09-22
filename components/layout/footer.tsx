"use client"

import Link from "next/link"
import { GraduationCap, Heart, Github, Mail, Briefcase, Shield } from "lucide-react"

interface FooterProps {
  variant?: "student" | "admin"
}

export function Footer({ variant = "student" }: FooterProps) {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800 mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Brand Section - Full width on all devices */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                {variant === "admin" ? <Shield className="w-5 h-5 text-white" /> : <GraduationCap className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Campus Placement Portal
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {variant === "admin" ? "Admin Dashboard" : "Student Portal"}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
              {variant === "admin" 
                ? "Comprehensive placement management system for administrators to streamline recruitment processes." 
                : "Your gateway to campus placements, internships, and career opportunities."}
            </p>
          </div>

          {/* Two column layout for mobile, three columns for desktop */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Quick Links</h4>
              <nav className="flex flex-col space-y-2">
                {variant === "admin" ? (
                  <>
                    <Link href="/admin" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Dashboard
                    </Link>
                    <Link href="/admin/applications" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Applications
                    </Link>
                    <Link href="/admin/settings" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Settings
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/dashboard" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Dashboard
                    </Link>
                    <Link href="/jobs" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Jobs
                    </Link>
                    <Link href="/applications" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Applications
                    </Link>
                    <Link href="/profile" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Profile
                    </Link>
                  </>
                )}
              </nav>
            </div>

            {/* Contact & Credits */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Credits</h4>
              <div className="sm:border-t sm:border-gray-200 sm:dark:border-gray-700 sm:pt-2">
                <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  <span>Designed & Developed with</span>
                  <Heart className="w-3 h-3 text-red-500" />
                  <span>by</span>
                </div>
                <div className="mt-1 flex items-center space-x-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">N</span>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    N R Navaneet
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              © {currentYear} Campus Placement Portal. All rights reserved.
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span>Made for MSRUAS</span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center space-x-1">
                <span>v1.0.0</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}