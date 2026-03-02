package com.smartcampus.repository;

import com.smartcampus.model.Facility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FacilityRepository extends JpaRepository<Facility, Long> {
    
    List<Facility> findByType(String type);
    
    List<Facility> findByAvailableTrue();
    
    List<Facility> findByLocation(String location);
}

