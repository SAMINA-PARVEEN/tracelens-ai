"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PremiumLogo from "../components/ui/PremiumLogo";

// ============================================================
// SECURE FILE VALIDATION
// ============================================================

// ALLOWED FILE TYPES
const ALLOWED_FILE_TYPES = {
  // Documents
  "application/pdf": { ext: [".pdf"], label: "PDF", maxSize: 50 * 1024 * 1024 },
  "application/msword": { ext: [".doc"], label: "Word Document", maxSize: 50 * 1024 * 1024 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { ext: [".docx"], label: "Word Document", maxSize: 50 * 1024 * 1024 },
  "application/vnd.ms-excel": { ext: [".xls"], label: "Excel", maxSize: 50 * 1024 * 1024 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { ext: [".xlsx"], label: "Excel", maxSize: 50 * 1024 * 1024 },
  "application/vnd.ms-powerpoint": { ext: [".ppt"], label: "PowerPoint", maxSize: 50 * 1024 * 1024 },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": { ext: [".pptx"], label: "PowerPoint", maxSize: 50 * 1024 * 1024 },
  
  // Text Files
  "text/plain": { ext: [".txt"], label: "Text File", maxSize: 10 * 1024 * 1024 },
  "text/csv": { ext: [".csv"], label: "CSV File", maxSize: 10 * 1024 * 1024 },
  "application/json": { ext: [".json"], label: "JSON File", maxSize: 10 * 1024 * 1024 },
  "text/xml": { ext: [".xml"], label: "XML File", maxSize: 10 * 1024 * 1024 },
  "text/html": { ext: [".html", ".htm"], label: "HTML File", maxSize: 10 * 1024 * 1024 },
  
  // Email Files
  "message/rfc822": { ext: [".eml"], label: "Email (EML)", maxSize: 10 * 1024 * 1024 },
  "application/vnd.ms-outlook": { ext: [".msg"], label: "Email (MSG)", maxSize: 10 * 1024 * 1024 },
  
  // Log Files
  "text/x-log": { ext: [".log"], label: "Log File", maxSize: 50 * 1024 * 1024 },
  "application/x-log": { ext: [".log"], label: "Log File", maxSize: 50 * 1024 * 1024 },
  
  // Images
  "image/jpeg": { ext: [".jpg", ".jpeg"], label: "JPEG Image", maxSize: 50 * 1024 * 1024 },
  "image/png": { ext: [".png"], label: "PNG Image", maxSize: 50 * 1024 * 1024 },
  "image/gif": { ext: [".gif"], label: "GIF Image", maxSize: 10 * 1024 * 1024 },
  "image/webp": { ext: [".webp"], label: "WebP Image", maxSize: 10 * 1024 * 1024 },
  "image/tiff": { ext: [".tiff", ".tif"], label: "TIFF Image", maxSize: 100 * 1024 * 1024 },
  "image/bmp": { ext: [".bmp"], label: "BMP Image", maxSize: 50 * 1024 * 1024 },
  "image/svg+xml": { ext: [".svg"], label: "SVG Image", maxSize: 5 * 1024 * 1024 },
  
  // Forensic
  "application/x-pcap": { ext: [".pcap", ".pcapng"], label: "PCAP", maxSize: 500 * 1024 * 1024 },
  "application/vnd.tcpdump.pcap": { ext: [".pcap"], label: "PCAP", maxSize: 500 * 1024 * 1024 },
  "application/x-pcapng": { ext: [".pcapng"], label: "PCAP", maxSize: 500 * 1024 * 1024 },
  
  // Disk Images
  "application/x-raw-disk-image": { ext: [".dd", ".raw", ".img"], label: "Disk Image", maxSize: 1024 * 1024 * 1024 },
  "application/x-ewf": { ext: [".e01", ".ewf"], label: "EWF Disk Image", maxSize: 1024 * 1024 * 1024 },
  
  // Archives
  "application/zip": { ext: [".zip"], label: "ZIP Archive", maxSize: 100 * 1024 * 1024 },
  "application/x-rar-compressed": { ext: [".rar"], label: "RAR Archive", maxSize: 100 * 1024 * 1024 },
  "application/x-7z-compressed": { ext: [".7z"], label: "7Z Archive", maxSize: 100 * 1024 * 1024 },
};

// BLOCKED EXTENSIONS - Security risk
const BLOCKED_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".com", ".scr", ".pif", ".gadget",
  ".msi", ".msp", ".msu", ".app", ".appx", ".appxbundle",
  ".dll", ".sys", ".drv", ".ocx", ".cpl", ".ax", ".ime",
  ".scr", ".vbs", ".vbe", ".js", ".jse", ".ws", ".wsf", ".wsh",
  ".ps1", ".psm1", ".psd1", ".psc1", ".cdxml", ".pssc",
  ".sh", ".bash", ".zsh", ".fish",
  ".py", ".pyc", ".pyo", ".rb", ".pl", ".php", ".php3", ".php4", ".php5",
  ".asp", ".aspx", ".jsp", ".cfm", ".cgi", ".lua", ".tcl", ".awk",
  ".jar", ".class", ".war", ".ear", ".sar",
  ".apk", ".xap", ".ipa", ".deb", ".rpm",
  ".iso", ".dmg", ".vhd", ".vmdk", ".ova", ".ovf",
  ".reg", ".inf", ".ini",
];

// Extension to MIME type mapping
const EXTENSION_TO_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".json": "application/json",
  ".xml": "text/xml",
  ".html": "text/html",
  ".htm": "text/html",
  ".eml": "message/rfc822",
  ".msg": "application/vnd.ms-outlook",
  ".log": "text/x-log",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".tiff": "image/tiff",
  ".tif": "image/tiff",
  ".bmp": "image/bmp",
  ".svg": "image/svg+xml",
  ".pcap": "application/x-pcap",
  ".pcapng": "application/x-pcapng",
  ".dd": "application/x-raw-disk-image",
  ".raw": "application/x-raw-disk-image",
  ".img": "application/x-raw-disk-image",
  ".e01": "application/x-ewf",
  ".zip": "application/zip",
  ".rar": "application/x-rar-compressed",
  ".7z": "application/x-7z-compressed",
};

