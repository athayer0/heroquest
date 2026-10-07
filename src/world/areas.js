// Area metadata: display name, palette, default ground tile under overlays,
// and whether the area is dark (lit only around the hero).
export const AREAS = {
  village: { name: 'Village', palette: 'overworld', ground: '.' },
  meadow: { name: 'Meadow', palette: 'overworld', ground: '.' },
  forest: { name: 'Forest', palette: 'forest', ground: '.' },
  cave: { name: 'Cave', palette: 'cave', ground: '_', dark: true },
  camp: { name: 'Camp', palette: 'cave', ground: '_' }, // merchant's camp: cave look, but lit
  castle: { name: 'Castle', palette: 'castle', ground: '_' },
};
