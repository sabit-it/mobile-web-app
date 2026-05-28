import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';

export interface MapMarker {
  lat: number;
  lng: number;
  /** 'order' = pin icon; 'worker' = person icon; 'self' = blue dot */
  type: 'order' | 'worker' | 'self';
}

export interface SharedMapProps {
  latitude: number;
  longitude: number;
  /** Multiple named markers (for tracking view) */
  markers?: MapMarker[];
  /** Legacy single-marker props */
  markerLat?: number;
  markerLng?: number;
  style?: object;
  onMapPress?: (lat: number, lng: number) => void;
  scrollEnabled?: boolean;
}

const ICONS: Record<string, string> = {
  order: `<div style="font-size:28px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,.4));transform:translate(-50%,-100%)">📍</div>`,
  worker: `<div style="font-size:26px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,.4));transform:translate(-50%,-50%)">👷</div>`,
  self: `<div style="width:14px;height:14px;background:#4F6EF7;border:2px solid #fff;border-radius:50%;box-shadow:0 0 6px rgba(79,110,247,.6);transform:translate(-50%,-50%)"></div>`,
};

function buildLeafletHTML(markers: MapMarker[], interactive: boolean, centerLat: number, centerLng: number): string {
  const markerJS = markers.map((m, i) => {
    const icon = ICONS[m.type] ?? ICONS.order;
    return `
var icon${i} = L.divIcon({ html: '${icon.replace(/'/g, "\\'")}', iconSize:[0,0], className:'' });
var marker${i} = L.marker([${m.lat},${m.lng}],{icon:icon${i},zIndexOffset:${m.type === 'worker' ? 1000 : 0}}).addTo(map);
    `.trim();
  }).join('\n');

  const fitBounds = markers.length > 1
    ? `map.fitBounds([${markers.map(m => `[${m.lat},${m.lng}]`).join(',')}], {padding:[40,40]});`
    : `map.setView([${centerLat},${centerLng}],15);`;

  const clickHandler = interactive ? `
map.on('click',function(e){
  var ll=e.latlng;
  if(typeof marker0 !== 'undefined') marker0.setLatLng(ll);
  window.parent.postMessage({type:'mapClick',lat:ll.lat,lng:ll.lng},'*');
});` : '';

  const updateHandler = `
window.addEventListener('message',function(e){
  if(!e.data) return;
  if(e.data.type==='updateWorker'){
    // Find worker marker (type worker = marker with high zIndex)
    map.eachLayer(function(l){
      if(l.options && l.options.zIndexOffset===1000){
        l.setLatLng([e.data.lat,e.data.lng]);
      }
    });
  }
});`;

  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#map{margin:0;padding:0;width:100%;height:100%;}</style>
</head><body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var map = L.map('map',{zoomControl:true});
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
  attribution:'© OpenStreetMap',maxZoom:19
}).addTo(map);
${markerJS}
${fitBounds}
${clickHandler}
${updateHandler}
</script></body></html>`;
}

export default function SharedMap({
  latitude, longitude,
  markers,
  markerLat, markerLng,
  style, onMapPress,
}: SharedMapProps) {
  const containerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Normalise markers: prefer explicit array, fall back to legacy single marker
  const resolvedMarkers: MapMarker[] = markers ?? (
    markerLat != null && markerLng != null
      ? [{ lat: markerLat, lng: markerLng, type: 'order' }]
      : []
  );

  // Initial mount — create iframe
  useEffect(() => {
    const container = containerRef.current as HTMLDivElement | null;
    if (!container) return;
    container.style.overflow = 'hidden';
    container.style.position = 'relative';

    const html = buildLeafletHTML(resolvedMarkers, !!onMapPress, latitude, longitude);
    const iframe = document.createElement('iframe');
    iframe.srcdoc = html;
    iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
    iframe.sandbox = 'allow-scripts allow-same-origin' as any;
    iframeRef.current = iframe;
    container.appendChild(iframe);

    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'mapClick') onMapPress?.(e.data.lat, e.data.lng);
    };
    window.addEventListener('message', handler);
    return () => {
      window.removeEventListener('message', handler);
      if (container.contains(iframe)) container.removeChild(iframe);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount only

  // Live update: push new worker position into existing iframe
  useEffect(() => {
    const workerMarker = resolvedMarkers.find(m => m.type === 'worker');
    if (!workerMarker || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      { type: 'updateWorker', lat: workerMarker.lat, lng: workerMarker.lng },
      '*',
    );
  }, [resolvedMarkers.find(m => m.type === 'worker')?.lat, resolvedMarkers.find(m => m.type === 'worker')?.lng]);

  return <View ref={containerRef} style={[{ height: 180 }, style]} />;
}
