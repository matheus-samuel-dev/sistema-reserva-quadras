package com.playspace.api.payment;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByReservationClientIdOrderByCreatedAtDesc(Long clientId);
    List<Payment> findByReservationId(Long reservationId);
    List<Payment> findByReservationIdAndStatusIn(Long reservationId, Collection<PaymentStatus> statuses);
    long countByStatus(PaymentStatus status);
    boolean existsByReservationIdAndStatus(Long reservationId, PaymentStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Payment p where p.id = :id")
    Optional<Payment> findByIdForUpdate(@Param("id") Long id);
}
