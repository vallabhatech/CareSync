import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
  Divider,
  Alert,
  Grid,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Sms as SmsIcon,
  Email as EmailIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import API from '../utils/api';

const MAX_CONTACTS = 3;
const EC_ENDPOINT = '/api/auth/emergency-contacts';

const emptyForm = { name: '', relationship: '', phone: '', email: '', isPrimary: false };

function EmergencyContacts() {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type, text }
  const [deleteTarget, setDeleteTarget] = useState(null);

  const flash = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  }, []);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await API.get(EC_ENDPOINT);
      setContacts(res.data.emergencyContacts || []);
    } catch (err) {
      console.error('Load emergency contacts error:', err);
      flash('error', t('profile:loadContactsError'));
    } finally {
      setLoading(false);
    }
  }, [t, flash]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (contact) => {
    setEditingId(contact._id);
    setForm({
      name: contact.name || '',
      relationship: contact.relationship || '',
      phone: contact.phone || '',
      email: contact.email || '',
      isPrimary: Boolean(contact.isPrimary),
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleField = (field) => (e) => {
    const value = field === 'isPrimary' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      flash('error', t('profile:namePhoneRequired'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        relationship: form.relationship.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        isPrimary: form.isPrimary,
      };
      let res;
      if (editingId) {
        res = await API.put(`${EC_ENDPOINT}/${editingId}`, payload);
        flash('success', t('profile:contactUpdatedMsg'));
      } else {
        res = await API.post(EC_ENDPOINT, payload);
        flash('success', t('profile:contactAddedMsg'));
      }
      setContacts(res.data.emergencyContacts || []);
      closeForm();
    } catch (err) {
      console.error('Save emergency contact error:', err);
      flash('error', err.response?.data?.message || t('profile:namePhoneRequired'));
    } finally {
      setSaving(false);
    }
  };

  const handleSetPrimary = async (contact) => {
    try {
      const res = await API.put(`${EC_ENDPOINT}/${contact._id}`, { isPrimary: true });
      setContacts(res.data.emergencyContacts || []);
      flash('success', t('profile:contactUpdatedMsg'));
    } catch (err) {
      console.error('Set primary error:', err);
      flash('error', err.response?.data?.message || t('profile:loadContactsError'));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await API.delete(`${EC_ENDPOINT}/${deleteTarget._id}`);
      setContacts(res.data.emergencyContacts || []);
      flash('success', t('profile:contactRemovedMsg'));
    } catch (err) {
      console.error('Delete emergency contact error:', err);
      flash('error', err.response?.data?.message || t('profile:loadContactsError'));
    } finally {
      setDeleteTarget(null);
    }
  };

  const atMax = contacts.length >= MAX_CONTACTS;

  return (
    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 24px rgba(25,118,210,0.1)', mt: 4 }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {t('profile:emergencyContactsTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('profile:emergencyContactsDesc')}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAdd}
            disabled={atMax || formOpen}
          >
            {t('profile:addContact')}
          </Button>
        </Box>

        {message && (
          <Alert severity={message.type} sx={{ mt: 2 }}>
            {message.text}
          </Alert>
        )}

        {atMax && !formOpen && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {t('profile:maxContactsReached')}
          </Alert>
        )}

        <Divider sx={{ my: 3 }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {formOpen && (
              <Box sx={{ mb: 3, p: 3, bgcolor: 'action.hover', borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  {editingId ? t('profile:editContactTitle') : t('profile:addContactTitle')}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label={t('profile:ecName')}
                      value={form.name}
                      onChange={handleField('name')}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('profile:ecRelationship')}
                      value={form.relationship}
                      onChange={handleField('relationship')}
                      placeholder={t('profile:ecRelationshipPlaceholder')}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label={t('profile:ecPhone')}
                      value={form.phone}
                      onChange={handleField('phone')}
                      type="tel"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('profile:ecEmail')}
                      value={form.email}
                      onChange={handleField('email')}
                      type="email"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch checked={form.isPrimary} onChange={handleField('isPrimary')} />}
                      label={t('profile:setAsPrimary')}
                    />
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Button variant="contained" onClick={handleSubmit} disabled={saving}>
                    {saving ? <CircularProgress size={22} color="inherit" /> : t('profile:saveContact')}
                  </Button>
                  <Button variant="outlined" onClick={closeForm} disabled={saving}>
                    {t('profile:cancel')}
                  </Button>
                </Box>
              </Box>
            )}

            {contacts.length === 0 && !formOpen ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                {t('profile:noContacts')}
              </Typography>
            ) : (
              <Stack spacing={2}>
                {contacts.map((c) => (
                  <Box
                    key={c._id}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: c.isPrimary ? 'primary.main' : 'divider',
                      borderRadius: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 1,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {c.name}
                        </Typography>
                        {c.isPrimary && (
                          <Chip
                            size="small"
                            color="primary"
                            icon={<StarIcon sx={{ fontSize: 16 }} />}
                            label={t('profile:primary')}
                          />
                        )}
                        {c.relationship && (
                          <Typography variant="body2" color="text.secondary">
                            · {c.relationship}
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {c.phone}
                        {c.email ? ` · ${c.email}` : ''}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Tooltip title={t('profile:callAction')}>
                        <IconButton component="a" href={`tel:${c.phone}`} color="success" size="small">
                          <PhoneIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('profile:messageAction')}>
                        <IconButton component="a" href={`sms:${c.phone}`} color="primary" size="small">
                          <SmsIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {c.email && (
                        <Tooltip title={t('profile:emailAction')}>
                          <IconButton component="a" href={`mailto:${c.email}`} color="primary" size="small">
                            <EmailIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {!c.isPrimary && (
                        <Tooltip title={t('profile:setAsPrimary')}>
                          <IconButton onClick={() => handleSetPrimary(c)} size="small">
                            <StarBorderIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title={t('profile:editProfile')}>
                        <IconButton onClick={() => openEdit(c)} size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('profile:remove')}>
                        <IconButton onClick={() => setDeleteTarget(c)} color="error" size="small">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </>
        )}
      </CardContent>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>{t('profile:deleteContactTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('profile:deleteContactConfirm', { name: deleteTarget?.name || '' })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>{t('profile:cancel')}</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            {t('profile:remove')}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

export default EmergencyContacts;
