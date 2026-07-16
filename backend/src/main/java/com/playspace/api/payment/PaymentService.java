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
import com.playspace.api.settings.PlatformSettingsRepository;
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
    private final PlatformSettingsRepository settingsRepository;

    public PaymentService(
            PaymentRepository payments,
            ReservationRepository reservations,
            CourtRepository courts,
            NotificationService notifications,
            AuditService audit,
            PlatformSettingsRepository settingsRepository
    ) {
        this.payments = payments;
        this.reservations = reservations;
        this.courts = courts;
        this.notifications = notifications;
        this.audit = audit;
        this.settingsRepository = settingsRepository;
    }

    @Transactional
    public Payment processDemo(PaymentRequest request, AppUser actor) {
        if (request.method() == null) {
            throw new BusinessException("O método de pagamento é obrigatório.");
        }
        settingsRepository.findFirstByOrderByIdAsc().ifPresent(settings -> {
            var enabled = request.method() == PaymentMethod.PIX ? settings.isAcceptPix() : settings.isAcceptCard();
            if (!enabled) throw new BusinessException("A forma de pagamento selecionada está desabilitada nas configurações.");
        });
        var reservation = reservations.findByIdForUpdate(request.reservationId())
                .orElseThrow(() -> new NotFoundException("Reserva não encontrada."));
        if (actor.getRole() == Role.CLIENTE && !reservation.getClient().getId().equals(actor.getId())) {
            throw new AccessDeniedException("Clientes só podem pagar as próprias reservas.");
        }
        if (payments.existsByReservationIdAndStatus(reservation.getId(), PaymentStatus.APROVADO)) {
            throw new ConflictException("Já existe um pagamento aprovado para esta reserva.");
        }
        if (reservation.getStatus() != ReservationStatus.PENDENTE) {
            throw new ConflictException("Somente reservas pendentes podem ser pagas.");
        }

        var court = courts.findByIdForUpdate(reservation.getCourt().getId())
                .orElseThrow(() -> new NotFoundException("Quadra não encontrada."));
        if (court.getStatus() != CourtStatus.DISPONIVEL) {
            throw new ConflictException("A quadra não está disponível para confirmar esta reserva.");
        }
        if (reservations.existsConflictExcluding(
                court.getId(),
                reservation.getDate(),
                OCCUPYING_STATUSES,
                reservation.getEndTime(),
                reservation.getStartTime(),
                reservation.getId())) {
            throw new ConflictException("O horário foi ocupado por outra reserva e o pagamento não pode ser concluído.");
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

    @Transactional
    public PaymentRefundResponse refund(Long paymentId, AppUser actor) {
        if (actor.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Somente administradores podem realizar estornos.");
        }
        var payment = payments.findByIdForUpdate(paymentId)
                .orElseThrow(() -> new NotFoundException("Pagamento não encontrado."));
        if (payment.getStatus() != PaymentStatus.APROVADO) {
            throw new ConflictException("Somente pagamentos aprovados podem ser estornados.");
        }

        var reservation = reservations.findByIdForUpdate(payment.getReservation().getId())
                .orElseThrow(() -> new NotFoundException("Reserva não encontrada."));
        var refundedAt = OffsetDateTime.now();
        payment.setStatus(PaymentStatus.CANCELADO);
        payment.setRefundedAt(refundedAt);

        if (reservation.getStatus() != ReservationStatus.CONCLUIDA) {
            reservation.setStatus(ReservationStatus.CANCELADA);
        }
        var currentHistory = reservation.getHistory() == null ? "" : reservation.getHistory() + "\n";
        reservation.setHistory(currentHistory + "Pagamento " + payment.getTransactionCode()
                + " estornado por " + actor.getName() + ".");

        reservations.save(reservation);
        var saved = payments.save(payment);
        notifications.create(
                reservation.getClient(),
                "Pagamento estornado",
                "O pagamento " + saved.getTransactionCode() + " da reserva " + reservation.getCode() + " foi estornado.",
                "PAGAMENTO"
        );
        audit.record(
                actor,
                "Estornou o pagamento " + saved.getTransactionCode() + " da reserva " + reservation.getCode(),
                "PAGAMENTO"
        );
        return PaymentRefundResponse.from(saved);
    }
}
