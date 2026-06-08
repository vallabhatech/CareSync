const express = require('express');
const router = express.Router();
const { FavoriteClinic, RecentSearch } = require('../models/Clinic');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/clinics/favorites
// @desc    Get all favorited clinics for the user
// @access  Private
router.get('/favorites', authMiddleware, async (req, res) => {
  try {
    const favorites = await FavoriteClinic.find({ user: { $eq: req.user._id } }).sort({ createdAt: -1 });
    res.json(favorites);
  } catch (err) {
    console.error('Fetch favorite clinics error:', err.message);
    res.status(500).json({ message: 'Server error fetching favorite clinics' });
  }
});

// @route   POST /api/clinics/favorites
// @desc    Add a clinic to favorites
// @access  Private
router.post('/favorites', authMiddleware, async (req, res) => {
  const name = req.body.name === undefined ? '' : String(req.body.name).trim();
  const address = req.body.address === undefined ? '' : String(req.body.address).trim();
  const lat = req.body.lat === undefined ? '' : String(req.body.lat).trim();
  const lon = req.body.lon === undefined ? '' : String(req.body.lon).trim();
  const place_id = req.body.place_id === undefined ? '' : String(req.body.place_id).trim();

  try {
    if (!name || !lat || !lon || !place_id) {
      return res.status(400).json({ message: 'Name, coordinates, and place ID are required' });
    }

    // Check if already favorited
    const existingFav = await FavoriteClinic.findOne({ user: { $eq: req.user._id }, place_id: { $eq: String(place_id) } });
    if (existingFav) {
      return res.status(400).json({ message: 'Clinic already favorited' });
    }

    const favClinic = new FavoriteClinic({
      user: req.user._id,
      name,
      address,
      lat,
      lon,
      place_id,
    });

    await favClinic.save();
    res.status(201).json(favClinic);
  } catch (err) {
    console.error('Add favorite clinic error:', err.message);
    res.status(500).json({ message: 'Server error saving favorite clinic' });
  }
});

// @route   DELETE /api/clinics/favorites/:id
// @desc    Remove a clinic from favorites (id can be favorite's MongoDB _id OR clinic's place_id)
// @access  Private
router.delete('/favorites/:id', authMiddleware, async (req, res) => {
  const cleanId = String(req.params.id).trim();
  try {
    // Look up by MongoDB ObjectId or place_id safely
    const query = { user: { $eq: req.user._id } };
    if (cleanId.match(/^[0-9a-fA-F]{24}$/)) {
      query.$or = [{ _id: { $eq: cleanId } }, { place_id: { $eq: cleanId } }];
    } else {
      query.place_id = { $eq: cleanId };
    }

    const favClinic = await FavoriteClinic.findOne(query);

    if (!favClinic) {
      return res.status(404).json({ message: 'Favorite clinic not found' });
    }

    await favClinic.deleteOne();
    res.json({ message: 'Clinic removed from favorites', id: req.params.id });
  } catch (err) {
    console.error('Remove favorite clinic error:', err.message);
    res.status(500).json({ message: 'Server error removing favorite clinic' });
  }
});

// @route   GET /api/clinics/searches
// @desc    Get recent search history for clinics
// @access  Private
router.get('/searches', authMiddleware, async (req, res) => {
  try {
    const searches = await RecentSearch.find({ user: { $eq: req.user._id } })
      .sort({ searchedAt: -1 })
      .limit(10); // Return last 10 searches
    res.json(searches);
  } catch (err) {
    console.error('Fetch clinic searches error:', err.message);
    res.status(500).json({ message: 'Server error fetching clinic search history' });
  }
});

// @route   POST /api/clinics/searches
// @desc    Save a clinic search to history
// @access  Private
router.post('/searches', authMiddleware, async (req, res) => {
  const query = req.body.query === undefined ? '' : String(req.body.query).trim();
  const searchType = req.body.searchType === undefined ? '' : String(req.body.searchType).trim();
  const lat = req.body.lat === undefined ? '' : String(req.body.lat).trim();
  const lon = req.body.lon === undefined ? '' : String(req.body.lon).trim();

  try {
    if (!query || !searchType) {
      return res.status(400).json({ message: 'Query and search type are required' });
    }

    // Limit same queries within a short timeframe by deleting duplicates
    await RecentSearch.deleteMany({
      user: { $eq: req.user._id },
      query: { $eq: String(query) },
    });

    const recentSearch = new RecentSearch({
      user: req.user._id,
      query: String(query),
      searchType: String(searchType),
      lat: String(lat),
      lon: String(lon),
    });

    await recentSearch.save();
    res.status(201).json(recentSearch);
  } catch (err) {
    console.error('Add clinic search error:', err.message);
    res.status(500).json({ message: 'Server error logging clinic search' });
  }
});

module.exports = router;
