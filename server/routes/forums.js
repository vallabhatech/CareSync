const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const ForumCategory = require('../models/ForumCategory');
const ForumTopic = require('../models/ForumTopic');
const ForumPost = require('../models/ForumPost');
const ForumReport = require('../models/ForumReport');
const User = require('../models/User'); // Required to check roles if not fully populated in req.user

// Helper to check moderator role
const isModerator = (user) => {
  return user && (user.role === 'admin' || user.role === 'moderator');
};

const modMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!isModerator(user)) {
      return res.status(403).json({ message: 'Access denied: Moderator role required.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error checking role' });
  }
};

// ---------------------------------------------------------
// CATEGORIES
// ---------------------------------------------------------

// @route   GET /api/forums/categories
// @desc    Get all categories
// @access  Public (or Private depending on requirements, usually public to view)
router.get('/categories', async (req, res) => {
  try {
    const categories = await ForumCategory.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/forums/categories
// @desc    Create a category (internal / admin utility)
// @access  Private (Admin/Mod)
router.post('/categories', authMiddleware, modMiddleware, async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    const category = new ForumCategory({ name, description, icon });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: 'Server error creating category' });
  }
});

// ---------------------------------------------------------
// TOPICS
// ---------------------------------------------------------

// @route   GET /api/forums/categories/:categoryId/topics
// @desc    Get topics by category
// @access  Public
router.get('/categories/:categoryId/topics', async (req, res) => {
  try {
    const topics = await ForumTopic.find({ categoryId: req.params.categoryId, status: { $ne: 'deleted' } })
      .sort({ updatedAt: -1 })
      .select('-__v');
    res.json(topics);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/forums/topics/:topicId
// @desc    Get single topic and its posts
// @access  Public
router.get('/topics/:topicId', async (req, res) => {
  try {
    const topic = await ForumTopic.findOne({ _id: req.params.topicId, status: { $ne: 'deleted' } });
    if (!topic) return res.status(404).json({ message: 'Topic not found' });

    const posts = await ForumPost.find({ topicId: topic._id, status: { $ne: 'deleted' } })
      .sort({ createdAt: 1 });

    res.json({ topic, posts });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/forums/topics
// @desc    Create a new topic
// @access  Private
router.post('/topics', authMiddleware, async (req, res) => {
  try {
    const { categoryId, title, content, isAnonymous, authorDisplayName } = req.body;
    if (!categoryId || !title || !content) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const topic = new ForumTopic({
      categoryId,
      title,
      content,
      author: isAnonymous ? null : req.user._id,
      authorDisplayName: authorDisplayName || 'Anonymous User',
      isAnonymous: Boolean(isAnonymous)
    });

    await topic.save();
    res.status(201).json(topic);
  } catch (err) {
    console.error('Error creating topic:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/forums/topics/:topicId/posts
// @desc    Reply to a topic
// @access  Private
router.post('/topics/:topicId/posts', authMiddleware, async (req, res) => {
  try {
    const { content, isAnonymous, authorDisplayName } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });

    const topic = await ForumTopic.findById(req.params.topicId);
    if (!topic || topic.status === 'deleted') {
      return res.status(404).json({ message: 'Topic not found' });
    }
    if (topic.status === 'locked') {
      return res.status(403).json({ message: 'Topic is locked' });
    }

    const post = new ForumPost({
      topicId: topic._id,
      content,
      author: isAnonymous ? null : req.user._id,
      authorDisplayName: authorDisplayName || 'Anonymous User',
      isAnonymous: Boolean(isAnonymous)
    });

    await post.save();
    
    // Update topic's updatedAt
    topic.updatedAt = Date.now();
    await topic.save();

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/forums/topics/:topicId/upvote
// @desc    Upvote/Downvote a topic
// @access  Private
router.post('/topics/:topicId/upvote', authMiddleware, async (req, res) => {
  try {
    const topic = await ForumTopic.findById(req.params.topicId);
    if (!topic) return res.status(404).json({ message: 'Topic not found' });

    const upvoteIndex = topic.upvotes.indexOf(req.user._id);
    if (upvoteIndex > -1) {
      // Remove upvote
      topic.upvotes.splice(upvoteIndex, 1);
    } else {
      // Add upvote
      topic.upvotes.push(req.user._id);
    }
    await topic.save();
    res.json(topic);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/forums/posts/:postId/upvote
// @desc    Upvote/Downvote a post
// @access  Private
router.post('/posts/:postId/upvote', authMiddleware, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const upvoteIndex = post.upvotes.indexOf(req.user._id);
    if (upvoteIndex > -1) {
      post.upvotes.splice(upvoteIndex, 1);
    } else {
      post.upvotes.push(req.user._id);
    }
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------------------------
// MODERATION & REPORTS
// ---------------------------------------------------------

// @route   POST /api/forums/reports
// @desc    Report a topic or post
// @access  Private
router.post('/reports', authMiddleware, async (req, res) => {
  try {
    const { targetId, targetType, reason } = req.body;
    if (!targetId || !targetType || !reason) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const report = new ForumReport({
      targetId,
      targetType,
      reportedBy: req.user._id,
      reason
    });
    await report.save();
    res.status(201).json({ message: 'Report submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/forums/reports
// @desc    Get all reports
// @access  Private (Admin/Mod)
router.get('/reports', authMiddleware, modMiddleware, async (req, res) => {
  try {
    const reports = await ForumReport.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .populate('reportedBy', 'name email');
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/forums/topics/:topicId
// @desc    Delete (soft-delete) a topic
// @access  Private (Admin/Mod)
router.delete('/topics/:topicId', authMiddleware, modMiddleware, async (req, res) => {
  try {
    const topic = await ForumTopic.findById(req.params.topicId);
    if (!topic) return res.status(404).json({ message: 'Topic not found' });

    topic.status = 'deleted';
    await topic.save();

    // Soft delete all related posts
    await ForumPost.updateMany({ topicId: topic._id }, { status: 'deleted' });

    res.json({ message: 'Topic deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/forums/posts/:postId
// @desc    Delete (soft-delete) a post
// @access  Private (Admin/Mod)
router.delete('/posts/:postId', authMiddleware, modMiddleware, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.status = 'deleted';
    await post.save();

    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/forums/reports/:reportId/resolve
// @desc    Mark report as resolved
// @access  Private (Admin/Mod)
router.put('/reports/:reportId/resolve', authMiddleware, modMiddleware, async (req, res) => {
  try {
    const report = await ForumReport.findById(req.params.reportId);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    
    report.status = 'resolved';
    await report.save();

    res.json({ message: 'Report resolved' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
