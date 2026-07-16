package com.playspace.api.reservation;

import com.playspace.api.common.AuditService;
import com.playspace.api.common.BusinessException;
import com.playspace.api.common.ConflictException;
import com.playspace.api.common.NotFoundException;
import com.playspace.api.court.CourtRepository;
import com.playspace.api.court.CourtStatus;
import com.playspace.api.notification.NotificationService;
import com.playspace.api.payment.PaymentRepository;
import com.playspace.api.payment.PaymentStatus;
import com.playspace.api.settings.PlatformSettingsRepository;
import com.playspace.api.user.AppUser;
import com.playspace.api.user.Role;
import com.playspace.api.user.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReservationService {
    private static final LocalTime OPENING = LocalTime.of(8, 0);
    private static final LocalTime CLOSING = LocalTime.of(22, 0);
    private static final List<ReservationStatus> OCCUPYING_STATUSES = List.of(
            ReservationStatus.PENDENTE,
            ReservationStatus.CONFIRMADA,
            ReservationStatus.EM_ANDAMENTO
    );
    private static final List<PaymentStatus> CANCELABLE_PAYMENT_STATUSES = List.of(
            PaymentStatus.PENDENTE,
            PaymentStatus.APROVADO
    );
    private static final long MAX_AVAILABILITY_RANGE_DAYS = 366;

    private final ReservationRepository reservations;
    private final CourtRepository courts;
    private final UserRepository users;
    private final PaymentRepository payments;
    private final NotificationService notifications;
    private final AuditService audit;
    private final PlatformSettingsRepository settingsRepository;

    public ReservationService(
            ReservationRepository reservations,
            CourtRepository courts,
            UserRepository users,
            PaymentRepository payments,
            NotificationService notifications,
            AuditService audit,
            PlatformSettingsRepository settingsRepository
    ) {
        this.reservations = reservations;
        this.courts = courts;
        this.users = users;
        this.payments = payments;
        this.notifications = notifications;
        this.audit = audit;
        this.settingsRepository = settingsRepository;
    }

    @Transactional
    public Reservation create(ReservationRequest request, AppUser actor) {
        var client = resolveClient(request, actor);
        validateWindow(request.date(), request.startTime(), request.endTime());
        var court = courts.findByIdForUpdate(request.courtId()).orElseThrow(() -> new NotFoundException("Quadra não encontrada."));
        if (court.getStatus() != CourtStatus.DISPONIVEL) {
            throw new BusinessException("A quadra selecionada não está disponível para reservas.");
        }
        validateCapacity(request.players(), court.getPlayerCapacity());
        if (reservations.existsByCourtIdAndDateAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
                court.getId(),
                request.date(),
                OCCUPYING_STATUSES,
                request.endTime(),
                request.startTime())) {
            throw new ConflictException("Já existe uma reserva nesse horário para a quadra selecionada.");
        }

        var reservation = new Reservation();
        reservation.setCode(generateCode());
        reservation.setClient(client);
        reservation.setCourt(court);
        reservation.setModality(court.getModality());
        reservation.setDate(request.date());
        reservation.setStartTime(request.startTime());
        reservation.setEndTime(request.endTime());
        reservation.setPlayers(request.players());
        reservation.setPaymentMethod(request.paymentMethod());
        reservation.setNotes(request.notes());
        reservation.setTotalValue(calculateTotal(court.getPricePerHour(), request.startTime(), request.endTime()));
        reservation.setHistory("Reserva criada por " + actor.getName());
        var saved = reservations.save(reservation);
        notifications.create(client, "Nova reserva criada", "Reserva " + saved.getCode() + " aguardando pagamento.", "RESERVA");
        audit.record(actor, "Criou a reserva " + saved.getCode() + " para " + client.getEmail(), "RESERVA");
        return saved;
    }

    @Transactional
    public Reservation updateStatus(Long id, ReservationStatus status, AppUser actor) {
        var reservation = getVisibleForUpdate(id, actor);
        if (reservation.getStatus() == status) {
            if (status == ReservationStatus.CANCELADA) {
                cancelLinkedPayments(reservation.getId());
            }
            return reservation;
        }
        validateTransition(reservation.getStatus(), status);
        if (isOccupying(status)) {
            lockCourtAndValidateConflict(reservation);
        }
        reservation.setStatus(status);
        if (status == ReservationStatus.CANCELADA) {
            cancelLinkedPayments(reservation.getId());
        }
        appendHistory(reservation, "Status alterado para " + status + " por " + actor.getName());
        notifications.create(reservation.getClient(), "Reserva atualizada", "Reserva " + reservation.getCode() + " agora está " + status + ".", "RESERVA");
        var saved = reservations.save(reservation);
        audit.record(actor, "Alterou a reserva " + saved.getCode() + " para " + status, "RESERVA");
        return saved;
    }

    @Transactional
    public Reservation cancel(Long id, AppUser actor) {
        var reservation = getVisibleForUpdate(id, actor);
        if (reservation.getStatus() == ReservationStatus.CANCELADA) {
            cancelLinkedPayments(reservation.getId());
            return reservation;
        }
        validateTransition(reservation.getStatus(), ReservationStatus.CANCELADA);
        var cancellationHours = settingsRepository.findFirstByOrderByIdAsc().map(item -> item.getCancellationRuleHours()).orElse(2);
        if (actor.getRole() == Role.CLIENTE && LocalDateTime.of(reservation.getDate(), reservation.getStartTime()).minusHours(cancellationHours).isBefore(LocalDateTime.now())) {
            throw new BusinessException("Cancelamento permitido até " + cancellationHours + " horas antes do horário reservado.");
        }
        reservation.setStatus(ReservationStatus.CANCELADA);
        cancelLinkedPayments(reservation.getId());
        appendHistory(reservation, "Reserva cancelada por " + actor.getName());
        notifications.create(reservation.getClient(), "Reserva cancelada", "Reserva " + reservation.getCode() + " foi cancelada.", "CANCELAMENTO");
        var saved = reservations.save(reservation);
        audit.record(actor, "Cancelou a reserva " + saved.getCode(), "CANCELAMENTO");
        return saved;
    }

    @Transactional(readOnly = true)
    public List<ReservationAvailability> availability(LocalDate start, LocalDate end) {
        if (start == null || end == null) {
            throw new BusinessException("As datas inicial e final são obrigatórias.");
        }
        if (end.isBefore(start)) {
            throw new BusinessException("A data final deve ser igual ou posterior a data inicial.");
        }
        if (ChronoUnit.DAYS.between(start, end) > MAX_AVAILABILITY_RANGE_DAYS) {
            throw new BusinessException("O intervalo de disponibilidade deve ter no máximo 366 dias.");
        }
        return reservations.findByDateBetweenAndStatusInOrderByDateAscStartTimeAsc(start, end, OCCUPYING_STATUSES)
                .stream()
                .map(ReservationAvailability::from)
                .toList();
    }

    public Reservation getVisible(Long id, AppUser actor) {
        var reservation = reservations.findById(id).orElseThrow(() -> new NotFoundException("Reserva não encontrada."));
        assertVisible(reservation, actor);
        return reservation;
    }

    private Reservation getVisibleForUpdate(Long id, AppUser actor) {
        var reservation = reservations.findByIdForUpdate(id).orElseThrow(() -> new NotFoundException("Reserva não encontrada."));
        assertVisible(reservation, actor);
        return reservation;
    }

    private void assertVisible(Reservation reservation, AppUser actor) {
        if (actor.getRole() == Role.CLIENTE && !reservation.getClient().getId().equals(actor.getId())) {
            throw new AccessDeniedException("Clientes só podem acessar as próprias reservas.");
        }
    }

    private AppUser resolveClient(ReservationRequest request, AppUser actor) {
        if (actor.getRole() == Role.CLIENTE) {
            return actor;
        }
        if (request.clientId() == null) {
            throw new BusinessException("Informe o cliente da reserva.");
        }
        var client = users.findById(request.clientId()).orElseThrow(() -> new NotFoundException("Cliente não encontrado."));
        if (client.getRole() != Role.CLIENTE) {
            throw new BusinessException("A reserva deve pertencer a um usuário com perfil de cliente.");
        }
        if (!client.isActive()) {
            throw new BusinessException("Não é permitido criar reservas para um cliente inativo.");
        }
        return client;
    }

    private void validateWindow(LocalDate date, LocalTime start, LocalTime end) {
        if (date == null || start == null || end == null) {
            throw new BusinessException("Data, horário inicial e horário final são obrigatórios.");
        }
        if (!start.isBefore(end)) {
            throw new BusinessException("O horário final deve ser maior que o horário inicial.");
        }
        var settings = settingsRepository.findFirstByOrderByIdAsc().orElse(null);
        var opening = settings == null ? OPENING : settings.getOpeningTime();
        var closing = settings == null ? CLOSING : settings.getClosingTime();
        var minimumMinutes = settings == null ? 60 : settings.getMinimumReservationMinutes();
        var slotMinutes = settings == null ? 60 : settings.getSlotMinutes();
        var maximumAdvanceDays = settings == null ? 90 : settings.getMaximumAdvanceDays();
        if (start.isBefore(opening) || end.isAfter(closing)) {
            throw new BusinessException("Reservas permitidas apenas entre " + opening + " e " + closing + ".");
        }
        if (LocalDateTime.of(date, start).isBefore(LocalDateTime.now())) {
            throw new BusinessException("Não é permitido reservar horários no passado.");
        }
        if (date.isAfter(LocalDate.now().plusDays(maximumAdvanceDays))) {
            throw new BusinessException("Reservas podem ser feitas com até " + maximumAdvanceDays + " dias de antecedência.");
        }
        if (settings != null && !List.of(settings.getOperatingDays().split(",")).contains(date.getDayOfWeek().name())) {
            throw new BusinessException("A unidade não funciona no dia selecionado.");
        }
        if (Duration.between(start, end).toMinutes() < minimumMinutes) {
            throw new BusinessException("A duração mínima da reserva é de " + minimumMinutes + " minutos.");
        }
        if (slotMinutes > 0 && (Duration.between(opening, start).toMinutes() % slotMinutes != 0 || Duration.between(opening, end).toMinutes() % slotMinutes != 0)) {
            throw new BusinessException("Os horários devem respeitar intervalos de " + slotMinutes + " minutos.");
        }
    }

    private void validateCapacity(int players, int capacity) {
        if (players < 1) {
            throw new BusinessException("A reserva deve possuir ao menos um jogador.");
        }
        if (players > capacity) {
            throw new BusinessException("A capacidade máxima desta quadra é de " + capacity + " jogadores.");
        }
    }

    private void validateTransition(ReservationStatus current, ReservationStatus target) {
        if (target == null) {
            throw new BusinessException("O novo status da reserva é obrigatório.");
        }
        var allowed = switch (current) {
            case PENDENTE -> target == ReservationStatus.CONFIRMADA || target == ReservationStatus.CANCELADA;
            case CONFIRMADA -> target == ReservationStatus.EM_ANDAMENTO
                    || target == ReservationStatus.CONCLUIDA
                    || target == ReservationStatus.CANCELADA;
            case EM_ANDAMENTO -> target == ReservationStatus.CONCLUIDA;
            case CANCELADA -> target == ReservationStatus.PENDENTE;
            case CONCLUIDA -> false;
        };
        if (!allowed) {
            throw new ConflictException("Transição de status inválida: " + current + " para " + target + ".");
        }
    }

    private void lockCourtAndValidateConflict(Reservation reservation) {
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
            throw new ConflictException("O horário foi ocupado por outra reserva e não pode ser reativado.");
        }
    }

    private boolean isOccupying(ReservationStatus status) {
        return OCCUPYING_STATUSES.contains(status);
    }

    private void cancelLinkedPayments(Long reservationId) {
        var linkedPayments = payments.findByReservationIdAndStatusIn(reservationId, CANCELABLE_PAYMENT_STATUSES);
        linkedPayments.forEach(payment -> payment.setStatus(PaymentStatus.CANCELADO));
        payments.saveAll(linkedPayments);
    }

    private BigDecimal calculateTotal(BigDecimal pricePerHour, LocalTime start, LocalTime end) {
        var minutes = Duration.between(start, end).toMinutes();
        return pricePerHour.multiply(BigDecimal.valueOf(minutes))
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
    }

    private String generateCode() {
        return "PS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private void appendHistory(Reservation reservation, String event) {
        var current = reservation.getHistory() == null ? "" : reservation.getHistory() + "\n";
        reservation.setHistory(current + event);
    }
}
