package com.playspace.api.user;

import com.playspace.api.court.Modality;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Set;

/** DTO publico de usuario; nunca expoe credenciais ou relacionamentos JPA. */
public record UserResponse(
        Long id,
        String name,
        String email,
        Role role,
        boolean active,
        String phone,
        String city,
        String avatarUrl,
        String bio,
        String sportsLevel,
        Modality favoriteModality,
        Set<String> practicedSports,
        String availability,
        LocalDate memberSince,
        int reservationsDone,
        int matchesPlayed,
        double hoursOnCourt,
        double attendanceRate,
        Set<String> achievements,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static UserResponse from(AppUser user) {
        return new UserResponse(
                user.getId(), user.getName(), user.getEmail(), user.getRole(), user.isActive(),
                user.getPhone(), user.getCity(), user.getAvatarUrl(), user.getBio(), user.getSportsLevel(),
                user.getFavoriteModality(), Set.copyOf(user.getPracticedSports()), user.getAvailability(),
                user.getMemberSince(), user.getReservationsDone(), user.getMatchesPlayed(), user.getHoursOnCourt(),
                user.getAttendanceRate(), Set.copyOf(user.getAchievements()), user.getCreatedAt(), user.getUpdatedAt()
        );
    }
}
