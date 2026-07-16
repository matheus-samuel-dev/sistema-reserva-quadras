package com.playspace.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.playspace.api.community.ReviewRepository;
import com.playspace.api.court.CourtRepository;
import com.playspace.api.court.CourtStatus;
import com.playspace.api.payment.PaymentMethod;
import com.playspace.api.reservation.Reservation;
import com.playspace.api.reservation.ReservationRepository;
import com.playspace.api.reservation.ReservationStatus;
import com.playspace.api.user.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ReviewIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired CourtRepository courts;
    @Autowired ReservationRepository reservations;
    @Autowired ReviewRepository reviews;

    @Test
    @WithUserDetails("cliente@playspace.com")
    void clientCanReviewAnOwnCompletedReservation() throws Exception {
        var reservation = reservation(ReservationStatus.CONCLUIDA);

        mvc.perform(post("/api/community/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reviewPayload(reservation.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reservationId").value(reservation.getId()))
                .andExpect(jsonPath("$.userName").value(reservation.getClient().getName()))
                .andExpect(jsonPath("$.courtName").value(reservation.getCourt().getName()))
                .andExpect(jsonPath("$.ratings.cleaning").value(5))
                .andExpect(jsonPath("$.average").value(4.6))
                .andExpect(jsonPath("$.comment").value("Estrutura excelente e atendimento atencioso."));

        assertThat(reviews.existsByReservationId(reservation.getId())).isTrue();
    }

    @Test
    @WithUserDetails("cliente@playspace.com")
    void duplicateReviewForTheSameReservationIsRejected() throws Exception {
        var reservation = reservation(ReservationStatus.CONCLUIDA);
        var request = post("/api/community/reviews")
                .contentType(MediaType.APPLICATION_JSON)
                .content(reviewPayload(reservation.getId()));

        mvc.perform(request).andExpect(status().isOk());
        mvc.perform(post("/api/community/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reviewPayload(reservation.getId())))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Conflito"))
                .andExpect(jsonPath("$.details[0]").value("Esta reserva já foi avaliada."));
    }

    @Test
    @WithUserDetails("cliente@playspace.com")
    void reviewOfAnUnfinishedReservationIsRejected() throws Exception {
        var reservation = reservation(ReservationStatus.CONFIRMADA);

        mvc.perform(post("/api/community/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reviewPayload(reservation.getId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Regra de negócio"))
                .andExpect(jsonPath("$.details[0]").value("A avaliação fica disponível após a conclusão da reserva."));

        assertThat(reviews.existsByReservationId(reservation.getId())).isFalse();
    }

    private Reservation reservation(ReservationStatus status) {
        var client = users.findByEmailIgnoreCase("cliente@playspace.com").orElseThrow();
        var court = courts.findByStatus(CourtStatus.DISPONIVEL).get(0);
        var reservation = new Reservation();
        reservation.setCode("REV-" + UUID.randomUUID());
        reservation.setClient(client);
        reservation.setCourt(court);
        reservation.setModality(court.getModality());
        reservation.setDate(LocalDate.now().minusDays(2));
        reservation.setStartTime(LocalTime.of(18, 0));
        reservation.setEndTime(LocalTime.of(19, 0));
        reservation.setPlayers(2);
        reservation.setTotalValue(new BigDecimal("120.00"));
        reservation.setStatus(status);
        reservation.setPaymentMethod(PaymentMethod.PIX);
        reservation.setHistory("Reserva criada para teste de avaliação.");
        return reservations.saveAndFlush(reservation);
    }

    private String reviewPayload(Long reservationId) {
        return """
                {
                  "reservationId":%d,
                  "cleaning":5,
                  "lighting":4,
                  "organization":5,
                  "service":4,
                  "courtQuality":5,
                  "comment":"Estrutura excelente e atendimento atencioso."
                }
                """.formatted(reservationId);
    }
}
