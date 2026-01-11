import React from 'react';
import { Container, Paper, Typography, Button, Box } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

const Login = ({ onLogin }) => {
  const handleGoogleLogin = () => {
    // Use full backend URL since window.location.href doesn't use the React proxy
    // The proxy only works for axios/fetch requests, not full page navigations
    window.location.href = 'http://localhost:5000/auth/google';
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: 'center',
            width: '100%',
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            AI Email Sorter
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Sign in with Google to get started
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            fullWidth
            sx={{ py: 1.5 }}
          >
            Sign in with Google
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
