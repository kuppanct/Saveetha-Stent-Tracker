const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

async function useOriginalIcon() {
  const originalPath = "C:/Users/Kuppan C T/.gemini/antigravity/brain/b781f5a9-b6dd-42af-8911-196ef93cc9ee/.user_uploaded/media_1787944622742.jpg";

  if (!fs.existsSync(originalPath)) {
    console.error("Source file not found:", originalPath);
    return;
  }

  console.log("Using exact original uploaded image with its original background:", originalPath);

  // Resize original image cleanly to 512x512 PNG keeping full original background
  const buffer = await sharp(originalPath)
    .resize(512, 512, { fit: "cover" })
    .png()
    .toBuffer();

  fs.writeFileSync("public/icon.png", buffer);
  fs.writeFileSync("public/logo.png", buffer);
  fs.writeFileSync("app/icon.png", buffer);
  fs.writeFileSync("public/favicon.ico", buffer);
  fs.writeFileSync("app/favicon.ico", buffer);

  console.log("✅ Successfully set original image as icon and logo everywhere!");
}

useOriginalIcon().catch(console.error);
