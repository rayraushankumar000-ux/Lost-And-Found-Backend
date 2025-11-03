const Item = require('../models/Item');
const { uploadBufferToCloudinary } = require('../middleware/upload');

exports.createItem = async (req, res, next) => {
  try {
    // Determine status based on route
    let itemStatus = 'lost'; // default
    if (req.path.includes('report-found')) {
      itemStatus = 'found';
    } else if (req.path.includes('report-lost')) {
      itemStatus = 'lost';
    }
    
    // Extract fields from FormData (some might be JSON strings)
    const { 
      title, 
      description, 
      category, 
      status, // Can override from body
      dateLostFound,
      contactPreference,
      distinctiveFeatures,
      rewardAmount,
      address,
      city,
      state,
      color,
      brand,
      model,
      location, // If location is sent as JSON string
      latitude,
      longitude
    } = req.body;
    
    // Use status from body if provided, otherwise infer from route; default to 'lost'
    const finalStatus = (status || itemStatus) || 'lost';

    // Build location object - handle if sent as JSON string or individual fields
    let locationObj;
    if (typeof location === 'string') {
      try {
        locationObj = JSON.parse(location);
      } catch (e) {
        locationObj = { address: '', city: '', state: '' };
      }
    } else if (location && typeof location === 'object') {
      locationObj = location;
    } else {
      // Build from individual fields
      locationObj = {
        address: address || '',
        city: city || '',
        state: state || ''
      };
      
      // Add coordinates if provided
      if (latitude && longitude) {
        locationObj.coordinates = {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        };
      }
    }

    // Build features object
    const features = {
      color: color || '',
      brand: brand || '',
      model: model || ''
    };

    // Create new item object
    const newItem = {
      title,
      description,
      category,
      location: locationObj,
      status: finalStatus,
      dateLostFound: dateLostFound || new Date(),
      contactPreference: contactPreference || 'email',
      distinctiveFeatures: distinctiveFeatures || '',
      reward: rewardAmount ? { amount: parseFloat(rewardAmount) } : { amount: 0 },
      features,
      reporter: req.user ? req.user.id : null,
      images: []
    };

    // Handle single image (multer.single('image'))
    if (req.file && req.file.buffer) {
      try {
        const uploaded = await uploadBufferToCloudinary(req.file.buffer, 'lost-found');
        newItem.images.push({ 
          url: uploaded.secure_url, 
          public_id: uploaded.public_id 
        });
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        // Continue without image if upload fails
      }
    }

    // Handle multiple images (if sent as array)
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      for (const file of req.files) {
        if (file.buffer) {
          try {
            const uploaded = await uploadBufferToCloudinary(file.buffer, 'lost-found');
            newItem.images.push({ 
              url: uploaded.secure_url, 
              public_id: uploaded.public_id 
            });
          } catch (uploadError) {
            console.error('Image upload error:', uploadError);
          }
        }
      }
    }

    const item = await Item.create(newItem);

    return res.status(201).json({ 
      success: true,
      data: item 
    });
  } catch (err) {
    console.error('Create item error:', err);
    next(err);
  }
};

exports.searchItems = async (req, res, next) => {
  try {
    const { q, category, status, near } = req.query;
    const query = { };
    
    // Text search
    if (q) {
      query.$text = { $search: q }; // ensure text index on title/description
    }
    
    // Category filter
    if (category) {
      query.category = category;
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    // Location-based search (near parameter: "lat,lng")
    let itemsQuery = Item.find(query);
    
    if (near) {
      const [lat, lng] = near.split(',').map(parseFloat);
      if (!isNaN(lat) && !isNaN(lng)) {
        // Use MongoDB geospatial query (if location.coordinates exists in schema)
        // For now, we'll filter client-side or implement a simple radius search
        itemsQuery = itemsQuery.where('location.coordinates').near({
          center: { type: 'Point', coordinates: [lng, lat] },
          maxDistance: 50000, // 50km radius in meters
          spherical: true
        });
      }
    }
    
    const items = await itemsQuery.limit(50).sort({ createdAt: -1 }).populate('reporter', 'name email');
    res.json({ success: true, data: items, items }); // Include both for backward compatibility
  } catch (err) { 
    next(err); 
  }
};

exports.getItemById = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id).populate('reporter', 'name email phone');
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
};
