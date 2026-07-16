package com.playspace.api.community;

import com.playspace.api.court.Modality;

public record RankingResponse(
        Long id,
        String name,
        String city,
        Modality favoriteModality,
        long reservations,
        double hours,
        double attendanceRate,
        long points,
        long achievements
) {
}
