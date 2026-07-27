import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  IconButton,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  AddShoppingCart as AddCartIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const INVENTORY = [
  { id: '1', name: 'Paracetamol 500mg', price: 5.99, image: 'https://via.placeholder.com/150/e3f2fd/1976d2?text=Medicine' },
  { id: '2', name: 'Ibuprofen 400mg', price: 8.50, image: 'https://via.placeholder.com/150/e3f2fd/1976d2?text=Medicine' },
  { id: '3', name: 'Vitamin C 1000mg', price: 12.00, image: 'https://via.placeholder.com/150/e3f2fd/1976d2?text=Vitamins' },
  { id: '4', name: 'First Aid Kit', price: 24.99, image: 'https://via.placeholder.com/150/e3f2fd/1976d2?text=First+Aid' }
];

function PharmacyStore() {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing) {
        return prev.map((p) => (p.id === item.id ? { ...p, qty: p.qty + 1 } : p));
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((p) => p.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0).toFixed(2);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>
          CareSync Pharmacy
        </Typography>
        <IconButton color="primary" onClick={() => setCartOpen(true)}>
          <Badge badgeContent={cartCount} color="error">
            <CartIcon fontSize="large" />
          </Badge>
        </IconButton>
      </Box>

      <Grid container spacing={4}>
        {INVENTORY.map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.id}>
            <Card sx={{ boxShadow: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia component="img" height="140" image={item.image} alt={item.name} />
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {item.name}
                </Typography>
                <Typography variant="h5" color="primary.main" sx={{ mb: 2 }}>
                  ${item.price.toFixed(2)}
                </Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<AddCartIcon />}
                  sx={{ mt: 'auto' }}
                  onClick={() => addToCart(item)}
                >
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Drawer anchor="right" open={cartOpen} onClose={() => setCartOpen(false)}>
        <Box sx={{ width: 350, p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Typography variant="h5" fontWeight={700} mb={2}>
            Your Cart
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {cart.length === 0 ? (
            <Typography variant="body1" color="text.secondary">
              Your cart is empty.
            </Typography>
          ) : (
            <List sx={{ flexGrow: 1, overflow: 'auto' }}>
              {cart.map((item) => (
                <ListItem
                  key={item.id}
                  secondaryAction={
                    <IconButton edge="end" color="error" onClick={() => removeFromCart(item.id)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                  sx={{ px: 0 }}
                >
                  <ListItemText
                    primary={item.name}
                    secondary={`Qty: ${item.qty} x $${item.price.toFixed(2)}`}
                  />
                  <Typography variant="body2" fontWeight={700}>
                    ${(item.qty * item.price).toFixed(2)}
                  </Typography>
                </ListItem>
              ))}
            </List>
          )}

          {cart.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6" fontWeight={700}>${cartTotal}</Typography>
              </Box>
              <Button variant="contained" color="primary" fullWidth size="large">
                Proceed to Checkout
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>
    </Container>
  );
}

export default PharmacyStore;
