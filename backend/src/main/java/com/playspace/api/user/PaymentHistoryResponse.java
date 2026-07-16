package com.playspace.api.user;

import com.playspace.api.payment.Payment;
import com.playspace.api.payment.PaymentMethod;
import com.playspace.api.payment.PaymentStatus;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record PaymentHistoryResponse(
        Long id,
        String reservationCode,
        PaymentMethod method,
        PaymentStatus status,
        BigDecimal amount,
        String transactionCode,
        OffsetDateTime paidAt
) {
    public static PaymentHistoryResponse from(Payment payment) {
        return new PaymentHistoryResponse(
                payment.getId(), payment.getReservation().getCode(), payment.getMethod(), payment.getStatus(),
                payment.getAmount(), payment.getTransactionCode(), payment.getPaidAt()
        );
    }
}
