import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, CardActionArea, 
  CircularProgress, Alert, Button, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaHeartbeat, FaBrain, FaStethoscope, FaLungs } from 'react-icons/fa'; // Some icons

const ForumsDashboard = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // For Mod/Admin creating categories
  const [openCreate, setOpenCreate] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', description: '' });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/forums/categories`);
      setCategories(res.data);
      setError('');
    } catch (err) {
      setError('Failed to load categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/forums/categories`,
        newCat,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOpenCreate(false);
      fetchCategories();
    } catch (err) {
      console.error('Failed to create category:', err);
      // Depending on error, might show alert
      alert('Failed to create category. Ensure you are an admin/moderator.');
    }
  };

  // Helper to render an icon based on category name or fallback
  const renderIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes('mental')) return <FaBrain size={40} color="#3f51b5" />;
    if (n.includes('chronic')) return <FaLungs size={40} color="#f50057" />;
    if (n.includes('general')) return <FaStethoscope size={40} color="#009688" />;
    return <FaHeartbeat size={40} color="#ff9800" />;
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Community Health Forums
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/forums/moderation')}>
          Moderation Dashboard
        </Button>
      </Box>

      <Typography variant="body1" color="text.secondary" paragraph>
        Discuss health conditions, share your experiences, and offer support to others in our community.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {categories.length === 0 && !error && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No categories found. Wait for an admin to create some.
        </Alert>
      )}

      <Grid container spacing={3}>
        {categories.map((cat) => (
          <Grid item xs={12} sm={6} md={4} key={cat._id}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardActionArea onClick={() => navigate(`/forums/category/${cat._id}`)} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {renderIcon(cat.name)}
                  <Typography variant="h6" component="h2" sx={{ ml: 2 }}>
                    {cat.name}
                  </Typography>
                </Box>
                <CardContent sx={{ p: 0, flexGrow: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {cat.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Hidden button for admins to create categories - checking role isn't strictly necessary on UI if backend enforces it, but this allows creation if token permits */}
      <Box sx={{ mt: 5, textAlign: 'center' }}>
        <Button variant="text" color="primary" onClick={() => setOpenCreate(true)}>
          Create New Category (Admin Only)
        </Button>
      </Box>

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)}>
        <DialogTitle>Create Category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newCat.name}
            onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newCat.description}
            onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button onClick={handleCreateCategory} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ForumsDashboard;
