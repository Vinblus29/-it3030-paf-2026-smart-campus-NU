package com.smartcampus.dto.facility;

import java.time.LocalDateTime;

public class BlackoutPeriodDTO {
    private Long id;
    private Long facilityId;
    private String facilityName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String reason;
    private LocalDateTime createdAt;

    public BlackoutPeriodDTO() {}

    public BlackoutPeriodDTO(Long id, Long facilityId, String facilityName, 
                             LocalDateTime startTime, LocalDateTime endTime, 
                             String reason, LocalDateTime createdAt) {
        this.id = id;
        this.facilityId = facilityId;
        this.facilityName = facilityName;
        this.startTime = startTime;
        this.endTime = endTime;
        this.reason = reason;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getFacilityId() { return facilityId; }
    public void setFacilityId(Long facilityId) { this.facilityId = facilityId; }

    public String getFacilityName() { return facilityName; }
    public void setFacilityName(String facilityName) { this.facilityName = facilityName; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}