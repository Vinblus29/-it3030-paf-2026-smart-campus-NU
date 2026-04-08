package com.smartcampus.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

import java.net.URI;

@Configuration
public class S3Config {

    @Value("${aws.access.key}")
    private String accessKey;

    @Value("${aws.secret.key}")
    private String secretKey;

    @Value("${aws.region}")
    private String region;

    @Bean
    public S3Client s3Client() {
        // FORCING HARDCODED KEYS AS PER USER REQUEST - SECURITY WARNING: This is not production-ready
        String haccessKey = "AKIA2MCFRZZL6S4O7TUK";
        String hsecretKey = "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";
        String hregion = "eu-north-1";
        
        System.out.println("S3 FORCED: Using Hardcoded Credentials for Region [" + hregion + "]");
        
        AwsBasicCredentials awsCredentials = AwsBasicCredentials.create(haccessKey, hsecretKey);
        
        return S3Client.builder()
                .region(Region.of(hregion))
                .credentialsProvider(StaticCredentialsProvider.create(awsCredentials))
                .crossRegionAccessEnabled(true)
                .build();
    }
}
