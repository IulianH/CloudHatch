FROM node:20-bookworm

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv \
    && python3 -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir opencv-python-headless numpy \
    && rm -rf /var/lib/apt/lists/*

ENV PATH="/opt/venv/bin:${PATH}"

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 8080

CMD ["npm", "run", "dev"]
