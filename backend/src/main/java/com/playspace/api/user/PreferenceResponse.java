package com.playspace.api.user;

import com.playspace.api.court.Modality;
import java.util.Set;

public record PreferenceResponse(
        String theme,
        boolean notificationsEnabled,
        int reservationReminderHours,
        boolean emailNotifications,
        boolean browserNotifications,
        String defaultCity,
        Set<Modality> favoriteModalities,
        String preferredTimes,
        boolean privateProfile,
        boolean discoverableByPartners,
        String language
) {
}
