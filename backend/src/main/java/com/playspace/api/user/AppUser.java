package com.playspace.api.user;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.playspace.api.common.AuditableEntity;
import com.playspace.api.court.Modality;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "users")
public class AppUser extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @Email
    @Column(nullable = false, unique = true)
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false)
    private boolean active = true;

    private String avatarUrl;
    private String bio;
    private String city;
    private LocalDate memberSince;

    @Enumerated(EnumType.STRING)
    private Modality favoriteModality;

    private String sportsLevel;
    private int reservationsDone;
    private int matchesPlayed;
    private double hoursOnCourt;
    private double attendanceRate;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_sports", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "sport")
    private Set<String> practicedSports = new LinkedHashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_achievements", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "achievement")
    private Set<String> achievements = new LinkedHashSet<>();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public LocalDate getMemberSince() {
        return memberSince;
    }

    public void setMemberSince(LocalDate memberSince) {
        this.memberSince = memberSince;
    }

    public Modality getFavoriteModality() {
        return favoriteModality;
    }

    public void setFavoriteModality(Modality favoriteModality) {
        this.favoriteModality = favoriteModality;
    }

    public String getSportsLevel() {
        return sportsLevel;
    }

    public void setSportsLevel(String sportsLevel) {
        this.sportsLevel = sportsLevel;
    }

    public int getReservationsDone() {
        return reservationsDone;
    }

    public void setReservationsDone(int reservationsDone) {
        this.reservationsDone = reservationsDone;
    }

    public int getMatchesPlayed() {
        return matchesPlayed;
    }

    public void setMatchesPlayed(int matchesPlayed) {
        this.matchesPlayed = matchesPlayed;
    }

    public double getHoursOnCourt() {
        return hoursOnCourt;
    }

    public void setHoursOnCourt(double hoursOnCourt) {
        this.hoursOnCourt = hoursOnCourt;
    }

    public double getAttendanceRate() {
        return attendanceRate;
    }

    public void setAttendanceRate(double attendanceRate) {
        this.attendanceRate = attendanceRate;
    }

    public Set<String> getPracticedSports() {
        return practicedSports;
    }

    public void setPracticedSports(Set<String> practicedSports) {
        this.practicedSports = practicedSports;
    }

    public Set<String> getAchievements() {
        return achievements;
    }

    public void setAchievements(Set<String> achievements) {
        this.achievements = achievements;
    }
}
