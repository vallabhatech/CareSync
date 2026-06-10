const mongoose = require('mongoose');

const FavoriteClinicSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    default: '',
  },
  lat: {
    type: String,
    required: true,
  },
  lon: {
    type: String,
    required: true,
  },
  place_id: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const RecentSearchSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  query: {
    type: String,
    required: true, // e.g. "Seattle" or "47.60,-122.33"
  },
  searchType: {
    type: String,
    enum: ['city', 'coords', 'nearby'],
    required: true,
  },
  lat: {
    type: String,
    default: '',
  },
  lon: {
    type: String,
    default: '',
  },
  searchedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = {
  FavoriteClinic: mongoose.model('FavoriteClinic', FavoriteClinicSchema),
  RecentSearch: mongoose.model('RecentSearch', RecentSearchSchema),
};
