package com.playspace.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.playspace.api.modality.SportModalityRepository;
import com.playspace.api.user.UserRepository;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ModalityCatalogIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired SportModalityRepository modalities;
    @Autowired UserRepository users;
    @PersistenceContext EntityManager entityManager;

    @Test
    void dynamicModalityFlowsThroughTheConnectedApiEndToEnd() throws Exception {
        var adminToken = login("admin@playspace.com", "Admin@123");
        var clientToken = login("cliente@playspace.com", "Cliente@123");

        var initialCatalog = getJson("/api/modalities", adminToken);
        assertThat(codes(initialCatalog))
                .contains("BEACH_TENNIS", "FUTEVOLEI", "SOCIETY", "TENIS", "VOLEI", "BASQUETE");

        var created = objectMapper.readTree(mvc.perform(post("/api/modalities")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Vôlei de Areia",
                                  "defaultPrice":135.50
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value("VOLEI_DE_AREIA"))
                .andExpect(jsonPath("$.name").value("Vôlei de Areia"))
                .andExpect(jsonPath("$.active").value(true))
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8));

        assertThat(created.path("id").asLong()).isPositive();
        entityManager.clear();
        var persisted = modalities.findByCode("VOLEI_DE_AREIA").orElseThrow();
        assertThat(persisted.getName()).isEqualTo("Vôlei de Areia");
        assertThat(persisted.getDefaultPrice()).isEqualByComparingTo(new BigDecimal("135.50"));

        mvc.perform(post("/api/modalities")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"  Volei   de Areia ",
                                  "defaultPrice":140.00
                                }
                                """))
                .andExpect(status().isConflict());

        mvc.perform(post("/api/modalities")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Vôlei de Praia",
                                  "defaultPrice":130.00
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value("VOLEI_DE_PRAIA"))
                .andExpect(jsonPath("$.name").value("Vôlei de Praia"));

        var longName = "Futebol recreativo integrado para equipes universitárias e comunitárias";
        var longNameResult = objectMapper.readTree(mvc.perform(post("/api/modalities")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"%s","defaultPrice":85.00}
                                """.formatted(longName)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(longNameResult.path("code").asText()).hasSizeLessThanOrEqualTo(40);

        mvc.perform(post("/api/modalities")
                        .header("Authorization", bearer(clientToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Handebol de Praia",
                                  "defaultPrice":100.00
                                }
                                """))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/modalities")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"   ",
                                  "defaultPrice":100.00
                                }
                                """))
                .andExpect(status().isBadRequest());

        mvc.perform(post("/api/modalities")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Badminton de Teste",
                                  "defaultPrice":-0.01
                                }
                                """))
                .andExpect(status().isBadRequest());

        var catalogAfterCreation = getJson("/api/modalities", adminToken);
        assertThat(codes(catalogAfterCreation))
                .contains("BEACH_TENNIS", "FUTEVOLEI", "SOCIETY", "TENIS", "VOLEI", "BASQUETE",
                        "VOLEI_DE_AREIA", "VOLEI_DE_PRAIA");

        mvc.perform(patch("/api/modalities/VOLEI_DE_PRAIA/status")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));
        assertThat(codes(getJson("/api/modalities", clientToken))).doesNotContain("VOLEI_DE_PRAIA");
        var completeClientCatalog = getJson("/api/modalities?includeInactive=true", clientToken);
        assertThat(codes(completeClientCatalog)).contains("VOLEI_DE_PRAIA");
        assertThat(itemByCode(completeClientCatalog, "VOLEI_DE_PRAIA").path("active").asBoolean()).isFalse();

        mvc.perform(get("/api/championships")
                        .header("Authorization", bearer(clientToken))
                        .param("modality", "Vôlei de Areia"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/partners")
                        .header("Authorization", bearer(clientToken))
                        .param("modality", "Vôlei de Areia"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/community/ranking")
                        .header("Authorization", bearer(clientToken))
                        .param("modality", "Vôlei de Areia"))
                .andExpect(status().isOk());

        var court = objectMapper.readTree(mvc.perform(post("/api/courts")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Arena Integração Vôlei de Areia",
                                  "modality":"VOLEI_DE_AREIA",
                                  "description":"Quadra criada pelo teste ponta a ponta do catálogo dinâmico.",
                                  "pricePerHour":135.50,
                                  "playerCapacity":12,
                                  "status":"DISPONIVEL",
                                  "location":"Setor Integração",
                                  "lighting":true,
                                  "covered":false,
                                  "rating":4.8
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.modality").value("VOLEI_DE_AREIA"))
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8));
        var courtId = court.path("id").asLong();
        assertThat(courtId).isPositive();

        var reportBeforeReservations = getJson("/api/reports", adminToken);
        assertThat(reportBeforeReservations.path("reservasPorModalidade").path("Vôlei").asLong()).isPositive();
        var previousLeaderCount = maximumCount(reportBeforeReservations.path("reservasPorModalidade"));
        var reservationsToLead = previousLeaderCount + 1;
        var clientId = users.findByEmail("cliente@playspace.com").orElseThrow().getId();

        for (int index = 0; index < reservationsToLead; index++) {
            var reservationDate = LocalDate.now().plusDays(index + 1L);
            mvc.perform(post("/api/reservations")
                            .header("Authorization", bearer(adminToken))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "clientId":%d,
                                      "courtId":%d,
                                      "date":"%s",
                                      "startTime":"10:00:00",
                                      "endTime":"11:00:00",
                                      "players":4,
                                      "paymentMethod":"PIX",
                                      "notes":"Validação do catálogo dinâmico conectado à API."
                                    }
                                    """.formatted(clientId, courtId, reservationDate)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.modality").value("VOLEI_DE_AREIA"));
        }

        var filteredReservations = objectMapper.readTree(mvc.perform(get("/api/reservations")
                        .header("Authorization", bearer(adminToken))
                        .param("modality", "VOLEI_DE_AREIA"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(filteredReservations).hasSize(reservationsToLead);
        assertThat(filteredReservations).allSatisfy(item ->
                assertThat(item.path("modality").asText()).isEqualTo("VOLEI_DE_AREIA"));

        var filteredByCanonicalName = objectMapper.readTree(mvc.perform(get("/api/reservations")
                        .header("Authorization", bearer(adminToken))
                        .param("modality", "Vôlei de Areia"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(filteredByCanonicalName).hasSize(reservationsToLead);

        var report = getJson("/api/reports", adminToken);
        assertThat(report.path("reservasPorModalidade").path("Vôlei de Areia").asLong())
                .isEqualTo(reservationsToLead);

        var pdf = mvc.perform(get("/api/reports/export/pdf")
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsByteArray();
        assertThat(new String(pdf, StandardCharsets.ISO_8859_1))
                .contains("Vôlei de Areia: " + reservationsToLead, "reserva\\(s\\)");

        mvc.perform(get("/api/dashboard/admin")
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cards.modalidadeAlta").value("Vôlei de Areia"));
    }

    private String login(String email, String password) throws Exception {
        var response = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"%s"}
                                """.formatted(email, password)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        return objectMapper.readTree(response).path("token").asText();
    }

    private JsonNode getJson(String path, String token) throws Exception {
        MvcResult result = mvc.perform(get(path).header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private java.util.List<String> codes(JsonNode catalog) {
        var result = new java.util.ArrayList<String>();
        catalog.forEach(item -> result.add(item.path("code").asText()));
        return result;
    }

    private JsonNode itemByCode(JsonNode catalog, String code) {
        for (var item : catalog) {
            if (item.path("code").asText().equals(code)) {
                return item;
            }
        }
        throw new AssertionError("Modalidade ausente no catálogo: " + code);
    }

    private int maximumCount(JsonNode reservationsByModality) {
        var maximum = new int[] {0};
        reservationsByModality.elements().forEachRemaining(value -> maximum[0] = Math.max(maximum[0], value.asInt()));
        return maximum[0];
    }
}
