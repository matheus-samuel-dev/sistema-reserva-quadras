package com.playspace.api.community;

import com.playspace.api.common.AuditService;
import com.playspace.api.common.BusinessException;
import com.playspace.api.common.ConflictException;
import com.playspace.api.common.NotFoundException;
import com.playspace.api.reservation.ReservationRepository;
import com.playspace.api.reservation.ReservationStatus;
import com.playspace.api.security.CurrentUserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReviewService {
    private final ReviewRepository reviews;
    private final ReservationRepository reservations;
    private final CurrentUserService currentUser;
    private final AuditService audit;

    public ReviewService(
            ReviewRepository reviews,
            ReservationRepository reservations,
            CurrentUserService currentUser,
            AuditService audit
    ) {
        this.reviews = reviews;
        this.reservations = reservations;
        this.currentUser = currentUser;
        this.audit = audit;
    }

    @Transactional
    public Review create(ReviewRequest request) {
        var actor = currentUser.user();
        var reservation = reservations.findByIdForUpdate(request.reservationId())
                .orElseThrow(() -> new NotFoundException("Reserva não encontrada."));
        if (!reservation.getClient().getId().equals(actor.getId())) {
            throw new BusinessException("Você só pode avaliar suas próprias reservas.");
        }
        if (reservation.getStatus() != ReservationStatus.CONCLUIDA) {
            throw new BusinessException("A avaliação fica disponível após a conclusão da reserva.");
        }
        if (reviews.existsByReservationId(reservation.getId())) {
            throw new ConflictException("Esta reserva já foi avaliada.");
        }

        var review = new Review();
        review.setReservation(reservation);
        review.setUser(actor);
        review.setCourt(reservation.getCourt());
        review.setCleaning(request.cleaning());
        review.setLighting(request.lighting());
        review.setOrganization(request.organization());
        review.setService(request.service());
        review.setCourtQuality(request.courtQuality());
        review.setAverage(roundAverage(request));
        review.setComment(normalizeComment(request.comment()));
        var saved = reviews.save(review);
        audit.record(actor, "Avaliação registrada para " + reservation.getCourt().getName(), "AVALIAÇÃO");
        return saved;
    }

    private double roundAverage(ReviewRequest request) {
        var total = request.cleaning() + request.lighting() + request.organization()
                + request.service() + request.courtQuality();
        return Math.round((total / 5.0) * 10.0) / 10.0;
    }

    private String normalizeComment(String comment) {
        if (comment == null) return "";
        return comment.strip().replaceAll("\\s+", " ");
    }
}
