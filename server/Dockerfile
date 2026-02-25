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

# Command to run (wait for DB in compose usually, but here we just start)
CMD ["npm", "start"]
