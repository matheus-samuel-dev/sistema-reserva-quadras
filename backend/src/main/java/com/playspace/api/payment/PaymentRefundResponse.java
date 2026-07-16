package com.playspace.api.payment;

import com.playspace.api.reservation.ReservationStatus;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record PaymentRefundResponse(
        Long paymentId,
        Long reservationId,
        String reservationCode,
        ReservationStatus reservationStatus,
        PaymentMethod method,
        PaymentStatus status,
        BigDecimal amount,
        String transactionCode,
        OffsetDateTime paidAt,
        OffsetDateTime refundedAt
) {
    static PaymentRefundResponse from(Payment payment) {
        var reservation = payment.getReservation();
        return new PaymentRefundResponse(
                payment.getId(),
                reservation.getId(),
                reservation.getCode(),
                reservation.getStatus(),
                payment.getMethod(),
                payment.getStatus(),
                payment.getAmount(),
                payment.getTransactionCode(),
                payment.getPaidAt(),
                payment.getRefundedAt()
        );
    }
}
