import * as Jimp from 'jimp';
import { Tensor } from 'onnxruntime-web';

// Fixed size required by the style transfer models
const MODEL_WIDTH = 224;
const MODEL_HEIGHT = 224;

export async function getImageTensorFromPath(path: string): Promise<Tensor> {
  // 1. load the image and resize to model's expected size
  var image = await loadImageFromPath(path);

  // Verify image was loaded correctly
  if (!image || !image.bitmap || !image.bitmap.data) {
    throw new Error('Failed to load image');
  }

  console.log('Image loaded:', image.bitmap.width, 'x', image.bitmap.height);

  const dims: [number, number, number, number] = [1, 3, MODEL_HEIGHT, MODEL_WIDTH];
  // 2. convert to tensor (no normalization for style transfer - keep [0, 255])
  var imageTensor = imageDataToTensor(image, dims);
  // 3. return the tensor
  return imageTensor;
}

async function loadImageFromPath(path: string): Promise<Jimp> {
  try {
    // Use Jimp to load the image and resize to model dimensions
    var imageData = await Jimp.default.read(path);
    console.log('Jimp loaded image:', imageData.bitmap.width, 'x', imageData.bitmap.height);
    return imageData.resize(MODEL_WIDTH, MODEL_HEIGHT);
  } catch (error) {
    console.error('Jimp failed to load image:', error);
    throw error;
  }
}

function imageDataToTensor(image: Jimp, dims: [number, number, number, number]): Tensor {
  // 1. Get buffer data from image and create R, G, and B arrays.
  var imageBufferData = image.bitmap.data;

  console.log('Buffer length:', imageBufferData.length, 'Expected:', MODEL_WIDTH * MODEL_HEIGHT * 4);

  const [redArray, greenArray, blueArray] = new Array(new Array<number>(), new Array<number>(), new Array<number>());

  // 2. Loop through the image buffer and extract the R, G, and B channels
  for (let i = 0; i < imageBufferData.length; i += 4) {
    redArray.push(imageBufferData[i]);
    greenArray.push(imageBufferData[i + 1]);
    blueArray.push(imageBufferData[i + 2]);
    // skip data[i + 3] to filter out the alpha channel
  }

  // 3. Concatenate RGB to transpose [H, W, 3] -> [3, H, W] to a number array
  const transposedData = redArray.concat(greenArray).concat(blueArray);

  // 4. convert to float32 (keep values in [0, 255] for style transfer)
  const tensorSize = dims[1] * dims[2] * dims[3];
  console.log('Creating tensor with size:', tensorSize, 'dims:', dims);

  const float32Data = new Float32Array(tensorSize);
  for (let i = 0; i < transposedData.length; i++) {
    float32Data[i] = transposedData[i]; // no normalization for style transfer
  }

  // 5. create the tensor object from onnxruntime-web.
  const inputTensor = new Tensor("float32", float32Data, dims);
  return inputTensor;
}

// Convert output tensor back to ImageData for canvas display
export function tensorToImageData(tensor: Tensor): ImageData {
  const data = tensor.data as Float32Array;
  const width = MODEL_WIDTH;
  const height = MODEL_HEIGHT;
  const imageData = new Uint8ClampedArray(width * height * 4);

  const channelSize = width * height;

  for (let i = 0; i < channelSize; i++) {
    // Tensor is in CHW format [3, H, W], convert back to HWC with alpha
    const r = Math.min(255, Math.max(0, data[i])); // R channel
    const g = Math.min(255, Math.max(0, data[i + channelSize])); // G channel
    const b = Math.min(255, Math.max(0, data[i + 2 * channelSize])); // B channel

    imageData[i * 4] = r;
    imageData[i * 4 + 1] = g;
    imageData[i * 4 + 2] = b;
    imageData[i * 4 + 3] = 255; // Alpha
  }

  return new ImageData(imageData, width, height);
}

// Export constants for UI
export const OUTPUT_WIDTH = MODEL_WIDTH;
export const OUTPUT_HEIGHT = MODEL_HEIGHT;
