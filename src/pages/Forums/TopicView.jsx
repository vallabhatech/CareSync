import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, CircularProgress, Alert, Button, 
  IconButton, TextField, Divider, Dialog, DialogTitle, DialogContent,
  DialogActions, Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { FaArrowLeft, FaThumbsUp, FaRegThumbsUp, FaExclamationTriangle } from 'react-icons/fa';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const TopicView = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  
  const [topic, setTopic] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyContent, setReplyContent] = useState('');
  
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [authorDisplayName, setAuthorDisplayName] = useState('');
  
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState({ id: null, type: '' });
  const [reportReason, setReportReason] = useState('');

  // Assuming logged in user ID can be parsed from token or context. 
  // Let's use a dummy ID for checking if already upvoted, or we can just let backend handle it and blindly render.
  // We'll decode it loosely or rely on state update.
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchTopicData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/forums/topics/${topicId}`);
        setTopic(res.data.topic);
        setPosts(res.data.posts);
        
        // Simple way to get user ID from JWT (not secure, just for UI hints)
        const token = localStorage.getItem('caresync_token');
        if (token) {
          try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(base64));
            setUserId(payload.id);
          } catch (e) {
            console.warn('Failed to parse token payload', e);
          }
        }
      } catch (err) {
        setError('Failed to load topic');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTopicData();
  }, [topicId]);

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    try {
      const token = localStorage.getItem('caresync_token');
      const res = await axios.post(
        `${API_BASE_URL}/api/forums/topics/${topicId}/posts`,
        {
          content: replyContent,
          isAnonymous,
          authorDisplayName: authorDisplayName || 'Anonymous User'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPosts([...posts, res.data]);
      setReplyContent('');
    } catch (err) {
      console.error('Failed to post reply', err);
      alert('Failed to post reply');
    }
  };

  const handleUpvoteTopic = async () => {
    try {
      const token = localStorage.getItem('caresync_token');
      const res = await axios.post(
        `${API_BASE_URL}/api/forums/topics/${topicId}/upvote`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTopic(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpvotePost = async (postId) => {
    try {
      const token = localStorage.getItem('caresync_token');
      const res = await axios.post(
        `${API_BASE_URL}/api/forums/posts/${postId}/upvote`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPosts(posts.map(p => p._id === postId ? res.data : p));
    } catch (err) {
      console.error(err);
    }
  };

  const openReportDialog = (id, type) => {
    setReportTarget({ id, type });
    setReportOpen(true);
  };

  const submitReport = async () => {
    try {
      const token = localStorage.getItem('caresync_token');
      await axios.post(
        `${API_BASE_URL}/api/forums/reports`,
        {
          targetId: reportTarget.id,
          targetType: reportTarget.type,
          reason: reportReason
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReportOpen(false);
      setReportReason('');
      alert('Report submitted successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to submit report');
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  if (error || !topic) return <Box sx={{ p: 3 }}><Alert severity="error">{error || 'Topic not found'}</Alert></Box>;

  return (
    <Box sx={{ p: 3, maxWidth: 1000, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(`/forums/category/${topic.categoryId}`)} sx={{ mr: 2 }}>
          <FaArrowLeft />
        </IconButton>
        <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          {topic.title}
        </Typography>
      </Box>

      {/* Main Topic Post */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderLeft: '5px solid #1976d2' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Posted by <strong>{topic.authorDisplayName}</strong> {topic.isAnonymous && '(Anonymous)'} on {format(new Date(topic.createdAt), 'MMM dd, yyyy HH:mm')}
          </Typography>
          <IconButton color="error" size="small" onClick={() => openReportDialog(topic._id, 'Topic')} title="Report Inappropriate Content">
            <FaExclamationTriangle size={14} />
          </IconButton>
        </Box>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 3 }}>
          {topic.content}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button 
            startIcon={topic.upvotes?.includes(userId) ? <FaThumbsUp /> : <FaRegThumbsUp />} 
            onClick={handleUpvoteTopic}
            variant={topic.upvotes?.includes(userId) ? 'contained' : 'outlined'}
            size="small"
          >
            {topic.upvotes?.length || 0}
          </Button>
        </Box>
      </Paper>

      <Typography variant="h6" sx={{ mb: 2 }}>Replies ({posts.length})</Typography>

      {/* Replies */}
      {posts.map((post) => (
        <Paper elevation={1} key={post._id} sx={{ p: 2, mb: 2, ml: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              <strong>{post.authorDisplayName}</strong> on {format(new Date(post.createdAt), 'MMM dd, yyyy HH:mm')}
            </Typography>
            <IconButton color="error" size="small" onClick={() => openReportDialog(post._id, 'Post')} title="Report Post">
              <FaExclamationTriangle size={12} />
            </IconButton>
          </Box>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
            {post.content}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              startIcon={post.upvotes?.includes(userId) ? <FaThumbsUp /> : <FaRegThumbsUp />} 
              onClick={() => handleUpvotePost(post._id)}
              size="small"
              sx={{ minWidth: 0, padding: '2px 8px' }}
            >
              {post.upvotes?.length || 0}
            </Button>
          </Box>
        </Paper>
      ))}

      {/* Reply Form */}
      <Box sx={{ mt: 5, p: 3, bgcolor: '#f9f9f9', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Leave a Reply</Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          placeholder="Write your reply here..."
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          sx={{ mb: 2, bgcolor: 'white' }}
        />
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            label="Display Name (Pseudonym)"
            variant="outlined"
            size="small"
            value={authorDisplayName}
            onChange={(e) => setAuthorDisplayName(e.target.value)}
          />
          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel>Identity</InputLabel>
            <Select
              value={isAnonymous}
              label="Identity"
              onChange={(e) => setIsAnonymous(e.target.value)}
            >
              <MenuItem value={false}>Linked to Account</MenuItem>
              <MenuItem value={true}>Anonymous</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Button variant="contained" color="primary" onClick={handleReply}>
          Post Reply
        </Button>
      </Box>

      {/* Report Dialog */}
      <Dialog open={reportOpen} onClose={() => setReportOpen(false)}>
        <DialogTitle>Report Content</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please let us know why you are reporting this content. Moderators will review it shortly.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for reporting"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportOpen(false)}>Cancel</Button>
          <Button onClick={submitReport} color="error" variant="contained">Report</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TopicView;
