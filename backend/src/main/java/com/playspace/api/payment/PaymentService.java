package com.playspace.api.payment;

import com.playspace.api.common.AuditService;
import com.playspace.api.common.BusinessException;
import com.playspace.api.common.ConflictException;
import com.playspace.api.common.NotFoundException;
import com.playspace.api.court.CourtRepository;
import com.playspace.api.court.CourtStatus;
import com.playspace.api.notification.NotificationService;
import com.playspace.api.reservation.ReservationRepository;
import com.playspace.api.reservation.ReservationStatus;
import com.playspace.api.user.AppUser;
import com.playspace.api.user.Role;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {
    private static final List<ReservationStatus> OCCUPYING_STATUSES = List.of(
            ReservationStatus.PENDENTE,
            ReservationStatus.CONFIRMADA,
            ReservationStatus.EM_ANDAMENTO
    );

    private final PaymentRepository payments;
    private final ReservationRepository reservations;
    private final CourtRepository courts;
    private final NotificationService notifications;
    private final AuditService audit;

    public PaymentService(
            PaymentRepository payments,
            ReservationRepository reservations,
            CourtRepository courts,
            NotificationService notifications,
            AuditService audit
    ) {
        this.payments = payments;
        this.reservations = reservations;
        this.courts = courts;
        this.notifications = notifications;
        this.audit = audit;
    }

    @Transactional
    public Payment processDemo(PaymentRequest request, AppUser actor) {
        if (request.method() == null) {
            throw new BusinessException("O metodo de pagamento e obrigatorio.");
        }
        var reservation = reservations.findByIdForUpdate(request.reservationId())
                .orElseThrow(() -> new NotFoundException("Reserva nao encontrada."));
        if (actor.getRole() == Role.CLIENTE && !reservation.getClient().getId().equals(actor.getId())) {
            throw new AccessDeniedException("Clientes so podem pagar as proprias reservas.");
        }
        if (payments.existsByReservationIdAndStatus(reservation.getId(), PaymentStatus.APROVADO)) {
            throw new ConflictException("Ja existe um pagamento aprovado para esta reserva.");
        }
        if (reservation.getStatus() != ReservationStatus.PENDENTE) {
            throw new ConflictException("Somente reservas pendentes podem ser pagas.");
        }

        var court = courts.findByIdForUpdate(reservation.getCourt().getId())
                .orElseThrow(() -> new NotFoundException("Quadra nao encontrada."));
        if (court.getStatus() != CourtStatus.DISPONIVEL) {
            throw new ConflictException("A quadra nao esta disponivel para confirmar esta reserva.");
        }
        if (reservations.existsConflictExcluding(
                court.getId(),
                reservation.getDate(),
                OCCUPYING_STATUSES,
                reservation.getEndTime(),
                reservation.getStartTime(),
                reservation.getId())) {
            throw new ConflictException("O horario foi ocupado por outra reserva e o pagamento nao pode ser concluido.");
        }

        var payment = new Payment();
        payment.setReservation(reservation);
        payment.setMethod(request.method());
        payment.setAmount(reservation.getTotalValue());
        payment.setTransactionCode("PAY-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase());
        payment.setStatus(PaymentStatus.APROVADO);
        payment.setPaidAt(OffsetDateTime.now());
        reservation.setStatus(ReservationStatus.CONFIRMADA);
        reservation.setPaymentMethod(request.method());
        var currentHistory = reservation.getHistory() == null ? "" : reservation.getHistory() + "\n";
        reservation.setHistory(currentHistory + "Pagamento demo aprovado pelo servidor.");
        notifications.create(reservation.getClient(), "Pagamento aprovado", "Reserva " + reservation.getCode() + " confirmada.", "PAGAMENTO");
        reservations.save(reservation);
        var saved = payments.save(payment);
        audit.record(actor, "Registrou pagamento " + saved.getTransactionCode() + " para " + reservation.getCode(), "PAGAMENTO");
        return saved;
    }
}
