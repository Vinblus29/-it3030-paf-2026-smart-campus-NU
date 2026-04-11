package com.smartcampus.repository;

import com.smartcampus.model.PortalTerms;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PortalTermsRepository extends JpaRepository<PortalTerms, Long> {
}
