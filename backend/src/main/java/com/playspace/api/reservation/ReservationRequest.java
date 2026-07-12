package com.playspace.api.reservation;

import com.playspace.api.payment.PaymentMethod;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;

public record ReservationRequest(
        @Positive Long clientId,
        @NotNull @Positive Long courtId,
        @NotNull @FutureOrPresent LocalDate date,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        @Min(1) int players,
        PaymentMethod paymentMethod,
        @Size(max = 1000) String notes
) {
}
