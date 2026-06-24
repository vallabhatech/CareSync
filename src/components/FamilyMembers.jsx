import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  MenuItem,
  Chip,
  Divider,
} from '@mui/material';
import {
  FaUserPlus,
  FaEdit,
  FaTrash,
  FaUsers,
  FaTimes,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import API from '../utils/api';

const MAX_FAMILY_MEMBERS = 20;

const EMPTY_FORM = {
  name: '',
  relationship: '',
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
  allergies: '',
  conditions: '',
  notes: '',
};

// Convert a stored ISO date to the yyyy-mm-dd value a date input expects.
function toDateInput(value) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

// Human-readable age from a date of birth, or null when unknown.
function ageFrom(value) {
  if (!value) return null;
  const dob = new Date(value);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

function FamilyMembers() {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await API.get('/api/family');
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || t('family:loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError('');
  };

  const openEdit = (member) => {
    setEditingId(member._id);
    setForm({
      name: member.name || '',
      relationship: member.relationship || '',
      dateOfBirth: toDateInput(member.dateOfBirth),
      gender: member.gender || '',
      bloodGroup: member.bloodGroup || '',
      allergies: member.allergies || '',
      conditions: member.conditions || '',
      notes: member.notes || '',
    });
    setShowForm(true);
    setError('');
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError(t('family:nameRequired'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await API.put(`/api/family/${editingId}`, form);
      } else {
        await API.post('/api/family', form);
      }
      closeForm();
      await loadMembers();
    } catch (err) {
      setError(err.response?.data?.message || t('family:saveError'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await API.delete(`/api/family/${deleteTarget._id}`);
      setDeleteTarget(null);
      await loadMembers();
    } catch (err) {
      setError(err.response?.data?.message || t('family:deleteError'));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const atLimit = members.length >= MAX_FAMILY_MEMBERS;

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FaUsers aria-hidden="true" />
          <Typography variant="h6">{t('family:title')}</Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          startIcon={<FaUserPlus />}
          onClick={openAdd}
          disabled={atLimit}
        >
          {t('family:addMember')}
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('family:subtitle')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {atLimit && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('family:limitReached', { max: MAX_FAMILY_MEMBERS })}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={28} />
        </Box>
      ) : members.length === 0 ? (
        <Card variant="outlined" sx={{ borderStyle: 'dashed' }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              {t('family:emptyState')}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {members.map((member) => {
            const age = ageFrom(member.dateOfBirth);
            return (
              <Grid item xs={12} sm={6} key={member._id}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {member.name}
                        </Typography>
                        {member.relationship && (
                          <Typography variant="body2" color="text.secondary">
                            {member.relationship}
                          </Typography>
                        )}
                      </Box>
                      <Box>
                        <IconButton
                          size="small"
                          aria-label={t('family:editMember')}
                          onClick={() => openEdit(member)}
                        >
                          <FaEdit size={15} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          aria-label={t('family:deleteMember')}
                          onClick={() => setDeleteTarget(member)}
                        >
                          <FaTrash size={15} />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.5 }}>
                      {age !== null && (
                        <Chip size="small" label={t('family:ageChip', { age })} />
                      )}
                      {member.gender && (
                        <Chip size="small" label={t(`family:gender_${member.gender}`)} />
                      )}
                      {member.bloodGroup && (
                        <Chip size="small" color="error" variant="outlined" label={member.bloodGroup} />
                      )}
                    </Box>

                    {(member.allergies || member.conditions || member.notes) && (
                      <Divider sx={{ my: 1.5 }} />
                    )}
                    {member.allergies && (
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        <strong>{t('family:allergies')}:</strong> {member.allergies}
                      </Typography>
                    )}
                    {member.conditions && (
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        <strong>{t('family:conditions')}:</strong> {member.conditions}
                      </Typography>
                    )}
                    {member.notes && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {member.notes}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={showForm} onClose={closeForm} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editingId ? t('family:editTitle') : t('family:addTitle')}
          <IconButton size="small" onClick={closeForm} aria-label={t('family:close')}>
            <FaTimes />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label={t('family:name')}
                value={form.name}
                onChange={handleChange('name')}
                fullWidth
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={t('family:relationship')}
                value={form.relationship}
                onChange={handleChange('relationship')}
                fullWidth
                size="small"
                placeholder={t('family:relationshipPlaceholder')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={t('family:dateOfBirth')}
                type="date"
                value={form.dateOfBirth}
                onChange={handleChange('dateOfBirth')}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={t('family:gender')}
                value={form.gender}
                onChange={handleChange('gender')}
                fullWidth
                size="small"
                select
              >
                <MenuItem value="">{t('family:genderUnspecified')}</MenuItem>
                <MenuItem value="male">{t('family:gender_male')}</MenuItem>
                <MenuItem value="female">{t('family:gender_female')}</MenuItem>
                <MenuItem value="other">{t('family:gender_other')}</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={t('family:bloodGroup')}
                value={form.bloodGroup}
                onChange={handleChange('bloodGroup')}
                fullWidth
                size="small"
                placeholder="A+, O-, AB+…"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label={t('family:allergies')}
                value={form.allergies}
                onChange={handleChange('allergies')}
                fullWidth
                size="small"
                placeholder={t('family:allergiesPlaceholder')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label={t('family:conditions')}
                value={form.conditions}
                onChange={handleChange('conditions')}
                fullWidth
                size="small"
                placeholder={t('family:conditionsPlaceholder')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label={t('family:notes')}
                value={form.notes}
                onChange={handleChange('notes')}
                fullWidth
                size="small"
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeForm} disabled={saving}>
            {t('family:cancel')}
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? t('family:saving') : t('family:save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>{t('family:deleteTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('family:deleteConfirm', { name: deleteTarget?.name || '' })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>{t('family:cancel')}</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" disabled={deleting}>
            {t('family:delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default FamilyMembers;
