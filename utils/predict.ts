import { getImageTensorFromPath, tensorToImageData, OUTPUT_WIDTH, OUTPUT_HEIGHT } from './imageHelper';
import { runStyleTransfer, StyleName } from './modelHelper';

export interface StyleTransferResult {
  imageData: ImageData;
  width: number;
  height: number;
  inferenceTime: number;
}

export async function inferenceStyleTransfer(
  path: string,
  styleName: StyleName
): Promise<StyleTransferResult> {
  // 1. Convert image to tensor (resized to 224x224)
  const imageTensor = await getImageTensorFromPath(path);

  // 2. Run style transfer model
  const [outputTensor, inferenceTime] = await runStyleTransfer(imageTensor, styleName);

  // 3. Convert output tensor to ImageData for canvas display
  const imageData = tensorToImageData(outputTensor);

  return {
    imageData,
    width: OUTPUT_WIDTH,
    height: OUTPUT_HEIGHT,
    inferenceTime,
  };
}
