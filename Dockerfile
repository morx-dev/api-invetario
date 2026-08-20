FROM node:20-alpine

WORKDIR /app

# Instalar librerías nativas necesarias para Prisma en Alpine Linux
RUN apk add --no-cache openssl libc6-compat

# Copiamos los descriptores de dependencias y la carpeta prisma
COPY package*.json ./
COPY prisma ./prisma/

# Instalamos dependencias del proyecto
RUN npm install

# Copiamos el resto del código
COPY . .

# Generamos el cliente de Prisma dentro del entorno Linux
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "dev"]