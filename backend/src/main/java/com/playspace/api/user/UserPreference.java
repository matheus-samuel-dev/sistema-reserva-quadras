package com.playspace.api.user;

import com.playspace.api.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "user_preferences", uniqueConstraints = @UniqueConstraint(name = "uk_user_preferences_user", columnNames = "user_id"))
public class UserPreference extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Column(nullable = false, length = 20)
    private String theme = "SYSTEM";
    @Column(nullable = false)
    private boolean notificationsEnabled = true;
    @Column(nullable = false)
    private int reservationReminderHours = 2;
    @Column(nullable = false)
    private boolean emailNotifications = true;
    @Column(nullable = false)
    private boolean browserNotifications = true;
    @Column(length = 120)
    private String defaultCity;
    @Column(length = 500)
    private String favoriteModalities;
    @Column(length = 1000)
    private String preferredTimes;
    @Column(nullable = false)
    private boolean privateProfile;
    @Column(nullable = false)
    private boolean discoverableByPartners = true;
    @Column(nullable = false, length = 10)
    private String language = "pt-BR";

    public Long getId() { return id; }
    public AppUser getUser() { return user; }
    public void setUser(AppUser user) { this.user = user; }
    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }
    public boolean isNotificationsEnabled() { return notificationsEnabled; }
    public void setNotificationsEnabled(boolean notificationsEnabled) { this.notificationsEnabled = notificationsEnabled; }
    public int getReservationReminderHours() { return reservationReminderHours; }
    public void setReservationReminderHours(int reservationReminderHours) { this.reservationReminderHours = reservationReminderHours; }
    public boolean isEmailNotifications() { return emailNotifications; }
    public void setEmailNotifications(boolean emailNotifications) { this.emailNotifications = emailNotifications; }
    public boolean isBrowserNotifications() { return browserNotifications; }
    public void setBrowserNotifications(boolean browserNotifications) { this.browserNotifications = browserNotifications; }
    public String getDefaultCity() { return defaultCity; }
    public void setDefaultCity(String defaultCity) { this.defaultCity = defaultCity; }
    public String getFavoriteModalities() { return favoriteModalities; }
    public void setFavoriteModalities(String favoriteModalities) { this.favoriteModalities = favoriteModalities; }
    public String getPreferredTimes() { return preferredTimes; }
    public void setPreferredTimes(String preferredTimes) { this.preferredTimes = preferredTimes; }
    public boolean isPrivateProfile() { return privateProfile; }
    public void setPrivateProfile(boolean privateProfile) { this.privateProfile = privateProfile; }
    public boolean isDiscoverableByPartners() { return discoverableByPartners; }
    public void setDiscoverableByPartners(boolean discoverableByPartners) { this.discoverableByPartners = discoverableByPartners; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
}
