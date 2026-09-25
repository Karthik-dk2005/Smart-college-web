// CampusConnect Reusable FileUpload Component (Requirements 22, 59, 74)
// Supports Image, PDF, Document with Drag & Drop, Preview, Progress, Remove & Replace

function FileUpload({ onFileSelect, accept = '.pdf,.doc,.docx,.png,.jpg,.jpeg', maxSizeBytes = 25000000, label = 'Upload Document or Photo' }) {
  const [dragActive, setDragActive] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    if (file.size > maxSizeBytes) {
      alert(`File is too large! Maximum limit is ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    const timer = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsUploading(false);
          setSelectedFile(file);
          if (onFileSelect) onFileSelect(file);
          return 100;
        }
        return prev + 25;
      });
    }, 100);
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onFileSelect) onFileSelect(null);
  };

  return (
    <div className="file-upload-component">
      <label className="form-label">{label}</label>

      {!selectedFile && !isUploading ? (
        <div 
          className={`drop-zone ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            className="file-input-hidden" 
            accept={accept}
            onChange={handleChange}
          />
          <div className="drop-zone-icon">
            <Icons.UploadCloud size={32} />
          </div>
          <div className="drop-zone-text">
            <strong>Click to browse</strong> or drag & drop file here
          </div>
          <div className="drop-zone-sub">
            Supported formats: PDF, Word Doc, Images up to 25MB
          </div>
        </div>
      ) : isUploading ? (
        <div className="upload-progress-card">
          <div className="upload-progress-header">
            <span>Uploading & Verifying Document...</span>
            <span className="font-bold">{uploadProgress}%</span>
          </div>
          <ProgressBar value={uploadProgress} max={100} showLabel={false} height={8} />
        </div>
      ) : (
        <div className="file-preview-card">
          <div className="file-preview-icon">
            <Icons.FileText size={24} className="text-primary" />
          </div>
          <div className="file-preview-info">
            <div className="file-name">{selectedFile.name}</div>
            <div className="file-meta">
              {(selectedFile.size / 1024).toFixed(1)} KB &bull; {selectedFile.type || 'Document'}
            </div>
          </div>
          <div className="file-preview-actions">
            <button 
              type="button" 
              className="btn btn-sm btn-secondary"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              title="Replace file"
            >
              Replace
            </button>
            <button 
              type="button" 
              className="btn btn-sm btn-outline-danger"
              onClick={handleRemove}
              title="Remove file"
            >
              <Icons.Trash size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

window.FileUpload = FileUpload;
