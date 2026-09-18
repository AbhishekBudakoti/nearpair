// Client-side avatar processing: center-crops to a square and re-encodes as a
// small JPEG data URL, entirely via native browser APIs (FileReader, Image,
// canvas) so the result can be stored directly in the existing `avatar`
// string field with no upload endpoint or file-hosting dependency.
export function resizeImageToDataUrl(file, size = 200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file"));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Couldn't read that image"));
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;

        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        canvas.getContext("2d").drawImage(img, sx, sy, side, side, 0, 0, size, size);

        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
