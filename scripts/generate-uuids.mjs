// generate-uuids.mjs - generate UUID v7 format ids
function uuidv7() {
  const now = Date.now();
  const timeHex = now.toString(16).padStart(12, '0');
  const rand = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const uuid = [
    timeHex.slice(0, 8),
    timeHex.slice(8, 12),
    '7' + rand.slice(0, 3),
    ((parseInt(rand[4], 16) & 0x3) | 0x8).toString(16) + rand.slice(5, 8),
    rand.slice(8, 20)
  ].join('-');
  return uuid;
}

for (let i = 0; i < 35; i++) {
  console.log(uuidv7());
}
