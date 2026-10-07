// Area metadata: display name, palette, default ground tile under overlays, whether the area
// is dark (lit only around the hero), and for villages: `village: true` plus `hub`, the room you
// respawn in and fast travel to. `mapColor` tints the area's rooms on the map.
export const AREAS = {
  village: { name: 'Village', palette: 'overworld', ground: '.', village: true, hub: 'village_square', mapColor: '#6ac85a' },
  meadow: { name: 'Meadow', palette: 'overworld', ground: '.', mapColor: '#9ad86a' },
  forest: { name: 'Forest', palette: 'forest', ground: '.', mapColor: '#3a8a3a' },
  desert: { name: 'Desert', palette: 'desert', ground: '.', mapColor: '#d8b868' },
  sunwell: { name: 'Sunwell', palette: 'desert', ground: '.', village: true, hub: 'sunwell', mapColor: '#f0d070' },
  cave: { name: 'Lava Cave', palette: 'cave', ground: '_', mapColor: '#b8401a' }, // lit by its lava (see PlayScene.drawLavaGlow)
  camp: { name: 'Camp', palette: 'cave', ground: '_', mapColor: '#e08a3a' }, // merchant's camp: same rock, no lava
  peaks: { name: 'Frozen Peaks', palette: 'peaks', ground: '.', mapColor: '#c8dcf0' },
  frosthold: { name: 'Frosthold', palette: 'peaks', ground: '.', village: true, hub: 'frosthold', mapColor: '#ffffff' },
  castle: { name: 'Castle', palette: 'castle', ground: '_', mapColor: '#8a5aa8' },
  test: { name: 'Test Room', palette: 'castle', ground: '_', mapColor: '#666666' },
};
