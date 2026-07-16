package com.playspace.api.notification;

import com.playspace.api.common.NotFoundException;
import com.playspace.api.security.CurrentUserService;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationRepository notifications;
    private final CurrentUserService currentUser;

    public NotificationController(NotificationRepository notifications, CurrentUserService currentUser) {
        this.notifications = notifications;
        this.currentUser = currentUser;
    }

    @GetMapping
    List<Notification> list() {
        return notifications.findByUserIdOrderByCreatedAtDesc(currentUser.user().getId());
    }

    @GetMapping("/unread-count")
    long unreadCount() {
        return notifications.countByUserIdAndReadFalse(currentUser.user().getId());
    }

    @PutMapping("/{id}/read")
    Notification markRead(@PathVariable Long id) {
        var notification = notifications.findByIdAndUserId(id, currentUser.user().getId())
                .orElseThrow(() -> new NotFoundException("Notificação não encontrada."));
        notification.setRead(true);
        return notifications.save(notification);
    }

    @DeleteMapping
    void clear() {
        notifications.findByUserIdOrderByCreatedAtDesc(currentUser.user().getId()).forEach(notifications::delete);
    }
}
