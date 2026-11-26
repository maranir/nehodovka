import { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { ExpressionSpecification, MapLayerMouseEvent, ErrorEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// MapLibre 6 loads its worker as a separate module; point it at the copy Vite bundles.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { loadSpots, type BlackSpot, type Meta, type Stats } from '../data';
import { dayToDate } from '../data';
import { useT } from '../i18n';
import { IconAlert, IconCrosshair, IconLocate } from '../icons';
import { TYPE, causeLabel } from '../labels';
import { areaStats, distance, loadAllPoints, toGeoJSON, type AreaStats, type Merged } from '../points';
import { causeTip } from '../tips';

maplibregl.setWorkerUrl(workerUrl);

const STYLE = 'https://tiles.openfreemap.org/styles/dark';
const FALLBACK_STYLE = 'https://tiles.openfreemap.org/styles/positron';
const CZ_BOUNDS: [number, number, number, number] = [12.09, 48.55, 18.86, 51.06];
const CZ_AREA_KM2 = 78871;

type Filter = 'all' | 'fatal' | 'alcohol' | 'peds' | 'bikes' | 'moto' | 'animals';

/** Show place names in the UI language where OpenStreetMap has them. */
function localizeLabels(map: maplibregl.Map, lang: string) {
  for (const layer of map.getStyle()?.layers ?? []) {
    if (layer.type !== 'symbol' || !layer.layout?.['text-field']) continue;
    map.setLayoutProperty(layer.id, 'text-field', ['coalesce', ['get', `name:${lang}`], ['get', 'name']]);
  }
}

export default function MapView({ meta, stats, openSpots = false }: { meta: Meta; stats: Stats; openSpots?: boolean }) {
  const { t, n, p, date, lang } = useT();
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [pts, setPts] = useState<Merged | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [year, setYear] = useState<number | 'all'>('all');
  const [selected, setSelected] = useState<number | null>(null);
  const [area, setArea] = useState<(AreaStats & { label: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [spots, setSpots] = useState<BlackSpot[] | null>(null);
  const [spotList, setSpotList] = useState(openSpots);
  const [spot, setSpot] = useState<BlackSpot | null>(null);
  const [me, setMe] = useState<[number, number] | null>(null);
  const spotMarker = useRef<maplibregl.Marker | null>(null);
  useEffect(() => {
    loadSpots().then(setSpots).catch(() => setSpots([]));
  }, []);
  useEffect(() => setSpotList(openSpots), [openSpots]);

  // load points
  useEffect(() => {
    loadAllPoints(meta).then(setPts).catch((e) => setError(String(e)));
  }, [meta]);

  // create map once
  useEffect(() => {
    if (!el.current) return;
    const map = new maplibregl.Map({
      container: el.current,
      style: STYLE,
      bounds: CZ_BOUNDS,
      fitBoundsOptions: { padding: 10 },
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
    });
    map.touchZoomRotate.disableRotation();
    let triedFallback = false;
    map.on('error', (e: ErrorEvent) => {
      if (!triedFallback && !map.isStyleLoaded() && String(e.error?.message ?? '').includes('style')) {
        triedFallback = true;
        map.setStyle(FALLBACK_STYLE);
      }
    });
    mapRef.current = map;
    return () => map.remove();
  }, []);

  // add data layers once both map + points are ready
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !pts) return;
    const add = () => {
      if (map.getSource('acc')) return;
      map.addSource('acc', { type: 'geojson', data: toGeoJSON(pts) });
      map.addLayer({
        id: 'heat',
        type: 'heatmap',
        source: 'acc',
        maxzoom: 14,
        paint: {
          'heatmap-weight': ['match', ['get', 'sev'], 3, 1, 2, 0.5, 0.15],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 6, 0.35, 13, 2.5],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 6, 4, 10, 12, 14, 24],
          'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.85, 14, 0],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0,0,0,0)', 0.15, 'rgba(255,212,0,0.35)', 0.4, 'rgba(255,150,0,0.7)', 0.7, 'rgba(240,60,0,0.85)', 1, 'rgba(255,0,40,1)',
          ],
        },
      });
      map.addLayer({
        id: 'dots',
        type: 'circle',
        source: 'acc',
        minzoom: 11,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 2.5, 16, 7],
          'circle-color': ['match', ['get', 'sev'], 3, '#ff1f3d', 2, '#ff9500', '#ffd400'],
          'circle-stroke-color': '#000',
          'circle-stroke-width': 0.6,
          'circle-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.4, 13, 0.95],
        },
      });
      map.addLayer({
        id: 'fatal',
        type: 'circle',
        source: 'acc',
        filter: ['==', ['get', 'sev'], 3],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 1.1, 9, 2, 12, 5, 16, 9],
          'circle-opacity': ['interpolate', ['linear'], ['zoom'], 6, 0.75, 10, 1],
          'circle-color': '#ff1f3d',
          'circle-stroke-color': '#fff',
          'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 6, 0, 12, 1.2],
        },
      });
      for (const layer of ['dots', 'fatal']) {
        map.on('click', layer, (e: MapLayerMouseEvent) => {
          const f = e.features?.[0];
          if (f) setSelected(Number(f.properties?.i));
        });
        map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'));
        map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''));
      }
    };
    if (map.isStyleLoaded()) add();
    else map.once('load', add);
    map.on('styledata', () => {
      if (map.isStyleLoaded() && !map.getSource('acc')) add();
    });
  }, [pts]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const go = () => localizeLabels(map, lang);
    if (map.isStyleLoaded()) go();
    else map.once('load', go);
  }, [lang]);

  // black spots layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !spots?.length) return;
    const add = () => {
      if (map.getSource('spots')) return;
      map.addSource('spots', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: spots.map((x) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [x.lon, x.lat] }, properties: { rank: x.rank } })) },
      });
      map.addLayer({
        id: 'spots',
        type: 'circle',
        source: 'spots',
        minzoom: 8,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 5, 14, 13],
          'circle-color': '#000',
          'circle-stroke-color': '#ff1f3d',
          'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 8, 1.5, 14, 3],
        },
      });
      map.addLayer({
        id: 'spots-label',
        type: 'symbol',
        source: 'spots',
        minzoom: 10,
        layout: { 'text-field': ['to-string', ['get', 'rank']], 'text-font': ['Noto Sans Bold'], 'text-size': 11, 'text-allow-overlap': true },
        paint: { 'text-color': '#fff' },
      });
      map.on('click', 'spots', (e: MapLayerMouseEvent) => {
        const r = Number(e.features?.[0]?.properties?.rank);
        const x = spots.find((y) => y.rank === r);
        if (x) showSpot(x);
      });
    };
    if (map.getSource('acc')) add();
    else map.once('idle', add);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spots, pts]);

  const showSpot = (x: BlackSpot) => {
    const map = mapRef.current;
    if (!map) return;
    setSpot(x);
    setSpotList(false);
    setArea(null);
    setSelected(null);
    spotMarker.current?.remove();
    const el = document.createElement('div');
    el.className = 'spot-marker';
    el.textContent = String(x.rank);
    spotMarker.current = new maplibregl.Marker({ element: el }).setLngLat([x.lon, x.lat]).addTo(map);
    map.flyTo({ center: [x.lon, x.lat], zoom: 15.5, offset: [0, -90] });
  };

  // apply filters
  const expr = useMemo(() => {
    const parts: ExpressionSpecification[] = [];
    if (year !== 'all') parts.push(['==', ['get', 'y'], year]);
    const flagKey: Record<Filter, string | null> = { all: null, fatal: null, alcohol: 'a', peds: 'p', bikes: 'b', moto: 'm', animals: 'z' };
    if (filter === 'fatal') parts.push(['==', ['get', 'sev'], 3]);
    if (flagKey[filter]) parts.push(['==', ['get', flagKey[filter]!], 1]);
    return parts.length ? (['all', ...parts] as ExpressionSpecification) : null;
  }, [filter, year]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !pts) return;
    const apply = () => {
      if (!map.getLayer('heat')) return;
      map.setFilter('heat', expr);
      map.setFilter('dots', expr);
      map.setFilter('fatal', expr ? ['all', ['==', ['get', 'sev'], 3], expr] : ['==', ['get', 'sev'], 3]);
    };
    if (map.getLayer('heat')) apply();
    else map.once('idle', apply);
  }, [expr, pts]);

  const analyze = (lon: number, lat: number, label: string) => {
    if (!pts) return;
    setArea({ ...areaStats(pts, lon, lat, 1000), label });
    setSelected(null);
    const map = mapRef.current!;
    markerRef.current?.remove();
    const dot = document.createElement('div');
    dot.className = 'me-marker';
    markerRef.current = new maplibregl.Marker({ element: dot }).setLngLat([lon, lat]).addTo(map);
    map.flyTo({ center: [lon, lat], zoom: 14 });
  };

  const locate = () => {
    if (!navigator.geolocation) return setError(t({ cs: 'Prohlížeč neumí zjistit polohu.', en: 'Your browser cannot get your location.' }));
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setMe([pos.coords.longitude, pos.coords.latitude]);
        analyze(pos.coords.longitude, pos.coords.latitude, t({ cs: 'Tvoje okolí', en: 'Your area' }));
      },
      () => {
        setLocating(false);
        setError(t({ cs: 'Polohu se nepodařilo zjistit. Posuň mapu a použij „Střed mapy“.', en: 'Could not get your location. Pan the map and use "Map centre".' }));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  };

  const analyzeCenter = () => {
    const c = mapRef.current?.getCenter();
    if (c) analyze(c.lng, c.lat, t({ cs: 'Střed mapy', en: 'Map centre' }));
  };

  const nat = stats.all.national;
  const expected = (nat.injuryAcc / CZ_AREA_KM2) * Math.PI; // injury accidents per 1 km radius circle, national average
  const filters: [Filter, string][] = [
    ['all', t({ cs: 'Vše', en: 'All' })],
    ['fatal', t({ cs: 'Smrtelné', en: 'Fatal' })],
    ['alcohol', t({ cs: 'Alkohol/drogy', en: 'Alcohol/drugs' })],
    ['peds', t({ cs: 'Chodci', en: 'Pedestrians' })],
    ['bikes', t({ cs: 'Cyklisti', en: 'Cyclists' })],
    ['moto', t({ cs: 'Motorky', en: 'Motorbikes' })],
    ['animals', t({ cs: 'Zvěř', en: 'Animals' })],
  ];

  return (
    <div className="map-view">
      <div ref={el} className="map" />
      <div className="map-top">
        <div className="chips">
          {filters.map(([f, label]) => (
            <button key={f} className={`chip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>
              {label}
            </button>
          ))}
        </div>
        <div className="chips">
          {(['all', ...meta.years.map((y) => y.year)] as const).map((y) => (
            <button key={y} className={`chip small ${year === y ? 'on' : ''}`} onClick={() => setYear(y)}>
              {y === 'all' ? t({ cs: 'Všechny roky', en: 'All years' }) : y}
            </button>
          ))}
        </div>
      </div>
      {!pts && !error && <div className="map-loading">{t({ cs: 'Načítám nehody…', en: 'Loading crashes…' })}</div>}
      <div className="map-actions">
        <button className="fab skull" onClick={() => { setSpotList(true); setArea(null); setSelected(null); setSpot(null); }} disabled={!spots}>
          <span className="fab-icon"><IconAlert /></span>{t({ cs: 'Černá místa', en: 'Black spots' })}
        </button>
        <button className="fab" onClick={analyzeCenter} disabled={!pts}>
          <span className="fab-icon"><IconCrosshair /></span>{t({ cs: 'Střed mapy', en: 'Map centre' })}
        </button>
        <button className="fab primary" onClick={locate} disabled={!pts || locating}>
          <span className="fab-icon"><IconLocate /></span>{locating ? '…' : t({ cs: 'Moje okolí', en: 'My area' })}
        </button>
      </div>
      <div className="legend">
        <span><i style={{ background: '#ff1f3d' }} />{t({ cs: 'smrt', en: 'death' })}</span>
        <span><i style={{ background: '#ff9500' }} />{t({ cs: 'těžké zranění', en: 'serious' })}</span>
        <span><i style={{ background: '#ffd400' }} />{t({ cs: 'lehké', en: 'minor' })}</span>
        <span><i className="spot" />{t({ cs: 'černé místo', en: 'black spot' })}</span>
      </div>

      {error && (
        <div className="sheet" onClick={() => setError(null)}>
          <p>{error}</p>
        </div>
      )}

      {selected != null && pts && (
        <div className="sheet">
          <button className="close" onClick={() => setSelected(null)} aria-label="close">×</button>
          <div className="sheet-tag">{date(dayToDate(pts.day[selected]))}{pts.h[selected] >= 0 ? ` · ${pts.h[selected]}:00–${pts.h[selected] + 1}:00` : ''}</div>
          <h3>{t(TYPE[String(pts.type[selected])] ?? TYPE['0'])}</h3>
          <p className="muted">{t({ cs: 'Hlavní příčina', en: 'Main cause' })}: {t(causeLabel(pts.cause[selected]))}</p>
          <div className="toll">
            {pts.k[selected] > 0 && <span className="k">{pts.k[selected]} {t({ cs: 'mrtví', en: 'dead' })}</span>}
            {pts.s[selected] > 0 && <span className="s">{pts.s[selected]} {t({ cs: 'těžce zraněno', en: 'seriously injured' })}</span>}
            {pts.l[selected] > 0 && <span className="l">{pts.l[selected]} {t({ cs: 'lehce zraněno', en: 'slightly injured' })}</span>}
          </div>
          <p className="tip">{t(causeTip(pts.cause[selected], pts.flags[selected]))}</p>
        </div>
      )}

      {area && (
        <div className="sheet">
          <button className="close" onClick={() => { setArea(null); markerRef.current?.remove(); }} aria-label="close">×</button>
          <div className="sheet-tag">{area.label} · {t({ cs: 'okruh 1 km', en: '1 km radius' })} · {meta.years[0].year}–{meta.years.at(-1)!.year}</div>
          {area.n === 0 ? (
            <>
              <h3>{t({ cs: 'Nula. Nic. Klid.', en: 'Zero. Nothing. Peace.' })}</h3>
              <p className="muted">{t({ cs: 'Žádná nehoda se zraněním v okruhu 1 km. Buď je tu bezpečno, nebo tu nikdo nejezdí.', en: 'No injury crashes within 1 km. Either it is safe here, or nobody drives here.' })}</p>
            </>
          ) : (
            <>
              <h3>
                {n(area.n)} {t({ cs: 'nehod se zraněním', en: 'injury crashes' })}
              </h3>
              <div className="toll">
                <span className="k">{n(area.k)} {t({ cs: 'mrtví', en: 'dead' })}</span>
                <span className="s">{n(area.s)} {t({ cs: 'těžce', en: 'serious' })}</span>
                <span className="l">{n(area.l)} {t({ cs: 'lehce', en: 'minor' })}</span>
              </div>
              <ul className="facts">
                <li>
                  {area.n > expected * 1.2
                    ? t({ cs: `To je ${p(area.n / expected)}× víc než průměr Česka na stejnou plochu.`, en: `That is ${p(area.n / expected)}× the Czech average for the same area.` })
                    : t({ cs: `Celorepublikový průměr na stejnou plochu je ${p(expected)}. Žiješ v relativním klidu.`, en: `The national average for the same area is ${p(expected)}. You live somewhere relatively calm.` })}
                </li>
                {area.topCause && (
                  <li>
                    {t({ cs: 'Nejčastější příčina', en: 'Most common cause' })}: <b>{t(causeLabel(area.topCause))}</b> ({n(area.topCauseN)}×)
                  </li>
                )}
                {area.worstHour != null && (
                  <li>
                    {t({ cs: 'Nejhorší hodina', en: 'Worst hour' })}: <b>{area.worstHour}:00–{area.worstHour + 1}:00</b>
                  </li>
                )}
                {area.peds > 0 && <li>{t({ cs: 'Sražení chodci', en: 'Pedestrians hit' })}: {n(area.peds)}</li>}
                {area.bikes > 0 && <li>{t({ cs: 'Nehody cyklistů', en: 'Cyclist crashes' })}: {n(area.bikes)}</li>}
                {area.alcohol > 0 && <li>{t({ cs: 'Alkohol nebo drogy', en: 'Alcohol or drugs' })}: {n(area.alcohol)}×</li>}
                {area.nearestFatal != null && (
                  <li>
                    {t({ cs: 'Nejbližší smrtelná nehoda', en: 'Nearest fatal crash' })}: <b>{area.nearestFatal < 1000 ? `${n(area.nearestFatal)} m` : `${p(area.nearestFatal / 1000)} km`}</b>
                  </li>
                )}
              </ul>
              {area.topCause && <p className="tip">{t(causeTip(area.topCause, 0))}</p>}
              <p className="muted small">{t({ cs: 'Jen nehody se zraněním; pouze s hmotnou škodou nejsou v mapě.', en: 'Injury crashes only; damage-only crashes are not on the map.' })}</p>
            </>
          )}
        </div>
      )}
      {spotList && spots && (
        <div className="sheet">
          <button className="close" onClick={() => setSpotList(false)} aria-label="close">×</button>
          <div className="sheet-tag">{t({ cs: `${spots.length} nejhorších míst Česka · ${meta.years[0].year}–${meta.years.at(-1)!.year}`, en: `${spots.length} worst places in Czechia · ${meta.years[0].year}–${meta.years.at(-1)!.year}` })}</div>
          <h3>{t({ cs: 'Černá místa', en: 'Black spots' })}</h3>
          <p className="muted small" style={{ marginTop: 0 }}>
            {t({
              cs: 'Místa, kde se opakovaně bourá (min. 10 nehod se zraněním v okruhu 300 m), seřazená podle závažnosti.',
              en: 'Places with repeated crashes (at least 10 injury crashes within 300 m), ranked by severity.',
            })}
            {me ? t({ cs: ' Seřazeno podle vzdálenosti od tebe.', en: ' Sorted by distance from you.' }) : ''}
          </p>
          <ul className="spot-list">
            {(me ? [...spots].sort((a, b) => distance(me[0], me[1], a.lon, a.lat) - distance(me[0], me[1], b.lon, b.lat)) : spots).slice(0, 40).map((x) => (
              <li key={x.rank}>
                <button onClick={() => showSpot(x)}>
                  <span className="rank">{x.rank}</span>
                  <span>
                    <span className="name">{x.town || '?'}{x.road ? ` · ${x.road}` : ''}</span>
                    <span className="sub" style={{ display: 'block' }}>
                      {n(x.n)} {t({ cs: 'nehod', en: 'crashes' })} · {x.k} {t({ cs: 'mrtvých', en: 'dead' })} · {x.s} {t({ cs: 'těžce', en: 'serious' })}{x.cause ? ` · ${t(causeLabel(x.cause))}` : ''}
                    </span>
                  </span>
                  <span className="dist">{me ? fmtKm(distance(me[0], me[1], x.lon, x.lat)) : ''}</span>
                </button>
              </li>
            ))}
          </ul>
          {!me && (
            <button className="btn primary" onClick={locate}><span className="btn-icon"><IconLocate /></span>{t({ cs: 'Seřadit podle mé polohy', en: 'Sort by my location' })}</button>
          )}
        </div>
      )}

      {spot && (
        <div className="sheet">
          <button className="close" onClick={() => { setSpot(null); spotMarker.current?.remove(); }} aria-label="close">×</button>
          <div className="sheet-tag">{t({ cs: `Černé místo č. ${spot.rank} · okruh 300 m`, en: `Black spot #${spot.rank} · 300 m radius` })}</div>
          <h3>{spot.town}{spot.road ? ` · ${spot.road}` : ''}</h3>
          <div className="toll">
            <span>{n(spot.n)} {t({ cs: 'nehod se zraněním', en: 'injury crashes' })}</span>
            <span className="k">{spot.k} {t({ cs: 'mrtví', en: 'dead' })}</span>
            <span className="s">{spot.s} {t({ cs: 'těžce', en: 'serious' })}</span>
            <span className="l">{spot.l} {t({ cs: 'lehce', en: 'minor' })}</span>
          </div>
          <ul className="facts">
            {spot.cause && <li>{t({ cs: 'Typická příčina', en: 'Typical cause' })}: <b>{t(causeLabel(spot.cause))}</b> ({spot.causeN}×)</li>}
            {spot.peds > 0 && <li>{t({ cs: 'Sražení chodci', en: 'Pedestrians hit' })}: {spot.peds}</li>}
            {spot.bikes > 0 && <li>{t({ cs: 'Cyklisté', en: 'Cyclists' })}: {spot.bikes}</li>}
            {spot.alcohol > 0 && <li>{t({ cs: 'Alkohol', en: 'Alcohol' })}: {spot.alcohol}×</li>}
          </ul>
          {spot.cause && <p className="tip">{t(causeTip(Number(spot.cause), 0))}</p>}
          <button className="btn" onClick={() => { setSpot(null); setSpotList(true); }}>← {t({ cs: 'Zpět na seznam', en: 'Back to the list' })}</button>
        </div>
      )}
    </div>
  );
}

const fmtKm = (m: number) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`);
