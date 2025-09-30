# Google Places API Setup

## Overview
The app now integrates with Google Places API to provide dynamic quests based on the user's location. If the user is in Atlanta, it uses seeded Atlanta quests; otherwise, it fetches dynamic quests from Google Places.

## Setup Instructions

### 1. Get Google Places API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Places API
   - Places API (New)
   - Maps JavaScript API (if using client-side maps)

### 2. Create API Credentials
1. Go to "Credentials" in the Google Cloud Console
2. Click "Create Credentials" → "API Key"
3. Copy the generated API key

### 3. Configure Environment Variables
Create a `.env.local` file in the project root and add:

```bash
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
```

### 4. API Restrictions (Recommended)
For security, restrict your API key:
1. Go to your API key in Google Cloud Console
2. Under "Application restrictions", select "HTTP referrers" or "IP addresses"
3. Under "API restrictions", select "Restrict key" and choose only the APIs you need

## Features

### Dynamic Quest Generation
- Maps Google Places results to quest objects
- Generates engaging quest titles and descriptions
- Estimates difficulty and duration based on place type
- Categorizes places into quest categories (Culture, Art, Nature, Food, etc.)

### Location-Based Logic
- **Atlanta Area**: Uses seeded Atlanta quests from `data/quests.atlanta.json`
- **Other Locations**: Fetches dynamic quests from Google Places API
- **Fallback**: Shows hardcoded fallback quests if API fails

### Caching & Offline Support
- Caches quest data in localStorage for 24 hours
- Shows cached quests when offline or API fails
- Displays toast notifications for user feedback

### Error Handling
- Graceful fallback to cached or hardcoded data
- Toast notifications for error states
- Detailed error logging for debugging

## API Response Format

The `/api/places` endpoint now returns:

```json
{
  "quests": [
    {
      "id": "google-quest-123",
      "title": "Discover Museum of Art",
      "description": "Immerse yourself in culture and history...",
      "category": "Culture",
      "lat": 40.7128,
      "lng": -74.0060,
      "duration_min": 120,
      "difficulty": "Medium",
      "city": "New York",
      "tags": ["culture", "history", "education", "artifacts"],
      "cover_url": "https://maps.googleapis.com/...",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 10,
  "location": { "lat": 40.7128, "lng": -74.0060 },
  "radius": 5,
  "source": "google_places"
}
```

## Quest Mapping Logic

### Categories
- `museum` → Culture
- `art_gallery` → Art
- `park` → Nature
- `restaurant` → Food
- `shopping_mall` → Shopping
- `historical_site` → History
- `amusement_park` → Adventure

### Difficulty Estimation
- Based on place type and user ratings
- `hiking_area`, `climbing` → Hard
- `museum`, `art_gallery` → Medium
- Most tourist attractions → Easy

### Duration Estimation
- Museums: 120 minutes
- Art galleries: 90 minutes
- Parks: 60 minutes
- Restaurants: 90 minutes
- Adjusted based on popularity (more ratings = longer duration)

## Testing

1. **Without API Key**: App will show fallback quests with error toast
2. **With API Key**: App will fetch dynamic quests from Google Places
3. **Atlanta Location**: App will use seeded Atlanta quests regardless of API key
4. **Offline Mode**: App will use cached quests if available

## Cost Considerations

Google Places API pricing:
- Places Nearby Search: $32 per 1,000 requests
- Place Details: $17 per 1,000 requests
- Photos: $7 per 1,000 requests

The app is configured to limit results to 10 per request and caches data for 24 hours to minimize API calls.
