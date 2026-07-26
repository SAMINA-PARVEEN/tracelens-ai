import * as mammoth from 'mammoth';
import * as exifr from 'exifr';
import JSZip from 'jszip';

export interface MetadataResult {
  fileName: string;
  fileSize: string;
  fileType: string;
  fileCategory: 'document' | 'image' | 'log' | 'email' | 'archive' | 'code' | 'other';
  created: string;
  modified: string;
  hash: string;
  document?: {
    author?: string;
    title?: string;
    creator?: string;
    producer?: string;
    pages?: number;
    created?: string;
    modified?: string;
    lastModifiedBy?: string;
    company?: string;
    wordCount?: number;
    characterCount?: number;
    lineCount?: number;
    paragraphCount?: number;
  };
  camera?: {
    make?: string;
    model?: string;
    aperture?: string;
    shutter?: string;
    iso?: string;
    date?: string;
    focalLength?: string;
    flash?: string;
    exposure?: string;
  };
  gps?: {
    latitude?: string;
    longitude?: string;
    altitude?: string;
    location?: string;
  };
  log?: {
    lineCount: number;
    fileSize: string;
    lastModified: string;
    entries?: {
      timestamp?: string;
      level?: string;
      message?: string;
    }[];
  };
  email?: {
    from?: string;
    to?: string;
    cc?: string[];
    bcc?: string[];
    subject?: string;
    date?: string;
    headers?: Record<string, string>;
    attachments?: string[];
    bodyPreview?: string;
  };
  archive?: {
    fileCount: number;
    totalSize: string;
    files: string[];
  };
  code?: {
    language?: string;
    lines: number;
    characters: number;
  };
}

