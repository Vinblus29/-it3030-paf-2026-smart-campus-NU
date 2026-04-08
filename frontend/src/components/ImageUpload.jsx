import { useState } from 'react';
import { Upload, Button, message, Progress, Image, Space, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import './ImageUpload.css';

const { Dragger } = Upload;

const ImageUpload = ({ 
  value = [], 
  onChange, 
  maxCount = 5, 
  maxSize = 5 * 1024 * 1024, // 5MB
  disabled = false 
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleBeforeUpload = (file) => {
    // Check file type
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }

    // Check file size
    if (file.size > maxSize) {
      message.error(`Image must be smaller than ${maxSize / 1024 / 1024}MB!`);
      return false;
    }

    // Check max count
    if (value.length >= maxCount) {
      message.error(`You can only upload up to ${maxCount} images!`);
      return false;
    }

    return true;
  };

  const handleUpload = async (file) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Create a preview URL for the image
      const previewUrl = URL.createObjectURL(file);
      
      // In a real implementation, you would upload to the server here
      // For now, we'll simulate with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Add the image to the list
      const newImage = {
        uid: file.uid,
        name: file.name,
        status: 'done',
        url: previewUrl,
        originFileObj: file
      };

      const newImages = [...value, newImage];
      onChange?.(newImages);

      message.success(`${file.name} uploaded successfully`);
    } catch (error) {
      message.error(`${file.name} upload failed`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }

    return false; // Prevent default upload behavior
  };

  const handleRemove = (file) => {
    const newImages = value.filter(item => item.uid !== file.uid);
    onChange?.(newImages);
    message.success('Image removed');
  };

  const handlePreview = (file) => {
    // Create preview modal
    Image.preview({
      src: file.url,
      visible: true,
    });
  };

  const uploadProps = {
    name: 'image',
    multiple: true,
    beforeUpload: handleBeforeUpload,
    customRequest: handleUpload,
    showUploadList: false,
    disabled: disabled || uploading || value.length >= maxCount,
  };

  return (
    <div className="image-upload">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Image Preview Grid */}
        {value.length > 0 && (
          <div className="image-grid">
            {value.map(file => (
              <div key={file.uid} className="image-item">
                <img 
                  src={file.url} 
                  alt={file.name}
                  className="image-preview"
                />
                <div className="image-actions">
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    size="small"
                    onClick={() => handlePreview(file)}
                    title="Preview"
                  />
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    size="small"
                    danger
                    onClick={() => handleRemove(file)}
                    title="Remove"
                    disabled={disabled}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <Progress 
            percent={uploadProgress} 
            status="active"
            format={percent => `${percent}%`}
          />
        )}

        {/* Upload Area */}
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <PlusOutlined />
          </p>
          <p className="ant-upload-text">
            {uploading ? 'Uploading...' : 'Click or drag images to upload'}
          </p>
          <p className="ant-upload-hint">
            Support for single or bulk upload. Maximum {maxCount} images, 
            each up to {maxSize / 1024 / 1024}MB.
          </p>
        </Dragger>

        {/* Upload Status */}
        <div className="upload-status">
          <Tag color="blue">
            {value.length}/{maxCount} images uploaded
          </Tag>
        </div>
      </Space>
    </div>
  );
};

export default ImageUpload;
