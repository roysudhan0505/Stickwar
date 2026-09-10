const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Minimal PNG generator without native dependencies
function createPNG(width, height, isMaskable = false) {
  // Create raw RGBA buffer
  const rowBytes = width * 4 + 1; // +1 for filter byte
  const buffer = Buffer.alloc(rowBytes * height);

  const cx = width / 2;
  const cy = height / 2;
  const scale = width / 512;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    buffer[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Background color: Deep Charcoal #1A1A2E
      let r = 0x1a;
      let g = 0x1a;
      let b = 0x2e;
      let a = 255;

      const distCenter = Math.hypot(x - cx, y - cy);

      // Maskable safe zone adjustment
      const cornerRadius = isMaskable ? 0 : 70 * scale;
      // Border check if not maskable
      if (!isMaskable) {
        const dx = Math.max(Math.abs(x - cx) - (width / 2 - cornerRadius), 0);
        const dy = Math.max(Math.abs(y - cy) - (height / 2 - cornerRadius), 0);
        const distCorner = Math.hypot(dx, dy);
        if (distCorner > cornerRadius) {
          a = 0; // outside rounded rect
        }
      }

      if (a > 0) {
        // Subtle radial gradient in background
        const bgGrad = Math.min(1, distCenter / (width * 0.7));
        r = Math.floor(0x22 * (1 - bgGrad * 0.4));
        g = Math.floor(0x2a * (1 - bgGrad * 0.4));
        b = Math.floor(0x44 * (1 - bgGrad * 0.3));

        // Border stroke if not maskable
        if (!isMaskable && (x < 8 * scale || x > width - 8 * scale || y < 8 * scale || y > height - 8 * scale)) {
          r = 0xff; g = 0xd6; b = 0x0a; // Electric yellow border
        }

        // Crossed swords (diagonals)
        const line1Dist = Math.abs((x - cx) - (y - cy)) / Math.SQRT2;
        const line2Dist = Math.abs((x - cx) + (y - cy)) / Math.SQRT2;
        if ((line1Dist < 6 * scale || line2Dist < 6 * scale) && distCenter < 170 * scale) {
          r = 0xe6; g = 0x39; b = 0x46; // Blood red
        }

        // Stickman head (circle at cy - 40*scale)
        const headY = cy - 45 * scale;
        const headDist = Math.hypot(x - cx, y - headY);
        const headRadius = 36 * scale;
        if (headDist <= headRadius && headDist >= headRadius - 10 * scale) {
          r = 0xff; g = 0xd6; b = 0x0a; // Electric yellow stroke
        } else if (headDist < headRadius - 10 * scale) {
          r = 0x16; g = 0x21; b = 0x3e;
        }

        // Stickman headband (red bar across forehead)
        if (Math.abs(y - (headY - 6 * scale)) < 5 * scale && Math.abs(x - cx) < headRadius + 6 * scale) {
          r = 0xe6; g = 0x39; b = 0x46; // Red headband
        }

        // Stickman spine (vertical line)
        if (x >= cx - 6 * scale && x <= cx + 6 * scale && y >= headY + headRadius && y <= cy + 60 * scale) {
          r = 0xff; g = 0xd6; b = 0x0a;
        }

        // Stickman legs
        const legStartY = cy + 60 * scale;
        const leg1Dist = Math.abs((y - legStartY) - 1.2 * (x - cx));
        const leg2Dist = Math.abs((y - legStartY) + 1.2 * (x - cx));
        if (y >= legStartY && y <= legStartY + 65 * scale) {
          if ((leg1Dist < 6 * scale && x < cx) || (leg2Dist < 6 * scale && x > cx)) {
            r = 0xff; g = 0xd6; b = 0x0a;
          }
        }

        // Stickman arms (holding sword stance)
        const armStartY = headY + headRadius + 20 * scale;
        const arm1Dist = Math.abs((y - armStartY) + 0.4 * (x - cx));
        const arm2Dist = Math.abs((y - armStartY) - 0.4 * (x - cx));
        if (y >= armStartY - 20 * scale && y <= armStartY + 30 * scale && Math.abs(x - cx) < 65 * scale) {
          if (arm1Dist < 5 * scale || arm2Dist < 5 * scale) {
            r = 0xff; g = 0xd6; b = 0x0a;
          }
        }
      }

      buffer[pxOffset] = r;
      buffer[pxOffset + 1] = g;
      buffer[pxOffset + 2] = b;
      buffer[pxOffset + 3] = a;
    }
  }

  // Compress IDAT
  const compressed = zlib.deflateSync(buffer);

  // PNG Header
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);
  const ihdrChunk = createChunk('IHDR', ihdr);

  // IDAT Chunk
  const idatChunk = createChunk('IDAT', compressed);

  // IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// Standard CRC32
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ table[(c ^ buf[i]) & 0xff];
  }
  return (c ^ 0xffffffff) >>> 0;
}

const table = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  table[n] = c;
}

const publicDir = path.resolve(__dirname, '../public');

// Generate icons
console.log('Generating PWA Icons...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPNG(64, 64, false));
console.log('All icons generated successfully!');
