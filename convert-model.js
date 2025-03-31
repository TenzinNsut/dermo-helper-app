const fs = require('fs');
const path = require('path');
const onnx = require('@microsoft/onnxjs');
const tfjs = require('@tensorflow/tfjs-node');
const onnxConverter = require('@tensorflow/tfjs-converter/dist/operations/executors/onnx_executor');

async function convertOnnxToTfjs() {
  try {
    console.log('Starting ONNX to TensorFlow.js conversion...');
    
    // Paths
    const onnxModelPath = path.join(__dirname, 'public', 'models', 'student_model_quantized.onnx');
    const outputDir = path.join(__dirname, 'public', 'models');
    
    // Check if ONNX model exists
    if (!fs.existsSync(onnxModelPath)) {
      console.error(`ONNX model not found at: ${onnxModelPath}`);
      return;
    }
    
    console.log(`ONNX model found at: ${onnxModelPath}`);
    
    // Load the ONNX model
    const modelBuffer = fs.readFileSync(onnxModelPath);
    
    // Convert to TF.js
    const tfModel = await onnxConverter.convertOnnxModel(modelBuffer);
    
    // Save the model
    await tfModel.save(`file://${outputDir}/student_model_quantized`);
    
    console.log(`Model successfully converted and saved to: ${outputDir}`);
  } catch (error) {
    console.error('Error converting model:', error);
  }
}

convertOnnxToTfjs(); 