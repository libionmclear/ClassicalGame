const DIRECTIONS = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1]
];

function keyOf(coord) {
  return `${coord.q},${coord.r}`;
}

function parseKey(key) {
  const [q, r] = key.split(",").map(Number);
  return { q, r };
}

function neighborsOf(coord) {
  return DIRECTIONS.map(([dq, dr]) => ({ q: coord.q + dq, r: coord.r + dr }));
}

function distance(a, b) {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

function edgeKey(a, b) {
  const ak = keyOf(a);
  const bk = keyOf(b);
  return ak < bk ? `${ak}|${bk}` : `${bk}|${ak}`;
}

module.exports = {
  DIRECTIONS,
  keyOf,
  parseKey,
  neighborsOf,
  distance,
  edgeKey
};
