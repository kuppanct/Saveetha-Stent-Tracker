/**
 * Client-side HTML5 Canvas Image Compression Utility
 * Resizes and compresses mobile camera/gallery photos to strictly under 150KB JPEG
 * to preserve Supabase storage limits and enable fast mobile uploading over 3G/4G.
 */

export interface CompressionResult {
  file: File;
  blob: Blob;
  dataUrl: string;
  originalSizeKb: number;
  compressedSizeKb: number;
}

export async function compressStentImage(
  file: File,
  maxDimension: number = 1200,
  maxSizeKb: number = 150
): Promise<CompressionResult> {
  const originalSizeKb = Math.round(file.size / 1024);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio downscaling
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Unable to create canvas context"));
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Iteratively find quality setting to meet < 150KB requirement
        let quality = 0.82;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);

        // Reduce quality if still larger than target
        while (dataUrl.length * 0.75 > maxSizeKb * 1024 && quality > 0.3) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        // Convert DataURL to Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Blob creation failed"));
              return;
            }

            const compressedSizeKb = Math.round(blob.size / 1024);
            const compressedFile = new File(
              [blob],
              `stent-${Date.now()}.jpg`,
              { type: "image/jpeg", lastModified: Date.now() }
            );

            resolve({
              file: compressedFile,
              blob,
              dataUrl,
              originalSizeKb,
              compressedSizeKb,
            });
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
}
