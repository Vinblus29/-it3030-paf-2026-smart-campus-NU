package com.smartcampus.controller;

import com.smartcampus.dto.PortalTermsRequest;
import com.smartcampus.model.PortalTerms;
import com.smartcampus.repository.PortalTermsRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/portal-terms")
public class PortalTermsController {

    private final PortalTermsRepository portalTermsRepository;

    public PortalTermsController(PortalTermsRepository portalTermsRepository) {
        this.portalTermsRepository = portalTermsRepository;
    }

    @GetMapping
    public ResponseEntity<Map<String, String>> getPortalTerms() {
        PortalTerms terms = portalTermsRepository.findById(1L).orElse(null);
        if (terms == null) {
            String defaultTerms = """
                SMART CAMPUS PORTAL TERMS OF USE
                Last Updated: April 11, 2026
                
                ACCEPTANCE OF TERMS
                
                By accessing and using the Smart Campus Portal ("Portal"), you agree to be bound by these Terms of Use and our Privacy Policy. If you do not agree to these terms, please do not use this Portal.
                
                1. USE OF THE PORTAL
                
                The Smart Campus Portal is provided exclusively for university students, faculty, and staff for educational and administrative purposes. You agree to use the Portal only for its intended purpose and in accordance with university policies.
                
                2. USER ACCOUNTS
                
                - You are responsible for maintaining the confidentiality of your account credentials
                - You must notify us immediately of any unauthorized access or security breaches
                - You are responsible for all activities that occur under your account
                - Account sharing or transfer is strictly prohibited
                
                3. ACCEPTABLE USE
                
                You agree NOT to:
                - Use the Portal for any illegal or unauthorized purpose
                - Attempt to gain unauthorized access to any part of the Portal
                - Interfere with or disrupt the Portal's operation
                - Upload or transmit viruses, malware, or harmful code
                - Harass, abuse, or harm other users
                - Post or share inappropriate, offensive, or illegal content
                
                4. PRIVACY AND DATA SECURITY
                
                - Your personal information will be handled in accordance with our Privacy Policy
                - We collect data necessary for Portal functionality and improvement
                - You consent to the collection and use of your data as described
                - You have the right to access and request deletion of your data
                
                5. INTELLECTUAL PROPERTY
                
                - All content on this Portal is protected by copyright and other intellectual property rights
                - You may not reproduce, distribute, or modify any content without prior written consent
                - University logos and trademarks are proprietary and may not be used without authorization
                
                6. THIRD-PARTY SERVICES
                
                - The Portal may contain links to third-party websites or services
                - We are not responsible for the content or practices of third-party sites
                - Your interactions with third-party services are governed by their terms
                
                7. LIMITATION OF LIABILITY
                
                - The Portal is provided "AS IS" without warranties of any kind
                - We do not guarantee the Portal will be error-free or uninterrupted
                - We are not liable for any damages arising from your use of the Portal
                
                8. TERMINATION
                
                - We reserve the right to suspend or terminate your account for violations
                - You may discontinue using the Portal at any time
                - Upon termination, your access to the Portal will be revoked
                
                9. INDEMNIFICATION
                
                You agree to indemnify and hold harmless the university and its affiliates from any claims arising from your use of the Portal or your violation of these Terms.
                
                10. CHANGES TO THESE TERMS
                
                We reserve the right to modify these Terms at any time. Continued use of the Portal after changes constitutes acceptance of the modified Terms.
                
                11. GOVERNING LAW
                
                These Terms shall be governed by and construed in accordance with applicable university policies and relevant laws.
                
                12. CONTACT INFORMATION
                
                If you have questions about these Terms, please contact the IT Department or email support@smartcampus.edu.
                """;
            portalTermsRepository.save(new PortalTerms(defaultTerms));
            return ResponseEntity.ok(Map.of("terms", defaultTerms));
        }
        return ResponseEntity.ok(Map.of("terms", terms.getTerms()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> savePortalTerms(@RequestBody PortalTermsRequest request) {
        PortalTerms terms = portalTermsRepository.findById(1L).orElse(new PortalTerms());
        terms.setTerms(request.getTerms());
        terms.setUpdatedAt(java.time.LocalDateTime.now());
        portalTermsRepository.save(terms);
        return ResponseEntity.ok(Map.of("terms", terms.getTerms()));
    }
}