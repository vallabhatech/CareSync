import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Typography, List, ListItem, ListItemText, ListItemAvatar, Avatar,
  Paper, TextField, IconButton, Divider, CircularProgress, useTheme
} from '@mui/material';
import { Send, Lock } from '@mui/icons-material';
import { io } from 'socket.io-client';
import { 
  getConversations, getMessages, sendMessage, startConversation, getProviders 
} from '../services/chatService';
import { useAuth } from '../context/AuthContext'; // Assuming this exists

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const SecureChat = () => {
  const theme = useTheme();
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [providers, setProviders] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  
  // Try to get user from local storage directly for now
  const storedUserStr = localStorage.getItem('user');
  const user = storedUserStr ? JSON.parse(storedUserStr) : null;
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [convs, provs] = await Promise.all([
          getConversations(),
          getProviders()
        ]);
        setConversations(convs);
        setProviders(provs);
      } catch (error) {
        console.error('Error fetching chat data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();

    // Initialize socket connection
    const newSocket = io(API_URL);
    setSocket(newSocket);

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('newMessage', (message) => {
        setMessages((prevMessages) => {
          // Prevent duplicates
          if (prevMessages.some(m => m._id === message._id)) return prevMessages;
          return [...prevMessages, message];
        });
      });

      socket.on('userTyping', ({ senderId, isTyping }) => {
        if (activeConversation && activeConversation.participants.some(p => p._id === senderId)) {
          setPartnerTyping(isTyping);
        }
      });
    }
  }, [socket, activeConversation]);

  useEffect(() => {
    if (activeConversation && socket) {
      socket.emit('joinRoom', { conversationId: activeConversation._id });
      fetchMessages(activeConversation._id);
    }
  }, [activeConversation, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping]);

  const fetchMessages = async (conversationId) => {
    try {
      const msgs = await getMessages(conversationId);
      setMessages(msgs);
    } catch (error) {
      console.error('Error fetching messages', error);
    }
  };

  const handleSelectProvider = async (providerId) => {
    try {
      const conv = await startConversation(providerId);
      // Add to list if new
      if (!conversations.find(c => c._id === conv._id)) {
        setConversations([conv, ...conversations]);
      }
      setActiveConversation(conv);
    } catch (error) {
      console.error('Error starting conversation', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    try {
      const savedMessage = await sendMessage(activeConversation._id, newMessage);
      setNewMessage('');
      
      // Stop typing
      socket.emit('typing', { conversationId: activeConversation._id, senderId: user?._id || user?.id, isTyping: false });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      // The socket will broadcast it back to us, but we can also optimistically add it
      setMessages(prev => {
        if (prev.some(m => m._id === savedMessage._id)) return prev;
        return [...prev, savedMessage];
      });

      // Also tell socket server to broadcast
      socket.emit('sendMessage', savedMessage);
    } catch (error) {
      console.error('Error sending message', error);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (socket && activeConversation) {
      socket.emit('typing', { conversationId: activeConversation._id, senderId: user?._id || user?.id, isTyping: true });
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { conversationId: activeConversation._id, senderId: user?._id || user?.id, isTyping: false });
      }, 2000);
    }
  };

  const getPartner = (conv) => {
    const currentId = user?._id || user?.id;
    return conv.participants.find(p => p._id !== currentId) || conv.participants[0];
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3, height: 'calc(100vh - 100px)' }}>
      <Box display="flex" alignItems="center" mb={2}>
        <Lock sx={{ mr: 1, color: 'success.main' }} />
        <Typography variant="h4" fontWeight="bold">Secure Chat (HIPAA Compliant)</Typography>
      </Box>

      <Paper elevation={3} sx={{ display: 'flex', height: '100%', borderRadius: 3, overflow: 'hidden' }}>
        {/* Sidebar */}
        <Box sx={{ width: 300, borderRight: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            Providers & Chats
          </Typography>
          <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
            {conversations.length > 0 && <Typography variant="subtitle2" sx={{ px: 2, pt: 1, color: 'text.secondary' }}>Recent Chats</Typography>}
            {conversations.map(conv => {
              const partner = getPartner(conv);
              return (
                <ListItem 
                  button 
                  key={conv._id} 
                  selected={activeConversation?._id === conv._id}
                  onClick={() => setActiveConversation(conv)}
                >
                  <ListItemAvatar>
                    <Avatar src={partner?.avatar}>{partner?.name?.charAt(0)}</Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={partner?.name} 
                    secondary={conv.lastMessage?.content || 'No messages yet'} 
                    secondaryTypographyProps={{ noWrap: true }}
                  />
                </ListItem>
              );
            })}
            
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ px: 2, pt: 1, color: 'text.secondary' }}>Available Providers</Typography>
            
            {providers.filter(p => !conversations.some(c => c.participants.some(cp => cp._id === p._id))).map(provider => (
              <ListItem button key={provider._id} onClick={() => handleSelectProvider(provider._id)}>
                <ListItemAvatar>
                  <Avatar src={provider.avatar}>{provider.name?.charAt(0)}</Avatar>
                </ListItemAvatar>
                <ListItemText primary={provider.name} secondary="Start new chat" />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Chat Area */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: '#f8f9fa' }}>
          {activeConversation ? (
            <>
              {/* Header */}
              <Box sx={{ p: 2, bgcolor: '#fff', borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ mr: 2 }} src={getPartner(activeConversation)?.avatar}>
                  {getPartner(activeConversation)?.name?.charAt(0)}
                </Avatar>
                <Typography variant="h6">{getPartner(activeConversation)?.name}</Typography>
              </Box>

              {/* Messages */}
              <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {messages.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 5 }}>
                    This chat is end-to-end encrypted. Messages are secured in transit and at rest. Start the conversation!
                  </Typography>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.sender?._id === (user?._id || user?.id) || msg.sender === (user?._id || user?.id);
                    return (
                      <Box key={msg._id} sx={{ 
                        display: 'flex', 
                        justifyContent: isMe ? 'flex-end' : 'flex-start',
                        mb: 2 
                      }}>
                        <Box sx={{
                          maxWidth: '70%',
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: isMe ? 'primary.main' : '#fff',
                          color: isMe ? 'primary.contrastText' : 'text.primary',
                          boxShadow: 1
                        }}>
                          <Typography variant="body1">{msg.content}</Typography>
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7, textAlign: 'right' }}>
                            {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })
                )}
                {partnerTyping && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#fff', boxShadow: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Typing...
                      </Typography>
                    </Box>
                  </Box>
                )}
                <div ref={messagesEndRef} />
              </Box>

              {/* Input Area */}
              <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, bgcolor: '#fff', borderTop: `1px solid ${theme.palette.divider}` }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Type a secure message..."
                  value={newMessage}
                  onChange={handleTyping}
                  InputProps={{
                    endAdornment: (
                      <IconButton type="submit" color="primary" disabled={!newMessage.trim()}>
                        <Send />
                      </IconButton>
                    ),
                    sx: { borderRadius: 4, bgcolor: '#f8f9fa' }
                  }}
                />
              </Box>
            </>
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%" flexDirection="column">
              <Lock sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" color="text.secondary">Select a provider to start a secure chat</Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default SecureChat;
