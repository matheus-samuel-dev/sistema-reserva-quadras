package com.playspace.api.user;

import com.playspace.api.court.Modality;
import com.playspace.api.reservation.Reservation;
import com.playspace.api.reservation.ReservationStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public record ReservationHistoryResponse(
        Long id,
        String code,
        String court,
        Modality modality,
        LocalDate date,
        LocalTime startTime,
        LocalTime endTime,
        ReservationStatus status,
        BigDecimal totalValue
) {
    public static ReservationHistoryResponse from(Reservation reservation) {
        return new ReservationHistoryResponse(
                reservation.getId(), reservation.getCode(), reservation.getCourt().getName(), reservation.getModality(),
                reservation.getDate(), reservation.getStartTime(), reservation.getEndTime(), reservation.getStatus(),
                reservation.getTotalValue()
        );
    }
}
