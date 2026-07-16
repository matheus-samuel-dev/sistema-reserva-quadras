package com.playspace.api.user;

import java.math.BigDecimal;

public record ProfileSummaryResponse(
        long reservations,
        long completedReservations,
        long payments,
        BigDecimal totalPaid,
        int achievements,
        double attendanceRate
) {
}
