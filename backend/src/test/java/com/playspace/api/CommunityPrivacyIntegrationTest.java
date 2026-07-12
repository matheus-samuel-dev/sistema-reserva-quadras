package com.playspace.api;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.playspace.api.community.CommunityPostRepository;
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
class CommunityPrivacyIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired CommunityPostRepository posts;

    @Test
    @WithUserDetails("cliente@playspace.com")
    void feedAndReviewsDoNotExposeJpaRelationshipsOrCredentials() throws Exception {
        mvc.perform(get("/api/community/feed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].authorId").exists())
                .andExpect(jsonPath("$[0].authorName").exists())
                .andExpect(jsonPath("$[0].createdAt").exists())
                .andExpect(jsonPath("$[0].author").doesNotExist())
                .andExpect(content().string(not(containsString("\"email\""))))
                .andExpect(content().string(not(containsString("\"password\""))))
                .andExpect(content().string(not(containsString("\"client\""))))
                .andExpect(content().string(not(containsString("\"reservation\""))));

        mvc.perform(get("/api/community/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].userName").exists())
                .andExpect(jsonPath("$[0].courtName").exists())
                .andExpect(jsonPath("$[0].ratings.cleaning").isNumber())
                .andExpect(jsonPath("$[0].average").isNumber())
                .andExpect(jsonPath("$[0].user").doesNotExist())
                .andExpect(jsonPath("$[0].court").doesNotExist())
                .andExpect(jsonPath("$[0].reservation").doesNotExist())
                .andExpect(content().string(not(containsString("\"email\""))))
                .andExpect(content().string(not(containsString("\"password\""))))
                .andExpect(content().string(not(containsString("\"client\""))))
                .andExpect(content().string(not(containsString("\"reservation\""))));
    }

    @Test
    @WithUserDetails("cliente@playspace.com")
    void relatedCommunityCollectionsAlsoUseFlatDtos() throws Exception {
        mvc.perform(get("/api/community/partners"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].playerId").exists())
                .andExpect(jsonPath("$[0].playerName").exists())
                .andExpect(jsonPath("$[0].player").doesNotExist());

        mvc.perform(get("/api/community/championships"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].bracket").isArray())
                .andExpect(jsonPath("$[0].bracketDemo").doesNotExist());

        mvc.perform(get("/api/community/achievements/my"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").exists())
                .andExpect(jsonPath("$[0].user").doesNotExist());
    }

    @Test
    @WithUserDetails("admin@playspace.com")
    void likeAndChampionshipCreationReturnResponseDtos() throws Exception {
        var post = posts.findTop20ByOrderByCreatedAtDesc().get(0);
        mvc.perform(post("/api/community/feed/{id}/like", post.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authorId").exists())
                .andExpect(jsonPath("$.authorName").exists())
                .andExpect(jsonPath("$.author").doesNotExist());

        mvc.perform(post("/api/community/championships")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Copa de Integracao",
                                  "modality": "BEACH_TENNIS",
                                  "startDate": "2030-01-20",
                                  "categories": "Misto",
                                  "prize": "Trofeu",
                                  "status": "Inscricoes abertas",
                                  "regulation": "Fase unica.",
                                  "bracketDemo": "Semifinais -> Final"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bracket").isArray())
                .andExpect(jsonPath("$.bracket[0]").value("Semifinais"))
                .andExpect(jsonPath("$.bracketDemo").doesNotExist());
    }

    @Test
    @WithUserDetails("cliente@playspace.com")
    void missingCommunityResourceReturnsNotFoundInsteadOfInternalError() throws Exception {
        mvc.perform(post("/api/community/feed/{id}/like", Long.MAX_VALUE))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }
}
