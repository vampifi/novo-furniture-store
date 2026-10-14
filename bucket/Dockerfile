# minio/minio is no longer published to Docker Hub or dl.min.io. This builds
# the official server binary from source via Go's module proxy instead, which
# remains a stable, immutable distribution channel for tagged releases.
FROM golang:1.24-bookworm AS builder
ENV CGO_ENABLED=0
RUN go install -v github.com/minio/minio@RELEASE.2025-10-15T17-29-55Z

FROM debian:bookworm-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=builder /go/bin/minio /usr/local/bin/minio
EXPOSE 9000
