package com.playspace.api.user;

import java.util.Set;

public record PreferenceResponse(
        String theme,
        boolean notificationsEnabled,
        int reservationReminderHours,
        boolean emailNotifications,
        boolean browserNotifications,
        String defaultCity,
        Set<String> favoriteModalities,
        String preferredTimes,
        boolean privateProfile,
        boolean discoverableByPartners,
        String language
) {
}
