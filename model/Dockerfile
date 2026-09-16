# Aurova Model gateway image (no GPU): pair with a vLLM container via AUROVA_UPSTREAM_URL.
FROM node:22-alpine
WORKDIR /app
COPY server/aurova-gateway.mjs server/
ENV PORT=8787
EXPOSE 8787
CMD ["node", "server/aurova-gateway.mjs"]
