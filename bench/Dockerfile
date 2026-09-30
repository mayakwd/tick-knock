# Benchmark image for Bencher Bare Metal.
# Bare metal runners have no network access, so the image contains everything: Node.js, dependencies, builds of
# tick-knock and the benchmark, and the baseline version of tick-knock.
# The image is loaded into the runner as a part of the job time, so the final stage contains only what the benchmark
# needs: production dependencies of the benchmark and builds, without development dependencies of the library.
#
# Build from the repository root:
#   docker build -f bench/Dockerfile -t tick-knock-bench .
# Run locally:
#   docker run --rm --network none tick-knock-bench
FROM node:22-slim AS build

ARG BENCH_BASELINE=4.3.0

WORKDIR /src
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile --filter tick-knock --filter tick-knock-bench \
  && pnpm build \
  && pnpm --filter tick-knock-bench build \
  && node bench/dist/index.js --baseline "${BENCH_BASELINE}" --prepare \
  && pnpm --filter tick-knock deploy --legacy --prod /deploy \
  && pnpm --filter tick-knock-bench deploy --legacy --prod /deploy/bench

FROM node:22-alpine

ARG BENCH_BASELINE=4.3.0
ENV BENCH_BASELINE=${BENCH_BASELINE}
ENV BENCH_OUTPUT=/tmp/bencher.json

WORKDIR /app
COPY --from=build /deploy ./
COPY --from=build /src/bench/dist ./bench/dist
COPY --from=build /src/bench/.baseline ./bench/.baseline

ENTRYPOINT ["node"]
CMD ["/app/bench/dist/bencher.js"]
