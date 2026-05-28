import React from 'react';
import MapView, { Marker, UrlTile, MapPressEvent } from 'react-native-maps';

export interface MapMarker {
  lat: number;
  lng: number;
  type: 'order' | 'worker' | 'self';
}

export interface SharedMapProps {
  latitude: number;
  longitude: number;
  markers?: MapMarker[];
  markerLat?: number;
  markerLng?: number;
  style?: object;
  onMapPress?: (lat: number, lng: number) => void;
  scrollEnabled?: boolean;
}

const PIN_COLORS: Record<string, string> = {
  order: '#E53935',   // red pin
  worker: '#43A047',  // green person
  self: '#4F6EF7',    // blue dot
};

export default function SharedMap({
  latitude, longitude,
  markers,
  markerLat, markerLng,
  style, onMapPress, scrollEnabled = false,
}: SharedMapProps) {
  const resolvedMarkers: MapMarker[] = markers ?? (
    markerLat != null && markerLng != null
      ? [{ lat: markerLat, lng: markerLng, type: 'order' }]
      : []
  );

  // Auto-fit: compute region covering all markers
  let region = { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 };
  if (resolvedMarkers.length > 1) {
    const lats = resolvedMarkers.map(m => m.lat);
    const lngs = resolvedMarkers.map(m => m.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    region = {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.01),
      longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.01),
    };
  }

  function handlePress(e: MapPressEvent) {
    const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
    onMapPress?.(lat, lng);
  }

  return (
    <MapView
      style={[{ height: 180 }, style]}
      initialRegion={region}
      scrollEnabled={scrollEnabled ?? !!onMapPress}
      zoomEnabled={scrollEnabled ?? !!onMapPress}
      onPress={onMapPress ? handlePress : undefined}
    >
      <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} flipY={false} />
      {resolvedMarkers.map((m, i) => (
        <Marker
          key={i}
          coordinate={{ latitude: m.lat, longitude: m.lng }}
          pinColor={PIN_COLORS[m.type] ?? PIN_COLORS.order}
          title={m.type === 'order' ? 'Место заказа' : m.type === 'worker' ? 'Исполнитель' : 'Вы'}
        />
      ))}
    </MapView>
  );
}
