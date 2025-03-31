import os
import sys
import subprocess

def install_required_packages():
    """Install required packages if not already installed"""
    required_packages = [
        "tensorflow",
        "tensorflowjs",
        "onnx",
        "onnx-tf"
    ]
    
    for package in required_packages:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            print(f"Successfully installed {package}")
        except subprocess.CalledProcessError:
            print(f"Failed to install {package}")
            return False
    return True

def convert_onnx_to_tf(onnx_model_path, output_dir):
    """Convert ONNX model to TensorFlow SavedModel format"""
    import onnx
    import onnx_tf
    import tensorflow as tf
    
    print(f"Loading ONNX model from {onnx_model_path}")
    onnx_model = onnx.load(onnx_model_path)
    
    print("Converting ONNX model to TensorFlow SavedModel format")
    tf_model_path = os.path.join(output_dir, "tf_saved_model")
    if not os.path.exists(tf_model_path):
        os.makedirs(tf_model_path)
    
    tf_rep = onnx_tf.backend.prepare(onnx_model)
    tf_rep.export_graph(tf_model_path)
    
    print(f"TensorFlow SavedModel saved to {tf_model_path}")
    return tf_model_path

def convert_tf_to_tfjs(tf_model_path, output_dir):
    """Convert TensorFlow SavedModel to TensorFlow.js format"""
    import tensorflowjs as tfjs
    
    print("Converting TensorFlow SavedModel to TensorFlow.js format")
    tfjs_model_path = os.path.join(output_dir, "tfjs_model")
    if not os.path.exists(tfjs_model_path):
        os.makedirs(tfjs_model_path)
    
    tfjs.converters.convert_tf_saved_model(
        tf_model_path,
        tfjs_model_path,
        skip_op_check=True,
        strip_debug_ops=True
    )
    
    print(f"TensorFlow.js model saved to {tfjs_model_path}")
    return tfjs_model_path

def main():
    # Install required packages
    print("Installing required packages...")
    if not install_required_packages():
        print("Failed to install required packages. Exiting.")
        return
    
    # Define paths
    onnx_model_path = "public/models/student_model_quantized.onnx"
    output_dir = "public/models"
    
    # Convert ONNX to TF SavedModel
    tf_model_path = convert_onnx_to_tf(onnx_model_path, output_dir)
    
    # Convert TF SavedModel to TF.js
    tfjs_model_path = convert_tf_to_tfjs(tf_model_path, output_dir)
    
    # Copy the TF.js model files to the correct location
    import shutil
    for file in os.listdir(tfjs_model_path):
        src = os.path.join(tfjs_model_path, file)
        dst = os.path.join("public/models", file)
        shutil.copy(src, dst)
    
    print("Conversion complete. TensorFlow.js model files are now in public/models/")
    print("The model files include model.json and several bin files.")

if __name__ == "__main__":
    main() 