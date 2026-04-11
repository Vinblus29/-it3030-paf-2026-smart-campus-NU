package com.smartcampus.dto;

public class PortalTermsRequest {
    private String terms;

    public PortalTermsRequest() {
    }

    public PortalTermsRequest(String terms) {
        this.terms = terms;
    }

    public String getTerms() {
        return terms;
    }

    public void setTerms(String terms) {
        this.terms = terms;
    }
}