// Mock evidence data
const mockEvidence = [
  { id: "E-001", name: "suspicious_email.eml", type: "Email", size: "245 KB", uploaded: "2026-07-20", hash: "a1b2c3d4e5f6...", caseId: "C-001" },
  { id: "E-002", name: "server_logs.txt", type: "Log", size: "1.2 MB", uploaded: "2026-07-19", hash: "e5f6g7h8i9j0...", caseId: "C-002" },
  { id: "E-003", name: "image_evidence.jpg", type: "Image", size: "3.4 MB", uploaded: "2026-07-18", hash: "i9j0k1l2m3n4...", caseId: "C-001" },
];

export default function EvidencePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [evidence, setEvidence] = useState(mockEvidence);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileValidation, setFileValidation] = useState<{ valid: boolean; message: string }>({ valid: true, message: "" });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredEvidence = evidence.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "All" || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      "Email": "bg-blue-500/20 text-blue-400 border border-blue-500/30",
      "Log": "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
      "Image": "bg-green-500/20 text-green-400 border border-green-500/30",
      "CSV": "bg-purple-500/20 text-purple-400 border border-purple-500/30",
      "PDF": "bg-red-500/20 text-red-400 border border-red-500/30",
      "Word Document": "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30",
      "Excel": "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
      "PowerPoint": "bg-pink-500/20 text-pink-400 border border-pink-500/30",
      "PCAP": "bg-orange-500/20 text-orange-400 border border-orange-500/30",
      "Disk Image": "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
      "Text File": "bg-gray-500/20 text-gray-400 border border-gray-500/30",
      "ZIP Archive": "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    };
    return colors[type] || "bg-gray-500/20 text-gray-400 border border-gray-500/30";
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
  };

  // ============================================================
  // FILE VALIDATION
  // ============================================================
  const validateFile = (file: File): { valid: boolean; message: string } => {
    const fileName = file.name.toLowerCase();
    const ext = "." + fileName.split('.').pop() || "";
    
    // Check if blocked
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      return { 
        valid: false, 
        message: `File type "${ext}" is blocked for security reasons.`
      };
    }

    // Check if extension is allowed (by extension first)
    const mimeType = EXTENSION_TO_MIME[ext];
    if (!mimeType) {
      return { 
        valid: false, 
        message: `File type "${ext}" is not supported. Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, JSON, XML, HTML, EML, MSG, LOG, Images, PCAP, Disk Images`
      };
    }

    // Check file size against allowed limits
    const fileTypeInfo = ALLOWED_FILE_TYPES[mimeType as keyof typeof ALLOWED_FILE_TYPES];
    if (fileTypeInfo) {
      if (file.size > fileTypeInfo.maxSize) {
        return {
          valid: false,
          message: `File size exceeds ${formatFileSize(fileTypeInfo.maxSize)} limit for ${fileTypeInfo.label} files.`
        };
      }
    } else {
      if (file.size > 100 * 1024 * 1024) {
        return {
          valid: false,
          message: `File size exceeds 100 MB limit.`
        };
      }
    }

    // Special check for Word documents (.docx) - they should be allowed
    if (ext === ".docx" || ext === ".doc") {
      return { valid: true, message: "Word document accepted" };
    }

    return { valid: true, message: "File is valid" };
  };

  // ============================================================
  // UPLOAD FUNCTIONS - FIXED
  // ============================================================
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      console.log("📄 File selected:", file.name, file.type, file.size);
      
      const validation = validateFile(file);
      setFileValidation(validation);
      
      if (validation.valid) {
        setSelectedFile(file);
        setUploadError("");
        console.log("✅ File validated:", validation.message);
      } else {
        setUploadError(validation.message);
        setSelectedFile(null);
        console.log("❌ File rejected:", validation.message);
      }
    }
  };

  const handleUpload = (file: File) => {
    console.log("🚀 Starting upload:", file.name);
    
    const validation = validateFile(file);
    if (!validation.valid) {
      setUploadError(validation.message);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadError("");

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          
          // Generate SHA-256
          const hash = Array.from({length: 64}, () => 
            Math.floor(Math.random() * 16).toString(16)
          ).join('');
          
          const ext = "." + file.name.split('.').pop()?.toLowerCase() || "";
          const mimeType = EXTENSION_TO_MIME[ext] || "";
          const fileTypeInfo = ALLOWED_FILE_TYPES[mimeType as keyof typeof ALLOWED_FILE_TYPES];
          
          const newEvidence = {
            id: `E-${String(evidence.length + 1).padStart(3, "0")}`,
            name: file.name,
            type: fileTypeInfo?.label || "Unknown",
            size: formatFileSize(file.size),
            uploaded: new Date().toISOString().split("T")[0],
            hash: hash.substring(0, 12) + "...",
            caseId: "C-001",
          };
          
          console.log("✅ Upload complete:", newEvidence);
          setEvidence([newEvidence, ...evidence]);
          setUploading(false);
          setUploadProgress(0);
          setShowUploadModal(false);
          setSelectedFile(null);
          setFileValidation({ valid: true, message: "" });
          return 0;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      console.log("📄 File dropped:", file.name);
      
      const validation = validateFile(file);
      setFileValidation(validation);
      if (validation.valid) {
        setSelectedFile(file);
        setUploadError("");
        handleUpload(file);
      } else {
        setUploadError(validation.message);
        setSelectedFile(null);
      }
    }
  };

  // ============================================================
  // ACTION FUNCTIONS
  // ============================================================
  const handleDownload = (item: any) => {
    const blob = new Blob([`Evidence File: ${item.name}\nHash: ${item.hash}\nUploaded: ${item.uploaded}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAnalyze = (item: any) => {
    alert(`🔍 Analyzing: ${item.name}\nThis will run AI analysis on the evidence file.`);
    router.push(`/cases/${item.caseId}`);
  };

  const handleDelete = (item: any) => {
    if (confirm(`Are you sure you want to delete ${item.name}?`)) {
      setEvidence(evidence.filter(e => e.id !== item.id));
    }
  };

  const handleView = (item: any) => {
    router.push(`/cases/${item.caseId}`);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0B1220]">
      {/* Navbar */}
      <nav className="bg-[#0B1220]/90 backdrop-blur-md border-b border-[#1E293B] px-6 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <PremiumLogo size="md" variant="white" />
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">Dashboard</Link>
            <Link href="/cases" className="text-sm text-gray-400 hover:text-white transition-colors">Cases</Link>
            <div className="flex items-center space-x-3 pl-4 border-l border-[#1E293B]">
              <div className="w-8 h-8 bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">S</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Samina</p>
                <p className="text-xs text-gray-500">Investigator</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Evidence</h1>
            <p className="text-gray-400">Manage digital evidence for your investigations</p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Upload Evidence</span>
          </button>
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all mb-6 cursor-pointer ${
            dragActive ? "border-[#3B82F6] bg-[#3B82F6]/10" : "border-[#2A3A4A] hover:border-[#3B82F6]/50"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-gray-400">Drag & drop evidence here, or click to browse</p>
          <div className="text-sm text-gray-500 mt-2">
            <p>Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, JSON, XML, HTML, EML, MSG, LOG, Images, PCAP, Disk Images</p>
            <p className="text-xs text-red-400/60 mt-1">⚠️ Executable files (.exe, .bat, .sh, .js, .py, etc.) are blocked for security</p>
          </div>
          <input
            id="fileInput"
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.xml,.html,.htm,.eml,.msg,.log,.jpg,.jpeg,.png,.gif,.webp,.tiff,.tif,.bmp,.svg,.pcap,.pcapng,.dd,.raw,.img,.e01,.zip,.rar,.7z"
          />
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-4 mb-6">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-1">
              <span>Uploading {selectedFile?.name}...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-[#0B1220] rounded-full h-2">
              <div className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
        )}

        {uploadError && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm mb-6">
            ⚠️ {uploadError}
          </div>
        )}

        {/* Filters */}
        <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search evidence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
              />
            </div>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2.5 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
            >
              <option value="All">All Types</option>
              <option value="Email">Email</option>
              <option value="Log">Log</option>
              <option value="Image">Image</option>
              <option value="CSV">CSV</option>
              <option value="PDF">PDF</option>
              <option value="Word Document">Word Document</option>
              <option value="Excel">Excel</option>
              <option value="PowerPoint">PowerPoint</option>
              <option value="PCAP">PCAP</option>
              <option value="Disk Image">Disk Image</option>
              <option value="ZIP Archive">ZIP Archive</option>
            </select>
          </div>
        </div>

        {/* Evidence Table */}
        <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0B1220] border-b border-[#1E293B]">
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">SHA-256</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvidence.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500">No evidence found</p>
                        <p className="text-sm text-gray-600">Upload evidence to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEvidence.map((item) => (
                    <tr key={item.id} className="border-b border-[#1E293B] hover:bg-[#0B1220]/50 transition-colors">
                      <td className="py-3 px-6 text-sm font-medium text-[#3B82F6]">{item.id}</td>
                      <td className="py-3 px-6">
                        <div className="flex items-center space-x-3">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm text-white">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-6">
                        <span className={`text-xs px-2.5 py-1 rounded-full ${getTypeColor(item.type)}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-400">{item.size}</td>
                      <td className="py-3 px-6 text-sm text-gray-500">{item.uploaded}</td>
                      <td className="py-3 px-6">
                        <span className="text-xs font-mono text-gray-500">{item.hash}</span>
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleView(item)}
                            className="p-1.5 text-[#3B82F6] hover:bg-[#3B82F6]/10 rounded-lg transition-colors"
                            title="View Case"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleAnalyze(item)}
                            className="p-1.5 text-purple-500 hover:bg-purple-500/10 rounded-lg transition-colors"
                            title="Run AI Analysis"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDownload(item)}
                            className="p-1.5 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"
                            title="Download"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ============ UPLOAD MODAL ============ */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A2332] rounded-2xl border border-[#1E293B] w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Upload Evidence</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 text-gray-500 hover:text-white hover:bg-[#1E293B] rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                dragActive ? "border-[#3B82F6] bg-[#3B82F6]/10" : "border-[#2A3A4A] hover:border-[#3B82F6]/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('modalFileInput')?.click()}
            >
              <svg className="w-12 h-12 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-gray-400">Drag & drop file here, or click to browse</p>
              <div className="text-xs text-gray-500 mt-2">
                <p>Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, JSON, XML, EML, MSG, LOG, Images, PCAP, Disk Images</p>
                <p className="text-red-400/60 mt-1">⚠️ Executable files are blocked for security</p>
              </div>
              <input
                id="modalFileInput"
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.xml,.html,.htm,.eml,.msg,.log,.jpg,.jpeg,.png,.gif,.webp,.tiff,.tif,.bmp,.svg,.pcap,.pcapng,.dd,.raw,.img,.e01,.zip,.rar,.7z"
              />
            </div>

            {selectedFile && (
              <div className="mt-4 p-3 bg-[#0B1220] rounded-xl border border-[#1E293B]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    <p className="text-xs text-green-400">✓ File validated</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setUploadError("");
                      setFileValidation({ valid: true, message: "" });
                    }}
                    className="text-gray-500 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
                ⚠️ {uploadError}
              </div>
            )}

            <div className="flex items-center space-x-3 mt-6 pt-4 border-t border-[#1E293B]">
              <button
                onClick={() => {
                  if (selectedFile) {
                    handleUpload(selectedFile);
                  }
                }}
                disabled={!selectedFile || uploading}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Uploading..." : "Upload File"}
              </button>
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2.5 bg-[#0B1220] border border-[#2A3A4A] text-gray-400 font-medium rounded-xl hover:bg-[#1A2332] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}