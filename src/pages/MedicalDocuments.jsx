import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button, TextField,
  MenuItem, Alert, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['report', 'prescription', 'scan', 'insurance', 'other'];
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const categoryColor = { report: 'primary', prescription: 'success', scan: 'warning', insurance: 'info', other: 'default' };

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function MedicalDocuments() {
  const { isAuthenticated } = useAuth();
  const fileInputRef = useRef(null);

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Upload form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('other');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [uploading, setUploading] = useState(false);

  // Edit dialog state
  const [editDoc, setEditDoc] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('other');
  const [editNotes, setEditNotes] = useState('');

  // Delete dialog state
  const [deleteId, setDeleteId] = useState(null);

  const fetchDocs = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await API.get('/api/medical-documents');
      setDocs(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError('');
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError('Only PDF, JPEG, PNG, or WebP files are allowed.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setFileError('File size must not exceed 10 MB.');
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!name.trim()) { setError('Document name is required.'); return; }
    if (!selectedFile) { setError('Please select a file to upload.'); return; }

    setUploading(true);
    setError('');
    try {
      // Read file as base64
      const fileData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      await API.post('/api/medical-documents', {
        name: name.trim(),
        category,
        notes,
        fileData,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
      });

      setSuccess('Document uploaded successfully.');
      setName(''); setCategory('other'); setNotes('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchDocs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const res = await API.get(`/api/medical-documents/${doc._id}/download`);
      const { fileData, fileType, name: fileName } = res.data;
      const link = document.createElement('a');
      link.href = fileData;
      const ext = fileType.split('/')[1] || 'file';
      link.download = `${fileName}.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to download document.');
    }
  };

  const handleEditOpen = (doc) => {
    setEditDoc(doc);
    setEditName(doc.name);
    setEditCategory(doc.category);
    setEditNotes(doc.notes || '');
  };

  const handleEditSave = async () => {
    try {
      await API.put(`/api/medical-documents/${editDoc._id}`, {
        name: editName,
        category: editCategory,
        notes: editNotes,
      });
      setEditDoc(null);
      setSuccess('Document updated successfully.');
      await fetchDocs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update document.');
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/api/medical-documents/${deleteId}`);
      setDeleteId(null);
      setSuccess('Document deleted.');
      await fetchDocs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete document.');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f8fb', py: 6, px: 2 }}>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Button component={Link} to="/dashboard" startIcon={<ArrowBackIcon />} variant="outlined" sx={{ mb: 3 }}>
          Back to Dashboard
        </Button>

        <Typography variant="h4" fontWeight={700} mb={1}>📁 Medical Documents</Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          Securely store and manage your medical reports, prescriptions, scans, and insurance documents.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        {/* Upload Card */}
        <Card sx={{ borderRadius: 3, boxShadow: 4, mb: 4 }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Upload New Document</Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <TextField
                label="Document Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Category"
                select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                fullWidth
              >
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
                multiline
                rows={2}
                sx={{ gridColumn: { sm: '1 / -1' } }}
              />
            </Box>

            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
                Choose File
                <input hidden type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileChange} ref={fileInputRef} />
              </Button>
              {selectedFile && (
                <Typography variant="body2" color="text.secondary">
                  {selectedFile.name} ({formatSize(selectedFile.size)})
                </Typography>
              )}
            </Box>
            {fileError && <Typography variant="caption" color="error" display="block" mt={1}>{fileError}</Typography>}
            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
              Accepted: PDF, JPEG, PNG, WebP — max 10 MB
            </Typography>

            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={uploading || !!fileError}
              sx={{ mt: 2 }}
              startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <UploadFileIcon />}
            >
              {uploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card sx={{ borderRadius: 3, boxShadow: 4 }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Typography variant="h6" fontWeight={700} mb={2}>
              Your Documents ({docs.length})
            </Typography>

            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : docs.length === 0 ? (
              <Typography color="text.secondary">No documents uploaded yet.</Typography>
            ) : (
              <Box sx={{ display: 'grid', gap: 2 }}>
                {docs.map((doc) => (
                  <Card key={doc._id} sx={{ bgcolor: '#fafafa', borderRadius: 2, borderLeft: '4px solid #1976d2' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <InsertDriveFileIcon color="primary" />
                          <Box>
                            <Typography fontWeight={600}>{doc.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatSize(doc.fileSize)} · {new Date(doc.uploadedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </Typography>
                            {doc.notes && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{doc.notes}</Typography>
                            )}
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label={doc.category} color={categoryColor[doc.category]} size="small" />
                          <IconButton size="small" title="Download" onClick={() => handleDownload(doc)}>
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" title="Edit" onClick={() => handleEditOpen(doc)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" title="Delete" onClick={() => setDeleteId(doc._id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Edit Dialog */}
      <Dialog open={!!editDoc} onClose={() => setEditDoc(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Document</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
          <TextField label="Document Name" value={editName} onChange={(e) => setEditName(e.target.value)} fullWidth />
          <TextField label="Category" select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} fullWidth>
            {CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</MenuItem>
            ))}
          </TextField>
          <TextField label="Notes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} fullWidth multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDoc(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to permanently delete this document?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
