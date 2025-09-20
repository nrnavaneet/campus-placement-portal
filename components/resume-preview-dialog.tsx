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
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 sm:p-6 overflow-hidden">
        <DialogHeader className="pb-4 px-6 pt-6 sm:px-0 sm:pt-0 border-b flex-shrink-0 relative">
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-lg font-semibold flex-1 leading-tight">
              Resume Preview - {studentName} ({studentRegNo})
            </DialogTitle>
            <div className="flex-shrink-0 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
                className="gap-2 whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 px-6 pb-6 sm:px-0 sm:pb-0 overflow-hidden">
          <div className="w-full h-full border border-gray-200 rounded bg-gray-100 overflow-hidden">
            <iframe
              src={`${resumeUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH&zoom=page-fit`}
              className="w-full h-full border-0"
              title="Resume Preview"
              style={{ 
                minHeight: '500px', 
                maxHeight: 'calc(90vh - 120px)',
                display: 'block',
                overflow: 'hidden'
              }}
              allow="fullscreen"
            >
              <div className="p-4 text-center bg-gray-50 rounded">
                <p className="text-gray-600 mb-4">
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