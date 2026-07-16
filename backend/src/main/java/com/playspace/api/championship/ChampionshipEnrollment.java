package com.playspace.api.championship;

import com.playspace.api.common.AuditableEntity;
import com.playspace.api.user.AppUser;
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
import java.time.OffsetDateTime;

@Entity
@Table(name = "championship_enrollment", uniqueConstraints =
        @UniqueConstraint(name = "uk_championship_enrollment_player", columnNames = {"championship_id", "player_id"}))
public class ChampionshipEnrollment extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "championship_id", nullable = false)
    private ChampionshipEvent championship;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private AppUser player;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private EnrollmentStatus status = EnrollmentStatus.ATIVA;

    private OffsetDateTime cancelledAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ChampionshipEvent getChampionship() { return championship; }
    public void setChampionship(ChampionshipEvent championship) { this.championship = championship; }
    public AppUser getPlayer() { return player; }
    public void setPlayer(AppUser player) { this.player = player; }
    public EnrollmentStatus getStatus() { return status; }
    public void setStatus(EnrollmentStatus status) { this.status = status; }
    public OffsetDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(OffsetDateTime cancelledAt) { this.cancelledAt = cancelledAt; }
}
