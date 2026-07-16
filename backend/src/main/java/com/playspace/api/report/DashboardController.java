package com.playspace.api.report;

import com.playspace.api.common.ActivityLogRepository;
import com.playspace.api.community.ChampionshipRepository;
import com.playspace.api.community.CommunityPostRepository;
import com.playspace.api.community.ReviewRepository;
import com.playspace.api.court.CourtRepository;
import com.playspace.api.payment.PaymentRepository;
import com.playspace.api.payment.PaymentStatus;
import com.playspace.api.reservation.ReservationRepository;
import com.playspace.api.reservation.ReservationStatus;
import com.playspace.api.security.CurrentUserService;
import com.playspace.api.user.UserRepository;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final ReservationRepository reservations;
    private final PaymentRepository payments;
    private final CourtRepository courts;
    private final UserRepository users;
    private final ActivityLogRepository activities;
    private final ReviewRepository reviews;
    private final ChampionshipRepository championships;
    private final CommunityPostRepository posts;
    private final CurrentUserService currentUser;

    public DashboardController(
            ReservationRepository reservations,
            PaymentRepository payments,
            CourtRepository courts,
            UserRepository users,
            ActivityLogRepository activities,
            ReviewRepository reviews,
            ChampionshipRepository championships,
            CommunityPostRepository posts,
            CurrentUserService currentUser
    ) {
        this.reservations = reservations;
        this.payments = payments;
        this.courts = courts;
        this.users = users;
        this.activities = activities;
        this.reviews = reviews;
        this.championships = championships;
        this.posts = posts;
        this.currentUser = currentUser;
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    Map<String, Object> admin() {
        var today = LocalDate.now();
        var monthStart = today.withDayOfMonth(1);
        var monthEnd = today.withDayOfMonth(today.lengthOfMonth());
        var weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        var weekEnd = weekStart.plusDays(6);
        var confirmed = List.of(ReservationStatus.CONFIRMADA, ReservationStatus.EM_ANDAMENTO, ReservationStatus.CONCLUIDA);

        var cards = new LinkedHashMap<String, Object>();
        cards.put("reservasHoje", reservations.countByDateAndStatusNot(today, ReservationStatus.CANCELADA));
        cards.put("proximasReservas", reservations.findByDateBetweenOrderByDateAscStartTimeAsc(today, today.plusDays(7)).size());
        cards.put("receitaMes", reservations.sumRevenue(monthStart, monthEnd, confirmed));
        cards.put("taxaOcupacao", 68);
        cards.put("pagamentosPendentes", payments.countByStatus(PaymentStatus.PENDENTE));
        cards.put("cancelamentos", reservations.countByStatus(ReservationStatus.CANCELADA));
        cards.put("quadraMaisReservada", "Quadra Aurora");
        cards.put("horarioMovimento", "19:00");
        cards.put("receitaPrevistaSemana", reservations.sumRevenue(weekStart, weekEnd, confirmed));
        cards.put("modalidadeAlta", "Beach Tennis");
        cards.put("jogadoresAtivosHoje", users.findAll().stream().filter(u -> u.getRole().name().equals("CLIENTE")).count());
        cards.put("clima", Map.of("temp", "27C", "hint", "Ideal para Beach Tennis"));
        cards.put("mediaAvaliacoes", reviews.globalAverage());

        return Map.of(
                "cards", cards,
                "upcoming", reservations.findByDateBetweenOrderByDateAscStartTimeAsc(today, today.plusDays(3)),
                "activity", activities.findTop12ByOrderByCreatedAtDesc(),
                "weekReservations", reservations.findByDateBetweenOrderByDateAscStartTimeAsc(weekStart, weekEnd),
                "championships", championships.findTop12ByOrderByStartDateAsc(),
                "communityHighlights", posts.findTop20ByOrderByCreatedAtDesc().stream().limit(5).toList(),
                "system", Map.of("api", "Operacional", "database", "Saudavel", "queue", "Demo realtime")
        );
    }

    @GetMapping("/client")
    Map<String, Object> client() {
        var user = currentUser.user();
        var myReservations = reservations.findByClientIdOrderByDateDescStartTimeDesc(user.getId());
        var stats = new LinkedHashMap<String, Object>();
        stats.put("totalReservas", myReservations.size());
        stats.put("totalPartidas", user.getMatchesPlayed());
        stats.put("horasJogadas", user.getHoursOnCourt());
        stats.put("modalidadeFavorita", user.getFavoriteModality());
        stats.put("horarioFavorito", "19:00");
        stats.put("diaFavorito", "Quinta-feira");
        stats.put("gastoMensal", 540);
        stats.put("gastoAnual", 4380);
        stats.put("frequenciaSemanal", 2.4);
        stats.put("sequenciaAtual", 6);
        stats.put("comparecimento", user.getAttendanceRate());

        return Map.of(
                "profile", user,
                "reservations", myReservations,
                "stats", stats,
                "recommendations", List.of(
                        "Sua quadra favorita tem horários livres hoje às 18:00.",
                        "Beach Tennis está em alta nesta semana.",
                        "Quadras cobertas recomendadas se chover no fim do dia."
                )
        );
    }
}
