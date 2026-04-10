package com.smartcampus.repository;

import com.smartcampus.entity.CampusAnnouncement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CampusAnnouncementRepository extends JpaRepository<CampusAnnouncement, Long> {
    List<CampusAnnouncement> findTop5ByOrderByCreatedAtDesc();
    List<CampusAnnouncement> findAllByOrderByCreatedAtDesc();
}