export async function extractMetadata(file: File): Promise<MetadataResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const buffer = await file.arrayBuffer();
  
  // SHA-256 Hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const baseResult: MetadataResult = {
    fileName: file.name,
    fileSize: (file.size / 1024).toFixed(1) + " KB",
    fileType: ext.toUpperCase() || "Unknown",
    fileCategory: 'other',
    created: new Date(file.lastModified).toISOString(),
    modified: new Date(file.lastModified).toISOString(),
    hash: hash,
  };

  // =============================================
  // 1. PDF FILES - DYNAMIC IMPORT
  // =============================================
  if (ext === 'pdf') {
    try {
      const pdfParse = await import('pdf-parse');
      const data = await pdfParse(Buffer.from(buffer));
      const info = data.info || {};
      const doc: any = {};
      if (info.Author) doc.author = info.Author;
      if (info.Title) doc.title = info.Title;
      if (info.Creator) doc.creator = info.Creator;
      if (info.Producer) doc.producer = info.Producer;
      if (data.numpages) doc.pages = data.numpages;
      if (info.CreationDate) doc.created = info.CreationDate;
      if (info.ModDate) doc.modified = info.ModDate;
      return {
        ...baseResult,
        fileType: "PDF Document",
        fileCategory: 'document',
        document: Object.keys(doc).length > 0 ? doc : undefined,
      };
    } catch (e) { console.warn("PDF failed:", e); }
  }

  // =============================================
  // 2. WORD DOCUMENTS (DOCX)
  // =============================================
  if (ext === 'docx') {
    try {
      const zip = await JSZip.loadAsync(buffer);
      const doc: any = {};
      
      // core.xml
      const coreFile = zip.file('docProps/core.xml');
      if (coreFile) {
        const coreText = await coreFile.async('text');
        const extractTag = (tag: string) => {
          const patterns = [
            new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'),
            new RegExp(`<dc:${tag}[^>]*>([^<]*)</dc:${tag}>`, 'i'),
            new RegExp(`<cp:${tag}[^>]*>([^<]*)</cp:${tag}>`, 'i'),
          ];
          for (const p of patterns) {
            const m = coreText.match(p);
            if (m && m[1]) return m[1].trim();
          }
          return null;
        };
        doc.author = extractTag('creator') || 'Unknown';
        doc.title = extractTag('title') || file.name;
        doc.created = extractTag('created') || baseResult.created;
        doc.modified = extractTag('modified') || baseResult.modified;
        doc.lastModifiedBy = extractTag('lastModifiedBy') || 'Unknown';
      }
      
      // app.xml
      const appFile = zip.file('docProps/app.xml');
      if (appFile) {
        const appText = await appFile.async('text');
        const extractAppTag = (tag: string) => {
          const m = appText.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'));
          return m ? m[1].trim() : null;
        };
        doc.pages = parseInt(extractAppTag('Pages') || '1');
        doc.wordCount = parseInt(extractAppTag('Words') || '0');
        doc.characterCount = parseInt(extractAppTag('Characters') || '0');
        doc.lineCount = parseInt(extractAppTag('Lines') || '0');
        doc.paragraphCount = parseInt(extractAppTag('Paragraphs') || '0');
        doc.creator = extractAppTag('Application') || 'Microsoft Word';
        doc.company = extractAppTag('Company') || 'Unknown';
      }
      
      return {
        ...baseResult,
        fileType: "Word Document",
        fileCategory: 'document',
        document: Object.keys(doc).length > 0 ? doc : undefined,
      };
    } catch (e) { console.warn("DOCX failed:", e); }
  }

  // =============================================
  // 3. IMAGES (EXIF)
  // =============================================
  if (['jpg', 'jpeg', 'png', 'tiff', 'webp', 'gif', 'bmp'].includes(ext)) {
    try {
      const exifData = await exifr.parse(buffer);
      if (exifData) {
        const camera: any = {};
        const gps: any = {};
        if (exifData.Make) camera.make = exifData.Make;
        if (exifData.Model) camera.model = exifData.Model;
        if (exifData.FNumber) camera.aperture = `f/${exifData.FNumber}`;
        if (exifData.ExposureTime) camera.shutter = `${exifData.ExposureTime}s`;
        if (exifData.ISO) camera.iso = `ISO ${exifData.ISO}`;
        if (exifData.DateTimeOriginal) camera.date = exifData.DateTimeOriginal;
        if (exifData.FocalLength) camera.focalLength = `${exifData.FocalLength}mm`;
        if (exifData.Flash) camera.flash = exifData.Flash ? 'Fired' : 'Off';
        if (exifData.latitude && exifData.longitude) {
          gps.latitude = exifData.latitude;
          gps.longitude = exifData.longitude;
          if (exifData.altitude) gps.altitude = exifData.altitude;
        }
        return {
          ...baseResult,
          fileType: "Image",
          fileCategory: 'image',
          camera: Object.keys(camera).length > 0 ? camera : undefined,
          gps: Object.keys(gps).length > 0 ? gps : undefined,
        };
      }
    } catch (e) { console.warn("EXIF failed:", e); }
    return { ...baseResult, fileType: "Image", fileCategory: 'image' };
  }

  // =============================================
  // 4. LOG FILES
  // =============================================
  if (['log', 'txt', 'csv'].includes(ext)) {
    try {
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(buffer);
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      const logEntries: any[] = [];
      const logPattern = /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(\w+)\s+(.+)/;
      for (const line of lines.slice(0, 100)) {
        const m = line.match(logPattern);
        if (m) logEntries.push({ timestamp: m[1], level: m[2], message: m[3] });
      }
      return {
        ...baseResult,
        fileType: ext === 'log' ? "Log File" : "Text File",
        fileCategory: 'log',
        log: {
          lineCount: lines.length,
          fileSize: (file.size / 1024).toFixed(1) + " KB",
          lastModified: new Date(file.lastModified).toISOString(),
          entries: logEntries.length > 0 ? logEntries : undefined,
        },
      };
    } catch (e) { console.warn("Log failed:", e); }
  }

  // =============================================
  // 5. EMAIL FILES
  // =============================================
  if (ext === 'eml' || ext === 'msg') {
    try {
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(buffer);
      const fromMatch = text.match(/^From:\s*(.+)$/m);
      const toMatch = text.match(/^To:\s*(.+)$/m);
      const subjectMatch = text.match(/^Subject:\s*(.+)$/m);
      const dateMatch = text.match(/^Date:\s*(.+)$/m);
      const bodyMatch = text.match(/\n\n([\s\S]+)$/);
      return {
        ...baseResult,
        fileType: "Email File",
        fileCategory: 'email',
        email: {
          from: fromMatch ? fromMatch[1].trim() : undefined,
          to: toMatch ? toMatch[1].trim() : undefined,
          subject: subjectMatch ? subjectMatch[1].trim() : undefined,
          date: dateMatch ? dateMatch[1].trim() : undefined,
          bodyPreview: bodyMatch ? bodyMatch[1].slice(0, 200) + '...' : undefined,
        },
      };
    } catch (e) { console.warn("Email failed:", e); }
  }

  // =============================================
  // 6. CODE FILES
  // =============================================
  if (['js', 'ts', 'py', 'java', 'html', 'css', 'json', 'xml'].includes(ext)) {
    try {
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(buffer);
      const languageMap: Record<string, string> = {
        'js': 'JavaScript', 'ts': 'TypeScript', 'py': 'Python',
        'java': 'Java', 'html': 'HTML', 'css': 'CSS',
        'json': 'JSON', 'xml': 'XML',
      };
      return {
        ...baseResult,
        fileType: "Code File",
        fileCategory: 'code',
        code: {
          language: languageMap[ext] || ext.toUpperCase(),
          lines: text.split('\n').length,
          characters: text.length,
        },
      };
    } catch (e) { console.warn("Code failed:", e); }
  }

  // =============================================
  // 7. ARCHIVE FILES
  // =============================================
  if (ext === 'zip' || ext === 'rar' || ext === '7z') {
    try {
      let fileCount = 0;
      let files: string[] = [];
      
      if (ext === 'zip') {
        try {
          const zip = await JSZip.loadAsync(buffer);
          files = Object.keys(zip.files);
          fileCount = files.length;
        } catch (e) {}
      }
      
      return {
        ...baseResult,
        fileType: "Archive File",
        fileCategory: 'archive',
        archive: {
          fileCount: fileCount || 0,
          totalSize: (file.size / 1024 / 1024).toFixed(2) + " MB",
          files: files.slice(0, 10) || [],
        },
      };
    } catch (e) { console.warn("Archive failed:", e); }
  }

  return { ...baseResult, fileCategory: 'other' };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileIcon(fileType: string, category: string): string {
  const icons: Record<string, string> = {
    'pdf': '📄', 'docx': '📝', 'doc': '📝',
    'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️',
    'log': '📋', 'txt': '📃', 'csv': '📊',
    'eml': '📧', 'msg': '📧',
    'zip': '📦', 'rar': '📦', '7z': '📦',
    'js': '💻', 'ts': '💻', 'py': '🐍', 'java': '☕',
    'html': '🌐', 'css': '🎨', 'json': '📋', 'xml': '📋',
  };
  return icons[fileType.toLowerCase()] || '📎';
}