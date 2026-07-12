package com.playspace.api.reservation;

import java.time.LocalDate;
import java.time.LocalTime;

public record ReservationAvailability(
        Long id,
        Long courtId,
        LocalDate date,
        LocalTime startTime,
        LocalTime endTime,
        ReservationStatus status
) {
    static ReservationAvailability from(Reservation reservation) {
        return new ReservationAvailability(
                reservation.getId(),
                reservation.getCourt().getId(),
                reservation.getDate(),
                reservation.getStartTime(),
                reservation.getEndTime(),
                reservation.getStatus()
        );
    }
}
