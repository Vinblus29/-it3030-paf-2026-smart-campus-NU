package com.smartcampus.dto.notification;

public class FcmTokenRequest {
    private String fcmToken;

    public FcmTokenRequest() {}

    public FcmTokenRequest(String fcmToken) {
        this.fcmToken = fcmToken;
    }

    public String getFcmToken() {
        return fcmToken;
    }

    public void setFcmToken(String fcmToken) {
        this.fcmToken = fcmToken;
    }
}
