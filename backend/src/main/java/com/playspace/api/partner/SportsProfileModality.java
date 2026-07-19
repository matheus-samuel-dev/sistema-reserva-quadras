package com.playspace.api.partner;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "sports_profile_modality", uniqueConstraints =
        @UniqueConstraint(name = "uk_profile_modality", columnNames = {"profile_id", "modality"}))
public class SportsProfileModality {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private SportsProfile profile;

    @Column(nullable = false, length = 40)
    private String modality;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private SportsLevel level;

    @Column(nullable = false)
    private boolean primaryModality;

    public Long getId() { return id; }
    public SportsProfile getProfile() { return profile; }
    public void setProfile(SportsProfile profile) { this.profile = profile; }
    public String getModality() { return modality; }
    public void setModality(String modality) { this.modality = modality; }
    public SportsLevel getLevel() { return level; }
    public void setLevel(SportsLevel level) { this.level = level; }
    public boolean isPrimaryModality() { return primaryModality; }
    public void setPrimaryModality(boolean primaryModality) { this.primaryModality = primaryModality; }
}
