import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Button, TextField, Rating, Alert } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

export default function DoctorReviews() {
  const [reviews, setReviews] = useState([
    { id: 1, doctor: 'Dr. Jane Smith', rating: 5, comment: 'Excellent physician, very caring.' },
    { id: 2, doctor: 'Dr. John Doe', rating: 4, comment: 'Good doctor, but wait time was a bit long.' }
  ]);
  const [doctorName, setDoctorName] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!doctorName || rating === 0) return;
    
    setReviews([
      { id: Date.now(), doctor: doctorName, rating, comment },
      ...reviews
    ]);
    setDoctorName('');
    setRating(0);
    setComment('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" fontWeight="bold" color="primary" mb={4} textAlign="center">
        Doctor Reviews & Ratings
      </Typography>

      <Card sx={{ mb: 4, p: 2, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>Write a Review</Typography>
          {submitted && <Alert severity="success" sx={{ mb: 2 }}>Review submitted successfully!</Alert>}
          
          <form onSubmit={handleSubmit}>
            <TextField
              label="Doctor Name"
              fullWidth
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              sx={{ mb: 2 }}
              required
            />
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography component="legend" mr={2}>Rating:</Typography>
              <Rating
                name="doctor-rating"
                value={rating}
                onChange={(event, newValue) => setRating(newValue)}
              />
            </Box>
            <TextField
              label="Your Review (Optional)"
              fullWidth
              multiline
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              sx={{ mb: 3 }}
            />
            <Button variant="contained" color="primary" type="submit">
              Submit Review
            </Button>
          </form>
        </CardContent>
      </Card>

      <Typography variant="h5" mb={2}>Recent Reviews</Typography>
      {reviews.map(review => (
        <Card key={review.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PersonIcon color="action" sx={{ mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                {review.doctor}
              </Typography>
            </Box>
            <Rating value={review.rating} readOnly size="small" sx={{ mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {review.comment}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
