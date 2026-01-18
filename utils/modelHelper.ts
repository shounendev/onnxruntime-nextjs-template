import * as ort from 'onnxruntime-web';

export type StyleName = 'mosaic' | 'candy' | 'rain-princess' | 'udnie' | 'pointilism';

export const STYLES: { name: StyleName; label: string }[] = [
  { name: 'mosaic', label: 'Mosaic' },
  { name: 'candy', label: 'Candy' },
  { name: 'rain-princess', label: 'Rain Princess' },
  { name: 'udnie', label: 'Udnie' },
  { name: 'pointilism', label: 'Pointilism' },
];

// Cache for loaded sessions to avoid reloading models
const sessionCache: Map<StyleName, ort.InferenceSession> = new Map();

async function getSession(styleName: StyleName): Promise<ort.InferenceSession> {
  // Check cache first
  if (sessionCache.has(styleName)) {
    return sessionCache.get(styleName)!;
  }

  // Load the model
  const modelPath = `./_next/static/chunks/pages/${styleName}-9.onnx`;
  console.log(`Loading model: ${modelPath}`);

  const session = await ort.InferenceSession.create(modelPath, {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all',
  });

  console.log('Inference session created for style:', styleName);
  sessionCache.set(styleName, session);
  return session;
}

export async function runStyleTransfer(
  preprocessedData: ort.Tensor,
  styleName: StyleName
): Promise<[ort.Tensor, number]> {
  const session = await getSession(styleName);
  const [output, inferenceTime] = await runInference(session, preprocessedData);
  return [output, inferenceTime];
}

async function runInference(
  session: ort.InferenceSession,
  preprocessedData: ort.Tensor
): Promise<[ort.Tensor, number]> {
  // Get start time to calculate inference time.
  const start = new Date();

  // Create feeds with the input name from model export and the preprocessed data.
  const feeds: Record<string, ort.Tensor> = {};
  feeds[session.inputNames[0]] = preprocessedData;

  // Run the session inference.
  const outputData = await session.run(feeds);

  // Get the end time to calculate inference time.
  const end = new Date();

  // Convert to seconds.
  const inferenceTime = (end.getTime() - start.getTime()) / 1000;

  // Get output results with the output name from the model export.
  const output = outputData[session.outputNames[0]];

  console.log('Style transfer completed in', inferenceTime, 'seconds');
  return [output, inferenceTime];
}

// Clear the session cache (useful for memory management)
export function clearSessionCache(): void {
  sessionCache.clear();
}
