'use client';

import { useState, useRef } from 'react';
import styles from './files.module.css';
import api from '@/lib/axios';
import notify from '@/lib/toast';

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export default function FilesComponent() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const [isOverDropZone, setIsOverDropZone] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // Helpers
  const bytesToSize = (bytes?: number | string) => {
    const b = typeof bytes === 'string' ? parseInt(bytes, 10) : (bytes || 0);
    if (b === 0) return '0 KB';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    const val = (b / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1);
    return `${val} ${sizes[i]}`;
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const onFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files;
    if (selected?.length) {
      setPendingFiles(prev => [...prev, ...Array.from(selected)]);
      notify.info(`${selected.length} file(s) added to queue`);
    }
    event.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsOverDropZone(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsOverDropZone(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsOverDropZone(false);
    const dropped = e.dataTransfer.files;
    if (dropped.length > 0) {
      setPendingFiles(prev => [...prev, ...Array.from(dropped)]);
      notify.info(`${dropped.length} file(s) added to queue`);
    }
  };

  const removeFromQueue = (idx: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const clearQueue = () => setPendingFiles([]);

  const uploadFiles = async () => {
    const MindMateToken = getCookie('MindMateToken');

    if (pendingFiles.length === 0) {
      notify.warn('Please choose at least one file to upload');
      return;
    }

    // DEBUG: log the array of files being sent
    console.log('Uploading files array:', pendingFiles);
    console.table(pendingFiles.map(f => ({ name: f.name, size: f.size, type: f.type })));

    const form = new FormData();
    pendingFiles.forEach(f => form.append('files', f));

    // DEBUG: log FormData keys (can't directly log values easily)
    for (const pair of (form as any).entries()) {
      console.log('FormData entry:', pair[0], pair[1] instanceof File ? (pair[1] as File).name : pair[1]);
    }

    try {
      setUploading(true);
      const res = await api.post('/api/mentor/files/upload', form, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${MindMateToken}` },
      });
      if (res.status >= 200 && res.status < 300) {
        notify.success('Files uploaded successfully');
        setPendingFiles([]);
      } else {
        notify.error(res.data?.message || 'Upload failed');
      }
    } catch (e: any) {
      console.error('Upload error:', e?.response?.data || e.message);
      notify.error(e?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.filesComponentWrapper}>
      {/* Header */}
      <div className={styles.filesComponentTableHeader}>
        <h2 className={styles.filesComponentTableTitle}>
          <i className={`fas fa-folder-open ${styles.filesComponentHeaderIcon}`}></i>
          Upload Files
        </h2>
      </div>

      {/* Upload section only (no fetching/rendering of existing files) */}
      <div className={styles.filesComponentLowerElement}>
        <div className={styles.filesComponentLowerGrid}>
          <div className={styles.filesComponentUploadFile}>
            <div
              ref={dropZoneRef}
              className={`${styles.filesComponentDropZone} ${isOverDropZone ? styles.filesComponentDropZoneActive : ''}`}
              onClick={triggerFileInput}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <i className={`fas fa-file-arrow-up ${styles.filesComponentDropZoneIcon}`}></i>
              <p>{isOverDropZone ? 'Drop Files Here' : 'Click or Drag Files to Upload'}</p>
              {pendingFiles.length > 0 && (
                <p style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
                  {pendingFiles.length} file(s) in queue
                </p>
              )}
            </div>

            <div className={styles.filesComponentBrowseFile}>
              <input
                type="file"
                ref={fileInputRef}
                className={styles.filesComponentFileUpload}
                onChange={onFileInputChange}
                multiple
                accept="*"
                style={{ display: 'none' }}
              />
            </div>

            <button onClick={triggerFileInput} className={styles.filesComponentCustomFileUpload}>
              <i className="fas fa-folder-open"></i> Browse Files
            </button>
          </div>

          {/* Queue preview (local only) */}
          <div className={styles.filesComponentDisplayedFiles}>
            <div className={styles.filesComponentFilesHeader}>
              <h3><i className="fas fa-list"></i> Upload Queue</h3>
              <div className={styles.filesComponentFileCount}>
                {pendingFiles.length} file(s)
              </div>
            </div>

            <div className={styles.filesComponentDisplayedContainer}>
              {pendingFiles.length > 0 ? (
                pendingFiles.map((file, idx) => (
                  <div key={`${file.name}-${idx}`} className={styles.filesComponentFileItem}>
                    <div className={styles.filesComponentFileContent}>
                      <i className="fas fa-file" style={{ fontSize: 20, marginRight: 10 }}></i>
                      <div className={styles.filesComponentFileInfo}>
                        <p className={styles.filesComponentFileName} title={file.name}>{file.name}</p>
                        <span className={styles.filesComponentFileType}>
                          {file.type || 'file'} • {bytesToSize(file.size)}
                        </span>
                      </div>
                    </div>
                    <div className={styles.filesComponentFileActions}>
                      <button onClick={() => removeFromQueue(idx)} className={styles.filesComponentDeleteBtn} title="Remove from queue">
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.filesComponentNoFiles}>
                  <p>No files in queue</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.filesComponentUploadButton} style={{ gap: 8, display: 'flex' }}>
        <button onClick={uploadFiles} className={styles.filesComponentUploadBtn} disabled={uploading || pendingFiles.length === 0}>
          <i className="fas fa-upload"></i> {uploading ? 'Uploading...' : 'Upload Files'}
        </button>
        <button onClick={clearQueue} className={styles.filesComponentUploadBtn} disabled={pendingFiles.length === 0}>
          <i className="fas fa-trash-can"></i> Clear Queue
        </button>
      </div>

      {/* Icons CDN */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
    </div>
  );
}