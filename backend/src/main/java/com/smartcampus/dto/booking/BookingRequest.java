package com.smartcampus.dto.booking;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class BookingRequest {
    
    @NotNull(message = "Facility ID is required")
    private Long facilityId;

    @NotNull(message = "Start time is required")
    private LocalDateTime startTime;

    @NotNull(message = "End time is required")
    private LocalDateTime endTime;

    @NotBlank(message = "Purpose is required")
    private String purpose;

    private int numberOfPeople = 1;

    private String attachmentUrl;

    private String recurrenceType = "ONCE"; // ONCE, DAILY, WEEKLY, MONTHLY
    private LocalDateTime recurringUntil;
    private boolean joinWaitlist = false;

    // Getters and Setters
    public Long getFacilityId() {
        return facilityId;
    }

    public void setFacilityId(Long facilityId) {
        this.facilityId = facilityId;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public int getNumberOfPeople() {
        return numberOfPeople;
    }

    public void setNumberOfPeople(int numberOfPeople) {
        this.numberOfPeople = numberOfPeople;
    }

    public String getAttachmentUrl() {
        return attachmentUrl;
    }

    public void setAttachmentUrl(String attachmentUrl) {
        this.attachmentUrl = attachmentUrl;
    }

    public String getRecurrenceType() {
        return recurrenceType;
    }

    public void setRecurrenceType(String recurrenceType) {
        this.recurrenceType = recurrenceType;
    }

    public LocalDateTime getRecurringUntil() {
        return recurringUntil;
    }

    public void setRecurringUntil(LocalDateTime recurringUntil) {
        this.recurringUntil = recurringUntil;
    }

    public boolean isJoinWaitlist() {
        return joinWaitlist;
    }

    public void setJoinWaitlist(boolean joinWaitlist) {
        this.joinWaitlist = joinWaitlist;
    }
}

