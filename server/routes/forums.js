const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// In-memory mock database for forum posts
let mockPosts = [
  { id: '1', title: 'Managing Diabetes Tips', author: 'Jane D.', content: 'What are your favorite low-carb snacks?', replies: 5, date: new Date().toISOString() },
  { id: '2', title: 'Anxiety and Sleep', author: 'Mark T.', content: 'Having trouble sleeping due to anxiety. Any natural remedies?', replies: 12, date: new Date().toISOString() }
];

// GET /api/forums
// Fetch all forum posts
router.get('/', auth, (req, res) => {
  res.json(mockPosts);
});

// POST /api/forums
// Create a new forum post
router.post('/', auth, (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }
  
  const newPost = {
    id: Date.now().toString(),
    title,
    content,
    author: req.user?.name || 'Anonymous',
    replies: 0,
    date: new Date().toISOString()
  };
  
  mockPosts.unshift(newPost);
  res.status(201).json(newPost);
});

module.exports = router;
