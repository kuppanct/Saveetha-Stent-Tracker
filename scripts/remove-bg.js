const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

async function removeBackground() {
  const inputPath = path.resolve("public/icon.png");
  const originalPath = "C:/Users/Kuppan C T/.gemini/antigravity/brain/b781f5a9-b6dd-42af-8911-196ef93cc9ee/.user_uploaded/media_1787937538103.png";
  
  const sourcePath = fs.existsSync(originalPath) ? originalPath : inputPath;
  console.log("Using source image:", sourcePath);

  const image = sharp(sourcePath);
  const { data, info } = await image.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  console.log(`Image dimensions: ${width}x${height}, channels: ${channels}`);

  // Sample corner background color
  const getPixel = (x, y) => {
    const idx = (y * width + x) * channels;
    return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
  };

  const corners = [
    getPixel(0, 0),
    getPixel(width - 1, 0),
    getPixel(0, height - 1),
    getPixel(width - 1, height - 1),
    getPixel(5, 5),
    getPixel(width - 6, 5),
  ];

  console.log("Corner colors:", corners);

  const bgR = corners.reduce((sum, c) => sum + c[0], 0) / corners.length;
  const bgG = corners.reduce((sum, c) => sum + c[1], 0) / corners.length;
  const bgB = corners.reduce((sum, c) => sum + c[2], 0) / corners.length;

  console.log(`Average Background RGB: (${bgR.toFixed(1)}, ${bgG.toFixed(1)}, ${bgB.toFixed(1)})`);

  // Flood fill from outer perimeter
  const visited = new Uint8Array(width * height);
  const queue = [];

  // Add all boundary pixels to queue
  for (let x = 0; x < width; x++) {
    queue.push([x, 0]);
    queue.push([x, height - 1]);
    visited[0 * width + x] = 1;
    visited[(height - 1) * width + x] = 1;
  }
  for (let y = 0; y < height; y++) {
    queue.push([0, y]);
    queue.push([width - 1, y]);
    visited[y * width + 0] = 1;
    visited[y * width + (width - 1)] = 1;
  }

  // Color distance threshold from background
  const isBgMatch = (r, g, b) => {
    const dist = Math.sqrt(
      Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
    );
    return dist < 45; // Adjust tolerance
  };

  // BFS flood fill
  let head = 0;
  while (head < queue.length) {
    const [cx, cy] = queue[head++];
    const pIdx = (cy * width + cx) * channels;
    const pr = data[pIdx];
    const pg = data[pIdx + 1];
    const pb = data[pIdx + 2];

    if (isBgMatch(pr, pg, pb)) {
      // Mark pixel as transparent
      data[pIdx + 3] = 0;

      // Check 4-connected neighbors
      const neighbors = [
        [cx + 1, cy],
        [cx - 1, cy],
        [cx, cy + 1],
        [cx, cy - 1],
      ];

      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nVisitedIdx = ny * width + nx;
          if (!visited[nVisitedIdx]) {
            visited[nVisitedIdx] = 1;
            const nPIdx = (ny * width + nx) * channels;
            const nr = data[nPIdx];
            const ng = data[nPIdx + 1];
            const nb = data[nPIdx + 2];
            if (isBgMatch(nr, ng, nb)) {
              queue.push([nx, ny]);
            }
          }
        }
      }
    }
  }

  // Smooth anti-aliased edge feathering
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * channels;
      if (data[idx + 3] > 0) {
        // Count transparent neighbors
        let transNeighbors = 0;
        const neighbors = [
          [-1, 0], [1, 0], [0, -1], [0, 1]
        ];
        for (const [dx, dy] of neighbors) {
          const nIdx = ((y + dy) * width + (x + dx)) * channels;
          if (data[nIdx + 3] === 0) transNeighbors++;
        }

        if (transNeighbors > 0) {
          const pr = data[idx], pg = data[idx + 1], pb = data[idx + 2];
          const dist = Math.sqrt(
            Math.pow(pr - bgR, 2) + Math.pow(pg - bgG, 2) + Math.pow(pb - bgB, 2)
          );
          if (dist < 65) {
            data[idx + 3] = Math.round(255 * (dist / 65));
          }
        }
      }
    }
  }

  const outputBuffer = await sharp(data, {
    raw: { width, height, channels: 4 },
  })
    .trim()
    .resize(512, 512, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // Write to all icon destinations
  fs.writeFileSync("public/icon.png", outputBuffer);
  fs.writeFileSync("app/icon.png", outputBuffer);
  fs.writeFileSync("public/favicon.ico", outputBuffer);
  fs.writeFileSync("app/favicon.ico", outputBuffer);

  console.log("✅ Transparent 512x512 square icon generated and saved successfully!");
}

removeBackground().catch(console.error);
