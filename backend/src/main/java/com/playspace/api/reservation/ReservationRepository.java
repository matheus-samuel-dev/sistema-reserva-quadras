package com.playspace.api.reservation;

import com.playspace.api.court.Modality;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    Optional<Reservation> findByCode(String code);

    List<Reservation> findByClientIdOrderByDateDescStartTimeDesc(Long clientId);

    List<Reservation> findByDateBetweenOrderByDateAscStartTimeAsc(LocalDate start, LocalDate end);

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
    List<Reservation> search(String search, ReservationStatus status, LocalDate date, Long courtId, Modality modality);

    @Query("select coalesce(sum(r.totalValue), 0) from Reservation r where r.status in :statuses and r.date between :start and :end")
    java.math.BigDecimal sumRevenue(LocalDate start, LocalDate end, Collection<ReservationStatus> statuses);
}
