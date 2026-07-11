import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DocumentUploadProps {
  onFileUpload: (file: File) => void;
  isUploading?: boolean;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onFileUpload, isUploading = false }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    try {
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ];

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setUploadStatus('error');
        return;
      }

      if (validTypes.includes(file.type)) {
        setUploadStatus('success');
        onFileUpload(file);
      } else {
        setUploadStatus('error');
      }
    } catch (error) {
      console.error('File handling error:', error);
      setUploadStatus('error');
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'success':
        return <CheckCircle2 className="w-8 h-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      default:
        return <Upload className="w-8 h-8 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'success':
        return 'File uploaded successfully!';
      case 'error':
        return 'Invalid file type. Please upload PDF, Word, Excel, or Text files.';
      default:
        return 'Drag and drop your document here, or click to browse';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-8">
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300",
            dragActive ? "border-primary bg-primary/5" : "border-border",
            uploadStatus === 'success' ? "border-green-500 bg-green-50" : "",
            uploadStatus === 'error' ? "border-red-500 bg-red-50" : "",
            "hover:border-primary/50 cursor-pointer"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
            disabled={isUploading}
          />
          
          <div className="flex flex-col items-center space-y-4">
            {getStatusIcon()}
            
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {getStatusText()}
              </p>
              <p className="text-sm text-muted-foreground">
                Supported formats: PDF, Word (DOC/DOCX), Excel (XLS/XLSX), Text (TXT)
              </p>
            </div>

            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>Maximum file size: 10MB</span>
            </div>

            <Button
              variant="outline"
              size="lg"
              disabled={isUploading}
              className="mt-4"
            >
              {isUploading ? 'Uploading...' : 'Choose File'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;