package com.playspace.api.championship;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChampionshipEnrollmentRepository extends JpaRepository<ChampionshipEnrollment, Long> {
    long countByChampionshipIdAndStatus(Long championshipId, EnrollmentStatus status);
    Optional<ChampionshipEnrollment> findByChampionshipIdAndPlayerId(Long championshipId, Long playerId);
    boolean existsByChampionshipIdAndPlayerIdAndStatus(Long championshipId, Long playerId, EnrollmentStatus status);

    @EntityGraph(attributePaths = {"player", "championship", "championship.court"})
    Page<ChampionshipEnrollment> findByChampionshipIdAndStatus(
            Long championshipId, EnrollmentStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"player", "championship", "championship.court"})
    Page<ChampionshipEnrollment> findByPlayerIdOrderByCreatedAtDesc(Long playerId, Pageable pageable);
}
