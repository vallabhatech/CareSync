import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, List, ListItem, ListItemText, 
  Button, CircularProgress, Alert, Paper, IconButton
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { FaArrowLeft, FaThumbsUp } from 'react-icons/fa';
import CreateTopicDialog from '../../components/Forums/CreateTopicDialog';
import { useAuth } from '../../context/AuthContext';
import { ListItemButton } from '@mui/material';

const TopicList = () => {
  const { isAuthenticated } = useAuth();
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openCreateDialog, setOpenCreateDialog] = useState(false);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/forums/categories/${categoryId}/topics`);
      setTopics(res.data);
      setError('');
    } catch (err) {
      setError('Failed to load topics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [categoryId]);

  const handleTopicCreated = (newTopic) => {
    setTopics([newTopic, ...topics]);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3, maxWidth: 1000, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/forums')} sx={{ mr: 2 }}>
          <FaArrowLeft />
        </IconButton>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          Topics
        </Typography>
        {isAuthenticated && (
          <Button variant="contained" color="primary" onClick={() => setOpenCreateDialog(true)}>
            New Topic
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {topics.length === 0 && !error ? (
        <Alert severity="info">No topics found in this category. Be the first to start one!</Alert>
      ) : (
        <Paper elevation={1}>
          <List sx={{ p: 0 }}>
            {topics.map((topic, index) => (
              <ListItem 
                key={topic._id} 
                divider={index !== topics.length - 1}
                disablePadding
              >
                <ListItemButton 
                  onClick={() => navigate(`/forums/topic/${topic._id}`)}
                  sx={{ p: 3, '&:hover': { backgroundColor: '#f5f5f5' } }}
                >
                  <ListItemText
                  primary={
                    <Typography variant="h6" color="primary">
                      {topic.title}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', color: 'text.secondary', fontSize: '0.875rem' }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', mr: 1 }}>
                        By: {topic.authorDisplayName} {topic.isAnonymous && '(Anonymous)'}
                      </Typography>
                      <span>•</span>
                      <Typography variant="caption" sx={{ mx: 1 }}>
                        Updated: {format(new Date(topic.updatedAt), 'MMM dd, yyyy HH:mm')}
                      </Typography>
                      <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                        <FaThumbsUp style={{ marginRight: '4px' }} />
                        <Typography variant="caption">{topic.upvotes?.length || 0} Upvotes</Typography>
                      </Box>
                    </Box>
                  }
                />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      <CreateTopicDialog 
        open={openCreateDialog} 
        onClose={() => setOpenCreateDialog(false)}
        categoryId={categoryId}
        onTopicCreated={handleTopicCreated}
      />
    </Box>
  );
};

export default TopicList;
