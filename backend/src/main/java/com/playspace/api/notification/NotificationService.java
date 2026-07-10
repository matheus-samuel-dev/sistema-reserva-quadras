package com.playspace.api.notification;

import com.playspace.api.user.AppUser;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
    private final NotificationRepository notifications;

    public NotificationService(NotificationRepository notifications) {
        this.notifications = notifications;
    }

    public Notification create(AppUser user, String title, String message, String type) {
        var notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        return notifications.save(notification);
    }
}
