const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// Get all conversations for the logged in user
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', 'name role avatar')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });
      
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error fetching conversations' });
  }
});

// Start a new conversation or get existing one
router.post('/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { providerId } = req.body;
    
    if (!providerId) {
      return res.status(400).json({ message: 'Provider ID is required' });
    }
    
    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, providerId] }
    }).populate('participants', 'name role avatar');
    
    if (!conversation) {
      conversation = new Conversation({
        participants: [userId, providerId]
      });
      await conversation.save();
      conversation = await conversation.populate('participants', 'name role avatar');
    }
    
    res.json(conversation);
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({ message: 'Server error starting conversation' });
  }
});

// Get messages for a specific conversation
router.get('/:conversationId/messages', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    // Verify user is part of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ message: 'Not authorized to view this conversation' });
    }
    
    const messages = await Message.find({ conversationId })
      .populate('sender', 'name')
      .sort({ createdAt: 1 });
      
    // Mark unread messages as read
    await Message.updateMany(
      { conversationId, sender: { $ne: userId }, read: false },
      { $set: { read: true } }
    );
      
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error fetching messages' });
  }
});

// Post a new message
router.post('/:conversationId/messages', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    
    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }
    
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ message: 'Not authorized to send messages to this conversation' });
    }
    
    const newMessage = new Message({
      conversationId,
      sender: userId,
      content
    });
    
    await newMessage.save();
    
    // Update conversation lastMessage and updatedAt
    conversation.lastMessage = newMessage._id;
    conversation.updatedAt = Date.now();
    await conversation.save();
    
    await newMessage.populate('sender', 'name avatar');
    
    res.json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error sending message' });
  }
});

// Get all providers (to show in contact list if needed)
router.get('/providers', authMiddleware, async (req, res) => {
  try {
    // Find all users who are doctors/providers
    const providers = await User.find({ role: { $in: ['doctor', 'provider'] } })
      .select('name role avatar email _id');
    res.json(providers);
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({ message: 'Server error fetching providers' });
  }
});

module.exports = router;
