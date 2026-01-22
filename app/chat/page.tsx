"use client"

import { useState, useEffect, useRef } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Send, Loader2, Bot, User, Sparkles, Upload, FileText, X, CheckCircle } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
}

const SUGGESTED_QUESTIONS = [
  "What jobs am I eligible for?",
  "Which companies are currently recruiting?",
  "How to answer behavioral questions?",
  "What technical skills should I focus on?",
  "How can I improve my resume?",
]

const RESUME_QUESTIONS = [
  "Analyze my resume",
  "What are the pros and cons of my resume?",
  "How can I improve my resume?",
  "Review my resume",
]

export default function ChatPage() {
  const { student, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 Hello! I'm your specialized interview preparation assistant for the campus placement portal.\n\n⚠️ Important: I provide PERSONALIZED assistance using YOUR actual data from the portal:\n\n🎯 I have access to:\n• YOUR profile data (branch, percentage, skills, etc.)\n• Active job openings in the portal and their requirements\n• Your application status and history\n• Your uploaded resume (if uploaded)\n• Eligibility checking for portal jobs\n\n💡 I can help you with:\n• Resume analysis with pros/cons (if you upload your resume)\n• Job recommendations based on YOUR profile from portal listings\n• Eligibility checking for jobs available in the portal\n• Interview preparation tailored to YOUR background\n• Application status and next steps\n• Information about companies currently recruiting through the portal\n\n⚠️ Note: I can only help with companies that have active job listings in the portal right now.\n\nTry asking:\n• \"What jobs am I eligible for?\"\n• \"Which companies are recruiting?\"\n• \"Analyze my resume\" (after uploading)\n• \"What are my application statuses?\"\n• \"Tell me about [Company Name]\" (if they're in the portal)\n\nWhat would you like to know?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [hasResume, setHasResume] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (authLoading) return

    if (!student) {
      toast.error("Please log in to access the chat")
      router.push("/")
      return
    }

    // Check if user has uploaded resume
    checkResumeStatus()
  }, [student, authLoading, router])

  const checkResumeStatus = async () => {
    if (!student?.college_reg_no) return
    
    try {
      // We'll use a simple identifier - in production use user ID
      const userId = student.college_reg_no
      const response = await fetch(`/api/chat/upload-resume?userId=${encodeURIComponent(userId)}`)
      if (response.ok) {
        const data = await response.json()
        setHasResume(data.hasResume || false)
      }
    } catch (error) {
      console.error("Error checking resume status:", error)
    }
  }

  const scrollToBottom = (immediate = false) => {
    // Use requestAnimationFrame for better performance
    const scroll = () => {
      if (messagesContainerRef.current) {
        const container = messagesContainerRef.current
        container.scrollTo({
          top: container.scrollHeight,
          behavior: immediate ? 'auto' : 'smooth'
        })
      }
      // Also try scrollIntoView as backup
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: immediate ? 'auto' : 'smooth', 
          block: 'nearest' 
        })
      }
    }
    
    if (immediate) {
      scroll()
    } else {
      // Use multiple timeouts to ensure it works even with async content
      requestAnimationFrame(() => {
        scroll()
        setTimeout(scroll, 100)
        setTimeout(scroll, 300)
      })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB")
      return
    }

    setResumeFile(file)
  }

  const handleResumeUpload = async () => {
    if (!resumeFile || !student) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("resume", resumeFile)
      formData.append("userId", student.college_reg_no || "")

      const response = await fetch("/api/chat/upload-resume", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload resume")
      }

      const data = await response.json()
      setHasResume(true)
      setResumeFile(null)
      toast.success("Resume uploaded and analyzed successfully!")
      
      // Add a message about resume being ready
      const resumeReadyMessage: Message = {
        role: "assistant",
        content: "✅ Your resume has been uploaded and analyzed! I can now provide personalized feedback. Try asking:\n• \"Analyze my resume\"\n• \"What are the pros and cons of my resume?\"\n• \"How can I improve my resume for Google?\""
      }
      setMessages(prev => [...prev, resumeReadyMessage])
    } catch (error: any) {
      console.error("Error uploading resume:", error)
      toast.error(error.message || "Failed to upload resume")
    } finally {
      setIsUploading(false)
    }
  }

  const sendMessage = async (messageContent?: string) => {
    const content = messageContent || input.trim()
    if (!content || isLoading) return

    // Add user message
    const userMessage: Message = { role: "user", content }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")
    setIsLoading(true)
    
    // Scroll immediately after adding user message (immediate scroll)
    setTimeout(() => {
      scrollToBottom(true)
    }, 10)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          userId: student?.college_reg_no || "",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get response")
      }

      const data = await response.json()
      
      // Clean markdown formatting from response
      let cleanedMessage = data.message
      // Remove markdown bold formatting (multiple patterns)
      cleanedMessage = cleanedMessage.replace(/\*\*(.*?)\*\*/g, '$1')
      cleanedMessage = cleanedMessage.replace(/\*([^*]+?)\*/g, '$1')
      cleanedMessage = cleanedMessage.replace(/__(.*?)__/g, '$1')
      cleanedMessage = cleanedMessage.replace(/_(.*?)_/g, '$1')
      // Remove markdown headers
      cleanedMessage = cleanedMessage.replace(/^#{1,6}\s+/gm, '')
      // Remove markdown code blocks
      cleanedMessage = cleanedMessage.replace(/```[\s\S]*?```/g, (match: string) => {
        // Keep the content but remove the code block markers
        return match.replace(/```[\w]*\n?/g, '').trim()
      })
      cleanedMessage = cleanedMessage.replace(/`([^`]+)`/g, '$1')
      // Clean up extra whitespace
      cleanedMessage = cleanedMessage.replace(/\n{3,}/g, '\n\n')
      
      // Add assistant message
      setMessages([...newMessages, { role: "assistant", content: cleanedMessage }])
      
      // Scroll after adding assistant message (smooth scroll)
      setTimeout(() => {
        scrollToBottom(false)
      }, 50)
    } catch (error: any) {
      console.error("Error sending message:", error)
      toast.error(error.message || "Failed to send message. Please try again.")
      // Remove the user message if there was an error
      setMessages(messages)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage()
  }

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex flex-col">
      <Navbar />

      <div className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-5xl flex flex-col min-h-0">
        <div className="mb-3 sm:mb-4 flex-shrink-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1 sm:mb-2 text-center sm:text-left flex items-center gap-2 justify-center sm:justify-start">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-purple-600" />
            Interview Prep Chat
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300 text-center sm:text-left">
            Get personalized interview preparation advice powered by AI
          </p>
        </div>

        <Card className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-xl flex flex-col flex-1 min-h-0">
          <CardHeader className="border-b pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              AI Interview Assistant
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Ask me anything about interview preparation for specific companies
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden min-h-0">
            {/* Messages Area */}
            <div 
              className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 min-h-0 scroll-smooth" 
              ref={messagesContainerRef}
              style={{ scrollBehavior: 'smooth' }}
            >
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 sm:gap-4 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 sm:px-5 sm:py-4 ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-tr-sm"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-sm"
                      }`}
                    >
                      <div className="text-sm sm:text-base whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    </div>
                    {message.role === "user" && (
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3 sm:gap-4 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-tl-sm px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} style={{ height: '1px' }} />
              </div>
            </div>

            {/* Resume Upload Section */}
            {resumeFile && (
              <div className="px-4 sm:px-6 pb-2 border-t pt-3 flex-shrink-0 bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-blue-900 dark:text-blue-100 truncate">
                      {resumeFile.name}
                    </span>
                    <span className="text-xs text-blue-700 dark:text-blue-300 flex-shrink-0">
                      ({(resumeFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleResumeUpload}
                      disabled={isUploading || isLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm h-8"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3 h-3 mr-1" />
                          Upload
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setResumeFile(null)}
                      disabled={isUploading}
                      className="text-xs sm:text-sm h-8 px-2"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Resume Status */}
            {hasResume && !resumeFile && (
              <div className="px-4 sm:px-6 pb-2 border-t pt-3 flex-shrink-0 bg-green-50 dark:bg-green-900/20">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-xs sm:text-sm text-green-900 dark:text-green-100">
                    Resume uploaded! Ask me to analyze it.
                  </span>
                </div>
              </div>
            )}

            {/* Suggested Questions */}
            {messages.length === 1 && !isLoading && (
              <div className="px-4 sm:px-6 pb-2 border-t pt-3 flex-shrink-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {hasResume ? "Suggested questions:" : "Suggested questions:"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {hasResume && RESUME_QUESTIONS.slice(0, 2).map((question, index) => (
                    <Button
                      key={`resume-${index}`}
                      variant="outline"
                      size="sm"
                      className="text-xs sm:text-sm h-auto py-1.5 sm:py-2 px-2 sm:px-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border-green-300 dark:border-green-700"
                      onClick={() => handleSuggestedQuestion(question)}
                    >
                      {question}
                    </Button>
                  ))}
                  {SUGGESTED_QUESTIONS.slice(0, hasResume ? 3 : 5).map((question, index) => (
                    <Button
                      key={`general-${index}`}
                      variant="outline"
                      size="sm"
                      className="text-xs sm:text-sm h-auto py-1.5 sm:py-2 px-2 sm:px-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => handleSuggestedQuestion(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t p-3 sm:p-4 flex-shrink-0 bg-white dark:bg-slate-800">
              <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3">
                <div className="flex-1 relative">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={hasResume ? "Ask about interview prep or analyze your resume..." : "Ask about interview preparation for any company..."}
                    className="flex-1 min-h-[60px] sm:min-h-[80px] max-h-[120px] resize-none text-sm sm:text-base pr-10"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    disabled={isLoading || isUploading}
                  />
                  {!hasResume && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading || isUploading}
                        className="absolute right-2 bottom-2 h-8 w-8 text-gray-500 hover:text-gray-700"
                        title="Upload Resume"
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading || isUploading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-auto px-4 sm:px-6 py-2 sm:py-3"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                  <span className="sr-only sm:not-sr-only ml-2">Send</span>
                </Button>
              </form>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Press Enter to send, Shift+Enter for new line
                </p>
                {!hasResume && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-blue-600 hover:text-blue-700 h-auto p-0"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    Upload Resume
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer variant="student" />
    </div>
  )
}

