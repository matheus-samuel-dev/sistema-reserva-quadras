package com.playspace.api.payment;

import com.playspace.api.common.BusinessException;
import com.playspace.api.common.NotFoundException;
import com.playspace.api.notification.NotificationService;
import com.playspace.api.reservation.ReservationRepository;
import com.playspace.api.reservation.ReservationStatus;
import com.playspace.api.user.AppUser;
import com.playspace.api.user.Role;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {
    private final PaymentRepository payments;
    private final ReservationRepository reservations;
    private final NotificationService notifications;

    public PaymentService(PaymentRepository payments, ReservationRepository reservations, NotificationService notifications) {
        this.payments = payments;
        this.reservations = reservations;
        this.notifications = notifications;
    }

    @Transactional
    public Payment processDemo(PaymentRequest request, AppUser actor) {
        var reservation = reservations.findById(request.reservationId())
                .orElseThrow(() -> new NotFoundException("Reserva nao encontrada."));
        if (actor.getRole() == Role.CLIENTE && !reservation.getClient().getId().equals(actor.getId())) {
            throw new BusinessException("Clientes so podem pagar as proprias reservas.");
        }
        var payment = new Payment();
        payment.setReservation(reservation);
        payment.setMethod(request.method());
        payment.setAmount(reservation.getTotalValue());
        payment.setTransactionCode("PAY-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase());
        payment.setStatus(request.approve() ? PaymentStatus.APROVADO : PaymentStatus.RECUSADO);
        if (payment.getStatus() == PaymentStatus.APROVADO) {
            payment.setPaidAt(OffsetDateTime.now());
            reservation.setStatus(ReservationStatus.CONFIRMADA);
            reservation.setPaymentMethod(request.method());
            notifications.create(reservation.getClient(), "Pagamento aprovado", "Reserva " + reservation.getCode() + " confirmada.", "PAGAMENTO");
        } else {
            notifications.create(reservation.getClient(), "Pagamento recusado", "Tente outro metodo para a reserva " + reservation.getCode() + ".", "PAGAMENTO");
        }
        reservations.save(reservation);
        return payments.save(payment);
    }
}
