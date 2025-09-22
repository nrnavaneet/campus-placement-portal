import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, ExternalLink, AlertCircle } from 'lucide-react'

interface ResumePreviewDialogProps {
  isOpen: boolean
  onClose: () => void
  resumeUrl: string
  studentName: string
  studentRegNo: string
  onDownload: () => void
}

export function ResumePreviewDialog({
  isOpen,
  onClose,
  resumeUrl,
  studentName,
  studentRegNo,
  onDownload
}: ResumePreviewDialogProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileFallback, setShowMobileFallback] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(mobile)
      // On mobile, show fallback immediately to avoid the "open something" issue
      if (mobile) {
        setShowMobileFallback(true)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleOpenInNewTab = () => {
    window.open(resumeUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] sm:w-full flex flex-col p-0 sm:p-6 overflow-hidden mx-2 sm:mx-auto">
        <DialogHeader className="pb-4 px-4 pt-4 sm:px-6 sm:pt-6 md:px-0 md:pt-0 border-b flex-shrink-0 relative">
          <div className="flex items-start justify-between gap-2 sm:gap-4">
            <DialogTitle className="text-base sm:text-lg font-semibold flex-1 leading-tight mt-2 pr-2">
              <span className="block sm:hidden">Resume - {studentName}</span>
              <span className="hidden sm:block">Resume Preview - {studentName} ({studentRegNo})</span>
            </DialogTitle>
            <div className="flex gap-2 flex-shrink-0" style={{ marginRight: '0.8cm' }}>
              {isMobile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenInNewTab}
                  className="gap-1 sm:gap-2 whitespace-nowrap px-2 sm:px-3"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="text-xs">Open</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
                className="gap-1 sm:gap-2 whitespace-nowrap px-2 sm:px-3"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
                <span className="sm:hidden text-xs">PDF</span>
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 px-4 pb-4 sm:px-6 sm:pb-6 md:px-0 md:pb-0 overflow-hidden">
          <div className="w-full h-full border border-gray-200 rounded bg-gray-100 overflow-hidden">
            {isMobile && showMobileFallback ? (
              /* Mobile-friendly fallback */
              <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
                <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Resume Preview
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-sm">
                  On mobile devices, resume viewing works best when opened in a new tab or downloaded directly.
                </p>
                <div className="flex flex-col gap-3 mt-6 w-full max-w-xs">
                  <Button 
                    onClick={handleOpenInNewTab} 
                    className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in New Tab
                  </Button>
                  <Button 
                    onClick={onDownload} 
                    variant="outline" 
                    className="w-full gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                </div>
              </div>
            ) : (
              /* Desktop iframe view */
              <iframe
                src={`${resumeUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH&zoom=page-fit`}
                className="w-full h-full border-0"
                title="Resume Preview"
                style={{ 
                  minHeight: '500px',
                  maxHeight: 'calc(90vh - 100px)',
                  display: 'block',
                  overflow: 'hidden'
                }}
                allow="fullscreen"
                onError={() => {
                  // If iframe fails to load on mobile, show fallback
                  if (isMobile) {
                    setShowMobileFallback(true)
                  }
                }}
              >
                <div className="p-4 text-center bg-gray-50 rounded">
                  <p className="text-gray-600 mb-4 text-sm sm:text-base">
                    Your browser doesn't support PDF viewing.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button variant="outline" onClick={handleOpenInNewTab} className="gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Open in New Tab
                    </Button>
                    <Button variant="outline" onClick={onDownload} className="gap-2">
                      <Download className="w-4 h-4" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              </iframe>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}