package com.playspace.api.reservation;

import com.playspace.api.common.BusinessException;
import com.playspace.api.common.NotFoundException;
import com.playspace.api.court.CourtRepository;
import com.playspace.api.court.CourtStatus;
import com.playspace.api.notification.NotificationService;
import com.playspace.api.user.AppUser;
import com.playspace.api.user.Role;
import com.playspace.api.user.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
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

    private final ReservationRepository reservations;
    private final CourtRepository courts;
    private final UserRepository users;
    private final NotificationService notifications;

    public ReservationService(
            ReservationRepository reservations,
            CourtRepository courts,
            UserRepository users,
            NotificationService notifications
    ) {
        this.reservations = reservations;
        this.courts = courts;
        this.users = users;
        this.notifications = notifications;
    }

    @Transactional
    public Reservation create(ReservationRequest request, AppUser actor) {
        var client = resolveClient(request, actor);
        var court = courts.findById(request.courtId()).orElseThrow(() -> new NotFoundException("Quadra nao encontrada."));
        validateWindow(request.date(), request.startTime(), request.endTime());
        if (court.getStatus() != CourtStatus.DISPONIVEL) {
            throw new BusinessException("A quadra selecionada nao esta disponivel para reservas.");
        }
        if (reservations.existsByCourtIdAndDateAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
                court.getId(),
                request.date(),
                OCCUPYING_STATUSES,
                request.endTime(),
                request.startTime())) {
            throw new BusinessException("Ja existe uma reserva nesse horario para a quadra selecionada.");
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
        return saved;
    }

    @Transactional
    public Reservation updateStatus(Long id, ReservationStatus status, AppUser actor) {
        var reservation = getVisible(id, actor);
        reservation.setStatus(status);
        appendHistory(reservation, "Status alterado para " + status + " por " + actor.getName());
        notifications.create(reservation.getClient(), "Reserva atualizada", "Reserva " + reservation.getCode() + " agora esta " + status + ".", "RESERVA");
        return reservations.save(reservation);
    }

    @Transactional
    public Reservation cancel(Long id, AppUser actor) {
        var reservation = getVisible(id, actor);
        if (reservation.getStatus() == ReservationStatus.CONCLUIDA) {
            throw new BusinessException("Reservas concluidas nao podem ser canceladas.");
        }
        if (actor.getRole() == Role.CLIENTE && LocalDateTime.of(reservation.getDate(), reservation.getStartTime()).minusHours(2).isBefore(LocalDateTime.now())) {
            throw new BusinessException("Cancelamento permitido ate 2 horas antes do horario reservado.");
        }
        reservation.setStatus(ReservationStatus.CANCELADA);
        appendHistory(reservation, "Reserva cancelada por " + actor.getName());
        notifications.create(reservation.getClient(), "Reserva cancelada", "Reserva " + reservation.getCode() + " foi cancelada.", "CANCELAMENTO");
        return reservations.save(reservation);
    }

    public Reservation getVisible(Long id, AppUser actor) {
        var reservation = reservations.findById(id).orElseThrow(() -> new NotFoundException("Reserva nao encontrada."));
        if (actor.getRole() == Role.CLIENTE && !reservation.getClient().getId().equals(actor.getId())) {
            throw new BusinessException("Clientes so podem acessar as proprias reservas.");
        }
        return reservation;
    }

    private AppUser resolveClient(ReservationRequest request, AppUser actor) {
        if (actor.getRole() == Role.CLIENTE) {
            return actor;
        }
        var clientId = request.clientId() == null ? actor.getId() : request.clientId();
        return users.findById(clientId).orElseThrow(() -> new NotFoundException("Cliente nao encontrado."));
    }

    private void validateWindow(LocalDate date, LocalTime start, LocalTime end) {
        if (!start.isBefore(end)) {
            throw new BusinessException("Horario final deve ser maior que o horario inicial.");
        }
        if (start.isBefore(OPENING) || end.isAfter(CLOSING)) {
            throw new BusinessException("Reservas permitidas apenas entre 08:00 e 22:00.");
        }
        if (LocalDateTime.of(date, start).isBefore(LocalDateTime.now())) {
            throw new BusinessException("Nao e permitido reservar horarios no passado.");
        }
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
