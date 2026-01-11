import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';

const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchAccounts();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await axios.get('/api/accounts');
      setAccounts(response.data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryName || !categoryDescription) {
      alert('Please fill in both name and description');
      return;
    }

    try {
      await axios.post('/api/categories', {
        name: categoryName,
        description: categoryDescription,
      });
      setCategoryName('');
      setCategoryDescription('');
      setOpenDialog(false);
      fetchCategories();
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      await axios.delete(`/api/categories/${categoryId}`);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  };

  const handleConnectAccount = () => {
    // Use full backend URL since window.location.href doesn't use the React proxy
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    window.location.href = `${apiUrl}/api/accounts/connect`;
  };

  const handleFetchEmails = async () => {
    setLoading(true);
    try {
      await axios.post('/api/emails/fetch');
      alert('Emails fetched and processed successfully!');
      // Refresh categories to show updated email counts
      fetchCategories();
    } catch (error) {
      console.error('Error fetching emails:', error);
      alert('Failed to fetch emails');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.get('/auth/logout');
      onLogout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          AI Email Sorter
        </Typography>
        <Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={handleFetchEmails}
            disabled={loading}
            sx={{ mr: 2 }}
          >
            {loading ? 'Processing...' : 'Fetch Emails'}
          </Button>
          <IconButton onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Connected Accounts Section */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Connected Gmail Accounts
            </Typography>
            <List>
              {accounts.map((account) => (
                <ListItem key={account.id}>
                  <ListItemText
                    primary={account.email}
                    secondary={account.is_primary ? 'Primary' : 'Secondary'}
                  />
                  {account.is_primary && (
                    <Chip label="Primary" size="small" color="primary" />
                  )}
                </ListItem>
              ))}
            </List>
            <Button
              variant="outlined"
              startIcon={<EmailIcon />}
              onClick={handleConnectAccount}
              fullWidth
              sx={{ mt: 2 }}
            >
              Connect Another Account
            </Button>
          </Paper>
        </Grid>

        {/* Categories Section */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Categories</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenDialog(true)}
              >
                Add Category
              </Button>
            </Box>

            <Grid container spacing={2}>
              {categories.map((category) => (
                <Grid item xs={12} sm={6} key={category.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6">{category.name}</Typography>
                        <Chip 
                          label={category.email_count || 0} 
                          color="primary" 
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {category.description}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        onClick={() => navigate(`/category/${category.id}`)}
                      >
                        View Emails ({category.email_count || 0})
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteCategory(category.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {categories.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                No categories yet. Create one to get started!
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Create Category Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            fullWidth
            variant="outlined"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={categoryDescription}
            onChange={(e) => setCategoryDescription(e.target.value)}
            placeholder="Describe what types of emails should go into this category..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateCategory} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;
