package com.smartcampus.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "booking_waitlist")
public class BookingWaitlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facility_id", nullable = false)
    private Facility facility;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private int position;

    private boolean autoPromoted = false;

    private LocalDateTime createdAt = LocalDateTime.now();

    public BookingWaitlist() {
    }

    public BookingWaitlist(User user, Facility facility, LocalDateTime startTime, LocalDateTime endTime, int position) {
        this.user = user;
        this.facility = facility;
        this.startTime = startTime;
        this.endTime = endTime;
        this.position = position;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Facility getFacility() {
        return facility;
    }

    public void setFacility(Facility facility) {
        this.facility = facility;
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

    public int getPosition() {
        return position;
    }

    public void setPosition(int position) {
        this.position = position;
    }

    public boolean isAutoPromoted() {
        return autoPromoted;
    }

    public void setAutoPromoted(boolean autoPromoted) {
        this.autoPromoted = autoPromoted;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
