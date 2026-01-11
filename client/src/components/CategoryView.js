import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import UnsubscribeIcon from '@mui/icons-material/Unsubscribe';
import EmailIcon from '@mui/icons-material/Email';
import axios from 'axios';

const CategoryView = ({ user }) => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [emails, setEmails] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [emailDialog, setEmailDialog] = useState(null);

  useEffect(() => {
    fetchEmails();
  }, [categoryId]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/emails/category/${categoryId}`);
      setEmails(response.data);
    } catch (error) {
      console.error('Error fetching emails:', error);
      alert('Failed to fetch emails');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedEmails.size === emails.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(emails.map((e) => e.id)));
    }
  };

  const handleSelectEmail = (emailId) => {
    const newSelected = new Set(selectedEmails);
    if (newSelected.has(emailId)) {
      newSelected.delete(emailId);
    } else {
      newSelected.add(emailId);
    }
    setSelectedEmails(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedEmails.size === 0) {
      alert('Please select at least one email');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedEmails.size} email(s)?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await axios.post('/api/emails/bulk-delete', {
        emailIds: Array.from(selectedEmails),
      });
      setSelectedEmails(new Set());
      fetchEmails();
      alert('Emails deleted successfully');
    } catch (error) {
      console.error('Error deleting emails:', error);
      alert('Failed to delete emails');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkUnsubscribe = async () => {
    if (selectedEmails.size === 0) {
      alert('Please select at least one email');
      return;
    }

    if (!window.confirm(`Are you sure you want to unsubscribe from ${selectedEmails.size} email(s)?`)) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await axios.post('/api/emails/bulk-unsubscribe', {
        emailIds: Array.from(selectedEmails),
      });
      setSelectedEmails(new Set());
      fetchEmails();
      
      const successCount = response.data.results.filter(r => r.success).length;
      alert(`Unsubscribed from ${successCount} email(s)`);
    } catch (error) {
      console.error('Error unsubscribing:', error);
      alert('Failed to unsubscribe');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewEmail = async (emailId) => {
    try {
      const response = await axios.get(`/api/emails/${emailId}`);
      setEmailDialog(response.data);
    } catch (error) {
      console.error('Error fetching email:', error);
      alert('Failed to load email');
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5">
          {emails.length > 0 ? `Category: ${emails[0].category_name}` : 'Category Emails'}
        </Typography>
      </Box>

      {selectedEmails.size > 0 && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'action.selected' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography>
              {selectedEmails.size} email(s) selected
            </Typography>
            <Box>
              <Button
                startIcon={<UnsubscribeIcon />}
                onClick={handleBulkUnsubscribe}
                disabled={actionLoading}
                sx={{ mr: 1 }}
              >
                Unsubscribe
              </Button>
              <Button
                startIcon={<DeleteIcon />}
                onClick={handleBulkDelete}
                disabled={actionLoading}
                color="error"
              >
                Delete
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      <Paper>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Checkbox
            checked={selectedEmails.size === emails.length && emails.length > 0}
            indeterminate={selectedEmails.size > 0 && selectedEmails.size < emails.length}
            onChange={handleSelectAll}
          />
          <Typography component="span" variant="body2">
            Select All ({emails.length} emails)
          </Typography>
        </Box>

        <List>
          {emails.map((email) => (
            <ListItem
              key={email.id}
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Checkbox
                checked={selectedEmails.has(email.id)}
                onChange={() => handleSelectEmail(email.id)}
              />
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1">{email.subject || '(No Subject)'}</Typography>
                    {email.is_archived && <Chip label="Archived" size="small" />}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      From: {email.from_name} &lt;{email.from_email}&gt;
                    </Typography>
                    {email.summary && (
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {email.summary}
                      </Typography>
                    )}
                  </Box>
                }
              />
              <IconButton onClick={() => handleViewEmail(email.id)}>
                <EmailIcon />
              </IconButton>
            </ListItem>
          ))}
        </List>

        {emails.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No emails in this category yet
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Email Detail Dialog */}
      <Dialog
        open={!!emailDialog}
        onClose={() => setEmailDialog(null)}
        maxWidth="md"
        fullWidth
      >
        {emailDialog && (
          <>
            <DialogTitle>{emailDialog.subject || '(No Subject)'}</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                From: {emailDialog.from_name} &lt;{emailDialog.from_email}&gt;
              </Typography>
              {emailDialog.summary && (
                <Box sx={{ my: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    AI Summary:
                  </Typography>
                  <Typography variant="body2">{emailDialog.summary}</Typography>
                </Box>
              )}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Email Content:
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'background.default',
                    borderRadius: 1,
                    maxHeight: '400px',
                    overflow: 'auto',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: emailDialog.body_html || emailDialog.body_text || 'No content',
                  }}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEmailDialog(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default CategoryView;
