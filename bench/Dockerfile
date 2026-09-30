# Benchmark image for Bencher Bare Metal.
# Bare metal runners have no network access, so the image contains everything: Node.js, dependencies, builds of
# tick-knock and the benchmark, and the baseline version of tick-knock.
#
# Build from the repository root:
#   docker build -f bench/Dockerfile -t tick-knock-bench .
# Run locally:
#   docker run --rm tick-knock-bench /app/bench/dist/bencher.js
FROM node:22-slim

ARG BENCH_BASELINE=4.3.0
ENV BENCH_BASELINE=${BENCH_BASELINE}

WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile --filter tick-knock --filter tick-knock-bench \
  && pnpm build \
  && pnpm --filter tick-knock-bench build \
  && node bench/dist/index.js --baseline "${BENCH_BASELINE}" --prepare

ENTRYPOINT ["node"]
CMD ["/app/bench/dist/bencher.js"]
