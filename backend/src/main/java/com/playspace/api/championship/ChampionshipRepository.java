package com.playspace.api.championship;

import com.playspace.api.court.Modality;
import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository("tournamentChampionshipRepository")
public interface ChampionshipRepository extends JpaRepository<ChampionshipEvent, Long> {
    @Query("""
            select c from ChampionshipEvent c
            where (:modality is null or c.modality = :modality)
              and (:status is null or c.status = :status)
              and (:city is null or lower(c.city) like lower(concat('%', :city, '%')))
              and (:fromDate is null or c.startDate >= :fromDate)
              and (:includeDraft = true or c.status <> com.playspace.api.championship.ChampionshipStatus.RASCUNHO)
            """)
    Page<ChampionshipEvent> search(
            @Param("modality") Modality modality,
            @Param("status") ChampionshipStatus status,
            @Param("city") String city,
            @Param("fromDate") LocalDate fromDate,
            @Param("includeDraft") boolean includeDraft,
            Pageable pageable
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from ChampionshipEvent c where c.id = :id")
    Optional<ChampionshipEvent> findByIdForUpdate(@Param("id") Long id);

    boolean existsByNameIgnoreCaseAndStartDate(String name, LocalDate startDate);

    boolean existsByNameIgnoreCase(String name);
}
