import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Button, CircularProgress, 
  Alert, IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { FaArrowLeft, FaCheck, FaTrash } from 'react-icons/fa';

const ModerationDashboard = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/forums/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reports. Access might be denied.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleResolve = async (reportId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/forums/reports/${reportId}/resolve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReports(reports.filter(r => r._id !== reportId));
    } catch (err) {
      console.error('Failed to resolve report', err);
      alert('Failed to resolve report');
    }
  };

  const handleDeleteContent = async (targetId, targetType, reportId) => {
    if (!window.confirm(`Are you sure you want to delete this ${targetType}?`)) return;
    try {
      const token = localStorage.getItem('token');
      const endpoint = targetType === 'Topic' ? `/api/forums/topics/${targetId}` : `/api/forums/posts/${targetId}`;
      
      await axios.delete(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${endpoint}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Auto-resolve report upon deletion
      await handleResolve(reportId);
      alert(`${targetType} deleted successfully.`);
    } catch (err) {
      console.error('Failed to delete content', err);
      alert('Failed to delete content');
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton onClick={() => navigate('/forums')} sx={{ mr: 2 }}>
          <FaArrowLeft />
        </IconButton>
        <Typography variant="h4" component="h1">
          Moderation Dashboard
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
      ) : reports.length === 0 && !error ? (
        <Alert severity="success">No pending reports to review. Great job!</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell><strong>Reason</strong></TableCell>
                <TableCell><strong>Reported By</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report._id} hover>
                  <TableCell>{format(new Date(report.createdAt), 'MMM dd, yyyy HH:mm')}</TableCell>
                  <TableCell>{report.targetType}</TableCell>
                  <TableCell sx={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={report.reason}>
                    {report.reason}
                  </TableCell>
                  <TableCell>{report.reportedBy ? report.reportedBy.name : 'Unknown'}</TableCell>
                  <TableCell align="right">
                    <Button 
                      size="small" 
                      color="success" 
                      variant="outlined" 
                      startIcon={<FaCheck />} 
                      onClick={() => handleResolve(report._id)}
                      sx={{ mr: 1 }}
                    >
                      Resolve (Keep)
                    </Button>
                    <Button 
                      size="small" 
                      color="error" 
                      variant="contained" 
                      startIcon={<FaTrash />} 
                      onClick={() => handleDeleteContent(report.targetId, report.targetType, report._id)}
                    >
                      Delete Content
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ModerationDashboard;
