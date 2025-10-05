# Google Places API Setup Guide

## Overview
The app now exclusively uses real places from Google Places API. No prewritten quests or fallbacks are provided - you need a valid Google Places API key to see any quests.

## Quick Setup (5 minutes)

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: "SydeQuests" (or any name you prefer)
4. Click "Create"

### 2. Enable Required APIs
1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for and enable these APIs:
   - **Places API** (New)
   - **Places API** (Legacy)
   - **Maps JavaScript API** (optional, for future map features)

### 3. Create API Key
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the generated API key

### 4. Configure Environment Variables
Create a `.env.local` file in your project root:

```bash
GOOGLE_PLACES_API_KEY=your_api_key_here
```

### 5. Test the Setup
1. Restart your development server: `npm run dev`
2. Open the app and check the dashboard
3. You should see real places from Google Places API with distance information

## Security Best Practices

### API Key Restrictions (Recommended)
1. Go to your API key in Google Cloud Console
2. Under "Application restrictions":
   - Select "HTTP referrers"
   - Add: `localhost:3000/*` (for development)
   - Add: `yourdomain.com/*` (for production)
3. Under "API restrictions":
   - Select "Restrict key"
   - Choose only: Places API (New), Places API (Legacy)

## Features

### Real Places Only
- **No prewritten quests**: All quests come from real Google Places
- **Distance calculation**: Shows exact distance from your current location
- **Sorted by proximity**: Closest places appear first
- **Real place data**: Actual restaurants, museums, parks, etc.

### Quest Generation
Each real place is converted into a quest with:
- **Engaging titles**: "Discover [Place Name]", "Explore [Place Name]"
- **Rich descriptions**: Generated based on place type and reviews
- **Smart categorization**: Museums → Culture, Parks → Nature, etc.
- **Difficulty estimation**: Based on place type and user ratings
- **Duration estimation**: Based on place type and popularity

### Distance Display
- **Kilometers and miles**: Both units calculated
- **Visual indicators**: Distance shown on quest cards
- **Sorted results**: Closest places first
- **Real-time accuracy**: Based on your exact GPS location

## API Response Format

```json
{
  "quests": [
    {
      "id": "google-quest-123",
      "title": "Discover Atlanta History Center",
      "description": "Immerse yourself in culture and history at Atlanta History Center...",
      "category": "Culture",
      "lat": 33.8417,
      "lng": -84.3768,
      "duration_min": 120,
      "difficulty": "Medium",
      "city": "Atlanta",
      "tags": ["culture", "history", "education", "artifacts"],
      "cover_url": "https://maps.googleapis.com/...",
      "created_at": "2024-01-15T10:00:00Z",
      "distance_km": 2.3,
      "distance_miles": 1.4
    }
  ],
  "total": 10,
  "location": { "lat": 33.7606, "lng": -84.3933 },
  "radius": 5,
  "source": "google_places"
}
```

## Cost Information

### Google Places API Pricing
- **Places Nearby Search**: $32 per 1,000 requests
- **Place Details**: $17 per 1,000 requests
- **Photos**: $7 per 1,000 requests

### Cost Optimization
- **Limited results**: Only 10 places per request
- **Caching**: 24-hour cache prevents duplicate requests
- **Efficient queries**: Single API call per location
- **Estimated monthly cost**: $5-20 for moderate usage

## Troubleshooting

### No Quests Showing
1. **Check API key**: Verify `GOOGLE_PLACES_API_KEY` is set in `.env.local`
2. **Restart server**: Run `npm run dev` after adding environment variable
3. **Check console**: Look for API key errors in browser console
4. **Verify APIs enabled**: Ensure Places API is enabled in Google Cloud Console

### Error Messages
- **"Google Places API key required"**: Add API key to `.env.local`
- **"Failed to fetch real places"**: Check internet connection and API key validity
- **"No real places found"**: Try expanding search radius or moving to a more populated area

### Development vs Production
- **Development**: Use `localhost:3000/*` in API key restrictions
- **Production**: Add your domain to HTTP referrers
- **Testing**: Use different API keys for dev/staging/production

## Next Steps

1. **Set up API key** following the steps above
2. **Test with your location** to see real places
3. **Customize categories** by modifying `mapCategoryToGoogleType()` function
4. **Add more place types** by updating the Google Places API type mapping
5. **Consider adding filters** for place types, ratings, or distance

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your API key is correctly configured
3. Ensure you have sufficient Google Cloud billing set up
4. Check that all required APIs are enabled

The app is now optimized for real places only - enjoy discovering actual locations in your area!