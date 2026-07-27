import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Divider,
  Avatar
} from '@mui/material';
import { Forum as ForumIcon, Add as AddIcon, Comment as CommentIcon } from '@mui/icons-material';
import API from '../utils/api';

function CommunityForums() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/forums');
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      await API.post('/api/forums', { title: newTitle, content: newContent });
      setOpen(false);
      setNewTitle('');
      setNewContent('');
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ForumIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight={700}>
            Community Health Forums
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          New Post
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          {posts.map((post) => (
            <Card key={post.id} sx={{ mb: 2, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} color="primary" gutterBottom>
                  {post.title}
                </Typography>
                <Typography variant="body1" paragraph>
                  {post.content}
                </Typography>
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.8rem' }}>{post.author[0]}</Avatar>
                    <Typography variant="body2" color="text.secondary">
                      Posted by {post.author} on {new Date(post.date).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                    <CommentIcon fontSize="small" />
                    <Typography variant="body2">{post.replies} Replies</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create New Post</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Discussion Title"
            fullWidth
            variant="outlined"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <TextField
            margin="dense"
            label="What's on your mind?"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handlePost} variant="contained">Post</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default CommunityForums;
