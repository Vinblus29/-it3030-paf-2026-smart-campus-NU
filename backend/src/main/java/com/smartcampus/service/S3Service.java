package com.smartcampus.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.IOException;
import java.util.UUID;

@Service
public class S3Service {

    private final S3Client s3Client;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    @Value("${aws.region}")
    private String region;

    public S3Service(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    public String uploadFile(MultipartFile file) {
        String fileName = generateFileName(file.getOriginalFilename());
        
        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileName)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            
            return getFileUrl(fileName);
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file", e);
        }
    }

    public String uploadFile(byte[] fileBytes, String fileName, String contentType) {
        String uniqueFileName = generateFileName(fileName);
        
        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(uniqueFileName)
                    .contentType(contentType)
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(fileBytes));
            
            return getFileUrl(uniqueFileName);
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload file", e);
        }
    }

    public void deleteFile(String fileUrl) {
        String fileName = extractFileName(fileUrl);
        
        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileName)
                    .build();

            s3Client.deleteObject(deleteObjectRequest);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete file", e);
        }
    }

    public byte[] downloadFile(String fileUrl) {
        String fileName = extractFileName(fileUrl);
        
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileName)
                    .build();

            return s3Client.getObject(getObjectRequest).readAllBytes();
        } catch (Exception e) {
            throw new RuntimeException("Failed to download file", e);
        }
    }

    private String generateFileName(String originalFileName) {
        String extension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }
        return "uploads/" + UUID.randomUUID().toString() + extension;
    }

    private String extractFileName(String fileUrl) {
        if (fileUrl.contains(".amazonaws.com/")) {
            return fileUrl.substring(fileUrl.indexOf(".amazonaws.com/") + 14);
        }
        return fileUrl;
    }

    private String getFileUrl(String fileName) {
        return String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, fileName);
    }
}

