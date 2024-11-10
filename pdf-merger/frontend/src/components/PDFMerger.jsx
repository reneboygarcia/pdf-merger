import React, { useState, useRef, useEffect } from 'react';
import { Loader2, X, FileText, MoveUp, MoveDown, Eye } from 'lucide-react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "../components/ui/use-toast";

const PDFMerger = () => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const dropzoneRef = useRef(null);
  const toast = useToast();

  // Get the current origin dynamically
  const API_URL = `http://${window.location.hostname}:5000`;

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target === dropzoneRef.current) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const processFiles = (fileList) => {
    if (!fileList || fileList.length === 0) {
      setError("No files selected");
      return;
    }

    const newFiles = Array.from(fileList)
      .filter(file => file.type === 'application/pdf')
      .map(file => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        preview: URL.createObjectURL(new Blob([file], { type: 'application/pdf' }))
      }));

    if (newFiles.length === 0) {
      setError("Please select PDF files only");
      return;
    }

    // Check file sizes
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = newFiles.filter(file => file.file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      setError(`Some files exceed the 10MB size limit: ${oversizedFiles.map(f => f.file.name).join(', ')}`);
      return;
    }

    setFiles(current => [...current, ...newFiles]);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const items = e.dataTransfer.files;
    processFiles(items);
  };

  const handleFileSelect = (e) => {
    if (!e.target.files) {
      setError("No files selected");
      return;
    }
    processFiles(e.target.files);
  };

  const removeFile = (idToRemove) => {
    if (!idToRemove) {
      console.error("No file ID provided for removal");
      return;
    }

    setFiles(files => {
      const fileToRemove = files.find(f => f.id === idToRemove);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return files.filter(file => file.id !== idToRemove);
    });
  };

  const moveFile = (index, direction) => {
    if (typeof index !== 'number' || typeof direction !== 'number') {
      console.error("Invalid index or direction for file movement");
      return;
    }

    const newFiles = [...files];
    const newIndex = index + direction;
    
    if (newIndex >= 0 && newIndex < files.length) {
      [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
      setFiles(newFiles);
    }
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError("Please add at least 2 PDF files to merge");
      return;
    }

    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    for (const file of files) {
      if (!file || !file.file) {
        setError("Invalid file data");
        setIsProcessing(false);
        return;
      }
      formData.append('pdfs', file.file);
    }

    try {
      const response = await fetch(`${API_URL}/api/merge-pdfs`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/pdf'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to merge PDFs');
      }

      const blob = await response.blob();
      if (!blob) {
        throw new Error("Received empty response from server");
      }

      // Create and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Merge error:', error);
      setError(error.message || "An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  // Cleanup URLs when component unmounts
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file && file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>PDF Merger</CardTitle>
          <CardDescription>
            Drag and drop PDF files to merge them into a single document
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            ref={dropzoneRef}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input').click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            role="button"
            tabIndex={0}
            aria-label="Drop zone for PDF files"
          >
            <input
              id="file-input"
              type="file"
              className="hidden"
              accept=".pdf"
              multiple
              onChange={handleFileSelect}
              aria-label="File input for PDFs"
            />
            <div className="space-y-4">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium">
                  Drop PDF files here or click to select
                </p>
                <p className="text-sm text-gray-500">
                  You can add multiple files (max 10MB each)
                </p>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="font-medium">Selected Files ({files.length})</div>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <span className="truncate max-w-xs">
                        {file.file.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewFile(file)}
                        aria-label={`Preview ${file.file.name}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveFile(index, -1)}
                        disabled={index === 0}
                        aria-label="Move file up"
                      >
                        <MoveUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveFile(index, 1)}
                        disabled={index === files.length - 1}
                        aria-label="Move file down"
                      >
                        <MoveDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        aria-label={`Remove ${file.file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                className="w-full"
                onClick={handleMerge}
                disabled={isProcessing || files.length < 2}
                aria-label="Merge PDFs"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Merging PDFs...
                  </>
                ) : (
                  'Merge PDFs'
                )}
              </Button>
            </div>
          )}

          {/* PDF Preview Dialog */}
          <Dialog 
            open={previewFile !== null} 
            onOpenChange={() => setPreviewFile(null)}
          >
            <DialogContent className="max-w-4xl h-[80vh]">
              <DialogHeader>
                <DialogTitle>{previewFile?.file.name}</DialogTitle>
                <DialogDescription>
                  Preview of the selected PDF file
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 w-full h-full min-h-0">
                {previewFile && (
                  <object
                    data={previewFile.preview}
                    type="application/pdf"
                    className="w-full h-full"
                    aria-label={`Preview of ${previewFile.file.name}`}
                  >
                    <p>Your browser does not support PDF previews. 
                      <a href={previewFile.preview} target="_blank" rel="noopener noreferrer">
                        Click here to open the PDF
                      </a>
                    </p>
                  </object>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default PDFMerger;