FROM node:18-alpine

WORKDIR /app

# Install dependencies needed for node-gyp and prisma
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install

# Copy schema and generate Prisma Client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the app
COPY . .

EXPOSE 3001

# Wait for DB to be ready, then push schema and start the app
CMD ["sh", "-c", "echo 'Waiting for database...' && until npx prisma db push --skip-generate 2>/dev/null; do echo 'DB not ready, retrying in 3s...'; sleep 3; done && echo 'Database ready!' && npm start"]
