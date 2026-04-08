package com.smartcampus.dto.ticket;

import com.smartcampus.enums.TicketStatus;

public class UpdateStatusRequest {

    private TicketStatus status;
    private String resolutionNotes;
    private String rejectionReason;

    public TicketStatus getStatus() { return status; }
    public void setStatus(TicketStatus status) { this.status = status; }
    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
}

