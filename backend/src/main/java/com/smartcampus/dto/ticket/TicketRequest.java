package com.smartcampus.dto.ticket;

import com.smartcampus.enums.Priority;
import com.smartcampus.enums.TicketCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class TicketRequest {
    
    private String title;
    private String description;
    private String location;
    private String reportedBy;
    private Priority priority;
    private TicketCategory category;
    private List<String> imageAttachments;

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

}

