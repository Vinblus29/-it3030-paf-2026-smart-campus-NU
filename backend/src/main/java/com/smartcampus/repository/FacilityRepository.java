package com.smartcampus.repository;

import com.smartcampus.model.Facility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FacilityRepository extends JpaRepository<Facility, Long> {
    
    List<Facility> findByType(String type);
    
    List<Facility> findByAvailableTrue();
    
    List<Facility> findByLocation(String location);
    
    @Query("SELECT f FROM Facility f WHERE " +
           "LOWER(f.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(f.location) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(f.description) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(f.type) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Facility> searchFacilities(@Param("query") String query);
}

