package com.playspace.api.payment;

import jakarta.validation.constraints.NotNull;

public record PaymentRequest(
        @NotNull Long reservationId,
        @NotNull PaymentMethod method,
        boolean approve
) {
}
