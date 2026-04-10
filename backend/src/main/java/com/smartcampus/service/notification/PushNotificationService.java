package com.smartcampus.service.notification;

import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsSessionCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * PushNotificationService
 *
 * Handles:
 *  1. Registering an FCM token as an AWS SNS platform endpoint (GCM/smartuni)
 *  2. Sending push notifications to a single user
 *  3. Broadcasting to all users who have registered endpoints
 */
@Service
public class PushNotificationService {

    private static final Logger log = Logger.getLogger(PushNotificationService.class.getName());

    private final SnsClient snsClient;
    private final UserRepository userRepository;
    private final String platformAppArn;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PushNotificationService(
            @Value("${aws.access.key}") String accessKey,
            @Value("${aws.secret.key}") String secretKey,
            @Value("${aws.session.token:}") String sessionToken,
            @Value("${aws.region}") String region,
            @Value("${aws.sns.platform.arn}") String platformAppArn,
            UserRepository userRepository) {
        System.out.println("🚨 PUSH DEBUG Backend: AWS config - region:" + region + ", platformARN:" + platformAppArn + ", sessionToken present:" + (!sessionToken.isBlank()));
        System.out.println("🚨 PUSH DEBUG Backend: AWS accessKey starts with: " + accessKey.substring(0, Math.min(8, accessKey.length())) + "...");

        StaticCredentialsProvider credentialsProvider;
        if (sessionToken != null && !sessionToken.isBlank()) {
            credentialsProvider = StaticCredentialsProvider.create(
                    AwsSessionCredentials.create(accessKey, secretKey, sessionToken));
        } else {
            credentialsProvider = StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(accessKey, secretKey));
        }

