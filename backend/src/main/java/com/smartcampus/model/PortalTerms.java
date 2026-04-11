package com.smartcampus.model;

import jakarta.persistence.*;

@Entity
@Table(name = "portal_terms")
public class PortalTerms {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String terms;
    
    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;

    public PortalTerms() {
    }

    public PortalTerms(String terms) {
        this.terms = terms;
        this.updatedAt = java.time.LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTerms() {
        return terms;
    }

    public void setTerms(String terms) {
        this.terms = terms;
    }

    public java.time.LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(java.time.LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
