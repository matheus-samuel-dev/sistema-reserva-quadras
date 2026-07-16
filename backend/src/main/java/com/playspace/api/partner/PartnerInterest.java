package com.playspace.api.partner;

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
@Table(name = "partner_interest", uniqueConstraints =
        @UniqueConstraint(name = "uk_partner_interest_pair", columnNames = {"sender_id", "receiver_id"}))
public class PartnerInterest extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private AppUser sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private AppUser receiver;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private PartnerInterestStatus status = PartnerInterestStatus.PENDENTE;

    @Column(length = 500)
    private String message;

    private OffsetDateTime respondedAt;
    private OffsetDateTime cancelledAt;

    public Long getId() { return id; }
    public AppUser getSender() { return sender; }
    public void setSender(AppUser sender) { this.sender = sender; }
    public AppUser getReceiver() { return receiver; }
    public void setReceiver(AppUser receiver) { this.receiver = receiver; }
    public PartnerInterestStatus getStatus() { return status; }
    public void setStatus(PartnerInterestStatus status) { this.status = status; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public OffsetDateTime getRespondedAt() { return respondedAt; }
    public void setRespondedAt(OffsetDateTime respondedAt) { this.respondedAt = respondedAt; }
    public OffsetDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(OffsetDateTime cancelledAt) { this.cancelledAt = cancelledAt; }
}
