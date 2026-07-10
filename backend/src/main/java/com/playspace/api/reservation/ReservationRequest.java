package com.playspace.api.reservation;

import com.playspace.api.payment.PaymentMethod;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public record ReservationRequest(
        Long clientId,
        @NotNull Long courtId,
        @FutureOrPresent LocalDate date,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        @Min(1) int players,
        PaymentMethod paymentMethod,
        String notes
) {
}
