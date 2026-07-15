import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, FormControlLabel, Switch, Box, Typography 
} from '@mui/material';
import axios from 'axios';

const CreateTopicDialog = ({ open, onClose, categoryId, onTopicCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [authorDisplayName, setAuthorDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Title and Content are required.');
      return;
    }
    
    // If anonymous is false and display name is empty, we let backend handle default 'Anonymous User' or use real name
    // Actually, if it's not anonymous, we usually want real name or pseudonym. 
    // The backend uses authorDisplayName if provided.
    
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/forums/topics`,
        {
          categoryId,
          title,
          content,
          isAnonymous,
          authorDisplayName: authorDisplayName || 'Anonymous User'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onTopicCreated(res.data);
      // Reset state
      setTitle('');
      setContent('');
      setIsAnonymous(false);
      setAuthorDisplayName('');
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create topic');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Start a New Topic</DialogTitle>
      <DialogContent>
        {error && <Typography color="error" variant="body2" sx={{ mb: 2 }}>{error}</Typography>}
        <TextField
          autoFocus
          margin="dense"
          label="Topic Title"
          type="text"
          fullWidth
          variant="outlined"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          margin="dense"
          label="Content"
          type="text"
          fullWidth
          variant="outlined"
          multiline
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          sx={{ mt: 2 }}
        />
        
        <Box sx={{ mt: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>Privacy & Identity</Typography>
          <FormControlLabel
            control={<Switch checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />}
            label="Post Anonymously (Do not link my account)"
          />
          <TextField
            margin="dense"
            label="Display Name / Pseudonym"
            type="text"
            fullWidth
            variant="outlined"
            size="small"
            value={authorDisplayName}
            onChange={(e) => setAuthorDisplayName(e.target.value)}
            helperText="What name should appear on your post?"
            sx={{ mt: 1 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Posting...' : 'Post Topic'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTopicDialog;
