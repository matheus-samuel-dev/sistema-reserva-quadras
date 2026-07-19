package com.playspace.api.partner;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SportsProfileRepository extends JpaRepository<SportsProfile, Long> {
    Optional<SportsProfile> findByUserId(Long userId);
    boolean existsByUserId(Long userId);

    @Query("""
            select distinct p from SportsProfile p
            left join p.modalities m
            where p.discoverable = true
              and p.user.active = true
              and p.user.id <> :viewerId
              and (:name is null or lower(p.user.name) like lower(concat('%', :name, '%')))
              and (:city is null or lower(p.city) like lower(concat('%', :city, '%')))
              and (:modality is null or m.modality = :modality)
              and (:level is null or m.level = :level)
              and (:objective is null or p.objective = :objective)
            """)
    Page<SportsProfile> search(
            @Param("viewerId") Long viewerId,
            @Param("name") String name,
            @Param("city") String city,
            @Param("modality") String modality,
            @Param("level") SportsLevel level,
            @Param("objective") PartnerObjective objective,
            Pageable pageable
    );
}
