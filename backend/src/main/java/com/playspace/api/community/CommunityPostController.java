package com.playspace.api.community;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/community")
public class CommunityPostController {
    private final CommunityPostService service;

    public CommunityPostController(CommunityPostService service) {
        this.service = service;
    }

    @GetMapping("/feed")
    List<CommunityPostResponse> legacyFeed() {
        return service.legacyFeed();
    }

    @PostMapping("/feed/{postId}/like")
    CommunityPostResponse legacyLike(@PathVariable Long postId) {
        return service.like(postId);
    }

    @DeleteMapping("/feed/{postId}/like")
    CommunityPostResponse legacyUnlike(@PathVariable Long postId) {
        return service.unlike(postId);
    }

    @GetMapping("/posts")
    PageResponse<CommunityPostResponse> list(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int size
    ) {
        return service.list(page, size);
    }

    @GetMapping("/posts/{postId}")
    CommunityPostResponse detail(@PathVariable Long postId) {
        return service.detail(postId);
    }

    @PostMapping("/posts")
    ResponseEntity<CommunityPostResponse> create(@Valid @RequestBody CommunityPostRequest request) {
        var created = service.create(request);
        return ResponseEntity.created(URI.create("/api/community/posts/" + created.id())).body(created);
    }

    @PutMapping("/posts/{postId}")
    CommunityPostResponse update(@PathVariable Long postId, @Valid @RequestBody CommunityPostRequest request) {
        return service.update(postId, request);
    }

    @DeleteMapping("/posts/{postId}")
    ResponseEntity<Void> delete(@PathVariable Long postId) {
        service.delete(postId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/posts/{postId}/likes")
    CommunityPostResponse like(@PathVariable Long postId) {
        return service.like(postId);
    }

    @DeleteMapping("/posts/{postId}/likes")
    CommunityPostResponse unlike(@PathVariable Long postId) {
        return service.unlike(postId);
    }

    @GetMapping("/posts/{postId}/comments")
    PageResponse<CommunityCommentResponse> comments(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int size
    ) {
        return service.listComments(postId, page, size);
    }

    @PostMapping("/posts/{postId}/comments")
    ResponseEntity<CommunityCommentResponse> comment(
            @PathVariable Long postId,
            @Valid @RequestBody CommunityCommentRequest request
    ) {
        var created = service.createComment(postId, request);
        return ResponseEntity.created(URI.create("/api/community/comments/" + created.id())).body(created);
    }

    @PutMapping("/comments/{commentId}")
    CommunityCommentResponse updateComment(
            @PathVariable Long commentId,
            @Valid @RequestBody CommunityCommentRequest request
    ) {
        return service.updateComment(commentId, request);
    }

    @DeleteMapping("/comments/{commentId}")
    ResponseEntity<Void> deleteComment(@PathVariable Long commentId) {
        service.deleteComment(commentId);
        return ResponseEntity.noContent().build();
    }
}
