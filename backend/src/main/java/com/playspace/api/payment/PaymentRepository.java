package com.playspace.api.payment;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByReservationClientIdOrderByCreatedAtDesc(Long clientId);
    long countByStatus(PaymentStatus status);
}
