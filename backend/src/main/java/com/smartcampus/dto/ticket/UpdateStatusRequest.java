package com.smartcampus.dto.ticket;

import com.smartcampus.enums.TicketStatus;

public class UpdateStatusRequest {

    private TicketStatus status;
    private String resolutionNotes;

    public TicketStatus getStatus() {
        return status;
    }

    public void setStatus(TicketStatus status) {
        this.status = status;
    }

    public String getResolutionNotes() {
        return resolutionNotes;
    }

    public void setResolutionNotes(String resolutionNotes) {
        this.resolutionNotes = resolutionNotes;
    }
}
