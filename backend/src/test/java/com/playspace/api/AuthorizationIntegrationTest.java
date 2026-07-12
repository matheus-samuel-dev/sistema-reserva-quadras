package com.playspace.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.playspace.api.court.CourtRepository;
import com.playspace.api.court.CourtStatus;
import com.playspace.api.notification.NotificationRepository;
import com.playspace.api.security.AuthService;
import com.playspace.api.security.LoginRequest;
import com.playspace.api.user.UserRepository;
import java.time.LocalDate;
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
class AuthorizationIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired NotificationRepository notifications;
    @Autowired UserRepository users;
    @Autowired CourtRepository courts;
    @Autowired AuthService authService;

    @Test
    @WithUserDetails("cliente@playspace.com")
    void clientCannotAccessAdministrativeDashboardOrGlobalAgenda() throws Exception {
        mvc.perform(get("/api/dashboard/admin")).andExpect(status().isForbidden());
        mvc.perform(get("/api/reservations/week")
                        .param("start", LocalDate.now().toString())
                        .param("end", LocalDate.now().plusDays(7).toString()))
                .andExpect(status().isForbidden());
    }

    @Test
    void availabilityRequiresAuthentication() throws Exception {
        mvc.perform(get("/api/reservations/availability")
                        .param("start", LocalDate.now().toString())
                        .param("end", LocalDate.now().plusDays(7).toString()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithUserDetails("cliente@playspace.com")
    void clientCanReadAvailabilityWithoutPrivateReservationData() throws Exception {
        mvc.perform(get("/api/reservations/availability")
                        .param("start", LocalDate.now().toString())
                        .param("end", LocalDate.now().plusDays(7).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").exists())
                .andExpect(jsonPath("$[0].courtId").exists())
                .andExpect(jsonPath("$[0].date").exists())
                .andExpect(jsonPath("$[0].startTime").exists())
                .andExpect(jsonPath("$[0].endTime").exists())
                .andExpect(jsonPath("$[0].status").exists())
                .andExpect(jsonPath("$[0].client").doesNotExist())
                .andExpect(jsonPath("$[0].code").doesNotExist())
                .andExpect(jsonPath("$[0].totalValue").doesNotExist());

        mvc.perform(get("/api/reservations/availability")
                        .param("start", LocalDate.now().toString())
                        .param("end", LocalDate.now().plusDays(367).toString()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithUserDetails("cliente@playspace.com")
    void clientCannotMarkAnotherUsersNotificationAsRead() throws Exception {
        var other = users.findByEmail("lucas@playspace.com").orElseThrow();
        var notification = notifications.findByUserIdOrderByCreatedAtDesc(other.getId()).get(0);
        mvc.perform(put("/api/notifications/{id}/read", notification.getId()))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithUserDetails("admin@playspace.com")
    void administratorCannotDeactivateOwnAccount() throws Exception {
        var admin = users.findByEmail("admin@playspace.com").orElseThrow();
        mvc.perform(delete("/api/users/{id}", admin.getId()))
                .andExpect(status().isForbidden());
    }

    @Test
    void tokenFromDeactivatedUserIsNotAuthenticated() throws Exception {
        var login = authService.login(new LoginRequest("cliente@playspace.com", "Cliente@123"));
        var client = users.findByEmail("cliente@playspace.com").orElseThrow();
        client.setActive(false);
        users.saveAndFlush(client);

        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + login.token()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void invalidCredentialsReturnUnauthorizedWithoutLeakingDetails() throws Exception {
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"cliente@playspace.com","password":"senha-incorreta"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Nao autenticado"));
    }

    @Test
    void nullBlankAndOversizedLoginFieldsAreRejectedByValidation() throws Exception {
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":null,"password":"Cliente@123"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validacao"));

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"   ","password":"Cliente@123"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validacao"));

        var oversizedEmail = "a".repeat(245) + "@example.com";
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"Cliente@123"}
                                """.formatted(oversizedEmail)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validacao"));

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"cliente@playspace.com","password":"%s"}
                                """.formatted("p".repeat(73))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validacao"));
    }

    @Test
    @WithUserDetails("admin@playspace.com")
    void userProfileFieldsCannotExceedDatabaseLimits() throws Exception {
        mvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Usuario de validacao",
                                  "email":"validacao@playspace.com",
                                  "password":"Validacao@123",
                                  "role":"CLIENTE",
                                  "active":true,
                                  "bio":"%s",
                                  "avatarUrl":"%s"
                                }
                                """.formatted("b".repeat(256), "a".repeat(256))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validacao"));

        mvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"%s",
                                  "email":"nome-longo@playspace.com",
                                  "password":"Validacao@123",
                                  "role":"CLIENTE",
                                  "active":true
                                }
                                """.formatted("n".repeat(256))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validacao"));
    }

    @Test
    @WithUserDetails("admin@playspace.com")
    void courtFieldsRespectSchemaValidationBeforePersistence() throws Exception {
        mvc.perform(post("/api/courts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Quadra de validacao",
                                  "modality":"TENIS",
                                  "description":"%s",
                                  "pricePerHour":100,
                                  "playerCapacity":4,
                                  "status":"DISPONIVEL",
                                  "rating":4.5
                                }
                                """.formatted("d".repeat(1201))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validacao"));

        for (var oversizedField : new String[] {"name", "imageUrl", "location"}) {
            var body = """
                    {
                      "name":"Quadra de validacao",
                      "modality":"TENIS",
                      "pricePerHour":100,
                      "playerCapacity":4,
                      "status":"DISPONIVEL",
                      "rating":4.5,
                      "%s":"%s"
                    }
                    """.formatted(oversizedField, "x".repeat(256));

            mvc.perform(post("/api/courts")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("Validacao"));
        }

        mvc.perform(post("/api/courts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Quadra de validacao",
                                  "modality":"TENIS",
                                  "pricePerHour":100,
                                  "playerCapacity":4,
                                  "status":"DISPONIVEL",
                                  "rating":5.1
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validacao"));

        mvc.perform(post("/api/courts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Quadra de validacao",
                                  "modality":"TENIS",
                                  "pricePerHour":100,
                                  "playerCapacity":4,
                                  "status":null,
                                  "rating":4.5
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validacao"));

        mvc.perform(post("/api/courts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Quadra com status padrao",
                                  "modality":"TENIS",
                                  "pricePerHour":100,
                                  "playerCapacity":4,
                                  "rating":4.5
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DISPONIVEL"));
    }

    @Test
    @WithUserDetails("admin@playspace.com")
    void deletingCourtArchivesItWithoutRemovingHistoryTarget() throws Exception {
        var court = courts.findByStatus(CourtStatus.DISPONIVEL).get(0);

        mvc.perform(delete("/api/courts/{id}", court.getId()))
                .andExpect(status().isNoContent());

        var archived = courts.findById(court.getId()).orElseThrow();
        org.assertj.core.api.Assertions.assertThat(archived.getStatus()).isEqualTo(CourtStatus.INDISPONIVEL);
    }
}
