import { useRef, useState, ChangeEvent } from 'react';
import { IMAGE_URLS } from '../data/sample-image-urls';
import { inferenceStyleTransfer } from '../utils/predict';
import { STYLES, StyleName } from '../utils/modelHelper';
import { OUTPUT_WIDTH, OUTPUT_HEIGHT } from '../utils/imageHelper';
import styles from '../styles/Home.module.css';

// Fixed canvas size matching model input/output
const CANVAS_SIZE = 224;

const ImageCanvas = () => {
  const inputCanvasRef = useRef<HTMLCanvasElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);

  const [selectedStyle, setSelectedStyle] = useState<StyleName>('mosaic');
  const [imageSource, setImageSource] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [inferenceTime, setInferenceTime] = useState('');
  const [statusMessage, setStatusMessage] = useState('Select an image to get started');

  // Load a random sample image
  const loadSampleImage = () => {
    const sampleImageUrls = IMAGE_URLS;
    const random = Math.floor(Math.random() * sampleImageUrls.length);
    const imageUrl = sampleImageUrls[random].value;
    loadImage(imageUrl);
  };

  // Handle file upload
  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        loadImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Load and display image on input canvas (scaled to 224x224 preview)
  const loadImage = (src: string) => {
    setImageSource(src);
    setStatusMessage('Image loaded. Click "Apply Style" to transform.');
    setInferenceTime('');

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = src;

    image.onload = () => {
      const canvas = inputCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear and draw image scaled to canvas size (224x224)
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.drawImage(image, 0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Clear output canvas
      const outputCanvas = outputCanvasRef.current;
      if (outputCanvas) {
        const outputCtx = outputCanvas.getContext('2d');
        outputCtx?.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      }
    };
  };

  // Run style transfer
  const applyStyle = async () => {
    if (!imageSource) {
      setStatusMessage('Please select an image first');
      return;
    }

    setIsProcessing(true);
    setStatusMessage(`Applying ${selectedStyle} style...`);
    setInferenceTime('');

    try {
      const result = await inferenceStyleTransfer(imageSource, selectedStyle);

      // Draw result on output canvas
      const outputCanvas = outputCanvasRef.current;
      if (outputCanvas) {
        const ctx = outputCanvas.getContext('2d');
        if (ctx) {
          ctx.putImageData(result.imageData, 0, 0);
        }
      }

      setStatusMessage('Style transfer complete!');
      setInferenceTime(`Inference time: ${result.inferenceTime.toFixed(2)}s`);
    } catch (error) {
      console.error('Style transfer error:', error);
      setStatusMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.styleTransferContainer}>
      {/* Controls */}
      <div className={styles.controls}>
        {/* Image Selection */}
        <div className={styles.imageControls}>
          <button
            className={styles.button}
            onClick={loadSampleImage}
            disabled={isProcessing}
          >
            Random Sample Image
          </button>
          <label className={styles.uploadLabel}>
            Upload Image
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className={styles.fileInput}
            />
          </label>
        </div>

        {/* Style Selection */}
        <div className={styles.styleSelector}>
          <label>Style: </label>
          <select
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value as StyleName)}
            disabled={isProcessing}
            className={styles.styleSelect}
          >
            {STYLES.map((style) => (
              <option key={style.name} value={style.name}>
                {style.label}
              </option>
            ))}
          </select>
        </div>

        {/* Apply Button */}
        <button
          className={styles.applyButton}
          onClick={applyStyle}
          disabled={isProcessing || !imageSource}
        >
          {isProcessing ? 'Processing...' : 'Apply Style'}
        </button>
      </div>

      {/* Status */}
      <div className={styles.status}>
        <span>{statusMessage}</span>
        {inferenceTime && <span className={styles.inferenceTime}>{inferenceTime}</span>}
      </div>

      {/* Info about processing size */}
      <p className={styles.sizeInfo}>Images are processed at 224x224 pixels</p>

      {/* Canvases */}
      <div className={styles.canvasContainer}>
        <div className={styles.canvasWrapper}>
          <h3>Input</h3>
          <canvas
            ref={inputCanvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className={styles.canvas}
          />
        </div>
        <div className={styles.canvasWrapper}>
          <h3>Output</h3>
          <canvas
            ref={outputCanvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className={styles.canvas}
          />
        </div>
      </div>
    </div>
  );
};

export default ImageCanvas;
