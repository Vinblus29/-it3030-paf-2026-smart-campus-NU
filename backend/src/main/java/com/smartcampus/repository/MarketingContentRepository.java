package com.smartcampus.repository;

import com.smartcampus.model.MarketingContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MarketingContentRepository extends JpaRepository<MarketingContent, Long> {
    List<MarketingContent> findByTypeAndActiveTrueOrderByDisplayOrderAsc(String type);
    List<MarketingContent> findByActiveTrueOrderByDisplayOrderAsc();
}