        this.snsClient = SnsClient.builder()
                .region(Region.of(region))
                .credentialsProvider(credentialsProvider)
                .build();
        this.userRepository = userRepository;
        this.platformAppArn = platformAppArn;
    }

    /**
     * Register or update an FCM token as an SNS platform endpoint for the given user.
     */
    @Transactional
    public String registerEndpoint(User user, String fcmToken) {
        System.out.println("🚨 PUSH DEBUG Backend registerEndpoint called for user: " + user.getEmail() + ", fcmToken length: " + fcmToken.length());
        try {
            log.info("Request to register FCM token for user: " + user.getEmail());
            
            String endpointArn = user.getSnsEndpointArn();
            System.out.println("🚨 PUSH DEBUG Backend existing endpointArn: " + endpointArn + ", stored fcmToken length: " + (user.getFcmToken() != null ? user.getFcmToken().length() : 0));
            boolean needsCreation = true;

            if (endpointArn != null && !endpointArn.isBlank()) {
                try {
                    System.out.println("🚨 PUSH DEBUG Backend checking existing endpoint attributes...");
                    GetEndpointAttributesResponse attrs = snsClient.getEndpointAttributes(
                            GetEndpointAttributesRequest.builder().endpointArn(endpointArn).build());
                    System.out.println("🚨 PUSH DEBUG Backend existing endpoint Token: " + attrs.attributes().get("Token") + ", Enabled: " + attrs.attributes().get("Enabled"));
                    
                    // If token has changed, update SNS
                    if (!fcmToken.equals(attrs.attributes().get("Token"))) {
                        snsClient.setEndpointAttributes(SetEndpointAttributesRequest.builder()
                                .endpointArn(endpointArn)
                                .attributes(Map.of("Token", fcmToken, "Enabled", "true"))
                                .build());
                    }
                    needsCreation = false;
                } catch (Exception e) {
                    log.info("Endpoint ARN invalid or expired, will recreate: " + e.getMessage());
                }
            }

            if (needsCreation) {
                System.out.println("🚨 PUSH DEBUG Backend CREATING NEW SNS endpoint with platformARN: " + platformAppArn);
                log.info("Creating new SNS endpoint for user " + user.getEmail() + " using platform ARN: " + platformAppArn);
                CreatePlatformEndpointResponse response = snsClient.createPlatformEndpoint(
                        CreatePlatformEndpointRequest.builder()
                                .platformApplicationArn(platformAppArn)
                                .token(fcmToken)
                                .build());
                endpointArn = response.endpointArn();
                System.out.println("🚨 PUSH DEBUG Backend NEW endpointArn created: " + endpointArn);
            }

            // Save to database
            User dbUser = userRepository.findById(user.getId()).orElse(user);
            dbUser.setFcmToken(fcmToken);
            dbUser.setSnsEndpointArn(endpointArn);
            User savedUser = userRepository.save(dbUser);
            System.out.println("🚨 PUSH DEBUG Backend DB saved - new fcmToken length: " + savedUser.getFcmToken().length() + ", endpointArn: " + savedUser.getSnsEndpointArn());

            log.info("Successfully registered push endpoint for " + user.getEmail() + ": " + endpointArn);
            return endpointArn;

        } catch (Exception e) {
            System.out.println("🚨 PUSH DEBUG Backend registerEndpoint FULL EXCEPTION: " + e.getClass().getSimpleName() + ": " + e.getMessage());
            e.printStackTrace();
            log.warning("Failed to register SNS endpoint for " + user.getEmail() + ": " + e.getMessage());
            throw new RuntimeException("Push registration failed: " + e.getMessage(), e);
        }
    }

    public void sendToUser(User user, String title, String body) {
        String endpointArn = user.getSnsEndpointArn();
        if (endpointArn == null || endpointArn.isBlank()) {
            log.info("No SNS endpoint for user " + user.getEmail() + " — skipping push.");
            return;
        }
        sendToEndpoint(endpointArn, title, body);
    }

    public void broadcastToAll(String title, String body) {
        userRepository.findAll().stream()
                .filter(u -> u.getSnsEndpointArn() != null && !u.getSnsEndpointArn().isBlank())
                .forEach(u -> sendToEndpoint(u.getSnsEndpointArn(), title, body));
    }

    public void broadcastToRole(String role, String title, String body) {
        userRepository.findAll().stream()
                .filter(u -> role.equalsIgnoreCase(u.getRole().name()))
                .filter(u -> u.getSnsEndpointArn() != null && !u.getSnsEndpointArn().isBlank())
                .forEach(u -> sendToEndpoint(u.getSnsEndpointArn(), title, body));
    }

    private void sendToEndpoint(String endpointArn, String title, String body) {
        try {
            // AUTO-FIX: Ensure endpoint enabled before publish (fixes "Endpoint is disabled")
            System.out.println("🚨 PUSH DEBUG sendToEndpoint: Checking endpoint " + endpointArn + " enabled status...");
            GetEndpointAttributesRequest attrReq = GetEndpointAttributesRequest.builder().endpointArn(endpointArn).build();
            GetEndpointAttributesResponse attrs = snsClient.getEndpointAttributes(attrReq);
            String enabled = attrs.attributes().get("Enabled");
            
            if (!"true".equals(enabled)) {
                System.out.println("🚨 PUSH DEBUG RE-ENABLE endpoint " + endpointArn);
                snsClient.setEndpointAttributes(SetEndpointAttributesRequest.builder()
                    .endpointArn(endpointArn)
                    .attributes(Map.of("Enabled", "true"))
                    .build());
                System.out.println("✅ Endpoint re-enabled");
            }
            
            log.info("TRACING PUSH: Target=" + endpointArn + " | Title=" + title + " | Body=" + body);

            Map<String, Object> notification = new HashMap<>();
            notification.put("title", title);
            notification.put("body", body);
            notification.put("sound", "default");
            notification.put("priority", "high");
            notification.put("badge", "/favicon.ico");

            Map<String, Object> data = new HashMap<>();
            data.put("title", title);
            data.put("body", body);
            data.put("type", "CHAT");
            data.put("timestamp", String.valueOf(System.currentTimeMillis()));

            Map<String, Object> gcmMap = new HashMap<>();
            gcmMap.put("notification", notification);
            gcmMap.put("data", data);
            gcmMap.put("priority", "high");
            gcmMap.put("content_available", true); 
            
            String gcmPayload = objectMapper.writeValueAsString(gcmMap);
            log.info("DEBUG: Sending GCM Payload: " + gcmPayload);

            Map<String, String> snsMap = new HashMap<>();
            snsMap.put("default", body);
            snsMap.put("GCM", gcmPayload);
            String snsMessage = objectMapper.writeValueAsString(snsMap);

            log.info("Publishing to SNS: " + endpointArn);
            snsClient.publish(PublishRequest.builder()
                    .targetArn(endpointArn)
                    .message(snsMessage)
                    .messageStructure("json")
                    .build());
            log.info("Push SUCCESS to: " + endpointArn);
        } catch (Exception e) {
            log.warning("Push FAILURE to " + endpointArn + ": " + e.getMessage());
        }
    }
}
