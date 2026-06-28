import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Avatar,
  Typography,
  CircularProgress,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import { useFamily } from '../context/FamilyContext';

/**
 * ProfileSelector — a compact MUI dropdown that lets the user choose between
 * "Myself" and any of their family members. It reads from and writes to
 * FamilyContext so the selection is shared across pages.
 *
 * @param {object} props
 * @param {string} [props.label]   - Override the InputLabel text.
 * @param {string} [props.size]    - MUI size ("small" | "medium"). Default "small".
 * @param {object} [props.sx]      - Extra sx styles for the FormControl wrapper.
 */
export default function ProfileSelector({ label = 'Tracking for', size = 'small', sx = {} }) {
  const { members, loadingMembers, selectedMember, setSelectedMember } = useFamily();

  const value = selectedMember ? selectedMember._id : '__myself__';

  const handleChange = (e) => {
    const id = e.target.value;
    if (id === '__myself__') {
      setSelectedMember(null);
    } else {
      const found = members.find((m) => m._id === id);
      setSelectedMember(found ?? null);
    }
  };

  return (
    <FormControl
      size={size}
      sx={{
        minWidth: 200,
        bgcolor: 'rgba(255,255,255,0.9)',
        borderRadius: 2,
        ...sx,
      }}
    >
      <InputLabel
        id="profile-selector-label"
        sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}
      >
        <FamilyRestroomIcon fontSize="small" sx={{ mr: 0.5 }} />
        {label}
      </InputLabel>
      <Select
        labelId="profile-selector-label"
        id="profile-selector"
        value={value}
        label={label}
        onChange={handleChange}
        disabled={loadingMembers}
        renderValue={(selected) => {
          if (loadingMembers) {
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={14} />
                <Typography variant="body2">Loading…</Typography>
              </Box>
            );
          }
          if (selected === '__myself__') {
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 20, height: 20, bgcolor: 'primary.main', fontSize: '0.65rem' }}>
                  Me
                </Avatar>
                <Typography variant="body2" fontWeight={600}>Myself</Typography>
              </Box>
            );
          }
          const member = members.find((m) => m._id === selected);
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 20, height: 20, bgcolor: 'secondary.main', fontSize: '0.6rem' }}>
                {member?.name?.[0]?.toUpperCase() || '?'}
              </Avatar>
              <Typography variant="body2" fontWeight={600}>{member?.name || 'Unknown'}</Typography>
            </Box>
          );
        }}
      >
        {/* Primary user option */}
        <MenuItem value="__myself__">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: '0.75rem' }}>
              <PersonIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={700}>Myself</Typography>
              <Typography variant="caption" color="text.secondary">Primary profile</Typography>
            </Box>
          </Box>
        </MenuItem>

        {/* Family members */}
        {members.map((member) => (
          <MenuItem key={member._id} value={member._id}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.main', fontSize: '0.75rem' }}>
                {member.name?.[0]?.toUpperCase() || '?'}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={700}>{member.name}</Typography>
                {member.relationship && (
                  <Typography variant="caption" color="text.secondary">
                    {member.relationship}
                  </Typography>
                )}
              </Box>
            </Box>
          </MenuItem>
        ))}

        {members.length === 0 && !loadingMembers && (
          <MenuItem disabled>
            <Typography variant="caption" color="text.secondary">
              No family members added yet — visit your Profile page to add one.
            </Typography>
          </MenuItem>
        )}
      </Select>
    </FormControl>
  );
}
