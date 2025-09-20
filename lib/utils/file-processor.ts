import { FileAttachment } from '../types'
import { v4 as uuidv4 } from 'uuid'

export class FileProcessor {
  static async processFiles(files: FileList): Promise<FileAttachment[]> {
    const processedFiles: FileAttachment[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const processed = await this.processFile(file)
        processedFiles.push(processed)
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error)
        // Still add the file but with error info
        processedFiles.push({
          id: uuidv4(),
          name: file.name,
          type: file.type,
          size: file.size,
          content: `Error processing file: ${error}`,
          extractedText: '',
        })
      }
    }

    return processedFiles
  }

  static async processFile(file: File): Promise<FileAttachment> {
    const id = uuidv4()
    const baseAttachment: Omit<FileAttachment, 'content' | 'extractedText'> = {
      id,
      name: file.name,
      type: file.type,
      size: file.size,
    }

    // Process based on file type
    if (file.type === 'application/pdf') {
      const extractedText = await this.extractPDFText(file)
      return {
        ...baseAttachment,
        content: `PDF file: ${file.name}\n\nExtracted content:\n${extractedText}`,
        extractedText,
      }
    } else if (file.type.startsWith('image/')) {
      const dataUrl = await this.fileToDataUrl(file)
      return {
        ...baseAttachment,
        content: `Image file: ${file.name}`,
        url: dataUrl,
      }
    } else if (this.isTextFile(file)) {
      const text = await file.text()
      return {
        ...baseAttachment,
        content: `File: ${file.name}\n\n\`\`\`${this.getFileExtension(file.name)}\n${text}\n\`\`\``,
        extractedText: text,
      }
    } else {
      // Try to read as text for unknown types
      try {
        const text = await file.text()
        return {
          ...baseAttachment,
          content: `File: ${file.name}\n\n${text}`,
          extractedText: text,
        }
      } catch (error) {
        return {
          ...baseAttachment,
          content: `Binary file: ${file.name} (${this.formatFileSize(file.size)})`,
          extractedText: '',
        }
      }
    }
  }

  private static async extractPDFText(file: File): Promise<string> {
    try {
      // Dynamic import for PDF.js to avoid SSR issues
      const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist/legacy/build/pdf.js')
      
      // Set worker source
      GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

      const arrayBuffer = await file.arrayBuffer()
      const pdf = await getDocument({ data: arrayBuffer }).promise
      
      let fullText = ''
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        
        const pageText = textContent.items
          .filter((item: any) => 'str' in item)
          .map((item: any) => item.str)
          .join(' ')
        
        fullText += `Page ${i}:\n${pageText}\n\n`
      }
      
      return fullText.trim()
    } catch (error) {
      throw new Error(`Failed to extract PDF text: ${error}`)
    }
  }

  private static async fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  private static isTextFile(file: File): boolean {
    const textTypes = [
      'text/',
      'application/json',
      'application/xml',
      'application/javascript',
      'application/typescript',
    ]
    
    const textExtensions = [
      '.txt', '.md', '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c',
      '.html', '.css', '.json', '.xml', '.yaml', '.yml', '.ini', '.cfg', '.conf',
      '.sh', '.bat', '.ps1', '.sql', '.r', '.m', '.swift', '.go', '.rs', '.php',
    ]
    
    return textTypes.some(type => file.type.startsWith(type)) ||
           textExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
  }

  private static getFileExtension(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase()
    
    // Map common extensions to syntax highlighting names
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'jsx': 'javascript',
      'tsx': 'typescript',
      'py': 'python',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'cpp': 'cpp',
      'c': 'c',
      'java': 'java',
      'php': 'php',
      'swift': 'swift',
      'kt': 'kotlin',
      'cs': 'csharp',
      'sh': 'bash',
      'ps1': 'powershell',
      'sql': 'sql',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
    }
    
    return ext ? (languageMap[ext] || ext) : 'text'
  }

  private static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  static validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return { valid: false, error: `File size exceeds 10MB limit` }
    }

    return { valid: true }
  }

  // Utility for drag and drop
  static handleDragAndDrop(
    e: DragEvent,
    onFiles: (files: FileAttachment[]) => void,
    onError: (error: string) => void
  ) {
    e.preventDefault()
    e.stopPropagation()

    const files = e.dataTransfer?.files
    if (!files || files.length === 0) {
      onError('No files detected in drop')
      return
    }

    // Validate files
    for (let i = 0; i < files.length; i++) {
      const validation = this.validateFile(files[i])
      if (!validation.valid) {
        onError(`${files[i].name}: ${validation.error}`)
        return
      }
    }

    // Process files
    this.processFiles(files)
      .then(onFiles)
      .catch(error => onError(`Error processing files: ${error.message}`))
  }
}