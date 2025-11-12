'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './filemanager.module.css';
import api from '@/lib/axios';
import notify from '@/lib/toast';

interface File {
  id: string;            // Drive file id
  file_name: string;     // name
  created_at: string;    // createdTime
  File_type: string;     // mimeType simplified label
  file_size: number;     // bytes (we show KB)
  webViewLink?: string;
  webContentLink?: string;
}

interface FileManagerComponentProps {
  files: File[];
  setFiles: (files: File[]) => void;
}

export default function FileManagerComponent({ files: propFiles, setFiles }: FileManagerComponentProps) {
  const [files, setFilesState] = useState<File[]>([]);
  const [showFileActions, setShowFileActions] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [sortKey, setSortKey] = useState<keyof File | ''>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedFileType, setSelectedFileType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uniqueFileTypes, setUniqueFileTypes] = useState<string[]>([]);
  const [showTypeFilter, setShowTypeFilter] = useState(false);

  const typeFilterRef = useRef<HTMLDivElement>(null);

  // Add: simplify MIME/extension to friendly label
  function simplifyMimeType(mime?: string, name?: string): string {
    const ext = (name?.split('.').pop() || '').toLowerCase();
    const m = (mime || '').toLowerCase();

    if (m.includes('pdf') || ext === 'pdf') return 'PDF';

    if (m.includes('msword') || m.includes('word') || ['doc', 'docx', 'rtf', 'odt', 'pages'].includes(ext))
      return ext === 'doc' ? 'DOC' : 'DOCX';

    if (m.includes('presentation') || m.includes('powerpoint') || ['ppt', 'pptx', 'key'].includes(ext))
      return ext === 'ppt' ? 'PPT' : 'PPTX';

    if (m.includes('spreadsheet') || m.includes('excel') || ['xls', 'xlsx', 'csv', 'ods', 'tsv'].includes(ext)) {
      if (ext === 'xls') return 'XLS';
      if (ext === 'csv') return 'CSV';
      return 'XLSX';
    }

    if (m.startsWith('image/') || ['jpg','jpeg','png','gif','bmp','svg','webp','heic','ico'].includes(ext)) return 'Image';
    if (m.startsWith('video/') || ['mp4','mov','avi','wmv','flv','mkv','webm'].includes(ext)) return 'Video';
    if (m.startsWith('audio/') || ['mp3','wav','aac','flac','ogg','m4a'].includes(ext)) return 'Audio';

    if (m === 'text/plain' || ['txt','log','md'].includes(ext)) return ext === 'md' ? 'Markdown' : 'TXT';

    if (['zip','rar','7z','tar','gz','tgz'].includes(ext) || m.includes('zip') || m.includes('compressed')) return 'Archive';

    if (['json','yml','yaml','xml'].includes(ext) || m.includes('json') || m.includes('xml')) return ext.toUpperCase();

    if (['js','ts','tsx','jsx','py','java','cs','cpp','c','php','html','css','sql','sh','bat'].includes(ext)) return ext.toUpperCase();

    return 'File';
  }

  const processFiles = (fileList: any[]): File[] => {
    return (fileList || []).map((f) => ({
      id: String(f.id),
      file_name: f.name || f.file_name || 'Unnamed File',
      created_at: f.createdTime || f.created_at || new Date().toISOString(),
      // CHANGED: use simplified label
      File_type: simplifyMimeType(f.mimeType, f.name) || 'File',
      file_size: Number(f.size || f.file_size || 0),
      webViewLink: f.webViewLink,
      webContentLink: f.webContentLink,
    }));
  };

  // Load from backend; if parent passes files, prefer backend anyway to ensure "owned-only"
  const loadFromServer = async () => {
    try {
      const res = await api.get('/api/mentor/files', { withCredentials: true });
      const list = processFiles(res.data?.files || []);
      setFilesState(list);
      setFiles(list);
      // ensure compatibility with older TS targets by converting Set -> Array
      const types = ['all', ...Array.from(new Set(list.map((file) => (file.File_type || 'Unknown'))))];
      setUniqueFileTypes(types);
    } catch (e: any) {
      console.error('Fetch files error:', e?.response?.data || e.message);
      notify.error(e?.response?.data?.message || 'Failed to fetch files');
    }
  };

  useEffect(() => { loadFromServer(); }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredFiles = files
    .filter((file) => {
      if (selectedFileType !== 'all' && file.File_type !== selectedFileType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return file.file_name.toLowerCase().includes(q) || (file.File_type || '').toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (!sortKey) return 0;
      let A: any = sortKey === 'file_size' ? Number(a[sortKey]) : a[sortKey];
      let B: any = sortKey === 'file_size' ? Number(b[sortKey]) : b[sortKey];
      if (sortKey === 'created_at') {
        A = new Date(a[sortKey]).getTime();
        B = new Date(b[sortKey]).getTime();
      }
      if (A < B) return sortOrder === 'asc' ? -1 : 1;
      if (A > B) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const formatDate = (dateString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch {
      return 'Invalid Date';
    }
  };

  const openFileActions = (file: File, event: React.MouseEvent) => {
    setSelectedFile(file);
    setShowFileActions(true);
    event.stopPropagation();
  };
  const closeFileActions = () => { setShowFileActions(false); setSelectedFile(null); };

  const getFileIcon = (fileType?: string) => {
    const t = (fileType || 'File').toUpperCase();
    if (t === 'PDF') return 'fas fa-file-pdf';
    if (['DOC','DOCX','RTF','ODT'].includes(t)) return 'fas fa-file-word';
    if (['PPT','PPTX','KEY'].includes(t)) return 'fas fa-file-powerpoint';
    if (['XLS','XLSX','CSV','ODS','TSV'].includes(t)) return 'fas fa-file-excel';
    if (t === 'IMAGE') return 'fas fa-file-image';
    if (t === 'VIDEO') return 'fas fa-file-video';
    if (t === 'AUDIO') return 'fas fa-file-audio';
    if (t === 'ARCHIVE') return 'fas fa-file-archive';
    if (['TXT','MARKDOWN','JSON','XML','YML','YAML'].includes(t)) return 'fas fa-file-lines';
    return 'fas fa-file';
    };

  const viewFile = async (file: File) => {
    try {
      let link = file.webViewLink;
      if (!link) {
        const meta = await api.get(`/api/mentor/files/${encodeURIComponent(file.id)}`, { withCredentials: true });
        link = meta.data?.webViewLink || meta.data?.webContentLink;
      }
      if (link) {
        window.open(link, '_blank', 'noopener,noreferrer');
      } else {
        notify.error('No preview link available');
      }
      closeFileActions();
    } catch (e: any) {
      console.error('Get file meta error:', e?.response?.data || e.message);
      notify.error(e?.response?.data?.message || 'Failed to open file');
      closeFileActions();
    }
  };

  const downloadFile = async (file: File) => {
    try {
      let link = file.webContentLink;
      if (!link) {
        const meta = await api.get(`/api/mentor/files/${encodeURIComponent(file.id)}`, { withCredentials: true });
        link = meta.data?.webContentLink || meta.data?.webViewLink;
      }
      if (link) {
        window.open(link, '_blank', 'noopener,noreferrer');
      } else {
        notify.error('No download link available');
      }
      closeFileActions();
    } catch (e: any) {
      console.error('Get file meta error:', e?.response?.data || e.message);
      notify.error(e?.response?.data?.message || 'Failed to download file');
      closeFileActions();
    }
  };

  const deleteFile = async (file: File) => {
    try {
      const ok = confirm(`Delete "${file.file_name}"?`);
      if (!ok) return;
      const res = await api.delete(`/api/mentor/files/${encodeURIComponent(file.id)}`, { withCredentials: true });
      if (res.status === 200) {
        const updated = files.filter((f) => f.id !== file.id);
        setFilesState(updated);
        setFiles(updated);
        notify.success('File deleted');
      } else {
        notify.error(res.data?.message || 'Failed to delete file');
      }
      closeFileActions();
    } catch (e: any) {
      console.error('Delete error:', e?.response?.data || e.message);
      notify.error(e?.response?.data?.message || 'Failed to delete file');
      closeFileActions();
    }
  };

  // Close type filter when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeFilterRef.current && !typeFilterRef.current.contains(event.target as Node)) {
        setShowTypeFilter(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close modal when ESC or clicking outside
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') closeFileActions(); };
    const handleClickOutside = () => { if (showFileActions) closeFileActions(); };
    if (showFileActions) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('click', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [showFileActions]);

  return (
    <div className={styles.fileManagerTableContainer}>
      <div className={styles.fileManagerTableHeader}>
        <h2 className={styles.fileManagerTableTitle}>
          <i className={`fas fa-folder-open ${styles.fileManagerHeaderIcon}`}></i>
          Uploaded Files
        </h2>

        <div className={styles.fileManagerSearchContainer}>
          <div className={styles.fileManagerSearchWrapper}>
            <i className={`fas fa-search ${styles.fileManagerSearchIcon}`}></i>
            <input
              type="text"
              value={searchQuery}
              placeholder="Search files..."
              className={styles.fileManagerSearchInput}
              onChange={handleSearch}
            />
          </div>
        </div>
      </div>

      <div className={styles.fileManagerTableScrollContainer}>
        <table className={styles.fileManagerDataTable}>
          <thead>
            <tr>
              <th onClick={() => { setSortKey('file_name'); setSortOrder(sortKey === 'file_name' && sortOrder === 'asc' ? 'desc' : 'asc'); }} className={styles.fileManagerSortableHeader}>
                FILE NAME
                {sortKey === 'file_name' && (
                  <span className={`${styles.fileManagerSortArrow} ${sortOrder === 'desc' ? styles.fileManagerSortArrowDesc : ''}`}>▲</span>
                )}
              </th>
              <th onClick={() => { setSortKey('created_at'); setSortOrder(sortKey === 'created_at' && sortOrder === 'asc' ? 'desc' : 'asc'); }} className={styles.fileManagerSortableHeader}>
                DATE
                {sortKey === 'created_at' && (
                  <span className={`${styles.fileManagerSortArrow} ${sortOrder === 'desc' ? styles.fileManagerSortArrowDesc : ''}`}>▲</span>
                )}
              </th>
              <th>
                <div className={styles.fileManagerThContent} ref={typeFilterRef}>
                  <span>FILE TYPE</span>
                  <i className={`fas fa-filter ${styles.fileManagerFilterIcon}`} onClick={(e) => { e.stopPropagation(); setShowTypeFilter(!showTypeFilter); }}></i>
                  {showTypeFilter && (
                    <div className={styles.fileManagerTypeFilterDropdown}>
                      <select
                        value={selectedFileType}
                        onChange={(e) => { setSelectedFileType(e.target.value); setShowTypeFilter(false); }}
                        onClick={(e) => e.stopPropagation()}
                        className={styles.fileManagerHeaderFilter}
                      >
                        {uniqueFileTypes.map((type) => (
                          <option key={type} value={type}>{type === 'all' ? 'All Types' : type}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </th>
              <th onClick={() => { setSortKey('file_size'); setSortOrder(sortKey === 'file_size' && sortOrder === 'asc' ? 'desc' : 'asc'); }} className={styles.fileManagerSortableHeader}>
                FILE SIZE
                {sortKey === 'file_size' && (
                  <span className={`${styles.fileManagerSortArrow} ${sortOrder === 'desc' ? styles.fileManagerSortArrowDesc : ''}`}>▲</span>
                )}
              </th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredFiles.map((file) => (
              <tr key={file.id}>
                <td>
                  <i className={`${getFileIcon(file.File_type)} ${styles.fileManagerFileIconSmall}`}></i>
                  {file.file_name}
                </td>
                <td>{formatDate(file.created_at)}</td>
                <td><span className={styles.fileManagerFileTypeBadge}>{file.File_type}</span></td>
                <td>{Math.round((file.file_size || 0) / 1024).toLocaleString()} KB</td>
                <td>
                  <button onClick={(e) => openFileActions(file, e)} className={styles.fileManagerDetailsBtn}>
                    <i className="fas fa-ellipsis-v"></i> <span>Actions</span>
                  </button>
                </td>
              </tr>
            ))}
            {filteredFiles.length === 0 && (
              <tr><td colSpan={5} className={styles.fileManagerNoFiles}>
                <i className="fas fa-search" style={{ marginRight: 10 }}></i>No files found
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showFileActions && selectedFile && (
        <div className={styles.fileManagerModalOverlay}>
          <div className={styles.fileManagerFileModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.fileManagerModalHeader}>
              <h3 className={styles.fileManagerModalTitle}><i className="fas fa-file-alt"></i> File Actions</h3>
              <button className={styles.fileManagerCloseBtn} onClick={closeFileActions}><i className="fas fa-times"></i></button>
            </div>

            <div className={styles.fileManagerModalBody}>
              <div className={styles.fileManagerFileInfo}>
                <div className={styles.fileManagerFileIconLarge}><i className={getFileIcon(selectedFile.File_type)}></i></div>
                <div className={styles.fileManagerFileDetails}>
                  <h4>{selectedFile.file_name}</h4>
                  <p>{selectedFile.File_type} • {Math.round((selectedFile.file_size || 0) / 1024).toLocaleString()} KB • {formatDate(selectedFile.created_at)}</p>
                </div>
              </div>

              <div className={styles.fileManagerActionButtons}>
                <button onClick={() => viewFile(selectedFile)} className={`${styles.fileManagerActionBtn} ${styles.fileManagerActionBtnView}`}>
                  <i className="fas fa-eye"></i> View
                </button>
                <button onClick={() => downloadFile(selectedFile)} className={`${styles.fileManagerActionBtn} ${styles.fileManagerActionBtnDownload}`}>
                  <i className="fas fa-download"></i> Download
                </button>
                <button onClick={() => deleteFile(selectedFile)} className={`${styles.fileManagerActionBtn} ${styles.fileManagerActionBtnDelete}`}>
                  <i className="fas fa-trash"></i> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
    </div>
  );
}