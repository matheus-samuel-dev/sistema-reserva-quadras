package com.playspace.api.partner;

import com.playspace.api.common.AuditableEntity;
import com.playspace.api.user.AppUser;
import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "sports_profile")
public class SportsProfile extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private AppUser user;

    @Column(nullable = false, length = 120)
    private String city;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private PartnerObjective objective;

    @Column(nullable = false, length = 1200)
    private String presentation;

    @Column(length = 120)
    private String position;

    @Column(nullable = false)
    private boolean discoverable = true;

    @Column(length = 500)
    private String avatarUrl;

    @ElementCollection
    @CollectionTable(name = "sports_profile_region", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "region", nullable = false, length = 120)
    private Set<String> regions = new LinkedHashSet<>();

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("primaryModality DESC, id ASC")
    private Set<SportsProfileModality> modalities = new LinkedHashSet<>();

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("dayOfWeek ASC, startTime ASC")
    private Set<SportsAvailability> availabilities = new LinkedHashSet<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public AppUser getUser() { return user; }
    public void setUser(AppUser user) { this.user = user; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public PartnerObjective getObjective() { return objective; }
    public void setObjective(PartnerObjective objective) { this.objective = objective; }
    public String getPresentation() { return presentation; }
    public void setPresentation(String presentation) { this.presentation = presentation; }
    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }
    public boolean isDiscoverable() { return discoverable; }
    public void setDiscoverable(boolean discoverable) { this.discoverable = discoverable; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public Set<String> getRegions() { return regions; }
    public void setRegions(Set<String> regions) { this.regions = regions; }
    public Set<SportsProfileModality> getModalities() { return modalities; }
    public Set<SportsAvailability> getAvailabilities() { return availabilities; }

    public void replaceModalities(Set<SportsProfileModality> replacements) {
        modalities.clear();
        replacements.forEach(item -> {
            item.setProfile(this);
            modalities.add(item);
        });
    }

    public void replaceAvailabilities(Set<SportsAvailability> replacements) {
        availabilities.clear();
        replacements.forEach(item -> {
            item.setProfile(this);
            availabilities.add(item);
        });
    }
}
