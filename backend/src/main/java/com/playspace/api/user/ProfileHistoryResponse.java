package com.playspace.api.user;

import java.util.List;

public record ProfileHistoryResponse(
        List<ReservationHistoryResponse> reservations,
        List<PaymentHistoryResponse> payments
) {
}
