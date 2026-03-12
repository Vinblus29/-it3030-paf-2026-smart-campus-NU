package com.smartcampus.dto.ticket;

import java.time.LocalDateTime;
import java.util.List;

import com.smartcampus.enums.TicketStatus;
import com.smartcampus.enums.Priority;
import com.smartcampus.enums.TicketCategory;

public class TicketResponse {
        private Long id;
    private String title;
    private String description;
    private String location;
    private String reportedBy;
    private String assignedTo;
    private TicketStatus status;
    private Priority priority;
    private TicketCategory category;
    private List<String> imageAttachments;
    private String resolutionNotes;
    private LocalDateTime createdAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getReportedBy() {
        return reportedBy;
    }

    public void setReportedBy(String reportedBy) {
        this.reportedBy = reportedBy;
    }

    public String getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(String assignedTo) {
        this.assignedTo = assignedTo;
    }

    public TicketStatus getStatus() {
        return status;
    }

    public void setStatus(TicketStatus status) {
        this.status = status;
    }

    public Priority getPriority() {
        return priority;
    }

    public void setPriority(Priority priority) {
        this.priority = priority;
    }

    public TicketCategory getCategory() {
        return category;
    }

    public void setCategory(TicketCategory category) {
        this.category = category;
    }

    public List<String> getImageAttachments() {
        return imageAttachments;
    }

    public void setImageAttachments(List<String> imageAttachments) {
        this.imageAttachments = imageAttachments;
    }

    public String getResolutionNotes() {
        return resolutionNotes;
    }

    public void setResolutionNotes(String resolutionNotes) {
        this.resolutionNotes = resolutionNotes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
