import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] sm:w-full flex flex-col p-0 sm:p-6 overflow-hidden mx-2 sm:mx-auto">
        <DialogHeader className="pb-4 px-4 pt-4 sm:px-6 sm:pt-6 md:px-0 md:pt-0 border-b flex-shrink-0 relative">
          <div className="flex items-start justify-between gap-2 sm:gap-4">
            <DialogTitle className="text-base sm:text-lg font-semibold flex-1 leading-tight mt-2 pr-2">
              <span className="block sm:hidden">Resume - {studentName}</span>
              <span className="hidden sm:block">Resume Preview - {studentName} ({studentRegNo})</span>
            </DialogTitle>
            <div className="flex-shrink-0" style={{ marginRight: '0.8cm' }}>
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
            >
              <div className="p-4 text-center bg-gray-50 rounded">
                <p className="text-gray-600 mb-4 text-sm sm:text-base">
                  Your browser doesn't support PDF viewing.
                </p>
                <Button variant="outline" onClick={onDownload} className="gap-2">
                  <Download className="w-4 h-4" />
                  Download the resume instead
                </Button>
              </div>
            </iframe>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}