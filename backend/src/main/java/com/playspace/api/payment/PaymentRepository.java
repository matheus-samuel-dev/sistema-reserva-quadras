package com.playspace.api.payment;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByReservationClientIdOrderByCreatedAtDesc(Long clientId);
    List<Payment> findByReservationId(Long reservationId);
    List<Payment> findByReservationIdAndStatusIn(Long reservationId, Collection<PaymentStatus> statuses);
    long countByStatus(PaymentStatus status);
    boolean existsByReservationIdAndStatus(Long reservationId, PaymentStatus status);
}
