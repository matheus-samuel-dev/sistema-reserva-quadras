package com.playspace.api.community;


public record RankingResponse(
        Long id,
        String name,
        String city,
        String favoriteModality,
        long reservations,
        double hours,
        double attendanceRate,
        long points,
        long achievements
) {
}
