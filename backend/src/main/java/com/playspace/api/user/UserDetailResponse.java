package com.playspace.api.user;

import java.math.BigDecimal;

public record UserDetailResponse(
        UserResponse user,
        long reservations,
        long payments,
        BigDecimal totalPaid,
        long championshipRegistrations
) {
}
