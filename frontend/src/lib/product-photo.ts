// Resize a selected demo photo in the browser. No external upload/provider call.
export async function prepareProductPhoto(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('Choose a JPEG, PNG or WebP photo.');
  if (file.size > 5 * 1024 * 1024)
    throw new Error('Choose a photo smaller than 5 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (image.naturalWidth * image.naturalHeight > 24_000_000)
      throw new Error('This photo is too large. Choose a smaller image.');
    for (const maxEdge of [1280, 960, 640]) {
      const ratio = Math.min(
        1,
        maxEdge / Math.max(image.naturalWidth, image.naturalHeight),
      );
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
      const context = canvas.getContext('2d');
      if (!context)
        throw new Error(
          'Photo preview is unavailable. You can continue without a photo.',
        );
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/webp', 0.82);
      if (dataUrl.length <= 450_000) return dataUrl;
    }
    throw new Error(
      'The photo is still too large. Try a simpler or smaller image.',
    );
  } catch (error) {
    if (error instanceof Error && !error.message.includes('source image'))
      throw error;
    throw new Error('This image could not be opened. Try another photo.');
  } finally {
    URL.revokeObjectURL(url);
  }
}
