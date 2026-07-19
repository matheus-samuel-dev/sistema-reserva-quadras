package com.playspace.api.reservation;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    Optional<Reservation> findByCode(String code);

    List<Reservation> findByClientIdOrderByDateDescStartTimeDesc(Long clientId);

    List<Reservation> findByDateBetweenOrderByDateAscStartTimeAsc(LocalDate start, LocalDate end);

    List<Reservation> findByDateBetweenAndStatusInOrderByDateAscStartTimeAsc(
            LocalDate start,
            LocalDate end,
            Collection<ReservationStatus> statuses
    );

    long countByDateAndStatusNot(LocalDate date, ReservationStatus status);

    long countByStatus(ReservationStatus status);

    List<Reservation> findByStatusIn(Collection<ReservationStatus> statuses);

    boolean existsByCourtIdAndDateAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
            Long courtId,
            LocalDate date,
            Collection<ReservationStatus> statuses,
            LocalTime endTime,
            LocalTime startTime
    );

    @Query("""
            select case when count(r) > 0 then true else false end
            from Reservation r
            where r.court.id = :courtId
              and r.date = :date
              and r.status in :statuses
              and r.startTime < :endTime
              and r.endTime > :startTime
              and r.id <> :excludedId
            """)
    boolean existsConflictExcluding(
            @Param("courtId") Long courtId,
            @Param("date") LocalDate date,
            @Param("statuses") Collection<ReservationStatus> statuses,
            @Param("endTime") LocalTime endTime,
            @Param("startTime") LocalTime startTime,
            @Param("excludedId") Long excludedId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Reservation r where r.id = :id")
    Optional<Reservation> findByIdForUpdate(@Param("id") Long id);

    @Query("""
            select r from Reservation r
            where (:status is null or r.status = :status)
              and (:date is null or r.date = :date)
              and (:courtId is null or r.court.id = :courtId)
              and (:modality is null or r.modality = :modality)
              and (
                :search is null or lower(r.code) like lower(concat('%', :search, '%'))
                or lower(r.client.name) like lower(concat('%', :search, '%'))
                or lower(r.court.name) like lower(concat('%', :search, '%'))
              )
            order by r.date desc, r.startTime desc
            """)
    List<Reservation> search(String search, ReservationStatus status, LocalDate date, Long courtId, String modality);

    @Query("select coalesce(sum(r.totalValue), 0) from Reservation r where r.status in :statuses and r.date between :start and :end")
    java.math.BigDecimal sumRevenue(LocalDate start, LocalDate end, Collection<ReservationStatus> statuses);

    @Query("""
            select r.modality, count(r)
            from Reservation r
            where r.status <> com.playspace.api.reservation.ReservationStatus.CANCELADA
            group by r.modality
            order by count(r) desc, r.modality asc
            """)
    List<Object[]> countReservationsByModality();
}
