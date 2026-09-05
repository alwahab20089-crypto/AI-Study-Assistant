FROM node:20

WORKDIR /app

COPY server/package*.json ./

RUN npm ci --omit=dev

COPY server/ ./

ENV NODE_ENV=production
ENV HF_HOME=/opt/huggingface

# Pre-download the embedding model during image build
RUN rm -rf /opt/huggingface && \
    node -e "import('@huggingface/transformers').then(({ pipeline }) => pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')).then(() => console.log('Embedding model downloaded during build'))"

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/api/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

CMD ["npm", "start"]
