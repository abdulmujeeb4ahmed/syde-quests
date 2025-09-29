'use client';

interface MiniMapProps {
  lat: number;
  lng: number;
  title: string;
  className?: string;
}

export default function MiniMap({ lat, lng, title, className = '' }: MiniMapProps) {
  // For MVP, we'll use a static map placeholder
  // In production, you'd integrate with Google Maps, Mapbox, or similar
  const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s-marker+00D1B2(${lng},${lat})/${lng},${lat},14,0/400x200@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw`;
  
  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      <div className="w-full h-48 bg-sq-card border border-sq-muted/20 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">🗺️</div>
          <p className="text-sq-text-muted text-sm">
            Map view coming soon
          </p>
          <p className="text-sq-text-muted text-xs mt-1">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </p>
        </div>
      </div>
      
      {/* Coordinates overlay */}
      <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm rounded px-2 py-1">
        <p className="text-white text-xs font-mono">
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </p>
      </div>
      
      {/* Location indicator */}
      <div className="absolute top-2 right-2">
        <div className="bg-sq-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
          📍
        </div>
      </div>
    </div>
  );
}
